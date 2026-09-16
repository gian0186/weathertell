const FORECAST_DAYS = Number(document.body.dataset.forecastDays) || 14;
const siteHeader = document.querySelector('.site-header');
addEventListener('scroll', () => siteHeader.classList.toggle('is-stuck', scrollY > 4), { passive: true });

const searchForm = document.querySelector('#searchForm');
const searchInput = document.querySelector('#locationSearch');
const suggestions = document.querySelector('#suggestions');
const locationName = document.querySelector('#locationName');
const currentTemp = document.querySelector('#currentTemp');
const currentSymbol = document.querySelector('#currentSymbol');
const currentSummary = document.querySelector('#currentSummary');
const feelsLike = document.querySelector('#feelsLike');
const windSpeed = document.querySelector('#windSpeed');
const rainChance = document.querySelector('#rainChance');
const hourlyStrip = document.querySelector('#hourlyStrip');
const rainChart = document.querySelector('#rainChart');
const rainTooltip = document.querySelector('#rainTooltip');
const forecastGrid = document.querySelector('#forecastGrid');
const updatedText = document.querySelector('#updatedText');
const insightText = document.querySelector('#insightText');

const wxIcons = {
  sun: '<svg class="wx-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5.5" fill="#fed00e"/><g stroke="#fed00e" stroke-width="1.8" stroke-linecap="round"><line x1="12" y1="1.5" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22.5"/><line x1="1.5" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22.5" y2="12"/><line x1="4.6" y1="4.6" x2="6.2" y2="6.2"/><line x1="17.8" y1="17.8" x2="19.4" y2="19.4"/><line x1="4.6" y1="19.4" x2="6.2" y2="17.8"/><line x1="17.8" y1="6.2" x2="19.4" y2="4.6"/></g></svg>',
  partlySunny: '<svg class="wx-icon" viewBox="0 0 24 24"><circle cx="9.5" cy="9" r="4.5" fill="#fed00e"/><g fill="#eef1ee" style="filter:drop-shadow(0 1px 0 rgba(23,37,34,.1))"><rect x="8" y="15.3" width="15" height="3.7" rx="1.85"/><circle cx="12.8" cy="14.4" r="4.1"/><circle cx="18.7" cy="14.8" r="3"/></g></svg>',
  moon: '<svg class="wx-icon" viewBox="0 0 24 24"><path d="M15.5 3.5a8.5 8.5 0 1 0 5 15.4A8.5 8.5 0 0 1 15.5 3.5Z" fill="#cbd5f5"/><g fill="#fed00e"><circle cx="20" cy="5.5" r="1"/><circle cx="17" cy="9.5" r=".7"/><circle cx="21.5" cy="10.5" r=".6"/></g></svg>',
  partlyMoon: '<svg class="wx-icon" viewBox="0 0 24 24"><path d="M11 3.2a5.6 5.6 0 0 0 4.9 8.3 5.6 5.6 0 0 1-7.5 5.4A5.6 5.6 0 0 1 11 3.2Z" fill="#cbd5f5"/><g fill="#eef1ee" style="filter:drop-shadow(0 1px 0 rgba(23,37,34,.1))"><rect x="8" y="15.3" width="15" height="3.7" rx="1.85"/><circle cx="12.8" cy="14.4" r="4.1"/><circle cx="18.7" cy="14.8" r="3"/></g></svg>',
  cloudy: '<svg class="wx-icon" viewBox="0 0 24 24" style="filter:drop-shadow(0 1.5px 0 rgba(23,37,34,.12))"><g fill="#eef1ee"><rect x="1.1" y="9" width="21.8" height="4.5" rx="2.25"/><circle cx="8.3" cy="7.9" r="5.1"/><circle cx="16.1" cy="8.3" r="3.75"/></g></svg>',
  fog: '<svg class="wx-icon" viewBox="0 0 24 24" style="filter:drop-shadow(0 1.5px 0 rgba(23,37,34,.12))"><g fill="#eef1ee"><rect x="1.1" y="9" width="21.8" height="4.5" rx="2.25"/><circle cx="8.3" cy="7.9" r="5.1"/><circle cx="16.1" cy="8.3" r="3.75"/></g><g stroke="#8fa19c" stroke-width="1.6" stroke-linecap="round"><line x1="3" y1="17" x2="21" y2="17"/><line x1="5" y1="20.5" x2="19" y2="20.5"/></g></svg>',
  drizzle: '<svg class="wx-icon" viewBox="0 0 24 24" style="filter:drop-shadow(0 1.5px 0 rgba(23,37,34,.12))"><g fill="#eef1ee"><rect x="1.1" y="9" width="21.8" height="4.5" rx="2.25"/><circle cx="8.3" cy="7.9" r="5.1"/><circle cx="16.1" cy="8.3" r="3.75"/></g><g stroke="#0d54c9" stroke-width="1.6" stroke-linecap="round"><line x1="9" y1="16" x2="8" y2="19"/><line x1="14" y1="16" x2="13" y2="19"/></g></svg>',
  rain: '<svg class="wx-icon" viewBox="0 0 24 24" style="filter:drop-shadow(0 1.5px 0 rgba(23,37,34,.12))"><g fill="#c9d2ce"><rect x="1.1" y="9" width="21.8" height="4.5" rx="2.25"/><circle cx="8.3" cy="7.9" r="5.1"/><circle cx="16.1" cy="8.3" r="3.75"/></g><g stroke="#0d54c9" stroke-width="1.8" stroke-linecap="round"><line x1="7" y1="16" x2="6" y2="19.5"/><line x1="12" y1="16" x2="11" y2="19.5"/><line x1="17" y1="16" x2="16" y2="19.5"/></g></svg>',
  snow: '<svg class="wx-icon" viewBox="0 0 24 24" style="filter:drop-shadow(0 1.5px 0 rgba(23,37,34,.12))"><g fill="#eef1ee"><rect x="1.1" y="9" width="21.8" height="4.5" rx="2.25"/><circle cx="8.3" cy="7.9" r="5.1"/><circle cx="16.1" cy="8.3" r="3.75"/></g><g fill="#0d54c9"><circle cx="8" cy="17.5" r="1.1"/><circle cx="12.5" cy="19.5" r="1.1"/><circle cx="16" cy="17.5" r="1.1"/></g></svg>',
  showers: '<svg class="wx-icon" viewBox="0 0 24 24"><circle cx="8" cy="7" r="3.6" fill="#fed00e"/><g fill="#c9d2ce" style="filter:drop-shadow(0 1.2px 0 rgba(23,37,34,.12))"><rect x="4.5" y="12.5" width="17" height="4" rx="2"/><circle cx="10.7" cy="11.5" r="4.4"/><circle cx="17.7" cy="11.9" r="3.3"/></g><g stroke="#0d54c9" stroke-width="1.8" stroke-linecap="round"><line x1="10" y1="19" x2="9" y2="22.5"/><line x1="15" y1="19" x2="14" y2="22.5"/></g></svg>',
  thunder: '<svg class="wx-icon" viewBox="0 0 24 24" style="filter:drop-shadow(0 1.5px 0 rgba(23,37,34,.15))"><g fill="#9aa6a1"><rect x="1.1" y="9" width="21.8" height="4.5" rx="2.25"/><circle cx="8.3" cy="7.9" r="5.1"/><circle cx="16.1" cy="8.3" r="3.75"/></g><polygon points="13,13.5 9.5,18 11.7,18 10.3,22.5 15,16.5 12.6,16.5" fill="#e77b5e"/></svg>'
};
const weatherLabels = {
  0: ['Sunny', wxIcons.sun], 1: ['Mostly sunny', wxIcons.partlySunny], 2: ['Partly cloudy', wxIcons.partlySunny], 3: ['Cloudy', wxIcons.cloudy],
  45: ['Foggy', wxIcons.fog], 48: ['Foggy', wxIcons.fog], 51: ['Light drizzle', wxIcons.drizzle], 53: ['Drizzle', wxIcons.drizzle], 55: ['Drizzle', wxIcons.drizzle],
  61: ['Light rain', wxIcons.rain], 63: ['Rain', wxIcons.rain], 65: ['Heavy rain', wxIcons.rain], 71: ['Light snow', wxIcons.snow], 73: ['Snow', wxIcons.snow], 75: ['Heavy snow', wxIcons.snow],
  80: ['Showers', wxIcons.showers], 81: ['Showers', wxIcons.showers], 82: ['Heavy showers', wxIcons.showers], 95: ['Thunderstorm', wxIcons.thunder], 96: ['Thunderstorm', wxIcons.thunder], 99: ['Thunderstorm', wxIcons.thunder]
};
const nightWeatherLabels = {
  0: ['Clear', wxIcons.moon], 1: ['Mostly clear', wxIcons.partlyMoon], 2: ['Partly cloudy', wxIcons.partlyMoon]
};
const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const locationPage = document.body.dataset.locationName;
let selectedPlace = {
  name: locationPage || 'London',
  admin1: document.body.dataset.locationRegion || 'England',
  latitude: Number(document.body.dataset.latitude) || 51.5074,
  longitude: Number(document.body.dataset.longitude) || -0.1278
};

