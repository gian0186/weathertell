import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const raw = JSON.parse(fs.readFileSync(path.join(root, 'data', 'london-history-1940-2025.json'), 'utf8'));
const d = raw.daily;

const days = d.time.map((time, i) => ({
  time,
  year: Number(time.slice(0, 4)),
  max: d.temperature_2m_max[i],
  min: d.temperature_2m_min[i],
  precip: d.precipitation_sum[i] ?? 0,
  sun: d.sunshine_duration[i] ?? 0
})).filter(day => Number.isFinite(day.max) && Number.isFinite(day.min));

const years = [...new Set(days.map(x => x.year))].sort((a, b) => a - b);

const round1 = n => Math.round(n * 10) / 10;
const round0 = n => Math.round(n);

function statsFor(yearDays) {
  const n = yearDays.length;
  const avgMax = round1(yearDays.reduce((a, x) => a + x.max, 0) / n);
  const avgMin = round1(yearDays.reduce((a, x) => a + x.min, 0) / n);
  const totalPrecip = round0(yearDays.reduce((a, x) => a + x.precip, 0));
  const totalSunHours = round0(yearDays.reduce((a, x) => a + x.sun, 0) / 3600);
  const warmestDay = yearDays.reduce((best, x) => x.max > best.max ? x : best, yearDays[0]);
  const coldestDay = yearDays.reduce((best, x) => x.min < best.min ? x : best, yearDays[0]);
  const wettestDay = yearDays.reduce((best, x) => x.precip > best.precip ? x : best, yearDays[0]);
  const frostDays = yearDays.filter(x => x.min < 0).length;
  const iceDays = yearDays.filter(x => x.max < 0).length;
  const warmDays = yearDays.filter(x => x.max >= 25).length;
  const hotDays = yearDays.filter(x => x.max >= 30).length;
  return { avgMax, avgMin, totalPrecip, totalSunHours, warmestDay, coldestDay, wettestDay, frostDays, iceDays, warmDays, hotDays, dayCount: n };
}

const yearStats = new Map();
for (const year of years) yearStats.set(year, statsFor(days.filter(x => x.year === year)));

// Climate normal: WMO reference period 1991-2020
const normalYears = years.filter(y => y >= 1991 && y <= 2020);
const normal = {};
normal.avgMax = round1(normalYears.reduce((a, y) => a + yearStats.get(y).avgMax, 0) / normalYears.length);
normal.avgMin = round1(normalYears.reduce((a, y) => a + yearStats.get(y).avgMin, 0) / normalYears.length);
normal.totalPrecip = round0(normalYears.reduce((a, y) => a + yearStats.get(y).totalPrecip, 0) / normalYears.length);
normal.totalSunHours = round0(normalYears.reduce((a, y) => a + yearStats.get(y).totalSunHours, 0) / normalYears.length);

const completeYears = years.filter(y => yearStats.get(y).dayCount >= 360);
const warmestYear = completeYears.reduce((best, y) => yearStats.get(y).avgMax > yearStats.get(best).avgMax ? y : best, completeYears[0]);
const coldestYear = completeYears.reduce((best, y) => yearStats.get(y).avgMax < yearStats.get(best).avgMax ? y : best, completeYears[0]);
const wettestYear = completeYears.reduce((best, y) => yearStats.get(y).totalPrecip > yearStats.get(best).totalPrecip ? y : best, completeYears[0]);
const driestYear = completeYears.reduce((best, y) => yearStats.get(y).totalPrecip < yearStats.get(best).totalPrecip ? y : best, completeYears[0]);
const sunniestYear = completeYears.reduce((best, y) => yearStats.get(y).totalSunHours > yearStats.get(best).totalSunHours ? y : best, completeYears[0]);
const leastSunnyYear = completeYears.reduce((best, y) => yearStats.get(y).totalSunHours < yearStats.get(best).totalSunHours ? y : best, completeYears[0]);
const mostFrostDaysYear = completeYears.reduce((best, y) => yearStats.get(y).frostDays > yearStats.get(best).frostDays ? y : best, completeYears[0]);
const mostHotDaysYear = completeYears.reduce((best, y) => yearStats.get(y).hotDays > yearStats.get(best).hotDays ? y : best, completeYears[0]);

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const formatDayDate = iso => { const [y, m, dd] = iso.split('-'); return `${Number(dd)} ${months[Number(m) - 1]} ${y}`; };
const diffWord = (value, normalValue, upWord, downWord) => value > normalValue ? upWord : value < normalValue ? downWord : 'equal to';

