/**
 * /api/chat — streaming chat endpoint that powers the Noa pre-call agent.
 *
 * Calls Anthropic directly with the system prompt from src/lib/noa-prompt.ts.
 * Server-side ANTHROPIC_API_KEY (Vercel env). Streaming SSE keeps the chat
 * widget feeling alive on mobile.
 *
 * Wire frame:
 *   POST /api/chat
 *   Body: { messages: [{role:'user'|'assistant', content:string}, ...], context?: {...} }
 *   Response: text/event-stream of "data: <delta-json>\n\n" frames, ended by "data: [DONE]\n\n"
 */
import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';
import {
  NOA_SYSTEM_PROMPT,
  NOA_MODEL,
  MAX_USER_TURNS,
  MAX_OUTPUT_TOKENS,
} from '@lib/noa-prompt';

export const prerender = false;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatBody {
  messages: ChatMessage[];
  /** Optional context the frontend may inject — e.g. priorBriefCount for the pattern-match line. */
  context?: {
    priorBriefCount?: number;
    locale?: string;
  };
}

const enc = new TextEncoder();

function frame(data: unknown): Uint8Array {
  return enc.encode(`data: ${JSON.stringify(data)}\n\n`);
}

function done(): Uint8Array {
  return enc.encode('data: [DONE]\n\n');
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

  const ctxLine =
    body.context?.priorBriefCount && body.context.priorBriefCount >= 3
      ? `\n\n[SYSTEM CONTEXT FOR THIS CALL] Prior briefs in the database: ${body.context.priorBriefCount}. The pattern-match line is now allowed.`
      : '';

  const anthropic = new Anthropic({ apiKey });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const llmStream = await anthropic.messages.stream({
          model: NOA_MODEL,
          max_tokens: MAX_OUTPUT_TOKENS,
          system: NOA_SYSTEM_PROMPT + ctxLine,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        });

        for await (const event of llmStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(frame({ type: 'delta', text: event.delta.text }));
          } else if (event.type === 'message_stop') {
            break;
          }
        }

        const final = await llmStream.finalMessage();
        controller.enqueue(
          frame({
            type: 'done',
            stop_reason: final.stop_reason,
            usage: final.usage,
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
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
};

export const GET: APIRoute = () =>
  new Response(JSON.stringify({ ok: true, agent: 'noa-web-pre-call' }), {
    headers: { 'Content-Type': 'application/json' },
  });
