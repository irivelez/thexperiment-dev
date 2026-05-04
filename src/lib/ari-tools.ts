/**
 * Ari tools — server-side capabilities Ari can invoke during a chat turn.
 *
 * The only tool today is `fetch_company_url`. When a visitor pastes a URL
 * (or a domain that Ari normalizes to https://), Ari calls this tool to
 * actually READ the page before deciding what to ask. That single ability
 * skips most gap-fill turns: the website usually tells us the services,
 * the city, the team size, and sometimes the owner's name.
 *
 * This is intentionally NOT the Claude Agent SDK. Agent SDK is built for
 * harness-style autonomous loops (file I/O, bash, MCP). Ari is a short
 * streaming conversation on a 300s serverless function — the regular
 * Anthropic SDK + a single custom tool ships in hours, not days, and
 * keeps the SSE consumer on /talk untouched.
 */
import type Anthropic from '@anthropic-ai/sdk';

/**
 * Tool spec sent to Anthropic. The description matters: Ari decides when
 * to call this based on what's written here. Keep it operational.
 */
export const FETCH_COMPANY_URL_TOOL: Anthropic.Messages.Tool = {
  name: 'fetch_company_url',
  description:
    "Fetch a company's website or social profile and return its title, description, and visible text. " +
    'Call this immediately whenever the visitor provides a URL or a domain (with or without https://). ' +
    "Use the result to skip gap-fill questions: if the page tells you the city, the services, or the team size, don't ask again. " +
    'If the fetch fails or the page is uninformative (auth-walled, JS-only SPA, 404), fall back to asking the visitor directly. ' +
    'Never call this on a URL the visitor did not give you, and never call it twice on the same URL.',
  input_schema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description:
          "The URL to fetch. Must be a full https:// URL. If the visitor wrote 'plomeria.cartagena.com', pass 'https://plomeria.cartagena.com'. If they wrote a social handle like '@plomeros_caribe', skip the tool and ask for a real link.",
      },
    },
    required: ['url'],
  },
};

export const TOOLS: Anthropic.Messages.Tool[] = [FETCH_COMPANY_URL_TOOL];

interface FetchSuccess {
  ok: true;
  url: string;
  final_url: string;
  title: string | null;
  description: string | null;
  og_title: string | null;
  og_description: string | null;
  text_snippet: string;
  fetched_chars: number;
}

interface FetchFailure {
  ok: false;
  url: string;
  reason: string;
}

type FetchResult = FetchSuccess | FetchFailure;

const MAX_BODY_BYTES = 500_000; // 500 KB. Most marketing sites ship under 200 KB of HTML.
const FETCH_TIMEOUT_MS = 5000;
const TEXT_SNIPPET_CHARS = 1800; // enough to know what the company does

/**
 * Block obvious SSRF targets. We're a public function fetching public sites;
 * we never need to hit private IPs, link-local, or the AWS metadata endpoint.
 * Vercel's network is already isolated, but defense in depth costs nothing.
 */
function isUnsafeHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost') return true;
  if (h === '0.0.0.0' || h === '::1' || h === '[::1]') return true;
  // raw IPv4
  const v4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  // raw IPv6 — block entirely (we only want named hosts)
  if (h.includes(':')) return true;
  // .internal, .local — common private TLDs
  if (h.endsWith('.internal') || h.endsWith('.local')) return true;
  return false;
}

/**
 * Normalize whatever the visitor (or Ari) hands us into a safe https:// URL.
 * Returns null if the input can't be made safe.
 */
