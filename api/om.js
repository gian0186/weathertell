// Open-Meteo proxy for the browser: /api/om?url=<free-API URL>.
// Keeps the commercial API key on the server and lets Vercel's CDN cache identical requests.
// Only used when OM_PROXY is switched on in the client scripts (app.js and the others).
const { omUrl, cacheSeconds } = require('./_om');

module.exports = async (req, res) => {
  const input = typeof req.query.url === 'string' ? req.query.url : '';
  const target = omUrl(input);
  if (!target) {
    res.status(400).json({ error: true, reason: 'URL not allowed' });
    return;
  }
  try {
    const upstream = await fetch(target);
    const body = await upstream.text();
    const ttl = cacheSeconds(input);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', upstream.ok ? `public, s-maxage=${ttl}, stale-while-revalidate=${ttl}` : 'no-store');
    res.status(upstream.status).send(body);
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: true, reason: 'Upstream request failed' });
  }
};
