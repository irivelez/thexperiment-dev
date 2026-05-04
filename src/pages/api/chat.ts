/**
 * /api/chat — streaming chat endpoint that powers the Ari pre-call agent.
 *
 * Calls Anthropic directly with the system prompt from src/lib/ari-prompt.ts,
 * the tool definitions from src/lib/ari-tools.ts (only fetch_company_url
 * today), and a tool-execution loop that lets Ari read a visitor's URL and
 * use what it learned in the same turn.
 *
 * Wire frame:
 *   POST /api/chat
 *   Body: { messages: [{role:'user'|'assistant', content:string}, ...] }
 *   Response: text/event-stream of "data: <json>\n\n" frames, ended by "data: [DONE]\n\n".
 *   Frame types:
 *     { type: 'delta', text }           — text chunk to append to current bubble
 *     { type: 'tool',  status, name? }  — 'running' | 'done' indicator while a tool executes
 *     { type: 'done',  stop_reason, usage } — final-message metadata
 *     { type: 'error', message }        — surface error string in the bubble
 *
 * Prompt caching:
 *   We mark the system prompt + tool definitions with cache_control: ephemeral.
 *   When the model is at or above the cache threshold this saves ~80% on repeat
 *   turns. Below threshold Anthropic ignores the directive — no error.
 */
import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';
import {
  ARI_SYSTEM_PROMPT,
  ARI_MODEL,
  MAX_USER_TURNS,
  MAX_OUTPUT_TOKENS,
  MAX_TOOL_ITERATIONS,
} from '@lib/ari-prompt';
import { TOOLS, runTool } from '@lib/ari-tools';

export const prerender = false;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatBody {
  messages: ChatMessage[];
}

const enc = new TextEncoder();

function frame(data: unknown): Uint8Array {
  return enc.encode(`data: ${JSON.stringify(data)}\n\n`);
}

function done(): Uint8Array {
  return enc.encode('data: [DONE]\n\n');
}

/**
 * Build the system prompt with prompt-caching turned on. The system field
 * accepts an array of text blocks; marking the last block ephemeral caches
 * everything up to that point. The tools array gets the same treatment via
 * cache_control on the last tool, which caches the full tool definitions.
 */
function systemBlocks(): Anthropic.Messages.MessageCreateParams['system'] {
  return [
    {
      type: 'text',
      text: ARI_SYSTEM_PROMPT,
      cache_control: { type: 'ephemeral' },
    },
  ];
}

function cacheableTools(): Anthropic.Messages.Tool[] {
  if (TOOLS.length === 0) return [];
  // Mark the LAST tool ephemeral. Anthropic caches the entire tools array up
  // to and including that breakpoint.
  const head = TOOLS.slice(0, -1);
  const last = TOOLS[TOOLS.length - 1];
  return [
    ...head,
    {
      ...last,
      cache_control: { type: 'ephemeral' },
    } as Anthropic.Messages.Tool,
  ];
}

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY missing on the server' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  let body: ChatBody;
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return new Response(JSON.stringify({ error: 'invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const userTurns = messages.filter((m) => m.role === 'user').length;
  if (userTurns > MAX_USER_TURNS) {
    return new Response(
      JSON.stringify({
        error: 'turn_cap',
        message: 'Conversation length cap reached. Refresh to start fresh, or book the 40-min call.',
      }),
      { status: 429, headers: { 'Content-Type': 'application/json' } },
    );
  }

  for (const m of messages) {
    if (typeof m.content !== 'string' || m.content.length > 4000) {
      return new Response(
        JSON.stringify({ error: 'message too long' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  const anthropic = new Anthropic({ apiKey });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Working messages array for the tool-use loop. Starts as the client's
      // simple {role, content:string} shape; later iterations append the
      // assistant's structured content blocks (with tool_use) and our own
      // tool_result blocks.
      const working: Anthropic.Messages.MessageParam[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      let totalUsage: Anthropic.Messages.Usage | undefined;
      let lastStopReason: string | null = null;

      try {
        for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
          const llmStream = anthropic.messages.stream({
            model: ARI_MODEL,
            max_tokens: MAX_OUTPUT_TOKENS,
            system: systemBlocks(),
            tools: cacheableTools(),
            messages: working,
          });

          // Use event listeners (not for-await + break). Breaking out of the
          // async iterator calls iterator.return(), which aborts the underlying
          // connection and surfaces as "Request was aborted" — even on a
          // successful generation. Listening on 'text' is the SDK's intended
          // streaming pattern.
          llmStream.on('text', (text: string) => {
            if (text) controller.enqueue(frame({ type: 'delta', text }));
          });

          const final = await llmStream.finalMessage();
          totalUsage = mergeUsage(totalUsage, final.usage);
          lastStopReason = final.stop_reason ?? null;

          if (final.stop_reason !== 'tool_use') {
            // Final answer — break out of the loop, flush done frame below.
            break;
          }

          // Tool-use round. Find the tool_use block(s), append the assistant's
          // structured content as-is, then run each tool and send tool_result
          // blocks back as the next user message.
          const assistantBlocks = final.content;
          working.push({ role: 'assistant', content: assistantBlocks });

          const toolUses = assistantBlocks.filter(
            (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use',
          );
          if (toolUses.length === 0) {
            // Defensive: stop_reason said tool_use but no tool_use block.
            // Treat as done.
            break;
          }

          // Tell the UI a tool is running so it can show a "thinking" hint.
          controller.enqueue(
            frame({
              type: 'tool',
              status: 'running',
              name: toolUses[0].name,
            }),
          );

          const toolResults = await Promise.all(
            toolUses.map(async (tu) => {
              const result = await runTool(tu.name, tu.input);
              return {
                type: 'tool_result' as const,
                tool_use_id: tu.id,
                content: result,
              } satisfies Anthropic.Messages.ToolResultBlockParam;
            }),
          );

          controller.enqueue(frame({ type: 'tool', status: 'done' }));

          working.push({
            role: 'user',
            content: toolResults,
          });
        }

        controller.enqueue(
          frame({
            type: 'done',
            stop_reason: lastStopReason,
            usage: totalUsage,
          }),
        );
        controller.enqueue(done());
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(frame({ type: 'error', message: msg }));
        controller.enqueue(done());
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
};

/**
 * Sum usage across tool-loop iterations so the final 'done' frame reports the
 * full conversation cost, not just the last leg.
 */
function mergeUsage(
  prev: Anthropic.Messages.Usage | undefined,
  next: Anthropic.Messages.Usage,
): Anthropic.Messages.Usage {
  if (!prev) return next;
  return {
    ...next,
    input_tokens: (prev.input_tokens ?? 0) + (next.input_tokens ?? 0),
    output_tokens: (prev.output_tokens ?? 0) + (next.output_tokens ?? 0),
    cache_creation_input_tokens:
      (prev.cache_creation_input_tokens ?? 0) +
      (next.cache_creation_input_tokens ?? 0),
    cache_read_input_tokens:
      (prev.cache_read_input_tokens ?? 0) + (next.cache_read_input_tokens ?? 0),
  };
}

export const GET: APIRoute = () =>
  new Response(JSON.stringify({ ok: true, agent: 'ari-web-pre-call' }), {
    headers: { 'Content-Type': 'application/json' },
  });