async function reverseGeocode(latitude, longitude) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const data = await response.json();
    const name = data.city || data.locality;
    return name ? { name, admin1: data.principalSubdivision || '' } : null;
  } catch (error) {
    return null;
  }
}

function applyResolvedName(place, latitude, longitude) {
  if (!place || selectedPlace.latitude !== latitude || selectedPlace.longitude !== longitude) return;
  selectedPlace.name = place.name;
  selectedPlace.admin1 = place.admin1;
  locationName.textContent = `${place.name}${place.admin1 ? `, ${place.admin1}` : ''}`;
}

const sharedLocationParams = new URLSearchParams(window.location.search);
const sharedLat = parseFloat(sharedLocationParams.get('lat'));
const sharedLon = parseFloat(sharedLocationParams.get('lon'));
if (!locationPage && Number.isFinite(sharedLat) && Number.isFinite(sharedLon)) {
  selectedPlace = { name: 'My location', latitude: sharedLat, longitude: sharedLon };
  window.history.replaceState({}, '', window.location.pathname);
  reverseGeocode(sharedLat, sharedLon).then(place => applyResolvedName(place, sharedLat, sharedLon));
}

const sharedQuery = sharedLocationParams.get('q');
let handledByQuery = false;
if (!locationPage && sharedQuery && sharedQuery.trim().length >= 2) {
  handledByQuery = true;
  searchInput.value = sharedQuery;
  window.history.replaceState({}, '', window.location.pathname);
  findPlaces(sharedQuery)
    .then(places => { if (places[0]) { searchInput.value = places[0].name; loadWeather(places[0]); } else { loadWeather(selectedPlace); } })
    .catch(() => loadWeather(selectedPlace));
}

