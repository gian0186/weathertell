import fs from 'fs';
import path from 'path';

const root = process.cwd();

const pages = [
  {
    slug: '7-day-forecast',
    days: 7,
    navLabel: '7-Day',
    h1: '7-day <em>weather forecast</em>',
    title: '7 Day Weather Forecast | WeatherTell.com',
    description: 'Check the 7 day weather forecast for any city in the world: temperature, rain and wind per day, updated daily.',
    intro: 'See the weather forecast for the next 7 days, updated daily. Search your city to see exactly what to expect.',
    explainerH1: 'What is a 7-day weather forecast?',
    explainerBody: 'A 7-day forecast gives an expected temperature, rain chance and wind speed for each of the next seven days. Weather models calculate this from current measurements of air pressure, wind and humidity, combined with satellite and radar data.',
    reliabilityH2: 'How reliable is day 5, 6 or 7?',
    reliabilityBody: 'The first two or three days are usually the most accurate, since the current state of the atmosphere is still easy to track. From about day 4 or 5 onward, small differences in the starting conditions can add up, so the forecast becomes more of a trend, such as a warmer or wetter spell, rather than an exact number for one specific day.',
    otherLink: { href: '14-day-forecast/', label: '14 day weather forecast' },
    faq: [
      ['How reliable is a 7-day weather forecast?', 'The first two or three days are the most accurate. From around day 5 onward the forecast increasingly shows a trend in temperature and rain rather than an exact hour-by-hour prediction.'],
      ['Why does the 7-day forecast sometimes change from one day to the next?', 'Weather models constantly process new measurements. For the far-out days this can noticeably shift the forecast; for tomorrow and the day after it usually stays far more stable.']
    ]
  },
  {
    slug: '14-day-forecast',
    days: 14,
    navLabel: '14-Day',
    h1: '14-day <em>weather forecast</em>',
    title: '14 Day Weather Forecast | WeatherTell.com',
    description: 'Check the 14 day weather forecast for any city in the world: temperature, rain and wind per day, updated daily.',
    intro: 'See the weather forecast for the next 14 days, updated daily. Search your city to see exactly what to expect.',
    explainerH1: 'What is a 14-day weather forecast?',
    explainerBody: 'A 14-day forecast gives an expected temperature, rain chance and wind speed for each day, two full weeks ahead. Weather models calculate this from current measurements of air pressure, wind and humidity, combined with satellite and radar data.',
    reliabilityH2: 'How reliable is day 10, 12 or 14?',
    reliabilityBody: 'The first days are usually the most accurate, since the current state of the atmosphere is still easy to track. From about a week out it becomes harder to pin down the exact weather for one specific day: the forecast then mostly shows a trend, such as a warmer or wetter spell, rather than a precise number.',
    otherLink: { href: '7-day-forecast/', label: '7 day weather forecast' },
    faq: [
      ['How reliable is a 14-day weather forecast?', 'The first days are the most accurate. From around day 7 or 8 the forecast mostly shows a trend in temperature and rain rather than an exact hour-by-hour prediction.'],
      ['Why does the 14-day forecast sometimes change from one day to the next?', 'Weather models constantly process new measurements. For the far-out days this can noticeably shift the forecast; for tomorrow and the day after it usually stays far more stable.']
    ]
  }
];