const footerNav = p => `<nav class="footer-col" aria-label="Navigation"><h3>Navigation</h3><a href="${p}">Forecast</a><a href="${p}7-day-forecast/">7-Day Forecast</a><a href="${p}14-day-forecast/">14-Day Forecast</a><a href="${p}sunrise-sunset/">Sunrise &amp; Sunset</a></nav><nav class="footer-col" aria-label="Discover"><h3>Discover</h3><a href="${p}blog/">Weather Explained</a><a href="${p}locations/">Locations</a><a href="${p}glossary/">Glossary</a><a href="${p}water-temperature/">Water Temperature</a><a href="${p}snow-depth/">Snow Depth</a><a href="${p}climate-archive/">Climate Archive</a><a href="${p}hay-fever/">Hay Fever</a></nav><nav class="footer-col" aria-label="Popular cities"><h3>Popular cities</h3><a href="${p}weather/london/">London</a><a href="${p}weather/new-york/">New York</a><a href="${p}weather/tokyo/">Tokyo</a><a href="${p}weather/paris/">Paris</a><a href="${p}weather/sydney/">Sydney</a></nav>`;

const shell = (p, title, description, canonicalPath, schemaScripts, breadcrumbHtml, bodyHtml) => `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="icon" type="image/png" href="${p}favicon.png"><link rel="apple-touch-icon" href="${p}apple-touch-icon.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="WeatherTell"><script defer src="/pwa.js"></script><script defer src="${p}analytics.js"></script><meta name="theme-color" content="#0a2a5c"><title>${title}</title><meta name="description" content="${description}"><link rel="canonical" href="https://www.weathertell.com/climate-archive/${canonicalPath}"><meta property="og:type" content="article"><meta property="og:locale" content="en_GB"><meta property="og:site_name" content="WeatherTell.com"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="https://www.weathertell.com/climate-archive/${canonicalPath}"><meta property="og:image" content="https://www.weathertell.com/og-image.png"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${description}"><meta name="twitter:image" content="https://www.weathertell.com/og-image.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet"><link rel="stylesheet" href="${p}styles.css">${schemaScripts}</head><body><div class="page-shell"><header class="site-header"><a class="brand" href="${p}" aria-label="WeatherTell.com home"><img class="brand-logo" src="${p}logo.png" alt=""><span>weather<span class="brand-dot">tell</span></span></a><nav class="top-nav" aria-label="Main navigation"><a href="${p}">Forecast</a><a href="${p}blog/">Weather Explained</a><a href="${p}sunrise-sunset/">Sunrise &amp; Sunset</a><a href="${p}glossary/">Glossary</a><a href="${p}locations/">Locations</a></nav><button class="location-button" id="locationButton" type="button" title="Use my location" aria-label="Use my location"><span class="location-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="7"></circle><line x1="12" y1="1" x2="12" y2="4"></line><line x1="12" y1="20" x2="12" y2="23"></line><line x1="1" y1="12" x2="4" y2="12"></line><line x1="20" y1="12" x2="23" y2="12"></line></svg></span><span>My location</span></button><details class="mobile-menu"><summary aria-label="Open navigation"><span class="menu-icon" aria-hidden="true">☰</span><span>Menu</span></summary><div><a href="${p}">Forecast</a><a href="${p}blog/">Weather Explained</a><a href="${p}sunrise-sunset/">Sunrise &amp; Sunset</a><a href="${p}glossary/">Glossary</a><a href="${p}locations/">Locations</a></div></details></header><nav class="breadcrumbs" aria-label="Breadcrumb">${breadcrumbHtml}</nav><main>${bodyHtml}</main><footer class="site-footer"><div class="footer-top"><div class="footer-brand"><a class="footer-logo" href="${p}"><img src="${p}logo.png" alt=""><span>weather<span class="brand-dot">tell</span></span></a><p>Clear weather forecasts for any place in the world, up to 14 days ahead.</p></div>${footerNav(p)}</div><div class="footer-bottom"><span>© 2026 WeatherTell.com</span><span>Data from <a href="https://open-meteo.com" rel="noopener" target="_blank">Open-Meteo</a> (historical data: ERA5 reanalysis for London)</span><a href="#" class="cookie-settings-link">Cookie settings</a><a href="${p}privacy/">Privacy Policy</a><a href="${p}terms/">Terms of Use</a></div></footer></div><script>addEventListener('scroll', function () { document.querySelector('.site-header').classList.toggle('is-stuck', scrollY > 4); }, { passive: true }); document.getElementById('locationButton').addEventListener('click', function () { if (!navigator.geolocation) return; var btn = this; btn.disabled = true; navigator.geolocation.getCurrentPosition(function (position) { window.location.href = '${p}?lat=' + position.coords.latitude + '&lon=' + position.coords.longitude; }, function () { btn.disabled = false; }); });</script></body></html>`;

