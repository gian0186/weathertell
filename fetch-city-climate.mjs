// Fetches monthly climate averages for city pages and writes data/city-climate.json.
// Air: ERA5 via Open-Meteo, 2015-2024. Sea (coastal cities only): Open-Meteo Marine, 2023-2025.
// Not part of the build. Usage: node fetch-city-climate.mjs
// To add a city: put its slug in PLACES; use zee: false for inland cities (no sea temperature).
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const root = process.cwd();
const PLACES = {
  'hong-kong': {}, dubai: {}, 'new-york': {}, seoul: { zee: false }, chicago: { zee: false }, 'los-angeles': {}, doha: {}, auckland: {}, 'kuala-lumpur': { zee: false }, athens: {},
  'buenos-aires': {}, delhi: { zee: false }, madrid: { zee: false }, oslo: {}, prague: { zee: false }, wellington: {}, london: { zee: false }, paris: { zee: false },
  barcelona: {}, rome: { zee: false }, tokyo: {}, bangkok: { zee: false }, singapore: {}, sydney: {}, lisbon: {}, amsterdam: { zee: false }, istanbul: {}, miami: {},
  toronto: { zee: false }, vancouver: {},
  // Lapland (October 2026). Tromsø (coast) and Abisko (rain shadow) are left out on purpose:
  // the model grid comes out too cold and far too wet there.
  rovaniemi: { zee: false }, levi: { zee: false }, saariselka: { zee: false }, kiruna: { zee: false },
  // All remaining city pages (October 2026); coastal cities get a sea temperature.
  dublin: {}, stockholm: {}, 'rio-de-janeiro': {}, lima: {}, mumbai: {}, melbourne: {}, 'cape-town': {}, edinburgh: {},
  'san-francisco': {}, seattle: {}, jakarta: {}, perth: {}, shanghai: {}, osaka: {}, karachi: {}, havana: {}, accra: {},
  beirut: {}, helsinki: {}, boston: {}, 'tel-aviv': {}, casablanca: {}, lagos: {}, manila: {}, reykjavik: {},
  berlin: { zee: false }, vienna: { zee: false }, zurich: { zee: false }, 'mexico-city': { zee: false }, 'sao-paulo': { zee: false },
  bogota: { zee: false }, cairo: { zee: false }, nairobi: { zee: false }, warsaw: { zee: false }, brussels: { zee: false },
  montreal: { zee: false }, santiago: { zee: false }, johannesburg: { zee: false }, beijing: { zee: false }, bangalore: { zee: false },
  kolkata: { zee: false }, dhaka: { zee: false }, tehran: { zee: false }, riyadh: { zee: false }, hanoi: { zee: false },
  milan: { zee: false }, munich: { zee: false }, kyiv: { zee: false }, belgrade: { zee: false }, philadelphia: { zee: false },
  denver: { zee: false }, medellin: { zee: false }, budapest: { zee: false }, bucharest: { zee: false }, 'washington-dc': { zee: false },
  houston: { zee: false }, calgary: { zee: false }, quito: { zee: false }, 'ho-chi-minh-city': { zee: false }, taipei: { zee: false },
  brisbane: { zee: false }
};

const source = fs.readFileSync(path.join(root, 'generate-locations.mjs'), 'utf8');
const coords = slug => {
  const m = source.match(new RegExp(`\\['${slug}', ["']([^"']+)["'], '[^']+', (-?[0-9.]+), (-?[0-9.]+)`));
  if (!m) throw new Error(`Geen coördinaten voor ${slug}`);
  return { name: m[1], latitude: Number(m[2]), longitude: Number(m[3]) };
};
const get = async url => {
  for (let attempt = 0; attempt < 20; attempt++) {
    const res = await fetch(url);
    const json = await res.json();
    if (res.ok && !json.error) return json;
    console.log(`Limiet of fout (${json.reason || res.status}), opnieuw over 65 seconden...`);
    await new Promise(r => setTimeout(r, 65000));
  }
  throw new Error(`Ophalen mislukt: ${url}`);
};

// Air temperature uses the same cache as fetch-landen-klimaat.mjs, so cities fetched there are reused.
const airCacheFile = path.join(os.tmpdir(), 'landen-klimaat-cache-2015-01-01-2024-12-31.json');
const airCache = fs.existsSync(airCacheFile) ? JSON.parse(fs.readFileSync(airCacheFile, 'utf8')) : {};
const seaCacheFile = path.join(os.tmpdir(), 'weathertell-zee-cache-2023-2025.json');
const seaCache = fs.existsSync(seaCacheFile) ? JSON.parse(fs.readFileSync(seaCacheFile, 'utf8')) : {};

const out = { periode: '2015-2024', zeePeriode: '2023-2025', bron: 'ERA5 reanalysis via Open-Meteo', plaatsen: {} };
for (const [slug, opts] of Object.entries(PLACES)) {
  const { name, latitude, longitude } = coords(slug);
  if (!airCache[slug]) {
    const j = await get(`https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=2015-01-01&end_date=2024-12-31&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`);
    const months = Array.from({ length: 12 }, () => ({ max: 0, min: 0, rain: 0, days: 0 }));
    j.daily.time.forEach((t, i) => {
      const m = months[Number(t.slice(5, 7)) - 1];
      m.max += j.daily.temperature_2m_max[i]; m.min += j.daily.temperature_2m_min[i]; m.rain += j.daily.precipitation_sum[i]; m.days++;
    });
    airCache[slug] = { slug, name, maanden: months.map(m => ({ max: +(m.max / m.days).toFixed(1), min: +(m.min / m.days).toFixed(1), neerslag: Math.round(m.rain / 10) })) };
    fs.writeFileSync(airCacheFile, JSON.stringify(airCache));
    await new Promise(r => setTimeout(r, 1500));
  }
  let zee = null;
  if (opts.zee !== false) {
    if (!seaCache[slug]) {
      const j = await get(`https://marine-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}&start_date=2023-01-01&end_date=2025-12-31&hourly=sea_surface_temperature&timezone=auto&cell_selection=sea`);
      const sums = Array.from({ length: 12 }, () => ({ s: 0, n: 0 }));
      j.hourly.time.forEach((t, i) => { const v = j.hourly.sea_surface_temperature[i]; if (v != null) { const m = sums[Number(t.slice(5, 7)) - 1]; m.s += v; m.n++; } });
      seaCache[slug] = sums.map(m => m.n ? +(m.s / m.n).toFixed(1) : null);
      fs.writeFileSync(seaCacheFile, JSON.stringify(seaCache));
      await new Promise(r => setTimeout(r, 1000));
    }
    zee = seaCache[slug];
  }
  out.plaatsen[slug] = { name, maanden: airCache[slug].maanden, zee };
  console.log(name, zee ? 'met zeewater' : 'zonder zeewater');
}
fs.writeFileSync(path.join(root, 'data', 'city-climate.json'), JSON.stringify(out, null, 1));
console.log('Written: data/city-climate.json');
