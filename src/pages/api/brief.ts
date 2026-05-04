/**
 * /api/brief — persists the brief Noa emits at the end of a chat.
 *
 * Why a server endpoint at all: the user's conversation lives in their
 * browser, but Irina wants visibility on what the agent is collecting *before*
 * the 40-min booking lands. This endpoint logs each completed brief to
 * Vercel function logs (visible via `vercel logs`) so Irina can grep the
 * funnel in near-real-time without needing extra infra.
 *
 * Optional next steps (post-May-17): forward to Slack webhook, push to
 * Supabase, or email Irina. For now: console.log + 200 OK.
 */
import type { APIRoute } from 'astro';

export const prerender = false;

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
  // Structured one-line log so it's easy to grep in `vercel logs`.
  console.log(`[noa-brief] ${ts} ${JSON.stringify(body)}`);

  return new Response(JSON.stringify({ ok: true, ts }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