const yearPage = year => {
  const s = yearStats.get(year);
  const prevYear = years.includes(year - 1) ? year - 1 : null;
  const nextYear = years.includes(year + 1) ? year + 1 : null;
  const tempWord = diffWord(s.avgMax, normal.avgMax, 'warmer', 'cooler');
  const precipWord = diffWord(s.totalPrecip, normal.totalPrecip, 'wetter', 'drier');
  const tempDiff = round1(Math.abs(s.avgMax - normal.avgMax));
  const precipDiff = Math.abs(s.totalPrecip - normal.totalPrecip);
  const superlatives = [
    year === warmestYear ? `${year} was the warmest year in London in this dataset since 1940, with an average high of ${s.avgMax}°C.` : '',
    year === coldestYear ? `${year} was the coldest year in London in this dataset since 1940, with an average high of only ${s.avgMax}°C.` : '',
    year === wettestYear ? `${year} was the wettest year in London in this dataset since 1940, with ${s.totalPrecip} mm of rain.` : '',
    year === driestYear ? `${year} was the driest year in London in this dataset since 1940, with just ${s.totalPrecip} mm of rain.` : ''
  ].filter(Boolean).join(' ');
  const intro = `In ${year}, the average daily high in London was ${s.avgMax}°C, ${tempDiff}° ${tempWord} than the 1991-2020 climate normal (${normal.avgMax}°C). ${s.totalPrecip} mm of rain fell that year, making it ${precipWord} than average (${normal.totalPrecip} mm), with ${s.totalSunHours} hours of sunshine.`;
  const breadcrumbSchema = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Forecast', item: 'https://www.weathertell.com/' },
    { '@type': 'ListItem', position: 2, name: 'Climate Archive', item: 'https://www.weathertell.com/climate-archive/' },
    { '@type': 'ListItem', position: 3, name: String(year), item: `https://www.weathertell.com/climate-archive/${year}/` }
  ] });
  const faq = [
    [`Was ${year} warmer or cooler than average in London?`, `${year} was ${tempDiff}° ${tempWord} than the 1991-2020 climate normal, with an average daily high of ${s.avgMax}°C compared to a normal of ${normal.avgMax}°C.`],
    [`How much rain fell in London in ${year}?`, `London recorded ${s.totalPrecip} mm of rain in total in ${year}, compared to a climate normal of ${normal.totalPrecip} mm.`],
    [`What was the warmest day of ${year} in London?`, `The warmest day of ${year} was ${formatDayDate(s.warmestDay.time)}, reaching ${round1(s.warmestDay.max)}°C in London.`]
  ];
  const faqSchema = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
  const body = `<article class="location-copy" style="margin-top:60px"><p class="section-kicker">climate archive</p><h1 style="max-width:720px;margin-bottom:18px;color:var(--ink);font-size:clamp(32px,4vw,48px)">London weather in ${year}</h1><p style="font-size:18px;color:var(--muted);max-width:680px">${intro} ${superlatives}</p><div class="highlight-cards" style="width:100%;margin:24px 0 0"><div class="highlight-card"><span class="highlight-icon">☀</span><div><h4>Avg. high</h4><strong>${s.avgMax}°C</strong></div></div><div class="highlight-card"><span class="highlight-icon">☂</span><div><h4>Rainfall</h4><strong>${s.totalPrecip} mm</strong></div></div><div class="highlight-card"><span class="highlight-icon">☾</span><div><h4>Avg. low</h4><strong>${s.avgMin}°C</strong></div></div><div class="highlight-card"><span class="highlight-icon">↗</span><div><h4>Sun hours</h4><strong>${s.totalSunHours} hrs</strong></div></div></div><p class="rain-hint" style="margin-top:10px">Measured in London. Source: Open-Meteo historical data (ERA5 reanalysis).</p><h3>Records of ${year}</h3><p><strong>Warmest day:</strong> ${formatDayDate(s.warmestDay.time)}, ${round1(s.warmestDay.max)}°C<br><strong>Coldest night:</strong> ${formatDayDate(s.coldestDay.time)}, ${round1(s.coldestDay.min)}°C<br><strong>Wettest day:</strong> ${formatDayDate(s.wettestDay.time)}, ${round1(s.wettestDay.precip)} mm</p><h3>Day counts for ${year}</h3><p><strong>Frost days</strong> (low below 0°C): ${s.frostDays}<br><strong>Ice days</strong> (high below 0°C): ${s.iceDays}<br><strong>Warm days</strong> (high 25°C or above): ${s.warmDays}<br><strong>Hot days</strong> (high 30°C or above): ${s.hotDays}</p><h3>Compared with the climate normal (1991-2020)</h3><p>The climate normal for London over the 1991-2020 reference period is an average daily high of ${normal.avgMax}°C, ${normal.totalPrecip} mm of rain and ${normal.totalSunHours} hours of sunshine per year. ${year} differed by ${tempDiff}° in temperature and ${precipDiff} mm in rainfall.</p><h3>Frequently asked questions</h3>${faq.map(([q, a]) => `<p><strong>${q}</strong><br>${a}</p>`).join('')}<h3>Other years</h3><div class="related-links">${prevYear ? `<a href="../${prevYear}/">${prevYear} <span>→</span></a>` : ''}${nextYear ? `<a href="../${nextYear}/">${nextYear} <span>→</span></a>` : ''}<a href="../">All years <span>→</span></a><a href="../records/">Weather records <span>→</span></a><a href="../compare/">Compare years <span>→</span></a></div></article>`;
  const breadcrumbHtml = `<a href="../../">Forecast</a><span class="sep">/</span><a href="../">Climate Archive</a><span class="sep">/</span><span class="crumb-current" aria-current="page">${year}</span>`;
  return shell('../../', `London weather in ${year} | WeatherTell.com`, `What was the weather like in London in ${year}? Average temperature, rainfall, sunshine and records, compared with the climate normal.`, `${year}/`, `<script type="application/ld+json">${breadcrumbSchema}</script><script type="application/ld+json">${faqSchema}</script>`, breadcrumbHtml, body);
};

