import fs from 'fs';
import path from 'path';

const root = process.cwd();

// [slug, name, lat, lon] - verified against the Open-Meteo Marine API (non-null sea_surface_temperature)
const locations = [
  ['miami', 'Miami', 25.7617, -80.1918],
  ['havana', 'Havana', 23.1136, -82.3666],
  ['rio-de-janeiro', 'Rio de Janeiro', -22.9068, -43.1729],
  ['los-angeles', 'Los Angeles', 34.0522, -118.2437],
  ['san-francisco', 'San Francisco', 37.7749, -122.4194],
  ['vancouver', 'Vancouver', 49.2827, -123.1207],
  ['dublin', 'Dublin', 53.3498, -6.2603],
  ['lisbon', 'Lisbon', 38.7223, -9.1393],
  ['barcelona', 'Barcelona', 41.3874, 2.1686],
  ['beirut', 'Beirut', 33.8938, 35.5018],
  ['dubai', 'Dubai', 25.2048, 55.2708],
  ['cape-town', 'Cape Town', -33.9249, 18.4241],
  ['jakarta', 'Jakarta', -6.2088, 106.8456],
  ['singapore', 'Singapore', 1.3521, 103.8198],
  ['hong-kong', 'Hong Kong', 22.3193, 114.1694],
  ['tokyo', 'Tokyo', 35.6762, 139.6503],
  ['sydney', 'Sydney', -33.8688, 151.2093],
  ['auckland', 'Auckland', -36.8485, 174.7633]
];

const configJson = JSON.stringify({ items: locations.map(([slug, name, lat, lon]) => ({ slug, name, lat, lon })) });

const rows = locations.map(([slug, name]) =>
  `<a href="../weather/${slug}/"><span><strong>${name}</strong></span><span class="ws-snow" data-watertemp="${slug}">–</span></a>`
).join('');

const breadcrumbSchema = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Forecast', item: 'https://www.weathertell.com/' },
    { '@type': 'ListItem', position: 2, name: 'Water Temperature', item: 'https://www.weathertell.com/water-temperature/' }
  ]
});
const faqSchema = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'What is the current sea water temperature?', acceptedAnswer: { '@type': 'Answer', text: 'It varies by location and season. Above are live readings for 18 coastal cities around the world, updated automatically via Open-Meteo.' } },
    { '@type': 'Question', name: 'Is this the air temperature or the water temperature?', acceptedAnswer: { '@type': 'Answer', text: 'This is the sea surface temperature specifically, not the air temperature. The two can differ noticeably, especially on a sunny or windy day.' } },
    { '@type': 'Question', name: 'Does this match what I feel swimming?', acceptedAnswer: { '@type': 'Answer', text: 'It is a model value for the open sea surface near that location, not a measurement at the beach itself. Right at the shoreline and in shallow water it can run a little warmer or cooler than this figure.' } }
  ]
});

