// Low-precision solar position algorithm (Jean Meeus / NOAA-style), accurate to about a minute.
const rad = Math.PI / 180;
const dayMs = 1000 * 60 * 60 * 24;
const J1970 = 2440588, J2000 = 2451545;
const earthTilt = rad * 23.4397;

const toJulian = date => date.valueOf() / dayMs - 0.5 + J1970;
const fromJulian = j => new Date((j + 0.5 - J1970) * dayMs);
const toDays = date => toJulian(date) - J2000;

function declination(l) { return Math.asin(Math.sin(l) * Math.sin(earthTilt)); }
function solarMeanAnomaly(d) { return rad * (357.5291 + 0.98560028 * d); }
function eclipticLongitude(M) {
  const C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const P = rad * 102.9372;
  return M + C + P + Math.PI;
}
function julianCycle(d, lw) { return Math.round(d - 0.0009 - lw / (2 * Math.PI)); }
function approxTransit(Ht, lw, n) { return 0.0009 + (Ht + lw) / (2 * Math.PI) + n; }
function solarTransitJ(ds, M, L) { return J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L); }
function hourAngle(h, phi, d) { return Math.acos((Math.sin(h) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d))); }
function edgeJ(h, lw, phi, dec, n, M, L) { return solarTransitJ(approxTransit(hourAngle(h, phi, dec), lw, n), M, L); }

function getSunTimes(date, lat, lng) {
  const lw = rad * -lng, phi = rad * lat;
  const d = toDays(date), n = julianCycle(d, lw), ds = approxTransit(0, lw, n);
  const M = solarMeanAnomaly(ds), L = eclipticLongitude(M);
  const dec = declination(L);
  const Jnoon = solarTransitJ(ds, M, L);

  const Jset = edgeJ(-0.833 * rad, lw, phi, dec, n, M, L);
  const Jrise = Jnoon - (Jset - Jnoon);
  const JciviDusk = edgeJ(-6 * rad, lw, phi, dec, n, M, L);

  return { sunrise: fromJulian(Jrise), sunset: fromJulian(Jset), civilDusk: fromJulian(JciviDusk) };
}

// WeatherTell covers the whole world, so instead of a fixed IANA timezone we derive the
// current UTC offset for the selected place from the API's own local sunrise time, then
// apply that offset when formatting locally-computed (non-API) instants like civil dusk
// and the year-ahead month table.
let utcOffsetMs = 0;
function formatTime(date) {
  const shifted = new Date(date.getTime() + utcOffsetMs);
  return `${String(shifted.getUTCHours()).padStart(2, '0')}:${String(shifted.getUTCMinutes()).padStart(2, '0')}`;
}
function formatIsoTime(iso) { return iso ? iso.slice(11, 16) : '--:--'; }
function formatDurationSeconds(seconds) {
  if (!Number.isFinite(seconds)) return '--h --m';
  const h = Math.floor(seconds / 3600), m = Math.round((seconds % 3600) / 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}
function formatDurationMs(ms) { return formatDurationSeconds(ms / 1000); }
const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function formatDateLabel(iso, index) {
  const d = new Date(`${iso}T12:00:00`);
  const label = `${dayLabels[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()].slice(0, 3)}`;
  return index === 0 ? `Today, ${d.getDate()} ${monthNames[d.getMonth()]}` : label;
}

const siteHeader = document.querySelector('.site-header');
addEventListener('scroll', () => siteHeader.classList.toggle('is-stuck', scrollY > 4), { passive: true });

const searchForm = document.querySelector('#sunSearchForm');
const searchInput = document.querySelector('#sunLocationSearch');
const suggestions = document.querySelector('#sunSuggestions');
const locationNameEl = document.querySelector('#sunLocationName');
const dateLabelEl = document.querySelector('#sunDateLabel');
const updatedTextEl = document.querySelector('#sunUpdatedText');
const riseValueEl = document.querySelector('#sunRiseValue');
const setValueEl = document.querySelector('#sunSetValue');
const daylightValueEl = document.querySelector('#sunDaylightValue');
const duskValueEl = document.querySelector('#sunDuskValue');
const artLabelEl = document.querySelector('#sunArtLabel');
const daysTableBody = document.querySelector('#sunDaysTable');
const monthsTableBody = document.querySelector('#sunMonthsTable');

let selectedPlace = { name: 'London', admin1: 'England', latitude: 51.5074, longitude: -0.1278 };

function renderMonthsTable(place) {
  const now = new Date();
  const rows = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 15, 12, 0, 0);
    const t = getSunTimes(d, place.latitude, place.longitude);
    const daylightMs = t.sunset - t.sunrise;
    rows.push(`<tr><td>${monthNames[d.getMonth()]} ${d.getFullYear()}</td><td>${formatTime(t.sunrise)}</td><td>${formatTime(t.sunset)}</td><td>${formatDurationMs(daylightMs)}</td></tr>`);
  }
  monthsTableBody.innerHTML = rows.join('');
}

async function loadSunData(place) {
  selectedPlace = place;
  locationNameEl.textContent = place.name;
  updatedTextEl.textContent = 'Loading data...';
  try {
    const params = new URLSearchParams({ latitude: place.latitude, longitude: place.longitude, timezone: 'auto', forecast_days: 14, daily: 'sunrise,sunset,daylight_duration' });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!response.ok) throw new Error('Sun data unavailable');
    const data = await response.json();
    const { time, sunrise, sunset, daylight_duration } = data.daily;

    const astroToday = getSunTimes(new Date(), place.latitude, place.longitude);
    const apiSunriseAsUtc = new Date(`${sunrise[0]}:00Z`);
    utcOffsetMs = apiSunriseAsUtc.getTime() - astroToday.sunrise.getTime();

    dateLabelEl.textContent = formatDateLabel(time[0], 0).replace('Today, ', '');
    riseValueEl.textContent = formatIsoTime(sunrise[0]);
    setValueEl.textContent = formatIsoTime(sunset[0]);
    daylightValueEl.textContent = formatDurationSeconds(daylight_duration[0]);
    duskValueEl.textContent = formatTime(astroToday.civilDusk);
    artLabelEl.textContent = `sunset ${formatIsoTime(sunset[0])}`;
    updatedTextEl.textContent = `Updated for ${place.name}`;

    daysTableBody.innerHTML = time.map((iso, i) => `<tr class="${i === 0 ? 'is-today' : ''}"><td>${formatDateLabel(iso, i)}</td><td>${formatIsoTime(sunrise[i])}</td><td>${formatIsoTime(sunset[i])}</td><td>${formatDurationSeconds(daylight_duration[i])}</td></tr>`).join('');

    renderMonthsTable(place);
  } catch (error) {
    updatedTextEl.textContent = 'Could not load the data';
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
    loadSunData(place);
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
    if (places[0]) { searchInput.value = places[0].name; suggestions.hidden = true; loadSunData(places[0]); }
  } catch { updatedTextEl.textContent = 'Search temporarily unavailable'; }
});
document.addEventListener('click', event => { if (!searchForm.contains(event.target)) suggestions.hidden = true; });

document.querySelector('#locationButton').addEventListener('click', function () {
  if (!navigator.geolocation) return;
  const btn = this;
  btn.disabled = true;
  navigator.geolocation.getCurrentPosition(position => {
    btn.disabled = false;
    const { latitude, longitude } = position.coords;
    searchInput.value = 'My location';
    loadSunData({ name: 'My location', latitude, longitude });
  }, () => { btn.disabled = false; updatedTextEl.textContent = 'Could not determine your location'; });
});

loadSunData(selectedPlace);