for (const year of years) {
  const dir = path.join(root, 'climate-archive', String(year));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), yearPage(year), 'utf8');
}

const decades = {};
for (const year of years) { const decade = Math.floor(year / 10) * 10; (decades[decade] ??= []).push(year); }
const decadeSections = Object.entries(decades).map(([decade, decadeYears]) => `<div class="directory-country-group"><h3 class="directory-country-heading">${decade}s</h3><div class="directory-country-grid">${decadeYears.map(y => `<a href="${y}/">${y} <span>→</span></a>`).join('')}</div></div>`).join('');

const indexBreadcrumbSchema = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
  { '@type': 'ListItem', position: 1, name: 'Forecast', item: 'https://www.weathertell.com/' },
  { '@type': 'ListItem', position: 2, name: 'Climate Archive', item: 'https://www.weathertell.com/climate-archive/' }
] });
const indexFaqSchema = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [
  { '@type': 'Question', name: 'What was the warmest year ever recorded in London?', acceptedAnswer: { '@type': 'Answer', text: `Of the years in this dataset (since 1940), ${warmestYear} was the warmest, with an average daily high of ${yearStats.get(warmestYear).avgMax}°C.` } },
  { '@type': 'Question', name: 'What is the climate normal for London?', acceptedAnswer: { '@type': 'Answer', text: `The climate normal is the average over the 1991-2020 reference period. For London that works out to an average daily high of ${normal.avgMax}°C and ${normal.totalPrecip} mm of rain per year.` } },
  { '@type': 'Question', name: 'How far back does this climate archive go?', acceptedAnswer: { '@type': 'Answer', text: 'This archive goes back to 1940, based on the Open-Meteo ERA5 reanalysis dataset for London. Earlier years are not available from this source.' } }
] });
const indexBody = `<section class="location-directory"><p class="section-kicker">since 1940</p><h1>Climate Archive<br><em>London</em></h1><p>What was the weather like in London in a specific year? See average temperature, rainfall, sunshine and records for every year from 1940 to now.</p><div class="highlight-cards" style="width:100%;margin:28px 0 0"><div class="highlight-card"><span class="highlight-icon">☀</span><div><h4>Warmest year</h4><strong>${warmestYear}</strong><span class="highlight-sub">${yearStats.get(warmestYear).avgMax}°C avg. high</span></div></div><div class="highlight-card"><span class="highlight-icon">☾</span><div><h4>Coldest year</h4><strong>${coldestYear}</strong><span class="highlight-sub">${yearStats.get(coldestYear).avgMax}°C avg. high</span></div></div><div class="highlight-card"><span class="highlight-icon">☂</span><div><h4>Wettest year</h4><strong>${wettestYear}</strong><span class="highlight-sub">${yearStats.get(wettestYear).totalPrecip} mm</span></div></div><div class="highlight-card"><span class="highlight-icon">↗</span><div><h4>Driest year</h4><strong>${driestYear}</strong><span class="highlight-sub">${yearStats.get(driestYear).totalPrecip} mm</span></div></div></div><div class="related-links" style="margin-top:20px"><a href="records/">All weather records <span>→</span></a><a href="compare/">Compare all years <span>→</span></a></div><div class="directory-groups" style="margin-top:40px">${decadeSections}</div></section><section class="location-copy"><p class="section-kicker">explained</p><h2>What is a climate normal?</h2><p>A climate normal is the average weather over a fixed 30-year reference period, 1991-2020 in this archive, as is standard practice at national weather services and the World Meteorological Organization. Comparing a specific year against this normal shows at a glance whether that year was warmer, cooler, wetter or drier than usual.</p><h3>Why only data for London?</h3><p>London is a widely used reference point for UK climate statistics, though weather can vary locally across the country. The data in this archive comes from Open-Meteo's ERA5 reanalysis, which goes back to 1940.</p><h3>Frequently asked questions</h3><p><strong>What was the warmest year ever recorded in London?</strong><br>Of the years in this dataset (since 1940), ${warmestYear} was the warmest, with an average daily high of ${yearStats.get(warmestYear).avgMax}°C.</p><p><strong>What is the climate normal for London?</strong><br>The climate normal is the average over the 1991-2020 reference period. For London that works out to an average daily high of ${normal.avgMax}°C and ${normal.totalPrecip} mm of rain per year.</p><p><strong>How far back does this climate archive go?</strong><br>This archive goes back to 1940, based on the Open-Meteo ERA5 reanalysis dataset for London. Earlier years are not available from this source.</p></section>`;
const indexBreadcrumbHtml = `<a href="../">Forecast</a><span class="sep">/</span><span class="crumb-current" aria-current="page">Climate Archive</span>`;
fs.mkdirSync(path.join(root, 'climate-archive'), { recursive: true });
fs.writeFileSync(path.join(root, 'climate-archive', 'index.html'), shell('../', 'Climate Archive: London Weather Since 1940 | WeatherTell.com', 'What was the weather like in London in a specific year? See average temperature, rainfall and records for every year from 1940 to now.', '', `<script type="application/ld+json">${indexBreadcrumbSchema}</script><script type="application/ld+json">${indexFaqSchema}</script>`, indexBreadcrumbHtml, indexBody), 'utf8');