function getWeatherLabel(code, isDay = 1) { return (isDay === 0 && nightWeatherLabels[code]) || weatherLabels[code] || ['Changeable', wxIcons.partlySunny]; }
function formatHour(iso) { return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
function formatDay(iso, index) { return index === 0 ? 'Today' : fullDays[new Date(`${iso}T12:00:00`).getDay()]; }
const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function formatDayDate(iso) { const d = new Date(`${iso}T12:00:00`); return `${d.getDate()} ${shortMonths[d.getMonth()]}`; }
function windDirection(degrees) { const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']; return points[Math.round(degrees / 45) % 8]; }
function safeNumber(value, fallback = '--') { return Number.isFinite(value) ? Math.round(value) : fallback; }

function renderHourly(data) {
  hourlyStrip.innerHTML = data.hourly.time.slice(0, 8).map((time, index) => {
    const [label, icon] = getWeatherLabel(data.hourly.weather_code[index], data.hourly.is_day[index]);
    return `<div class="hour ${index === 0 ? 'current' : ''}"><span>${index === 0 ? 'Now' : formatHour(time)}</span><b title="${label}">${icon}</b><strong>${safeNumber(data.hourly.temperature_2m[index])}°</strong></div>`;
  }).join('');
}

function renderRainChart(data) {
  const hours = 24;
  const times = data.hourly.time.slice(0, hours);
  const values = data.hourly.precipitation.slice(0, hours).map(v => Number.isFinite(v) ? v : 0);

  const isMobile = window.innerWidth <= 530;
  const width = isMobile ? 340 : 720, height = isMobile ? 220 : 200;
  const marginLeft = 36, marginRight = 12, marginTop = 16, marginBottom = 24;
  const plotW = width - marginLeft - marginRight;
  const plotH = height - marginTop - marginBottom;
  const baseY = marginTop + plotH;

  const bands = [{ mm: 2, label: 'Light' }, { mm: 8, label: 'Med' }, { mm: 20, label: 'Heavy' }];
  const maxValue = Math.max(...values, 0);
  const domainMax = Math.max(25, Math.ceil(maxValue * 1.2));

  const xAt = i => marginLeft + (i / (hours - 1)) * plotW;
  const yAt = v => marginTop + plotH - (Math.min(v, domainMax) / domainMax) * plotH;

  const points = values.map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(' ');
  const areaPath = `M${xAt(0).toFixed(1)},${baseY.toFixed(1)} L${points.split(' ').join(' L')} L${xAt(hours - 1).toFixed(1)},${baseY.toFixed(1)} Z`;

  const gridLines = bands.filter(b => b.mm < domainMax).map(b => {
    const y = yAt(b.mm);
    return `<line x1="${marginLeft}" y1="${y.toFixed(1)}" x2="${width - marginRight}" y2="${y.toFixed(1)}" stroke="rgba(23,37,34,.1)" stroke-width="1"/><text x="${marginLeft - 6}" y="${(y + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="#687673">${b.label}</text>`;
  }).join('');

  const labelIndexes = [0, 6, 12, 18, hours - 1];
  const hourLabels = labelIndexes.map(i => {
    const x = xAt(i);
    const anchor = i === 0 ? 'start' : i === hours - 1 ? 'end' : 'middle';
    const label = i === 0 ? 'Now' : new Date(times[i]).toLocaleTimeString('en-GB', { hour: '2-digit' }) + ':00';
    return `<text x="${x.toFixed(1)}" y="${height - 6}" text-anchor="${anchor}" font-size="9" fill="#687673">${label}</text>`;
  }).join('');

  const nowX = xAt(0);

  rainChart.innerHTML = `<svg id="rainChartSvg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="Rain intensity per hour for the next 24 hours, current value ${values[0].toFixed(1)} millimetres per hour">
    ${gridLines}
    <line x1="${nowX.toFixed(1)}" y1="${marginTop}" x2="${nowX.toFixed(1)}" y2="${baseY.toFixed(1)}" stroke="#e77b5e" stroke-width="1.5" stroke-dasharray="3,3"/>
    <path d="${areaPath}" fill="rgba(23,109,103,.14)"/>
    <polyline points="${points}" fill="none" stroke="#0d54c9" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    ${hourLabels}
    <line id="rainHoverLine" x1="${nowX.toFixed(1)}" y1="${marginTop}" x2="${nowX.toFixed(1)}" y2="${baseY.toFixed(1)}" stroke="#172522" stroke-width="1" opacity="0" />
    <circle id="rainHoverDot" cx="${nowX.toFixed(1)}" cy="${yAt(values[0]).toFixed(1)}" r="4" fill="#0d54c9" stroke="#fbfaf6" stroke-width="2" opacity="0"/>
    <rect id="rainHoverArea" x="${marginLeft}" y="${marginTop}" width="${plotW}" height="${plotH}" fill="transparent"/>
  </svg>`;

  const svg = rainChart.querySelector('#rainChartSvg');
  const hoverArea = rainChart.querySelector('#rainHoverArea');
  const hoverDot = rainChart.querySelector('#rainHoverDot');
  const hoverLine = rainChart.querySelector('#rainHoverLine');

  function showAt(clientX) {
    const rect = svg.getBoundingClientRect();
    const svgX = (clientX - rect.left) * (width / rect.width);
    let index = Math.round(((svgX - marginLeft) / plotW) * (hours - 1));
    index = Math.max(0, Math.min(hours - 1, index));
    const x = xAt(index);
    const y = yAt(values[index]);
    hoverDot.setAttribute('cx', x.toFixed(1));
    hoverDot.setAttribute('cy', y.toFixed(1));
    hoverDot.setAttribute('opacity', '1');
    hoverLine.setAttribute('x1', x.toFixed(1));
    hoverLine.setAttribute('x2', x.toFixed(1));
    hoverLine.setAttribute('opacity', '.25');
    const time = index === 0 ? 'Now' : formatHour(times[index]);
    const value = values[index];
    rainTooltip.innerHTML = `<strong>${time}</strong><span>${value > 0 ? `${value.toFixed(1)} mm/h` : 'Dry'}</span>`;
    rainTooltip.hidden = false;
    const wrapRect = rainChart.getBoundingClientRect();
    const px = (x / width) * wrapRect.width;
    const py = (y / height) * wrapRect.height;
    rainTooltip.style.left = `${Math.min(Math.max(px, 34), wrapRect.width - 34)}px`;
    rainTooltip.style.top = `${Math.max(py - 10, 4)}px`;
  }

  hoverArea.addEventListener('pointermove', event => showAt(event.clientX));
  hoverArea.addEventListener('pointerdown', event => showAt(event.clientX));
  hoverArea.addEventListener('pointerleave', () => {
    hoverDot.setAttribute('opacity', '0');
    hoverLine.setAttribute('opacity', '0');
    rainTooltip.hidden = true;
  });
}

function formatMm(value) {
  if (!Number.isFinite(value) || value <= 0) return '';
  return `${value.toFixed(1)} mm`;
}

function renderForecast(data) {
  const maxes = data.daily.temperature_2m_max.slice(0, FORECAST_DAYS);
  const mins = data.daily.temperature_2m_min.slice(0, FORECAST_DAYS);
  const finiteMaxes = maxes.filter(Number.isFinite);
  const finiteMins = mins.filter(Number.isFinite);
  const globalMax = finiteMaxes.length ? Math.max(...finiteMaxes) : 20;
  const globalMin = finiteMins.length ? Math.min(...finiteMins) : 0;
  const span = Math.max(1, globalMax - globalMin);
  forecastGrid.innerHTML = data.daily.time.slice(0, FORECAST_DAYS).map((date, index) => {
    const [label, icon] = getWeatherLabel(data.daily.weather_code[index]);
    const rain = safeNumber(data.daily.precipitation_probability_max[index], 0);
    const wind = safeNumber(data.daily.wind_speed_10m_max[index], 0);
    const dayMax = maxes[index];
    const dayMin = mins[index];
    const fromPct = Number.isFinite(dayMin) ? ((dayMin - globalMin) / span) * 100 : 0;
    const toPct = Number.isFinite(dayMax) ? ((dayMax - globalMin) / span) * 100 : 100;

    const hourStart = index * 24;
    const hourTimes = data.hourly.time.slice(hourStart, hourStart + 24);
    const hourBlocks = hourTimes.map((time, hourIndex) => {
      const i = hourStart + hourIndex;
      const [, hourIcon] = getWeatherLabel(data.hourly.weather_code[i], data.hourly.is_day[i]);
      const mm = formatMm(data.hourly.precipitation[i]);
      return `<div class="hour-block"><span class="hour-time">${formatHour(time)}</span><b>${hourIcon}</b><strong>${safeNumber(data.hourly.temperature_2m[i])}°</strong><span class="hour-rain">${mm}</span></div>`;
    }).join('');

    return `<article class="forecast-row"><button type="button" class="forecast-summary" aria-expanded="false"><span class="day">${formatDay(date, index)}<small>${formatDayDate(date)}</small></span><div class="forecast-icon" title="${label}">${icon}</div><p class="forecast-desc">${label}</p><div class="temp-range" title="${safeNumber(dayMax)}° / ${safeNumber(dayMin)}°"><strong>${safeNumber(dayMax)}°</strong><span class="range-track"><span class="range-fill" style="left:${fromPct.toFixed(1)}%;right:${(100 - toPct).toFixed(1)}%"></span></span><span class="range-min">${safeNumber(dayMin)}°</span></div><div class="forecast-meta"><div class="rain-meter" title="${rain}% chance of rain"><span class="rain-track"><span class="rain-fill" style="width:${rain}%"></span></span><span class="rain-value">${rain}%</span></div><span class="wind-value">Wind ${wind} km/h</span></div><span class="expand-icon" aria-hidden="true">⌄</span></button><div class="forecast-hourly" hidden><div class="hourly-scroll">${hourBlocks}</div></div></article>`;
  }).join('');

  if (FORECAST_DAYS > 7) {
    let toggle = forecastGrid.parentElement.querySelector('.forecast-toggle');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.className = 'forecast-toggle';
      toggle.type = 'button';
      toggle.textContent = `Show ${FORECAST_DAYS} days`;
      forecastGrid.parentElement.append(toggle);
      toggle.addEventListener('click', () => {
        const expanded = forecastGrid.classList.toggle('show-all');
        toggle.textContent = expanded ? 'Show less' : `Show ${FORECAST_DAYS} days`;
      });
    }
  }
}

forecastGrid.addEventListener('click', event => {
  const summary = event.target.closest('.forecast-summary');
  if (!summary) return;
  const row = summary.closest('.forecast-row');
  const panel = row.querySelector('.forecast-hourly');
  const isOpen = row.classList.contains('is-open');
  forecastGrid.querySelectorAll('.forecast-row.is-open').forEach(openRow => {
    if (openRow !== row) {
      openRow.classList.remove('is-open');
      openRow.querySelector('.forecast-summary').setAttribute('aria-expanded', 'false');
      openRow.querySelector('.forecast-hourly').hidden = true;
    }
  });
  row.classList.toggle('is-open', !isOpen);
  summary.setAttribute('aria-expanded', String(!isOpen));
  panel.hidden = isOpen;
});

function renderWeather(data) {
  const current = data.current;
  const [label, icon] = getWeatherLabel(current.weather_code, current.is_day);
  const rainProbability = safeNumber(data.daily.precipitation_probability_max[0], 0);
  locationName.textContent = `${selectedPlace.name}, ${selectedPlace.admin1 || selectedPlace.country || ''}`.replace(/, $/, '');
  currentTemp.textContent = `${safeNumber(current.temperature_2m)}°`;
  currentSymbol.innerHTML = icon;
  currentSummary.textContent = label;
  feelsLike.textContent = `${safeNumber(current.apparent_temperature)}°`;
  windSpeed.textContent = `${windDirection(current.wind_direction_10m)} ${Math.max(1, Math.round(current.wind_speed_10m / 3.6))} bft`;
  rainChance.textContent = `${rainProbability}%`;
  updatedText.textContent = `Updated at ${formatHour(current.time)}`;
  insightText.innerHTML = `${rainProbability < 30 ? 'It should stay mostly dry today.' : "An umbrella isn't a bad idea today."} The best hours to be outside are between <strong>11:00 and 16:00</strong>.`;
  renderHourly(data);
  renderRainChart(data);
  renderForecast(data);
}

async function loadWeather(place) {
  selectedPlace = place;
  locationName.textContent = `${place.name}${place.admin1 ? `, ${place.admin1}` : ''}`;
  updatedText.textContent = 'Loading forecast...';
  try {
    const params = new URLSearchParams({ latitude: place.latitude, longitude: place.longitude, timezone: 'auto', forecast_days: FORECAST_DAYS, current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,is_day', hourly: 'temperature_2m,weather_code,precipitation,is_day', daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max' });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!response.ok) throw new Error('Weather data unavailable');
    renderWeather(await response.json());
  } catch (error) {
    updatedText.textContent = 'Could not load the forecast';
    console.error(error);
  }
}