const page = p => {
  const breadcrumbSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Forecast', item: 'https://www.weathertell.com/' },
      { '@type': 'ListItem', position: 2, name: p.navLabel + ' Forecast', item: `https://www.weathertell.com/${p.slug}/` }
    ]
  });
  const faqSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: p.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
  });

  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="icon" type="image/png" href="../favicon.png"><link rel="apple-touch-icon" href="../apple-touch-icon.png"><link rel="manifest" href="/manifest.json"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="WeatherTell"><script defer src="/pwa.js"></script><script defer src="../analytics.js"></script><meta name="theme-color" content="#0a2a5c"><title>${p.title}</title><meta name="description" content="${p.description}"><link rel="canonical" href="https://www.weathertell.com/${p.slug}/"><meta property="og:type" content="website"><meta property="og:locale" content="en_GB"><meta property="og:site_name" content="WeatherTell.com"><meta property="og:title" content="${p.title}"><meta property="og:description" content="${p.description}"><meta property="og:url" content="https://www.weathertell.com/${p.slug}/"><meta property="og:image" content="https://www.weathertell.com/og-image.png"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${p.title}"><meta name="twitter:description" content="${p.description}"><meta name="twitter:image" content="https://www.weathertell.com/og-image.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet"><link rel="stylesheet" href="../styles.css"><script type="application/ld+json">${breadcrumbSchema}</script><script type="application/ld+json">${faqSchema}</script></head><body data-forecast-days="${p.days}"><div class="page-shell"><header class="site-header"><a class="brand" href="../" aria-label="WeatherTell.com home"><img class="brand-logo" src="../logo.png" alt=""><span>weather<span class="brand-dot">tell</span></span></a><nav class="top-nav" aria-label="Main navigation"><a href="../">Forecast</a><a class="active" href="./">${p.navLabel}</a><a href="../blog/">Weather Explained</a><a href="../sunrise-sunset/">Sunrise &amp; Sunset</a><a href="../locations/">Locations</a></nav><button class="location-button" id="locationButton" type="button" title="Use my location" aria-label="Use my location"><span class="location-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="7"></circle><line x1="12" y1="1" x2="12" y2="4"></line><line x1="12" y1="20" x2="12" y2="23"></line><line x1="1" y1="12" x2="4" y2="12"></line><line x1="20" y1="12" x2="23" y2="12"></line></svg></span><span>My location</span></button><details class="mobile-menu"><summary aria-label="Open navigation"><span class="menu-icon" aria-hidden="true">☰</span><span>Menu</span></summary><div><a href="../">Forecast</a><a class="active" href="./">${p.navLabel}</a><a href="../blog/">Weather Explained</a><a href="../sunrise-sunset/">Sunrise &amp; Sunset</a><a href="../locations/">Locations</a></div></details></header><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="../">Forecast</a><span class="sep">/</span><span class="crumb-current" aria-current="page">${p.navLabel} Forecast</span></nav><main><section class="hero" id="forecast"><div class="hero-copy"><p class="eyebrow"><span class="eyebrow-line"></span> weather forecast by city</p><h1>${p.h1}</h1><p class="hero-intro">${p.intro}</p><form class="search-form" id="searchForm" role="search"><label class="sr-only" for="locationSearch">Search for a place</label><span class="search-icon" aria-hidden="true">⌕</span><input id="locationSearch" name="location" type="search" autocomplete="off" placeholder="Search city or postcode" value="London"><button type="submit">Check weather <span aria-hidden="true">→</span></button><div class="suggestions" id="suggestions" hidden></div></form><p class="search-hint">Try for example: Paris, New York or Tokyo</p></div><div class="hero-art" aria-hidden="true"><div class="sun-disc"></div><div class="cloud cloud-back"></div><div class="cloud cloud-front"></div><div class="rain rain-one"></div><div class="rain rain-two"></div><div class="rain rain-three"></div><div class="art-label">today<br><strong>look ahead</strong></div></div></section><section class="weather-panel" id="overzicht" aria-live="polite"><div class="panel-heading"><div><p class="section-kicker">your forecast</p><h2 id="locationName">London, England</h2></div><div class="updated"><span class="status-dot"></span><span id="updatedText">Just updated</span></div></div><div class="current-weather"><div class="temperature-block"><span class="weather-symbol" id="currentSymbol">◒</span><div><strong id="currentTemp">18°</strong><span class="degrees">C</span></div><p id="currentSummary">Light cloud</p></div><div class="weather-stats"><div><span>Feels like</span><strong id="feelsLike">17°</strong></div><div><span>Wind</span><strong id="windSpeed">SW 3 bft</strong></div><div><span>Precipitation</span><strong id="rainChance">20%</strong></div></div><div class="daylight"><span class="daylight-icon">◐</span><div><span>Daylight</span><strong id="daylightText">07:12 — 20:44</strong></div></div></div><div class="hourly-strip" id="hourlyStrip" aria-label="Hour-by-hour forecast"></div></section><section class="rain-section" aria-labelledby="rainTitle"><div class="section-heading-row"><div><p class="section-kicker">next 24 hours</p><h2 id="rainTitle">Rain forecast</h2></div></div><div class="rain-chart-wrap"><div class="rain-chart" id="rainChart"></div><div class="rain-tooltip" id="rainTooltip" hidden></div></div><p class="rain-hint">Hover over the chart to see rainfall per hour.</p></section><section class="forecast-section" id="days"><div class="section-heading-row"><div><p class="section-kicker">looking ahead</p><h2>The next ${p.days} days</h2></div><div class="legend"><span class="legend-high"></span> maximum <span class="legend-low"></span> minimum</div></div><div class="forecast-grid" id="forecastGrid"></div></section><section class="location-copy"><p class="section-kicker">explained</p><h2>${p.explainerH1}</h2><p>${p.explainerBody}</p><h3>${p.reliabilityH2}</h3><p>${p.reliabilityBody}</p><h3>Frequently asked questions</h3>${p.faq.map(([q, a]) => `<p><strong>${q}</strong><br>${a}</p>`).join('')}<p>Prefer a different range? See the <a href="../${p.otherLink.href}">${p.otherLink.label}</a>, or search <a href="../locations/">your own city</a>.</p></section><section class="insight-band"><div class="insight-copy"><p class="section-kicker">today's tip</p><h2>Plan your day<br><em>around the weather.</em></h2></div><div class="insight-note"><span class="note-mark">✦</span><p id="insightText">Today's outlook is loading.</p></div></section></main><footer class="site-footer"><div class="footer-top"><div class="footer-brand"><a class="footer-logo" href="../"><img src="../logo.png" alt=""><span>weather<span class="brand-dot">tell</span></span></a><p>Clear weather forecasts for any place in the world, up to 14 days ahead.</p></div><nav class="footer-col" aria-label="Navigation"><h3>Navigation</h3><a href="../">Forecast</a><a href="../7-day-forecast/">7-Day Forecast</a><a href="../14-day-forecast/">14-Day Forecast</a><a href="../sunrise-sunset/">Sunrise &amp; Sunset</a></nav><nav class="footer-col" aria-label="Discover"><h3>Discover</h3><a href="../blog/">Weather Explained</a><a href="../locations/">Locations</a><a href="../glossary/">Glossary</a><a href="../water-temperature/">Water Temperature</a><a href="../snow-depth/">Snow Depth</a></nav><nav class="footer-col" aria-label="Popular cities"><h3>Popular cities</h3><a href="../weather/london/">London</a><a href="../weather/new-york/">New York</a><a href="../weather/tokyo/">Tokyo</a><a href="../weather/paris/">Paris</a><a href="../weather/sydney/">Sydney</a></nav></div><div class="footer-bottom"><span>© 2026 WeatherTell.com</span><span>Data from <a href="https://open-meteo.com" rel="noopener" target="_blank">Open-Meteo</a></span><a href="#" class="cookie-settings-link">Cookie settings</a><a href="../privacy/">Privacy Policy</a><a href="../terms/">Terms of Use</a></div></footer></div><script>addEventListener('scroll', function () { document.querySelector('.site-header').classList.toggle('is-stuck', scrollY > 4); }, { passive: true }); document.getElementById('locationButton').addEventListener('click', function () { if (!navigator.geolocation) return; var btn = this; btn.disabled = true; navigator.geolocation.getCurrentPosition(function (position) { window.location.href = '../?lat=' + position.coords.latitude + '&lon=' + position.coords.longitude; }, function () { btn.disabled = false; }); });</script><script src="../app.js"></script></body></html>`;
};

for (const p of pages) {
  const dir = path.join(root, p.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), page(p), 'utf8');
}
console.log(`Generated ${pages.length} forecast pages: ${pages.map(p => p.slug).join(', ')}.`);
