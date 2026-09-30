// Measured snow depth near Alpine ski resorts.
//   slf:       SLF/IMIS (Switzerland), half-hourly HS in cm. Source: WSL Institute for Snow and Avalanche Research SLF, CC BY 4.0
//   geosphere: GeoSphere Austria klima-v2-1d, daily "sh" (total snow depth) in cm. Source: GeoSphere Austria, CC BY 4.0
// Responses are cached at the CDN so the upstream APIs see at most a few requests per half hour.
const stations = require('./_snow-stations.json');

const SLF_URL = 'https://measurement-api.slf.ch/public/api/imis/station/';
const GEOSPHERE_URL = 'https://dataset.api.hub.geosphere.at/v1/station/historical/klima-v2-1d';
const DAY_MS = 24 * 60 * 60 * 1000;

async function getJson(url) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 8000);
  try {
    const res = await fetch(url, { signal: ctl.signal, headers: { 'User-Agent': 'weathertell.com snow stations' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

const cm = v => (typeof v === 'number' && isFinite(v) ? Math.max(0, Math.round(v)) : null);

async function loadSlf(list, out) {
  await Promise.all(list.map(async s => {
    try {
      const rows = await getJson(SLF_URL + encodeURIComponent(s.id) + '/measurements');
      const valid = rows.filter(r => r.HS !== null && r.HS !== undefined && r.measure_date)
        .map(r => ({ t: Date.parse(r.measure_date), hs: r.HS })).filter(r => isFinite(r.t)).sort((a, b) => a.t - b.t);
      if (!valid.length) return;
      const last = valid[valid.length - 1];
      // compare with the reading closest to 24 hours earlier, if the window is long enough
      const target = last.t - DAY_MS;
      const older = valid.filter(r => r.t <= last.t - 20 * 60 * 60 * 1000)
        .sort((a, b) => Math.abs(a.t - target) - Math.abs(b.t - target))[0];
      out[s.key] = { hs: cm(last.hs), prev: older ? cm(older.hs) : null, at: new Date(last.t).toISOString(), daily: false };
    } catch (e) { /* station skipped */ }
  }));
}

async function loadGeosphere(list, out) {
  if (!list.length) return;
  const end = new Date();
  const start = new Date(end.getTime() - 5 * DAY_MS);
  const iso = d => d.toISOString().slice(0, 10);
  const url = GEOSPHERE_URL + '?parameters=sh&station_ids=' + list.map(s => s.id).join(',') + '&start=' + iso(start) + '&end=' + iso(end);
  try {
    const data = await getJson(url);
    const times = data.timestamps || [];
    for (const f of data.features || []) {
      const key = 'geosphere:' + String(f.properties.station);
      const vals = f.properties.parameters.sh.data;
      let i = vals.length - 1;
      while (i >= 0 && (vals[i] === null || vals[i] === undefined)) i--;
      if (i < 0) continue;
      const prevOk = i > 0 && vals[i - 1] !== null && vals[i - 1] !== undefined;
      out[key] = { hs: cm(vals[i]), prev: prevOk ? cm(vals[i - 1]) : null, at: times[i], daily: true };
    }
  } catch (e) { /* source skipped */ }
}

module.exports = async function handler(req, res) {
  const out = {};
  await Promise.all([
    loadSlf(stations.filter(s => s.src === 'slf'), out),
    loadGeosphere(stations.filter(s => s.src === 'geosphere'), out)
  ]);
  if (!Object.keys(out).length) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ error: 'no data' });
  }
  res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=7200');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(200).json({ updated: new Date().toISOString(), stations: out });
};