const html = `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="icon" type="image/png" href="../favicon.png"><link rel="apple-touch-icon" href="../apple-touch-icon.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="WeatherTell"><script defer src="/pwa.js"></script><script defer src="../analytics.js"></script><meta name="theme-color" content="#0a2a5c"><title>Sea Water Temperature Worldwide | WeatherTell.com</title><meta name="description" content="Current sea surface temperature for 18 coastal cities around the world, updated automatically. Handy for a swim, a dive, or planning a beach trip."><link rel="canonical" href="https://www.weathertell.com/water-temperature/"><meta property="og:type" content="website"><meta property="og:locale" content="en_GB"><meta property="og:site_name" content="WeatherTell.com"><meta property="og:title" content="Sea Water Temperature Worldwide | WeatherTell.com"><meta property="og:description" content="Current sea surface temperature for 18 coastal cities around the world, updated automatically."><meta property="og:url" content="https://www.weathertell.com/water-temperature/"><meta property="og:image" content="https://www.weathertell.com/og-image.png"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="Sea Water Temperature Worldwide | WeatherTell.com"><meta name="twitter:description" content="Current sea surface temperature for 18 coastal cities around the world."><meta name="twitter:image" content="https://www.weathertell.com/og-image.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet"><link rel="stylesheet" href="../styles.css"><script type="application/ld+json">${breadcrumbSchema}</script><script type="application/ld+json">${faqSchema}</script></head><body><div class="page-shell"><header class="site-header"><a class="brand" href="../" aria-label="WeatherTell.com home"><img class="brand-logo" src="../logo.png" alt=""><span>weather<span class="brand-dot">tell</span></span></a><nav class="top-nav" aria-label="Main navigation"><a href="../">Forecast</a><a href="../blog/">Weather Explained</a><a href="../sunrise-sunset/">Sunrise &amp; Sunset</a><a href="../glossary/">Glossary</a><a href="../locations/">Locations</a></nav><button class="location-button" id="locationButton" type="button" title="Use my location" aria-label="Use my location"><span class="location-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="7"></circle><line x1="12" y1="1" x2="12" y2="4"></line><line x1="12" y1="20" x2="12" y2="23"></line><line x1="1" y1="12" x2="4" y2="12"></line><line x1="20" y1="12" x2="23" y2="12"></line></svg></span><span>My location</span></button><details class="mobile-menu"><summary aria-label="Open navigation"><span class="menu-icon" aria-hidden="true">☰</span><span>Menu</span></summary><div><a href="../">Forecast</a><a href="../blog/">Weather Explained</a><a href="../sunrise-sunset/">Sunrise &amp; Sunset</a><a href="../glossary/">Glossary</a><a href="../locations/">Locations</a></div></details></header><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="../">Forecast</a><span class="sep">/</span><span class="crumb-current" aria-current="page">Water Temperature</span></nav><main><section class="location-copy" style="margin-top:56px"><p class="section-kicker">swimming &amp; the coast</p><h1 style="max-width:760px;margin-bottom:18px;color:var(--ink);font-size:clamp(32px,4vw,48px)">Sea Water Temperature Worldwide</h1><p style="font-size:18px;color:var(--muted);max-width:720px">Current sea surface temperature for 18 coastal cities around the world, updated automatically. Handy for a swim, a dive, or planning a beach day.</p><h2 style="margin-top:34px">Current water temperature by city</h2><p>Model value for the sea surface via Open-Meteo. <span id="watertempUpdated">Loading...</span></p><div class="related-links ws-grid">${rows}</div><p class="rain-hint" style="margin-top:10px">Warmest right now: <span id="watertempWarmest">–</span>. Right at the shoreline and in shallow water, the real temperature can run a little warmer or cooler than this open-sea model value.</p><h2 style="margin-top:40px">Why does water temperature matter?</h2><p>For swimmers and divers, water temperature mostly determines comfort and the risk of getting too cold, since the body loses heat far faster in water than in air of the same temperature. For surfers and other watersports, water temperature usually matters less for comfort, since a wetsuit handles most of the cooling, but it still affects marine life and, at a larger scale, the strength of storms that form over warm water.</p><h3>Frequently asked questions</h3><p><strong>What is the current sea water temperature?</strong><br>It varies by location and season. Above are live readings for 18 coastal cities around the world, updated automatically via Open-Meteo.</p><p><strong>Is this the air temperature or the water temperature?</strong><br>This is the sea surface temperature specifically, not the air temperature. The two can differ noticeably, especially on a sunny or windy day.</p><p><strong>Does this match what I feel swimming?</strong><br>It is a model value for the open sea surface near that location, not a measurement at the beach itself. Right at the shoreline and in shallow water it can run a little warmer or cooler than this figure.</p><h3>See also</h3><div class="related-links"><a href="../blog/feels-like-temperature/">What Does "Feels Like" Temperature Actually Mean? <span>→</span></a><a href="../glossary/dew-point/">Dew Point: Explained <span>→</span></a><a href="../locations/">Browse all locations <span>→</span></a></div></section></main><footer class="site-footer"><div class="footer-top"><div class="footer-brand"><a class="footer-logo" href="../"><img src="../logo.png" alt=""><span>weather<span class="brand-dot">tell</span></span></a><p>Clear weather forecasts for any place in the world, up to 14 days ahead.</p></div><nav class="footer-col" aria-label="Navigation"><h3>Navigation</h3><a href="../">Forecast</a><a href="../sunrise-sunset/">Sunrise &amp; Sunset</a></nav><nav class="footer-col" aria-label="Discover"><h3>Discover</h3><a href="../blog/">Weather Explained</a><a href="../locations/">Locations</a><a href="../glossary/">Glossary</a><a href="./">Water Temperature</a><a href="../snow-depth/">Snow Depth</a></nav><nav class="footer-col" aria-label="Popular cities"><h3>Popular cities</h3><a href="../weather/london/">London</a><a href="../weather/new-york/">New York</a><a href="../weather/tokyo/">Tokyo</a><a href="../weather/paris/">Paris</a><a href="../weather/sydney/">Sydney</a></nav></div><div class="footer-bottom"><span>© 2026 WeatherTell.com</span><span>Data from <a href="https://open-meteo.com" rel="noopener" target="_blank">Open-Meteo</a></span><a href="#" class="cookie-settings-link">Cookie settings</a><a href="../privacy/">Privacy Policy</a><a href="../terms/">Terms of Use</a></div></footer></div><script>addEventListener('scroll', function () { document.querySelector('.site-header').classList.toggle('is-stuck', scrollY > 4); }, { passive: true }); document.getElementById('locationButton').addEventListener('click', function () { if (!navigator.geolocation) return; var btn = this; btn.disabled = true; navigator.geolocation.getCurrentPosition(function (position) { window.location.href = '../?lat=' + position.coords.latitude + '&lon=' + position.coords.longitude; }, function () { btn.disabled = false; }); });</script><script>window.WATERTEMP=${configJson};</script><script defer src="../water-temp.js"></script></body></html>`;

fs.mkdirSync(path.join(root, 'water-temperature'), { recursive: true });
fs.writeFileSync(path.join(root, 'water-temperature', 'index.html'), html, 'utf8');
console.log('Generated water-temperature/index.html with ' + locations.length + ' coastal cities.');
