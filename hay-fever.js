const siteHeader = document.querySelector('.site-header');
addEventListener('scroll', () => siteHeader.classList.toggle('is-stuck', scrollY > 4), { passive: true });

const searchForm = document.querySelector('#pollenSearchForm');
const searchInput = document.querySelector('#pollenLocationSearch');
const suggestions = document.querySelector('#pollenSuggestions');
const locationNameEl = document.querySelector('#pollenLocationName');
const updatedTextEl = document.querySelector('#pollenUpdatedText');
const currentCardsEl = document.querySelector('#pollenCurrentCards');
const forecastTableEl = document.querySelector('#pollenForecastTable');
const artLabelEl = document.querySelector('#pollenArtLabel');

let selectedPlace = window.POLLEN_LOCATION || { name: 'London', admin1: 'England', latitude: 51.5074, longitude: -0.1278 };

const pollenTypes = [
  { key: 'grass_pollen', label: 'Grass', icon: '🌾', thresholds: [10, 50, 150] },
  { key: 'birch_pollen', label: 'Birch', icon: '🌳', thresholds: [30, 100, 500] },
  { key: 'alder_pollen', label: 'Alder', icon: '🌳', thresholds: [30, 100, 500] },
  { key: 'mugwort_pollen', label: 'Mugwort', icon: '🌿', thresholds: [5, 20, 50] },
  { key: 'ragweed_pollen', label: 'Ragweed', icon: '🌿', thresholds: [5, 20, 50] }
];

function levelInfo(thresholds, value) {
  if (!Number.isFinite(value)) return { label: '--', className: '' };
  const [low, high, veryHigh] = thresholds;
  if (value < low) return { label: 'Low', className: 'pollen-low' };
  if (value < high) return { label: 'Moderate', className: 'pollen-moderate' };
  if (value < veryHigh) return { label: 'High', className: 'pollen-high' };
  return { label: 'Very high', className: 'pollen-very-high' };
}

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function formatDateLabel(iso, index) {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return index === 0 ? 'Today' : `${days[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
}

function dailyMaxPerType(hourly, key, dayIndex) {
  const start = dayIndex * 24;
  const values = (hourly[key] || []).slice(start, start + 24).filter(Number.isFinite);
  return values.length ? Math.max(...values) : NaN;
}

async function loadPollen(place) {
  selectedPlace = place;
  locationNameEl.textContent = place.name;
  updatedTextEl.textContent = 'Loading pollen data...';
  try {
    const fields = pollenTypes.map(t => t.key).join(',');
    const params = new URLSearchParams({ latitude: place.latitude, longitude: place.longitude, timezone: 'auto', forecast_days: 5, hourly: fields });
    const response = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`);
    if (!response.ok) throw new Error('Pollen data unavailable');
    const data = await response.json();
    const hourly = data.hourly;
    const dayCount = Math.min(5, Math.floor((hourly.time || []).length / 24));

    const levelRank = { '--': -1, 'Low': 0, 'Moderate': 1, 'High': 2, 'Very high': 3 };
    let worstLabel = '--';
    currentCardsEl.innerHTML = pollenTypes.map(t => {
      const todayMax = dailyMaxPerType(hourly, t.key, 0);
      const info = levelInfo(t.thresholds, todayMax);
      if (levelRank[info.label] > levelRank[worstLabel]) worstLabel = info.label;
      return `<div class="pollen-card ${info.className}"><span class="pollen-icon">${t.icon}</span><div><h4>${t.label}</h4><strong>${info.label}</strong><span class="pollen-value">${Number.isFinite(todayMax) ? todayMax.toFixed(1) + ' grains/m³' : 'no data'}</span></div></div>`;
    }).join('');
    if (artLabelEl) artLabelEl.textContent = worstLabel === '--' ? 'no data' : worstLabel;

    const headerRow = Array.from({ length: dayCount }, (_, i) => `<th>${formatDateLabel(hourly.time[i * 24], i)}</th>`).join('');
    const bodyRows = pollenTypes.map(t => {
      const cells = Array.from({ length: dayCount }, (_, i) => {
        const value = dailyMaxPerType(hourly, t.key, i);
        const info = levelInfo(t.thresholds, value);
        return `<td class="${info.className}">${info.label}</td>`;
      }).join('');
      return `<tr><td>${t.icon} ${t.label}</td>${cells}</tr>`;
    }).join('');
    forecastTableEl.innerHTML = `<thead><tr><th>Type</th>${headerRow}</tr></thead><tbody>${bodyRows}</tbody>`;

    updatedTextEl.textContent = `Updated for ${place.name}`;
  } catch (error) {
    updatedTextEl.textContent = 'Could not load pollen data';
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
    loadPollen(place);
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
    if (places[0]) { searchInput.value = places[0].name; suggestions.hidden = true; loadPollen(places[0]); }
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
    loadPollen({ name: 'My location', latitude, longitude });
  }, () => { btn.disabled = false; updatedTextEl.textContent = 'Could not determine your location'; });
});

loadPollen(selectedPlace);