// All-time day records across the full dataset
const allTimeWarmestDay = days.reduce((best, x) => x.max > best.max ? x : best, days[0]);
const allTimeColdestDay = days.reduce((best, x) => x.min < best.min ? x : best, days[0]);
const allTimeWettestDay = days.reduce((best, x) => x.precip > best.precip ? x : best, days[0]);

const recordsBreadcrumbSchema = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
  { '@type': 'ListItem', position: 1, name: 'Forecast', item: 'https://www.weathertell.com/' },
  { '@type': 'ListItem', position: 2, name: 'Climate Archive', item: 'https://www.weathertell.com/climate-archive/' },
  { '@type': 'ListItem', position: 3, name: 'Records', item: 'https://www.weathertell.com/climate-archive/records/' }
] });
const recordCard = (icon, label, value, sub) => `<div class="highlight-card"><span class="highlight-icon">${icon}</span><div><h4>${label}</h4><strong>${value}</strong><span class="highlight-sub">${sub}</span></div></div>`;
const recordsBody = `<article class="location-copy" style="margin-top:60px"><p class="section-kicker">climate archive</p><h1 style="max-width:720px;margin-bottom:18px;color:var(--ink);font-size:clamp(32px,4vw,48px)">London weather records since 1940</h1><p style="font-size:18px;color:var(--muted);max-width:680px">The warmest, coldest and wettest days and years recorded in London since 1940, based on the Open-Meteo ERA5 reanalysis dataset.</p><h3>Day records (since 1940)</h3><div class="highlight-cards" style="width:100%;margin:16px 0 0">${recordCard('☀', 'Warmest day ever', `${round1(allTimeWarmestDay.max)}°C`, formatDayDate(allTimeWarmestDay.time))}${recordCard('☾', 'Coldest night ever', `${round1(allTimeColdestDay.min)}°C`, formatDayDate(allTimeColdestDay.time))}${recordCard('☂', 'Wettest day ever', `${round1(allTimeWettestDay.precip)} mm`, formatDayDate(allTimeWettestDay.time))}</div><h3>Year records (since 1940)</h3><div class="highlight-cards" style="width:100%;margin:16px 0 0">${recordCard('☀', 'Warmest year', warmestYear, `${yearStats.get(warmestYear).avgMax}°C avg. high`)}${recordCard('☾', 'Coldest year', coldestYear, `${yearStats.get(coldestYear).avgMax}°C avg. high`)}${recordCard('☂', 'Wettest year', wettestYear, `${yearStats.get(wettestYear).totalPrecip} mm`)}${recordCard('☀', 'Driest year', driestYear, `${yearStats.get(driestYear).totalPrecip} mm`)}</div><div class="highlight-cards" style="width:100%;margin:10px 0 0">${recordCard('↗', 'Sunniest year', sunniestYear, `${yearStats.get(sunniestYear).totalSunHours} sun hours`)}${recordCard('↘', 'Gloomiest year', leastSunnyYear, `${yearStats.get(leastSunnyYear).totalSunHours} sun hours`)}${recordCard('❄', 'Most frost days', mostFrostDaysYear, `${yearStats.get(mostFrostDaysYear).frostDays} frost days`)}${recordCard('☀', 'Most hot days', mostHotDaysYear, `${yearStats.get(mostHotDaysYear).hotDays} hot days`)}</div><p class="rain-hint" style="margin-top:10px">Measured in London. Source: Open-Meteo historical data (ERA5 reanalysis), 1940-2025 dataset.</p><h3>Why do these records only start in 1940?</h3><p>Our data comes from Open-Meteo's ERA5 reanalysis dataset, which only provides coverage from 1940 onward. Official UK weather records go back further, but they are not part of the dataset we use here, so records from before 1940 cannot be derived from this overview.</p><h3>See also</h3><div class="related-links"><a href="../">All years <span>→</span></a><a href="../compare/">Compare years <span>→</span></a><a href="../../locations/">Browse all locations <span>→</span></a></div></article>`;
fs.mkdirSync(path.join(root, 'climate-archive', 'records'), { recursive: true });
fs.writeFileSync(path.join(root, 'climate-archive', 'records', 'index.html'), shell('../../', 'London Weather Records Since 1940 | WeatherTell.com', 'What is the warmest day, coldest night and wettest day ever recorded in London? See all day and year records since 1940.', 'records/', `<script type="application/ld+json">${recordsBreadcrumbSchema}</script>`, `<a href="../../">Forecast</a><span class="sep">/</span><a href="../">Climate Archive</a><span class="sep">/</span><span class="crumb-current" aria-current="page">Records</span>`, recordsBody), 'utf8');

