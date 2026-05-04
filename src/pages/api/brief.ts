/**
 * /api/brief — persists the brief Ari emits at the end of a chat.
 *
 * Why a server endpoint at all: the user's conversation lives in their
 * browser, but Irina wants visibility on what the agent is collecting *before*
 * the 40-min booking lands. This endpoint logs each completed brief to
 * Vercel function logs (visible via `vercel logs`) so Irina can grep the
 * funnel in near-real-time without needing extra infra.
 *
 * Log format is deliberately multi-line:
 *   [ari-brief] <ts> | <company> | <city, country> | <industry>
 *   [ari-brief]   url: <url>
 *   [ari-brief]   synthesis: <2-3 sentences for Irina>
 *   [ari-brief]   signal: <one observation worth probing>
 *   [ari-brief]   signal: <another observation>
 *   [ari-brief]   raw: <full JSON for grep + post-hoc analysis>
 *
 * That way `vercel logs --follow | grep ari-brief` reads like a digest, and
 * the trailing raw JSON line preserves every field for the eventual export
 * pipeline (Phase 2: Slack webhook + CSV).
 */
import type { APIRoute } from 'astro';

export const prerender = false;

interface BriefShape {
  company?: string | null;
  url?: string | null;
  industry?: string | null;
  services?: string | null;
  city?: string | null;
  country?: string | null;
  team_size?: string | null;
  user_first_name?: string | null;
  language?: string | null;
  synthesis?: string | null;
  signals_for_call?: string[] | null;
}

function safeStr(v: unknown): string {
  if (v == null) return '';
  return String(v).replace(/\s+/g, ' ').trim();
}

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ts = new Date().toISOString();
  const brief: BriefShape =
    body && typeof body === 'object' && 'brief' in body && body.brief && typeof body.brief === 'object'
      ? (body as { brief: BriefShape }).brief
      : (body as BriefShape);

  const company = safeStr(brief.company) || '(empresa sin nombre)';
  const where =
    [safeStr(brief.city), safeStr(brief.country)].filter(Boolean).join(', ') ||
    '(ubicación desconocida)';
  const industry = safeStr(brief.industry) || '(industria desconocida)';
  const url = safeStr(brief.url);
  const synthesis = safeStr(brief.synthesis);
  const signals = Array.isArray(brief.signals_for_call)
    ? brief.signals_for_call.map(safeStr).filter(Boolean)
    : [];

  // Multi-line digest: each line stays grep-keyed on `ari-brief`.
  console.log(`[ari-brief] ${ts} | ${company} | ${where} | ${industry}`);
  if (url) console.log(`[ari-brief]   url: ${url}`);
  if (synthesis) console.log(`[ari-brief]   synthesis: ${synthesis}`);
  for (const s of signals) console.log(`[ari-brief]   signal: ${s}`);
  // Trailing raw line preserves every field for the eventual export pipeline.
  console.log(`[ari-brief]   raw: ${JSON.stringify(body)}`);

  return new Response(JSON.stringify({ ok: true, ts }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