function normalizeUrl(raw: string): URL | null {
  let s = raw.trim();
  if (!s) return null;
  // Strip surrounding quotes / parens / trailing punctuation that often gets pasted.
  s = s.replace(/^[<("'\s]+|[>)"'\s.,;]+$/g, '');
  if (!/^https?:\/\//i.test(s)) {
    s = 'https://' + s;
  }
  let url: URL;
  try {
    url = new URL(s);
  } catch {
    return null;
  }
  // Force HTTPS — never let Ari fetch http://.
  if (url.protocol !== 'https:') return null;
  if (!url.hostname || isUnsafeHost(url.hostname)) return null;
  return url;
}

/**
 * Pull the first <title>, <meta name="description">, og:title, og:description,
 * and a chunk of visible text out of an HTML string. We don't bring in a DOM
 * parser — these regexes are good enough for marketing sites and keep the
 * function light enough to cold-start fast.
 */
function extractFromHtml(html: string): {
  title: string | null;
  description: string | null;
  og_title: string | null;
  og_description: string | null;
  text_snippet: string;
} {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descMatch = html.match(
    /<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)["']/i,
  );
  const ogTitleMatch = html.match(
    /<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["']/i,
  );
  const ogDescMatch = html.match(
    /<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']+)["']/i,
  );

  // Strip <script> and <style> blocks, then collapse all tags to spaces.
  const cleaned = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();

  return {
    title: titleMatch ? decodeEntities(titleMatch[1]).trim() : null,
    description: descMatch ? decodeEntities(descMatch[1]).trim() : null,
    og_title: ogTitleMatch ? decodeEntities(ogTitleMatch[1]).trim() : null,
    og_description: ogDescMatch ? decodeEntities(ogDescMatch[1]).trim() : null,
    text_snippet: cleaned.slice(0, TEXT_SNIPPET_CHARS),
  };
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

/**
 * Fetch a URL with strict bounds: HTTPS only, public hosts only, 5s timeout,
 * 500 KB body cap. Returns a structured result Ari can read straight into
 * its next turn. Never throws — failures come back as { ok: false, reason }.
 */
export async function fetchCompanyUrl(input: { url: string }): Promise<FetchResult> {
  const url = normalizeUrl(input.url);
  if (!url) {
    return {
      ok: false,
      url: input.url,
      reason: 'invalid_or_unsafe_url',
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
      headers: {
        // Identify ourselves clearly. Some sites block headless UAs; this
        // sometimes earns us a 200 where a default UA gets a 403.
        'User-Agent': 'AriBot/1.0 (+https://thexperiment.dev/talk)',
        Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'es,en;q=0.8',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      return {
        ok: false,
        url: input.url,
        reason: `http_${res.status}`,
      };
    }

    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('html') && !ct.includes('text/plain') && !ct.includes('xml')) {
      return {
        ok: false,
        url: input.url,
        reason: `unsupported_content_type:${ct.split(';')[0].trim()}`,
      };
    }

    // Read with a hard byte cap. Some sites stream forever otherwise.
    const reader = res.body?.getReader();
    if (!reader) {
      return { ok: false, url: input.url, reason: 'no_body' };
    }
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        total += value.byteLength;
        if (total >= MAX_BODY_BYTES) {
          try {
            await reader.cancel();
          } catch {
            /* ignore */
          }
          break;
        }
      }
    }
    const buf = new Uint8Array(total);
    {
      let off = 0;
      for (const c of chunks) {
        buf.set(c, off);
        off += c.byteLength;
      }
    }
    // UTF-8 with replacement; marketing sites are 99% UTF-8.
    const html = new TextDecoder('utf-8', { fatal: false }).decode(buf);

    const extracted = extractFromHtml(html);
    return {
      ok: true,
      url: input.url,
      final_url: res.url,
      title: extracted.title,
      description: extracted.description,
      og_title: extracted.og_title,
      og_description: extracted.og_description,
      text_snippet: extracted.text_snippet,
      fetched_chars: html.length,
    };
  } catch (err) {
    clearTimeout(timer);
    const reason =
      err instanceof Error
        ? err.name === 'AbortError'
          ? 'timeout'
          : err.message.slice(0, 120)
        : 'unknown_error';
    return { ok: false, url: input.url, reason };
  }
}

/**
 * Dispatch — given a tool name and input, run it and return a JSON-stringifiable
 * result. The Anthropic SDK expects tool_result content to be a string or
 * array of content blocks; we send compact JSON.
 */
export async function runTool(name: string, input: unknown): Promise<string> {
  if (name === 'fetch_company_url') {
    const safeInput =
      input && typeof input === 'object' && 'url' in input
        ? { url: String((input as { url: unknown }).url ?? '') }
        : { url: '' };
    const result = await fetchCompanyUrl(safeInput);
    return JSON.stringify(result);
  }
  return JSON.stringify({ ok: false, reason: `unknown_tool:${name}` });
}