// Compare-years table
const compareRows = years.map(y => { const s = yearStats.get(y); return `<tr><td><a href="../${y}/">${y}</a></td><td>${s.avgMax}°C</td><td>${s.avgMin}°C</td><td>${s.totalPrecip} mm</td><td>${s.totalSunHours} hrs</td><td>${s.frostDays}</td><td>${s.hotDays}</td></tr>`; }).join('');
const compareBreadcrumbSchema = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
  { '@type': 'ListItem', position: 1, name: 'Forecast', item: 'https://www.weathertell.com/' },
  { '@type': 'ListItem', position: 2, name: 'Climate Archive', item: 'https://www.weathertell.com/climate-archive/' },
  { '@type': 'ListItem', position: 3, name: 'Compare years', item: 'https://www.weathertell.com/climate-archive/compare/' }
] });
const compareBody = `<article class="location-copy" style="margin-top:60px"><p class="section-kicker">climate archive</p><h1 style="max-width:720px;margin-bottom:18px;color:var(--ink);font-size:clamp(32px,4vw,48px)">Compare years: 1940-2025</h1><p style="font-size:18px;color:var(--muted);max-width:680px">Every year since 1940 side by side: average temperature, rainfall, sunshine, frost days and hot days for London. Click a year for the full overview.</p><div class="sun-table-wrap" style="margin-top:20px"><table class="sun-table"><thead><tr><th>Year</th><th>Avg. high</th><th>Avg. low</th><th>Rainfall</th><th>Sun hours</th><th>Frost days</th><th>Hot days</th></tr></thead><tbody>${compareRows}</tbody></table></div><p class="rain-hint" style="margin-top:10px">Measured in London. Source: Open-Meteo historical data (ERA5 reanalysis). Climate normal 1991-2020: ${normal.avgMax}°C avg. high, ${normal.totalPrecip} mm rain, ${normal.totalSunHours} sun hours.</p><h3>See also</h3><div class="related-links"><a href="../">All years <span>→</span></a><a href="../records/">Weather records <span>→</span></a><a href="../../locations/">Browse all locations <span>→</span></a></div></article>`;
fs.mkdirSync(path.join(root, 'climate-archive', 'compare'), { recursive: true });
fs.writeFileSync(path.join(root, 'climate-archive', 'compare', 'index.html'), shell('../../', 'Compare Years 1940-2025 | WeatherTell.com', 'Compare every year since 1940 side by side: average temperature, rainfall, sunshine and more for London.', 'compare/', `<script type="application/ld+json">${compareBreadcrumbSchema}</script>`, `<a href="../../">Forecast</a><span class="sep">/</span><a href="../">Climate Archive</a><span class="sep">/</span><span class="crumb-current" aria-current="page">Compare years</span>`, compareBody), 'utf8');

console.log(`Generated ${years.length} climate archive year pages (${years[0]}-${years[years.length - 1]}), records page, compare page, and the index page.`);
