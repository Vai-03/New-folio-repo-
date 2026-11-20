// Vercel serverless function. Needs ANTHROPIC_API_KEY in the project's environment variables.
// Without it this returns 503 and the site falls back to its built-in answers.
const KB = require('./_kb.js');
const hits = new Map();
const SYSTEM = `You are the assistant on ${KB.name}'s portfolio website. Answer questions from visitors (recruiters, hiring managers, potential clients) using ONLY the facts below.
Rules: reply in plain text, at most 90 words, warm and direct, no markdown, no emojis. Refer to Vaishnavi in the third person. Never invent facts, prices, availability dates, clients or results; if something is not covered, say you don't know and point to her contact details. For prices, say it depends on scope and invite them to share the project. When useful, add one link written as [[label|full URL]]. If asked whether you are an AI, say yes, you are her website assistant.

FACTS
${KB.text}`;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: 'not configured' });

  const ip = String(req.headers['x-forwarded-for'] || 'x').split(',')[0].trim();
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60000);
  if (recent.length >= 12) return res.status(429).json({ error: 'slow down' });
  recent.push(now); hits.set(ip, recent);

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const raw = Array.isArray(body && body.messages) ? body.messages : [];
  const messages = raw
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 600) }));
  while (messages.length && messages[0].role !== 'user') messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== 'user') return res.status(400).json({ error: 'bad request' });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: process.env.CLAUDE_MODEL || 'claude-haiku-5-5', max_tokens: 320, system: SYSTEM, messages }),
    });
    if (!r.ok) return res.status(502).json({ error: 'upstream' });
    const j = await r.json();
    const reply = (j.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
    if (!reply) return res.status(502).json({ error: 'empty' });
    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(502).json({ error: 'failed' });
  }
};