async function findPlaces(query) {
  if (query.trim().length < 2) return [];
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
  const result = await response.json();
  return result.results || [];
}

function showSuggestions(places) {
  suggestions.innerHTML = places.map((place, index) => `<button class="suggestion" type="button" data-place-index="${index}"><span>${place.name}</span><small>${place.admin1 || place.country || ''}</small></button>`).join('');
  suggestions.hidden = places.length === 0;
  suggestions.querySelectorAll('.suggestion').forEach(button => button.addEventListener('click', () => {
    const place = places[Number(button.dataset.placeIndex)];
    searchInput.value = place.name;
    suggestions.hidden = true;
    loadWeather(place);
  }));
}

let searchTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    try { showSuggestions(await findPlaces(searchInput.value)); } catch { suggestions.hidden = true; }
  }, 250);
});
searchForm.addEventListener('submit', async event => {
  event.preventDefault();
  try {
    const places = await findPlaces(searchInput.value);
    if (places[0]) { searchInput.value = places[0].name; suggestions.hidden = true; loadWeather(places[0]); }
  } catch { updatedText.textContent = 'Search temporarily unavailable'; }
});
document.addEventListener('click', event => { if (!searchForm.contains(event.target)) suggestions.hidden = true; });
document.querySelector('#locationButton').addEventListener('click', () => {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(async position => {
    const { latitude, longitude } = position.coords;
    loadWeather({ name: 'My location', latitude, longitude });
    applyResolvedName(await reverseGeocode(latitude, longitude), latitude, longitude);
  }, () => { updatedText.textContent = 'Could not determine your location'; });
});
if (!handledByQuery) loadWeather(selectedPlace);
