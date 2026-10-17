// Shared Open-Meteo URL helper for the serverless functions.
// Without OPEN_METEO_API_KEY the free API is used (non-commercial only). Once the key is set in Vercel,
// requests go to the commercial hosts (customer-api.open-meteo.com etc.) with &apikey=.
// OPEN_METEO_HOST_PREFIX can override the 'customer-' prefix if Open-Meteo hands out a different host.
const HOSTS = new Set(['api.open-meteo.com', 'geocoding-api.open-meteo.com', 'air-quality-api.open-meteo.com', 'marine-api.open-meteo.com', 'archive-api.open-meteo.com', 'ensemble-api.open-meteo.com']);

// Returns the URL to call for a free-API URL, or null when the host or path is not allowed.
function omUrl(input) {
  let url;
  try { url = new URL(input); } catch { return null; }
  if (url.protocol !== 'https:' || !HOSTS.has(url.hostname) || !url.pathname.startsWith('/v1/')) return null;
  const key = process.env.OPEN_METEO_API_KEY;
  if (key) {
    url.hostname = (process.env.OPEN_METEO_HOST_PREFIX || 'customer-') + url.hostname;
    url.searchParams.set('apikey', key);
  }
  return url.toString();
}

// Cache lifetime in seconds per endpoint, used by api/om.js.
function cacheSeconds(input) {
  const host = new URL(input).hostname;
  if (host.startsWith('geocoding-api')) return 86400;
  if (host.startsWith('marine-api')) return 3600;
  if (host.startsWith('air-quality-api')) return 1800;
  return 900;
}

module.exports = { omUrl, cacheSeconds };
