// Vercel Cron hits this daily. It just re-triggers a deploy via a Deploy Hook,
// which reruns the generators (see package.json "build") so any blog post whose
// datePublished has now arrived gets included in the site.
module.exports = async (req, res) => {
  const auth = req.headers['authorization'] || '';
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const hookUrl = process.env.DEPLOY_HOOK_URL;
  if (!hookUrl) {
    res.status(500).json({ ok: false, error: 'DEPLOY_HOOK_URL is not set' });
    return;
  }
  try {
    const hookRes = await fetch(hookUrl, { method: 'GET' });
    res.status(200).json({ ok: hookRes.ok, status: hookRes.status });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
};
