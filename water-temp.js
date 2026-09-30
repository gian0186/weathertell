(function () {
  var cfg = window.WATERTEMP;
  if (!cfg || !cfg.items || !cfg.items.length) return;

  var API = 'https://marine-api.open-meteo.com/v1/marine';
  var url = API + '?latitude=' + cfg.items.map(function (r) { return r.lat; }).join(',') +
    '&longitude=' + cfg.items.map(function (r) { return r.lon; }).join(',') +
    '&current=sea_surface_temperature';

  function fmt(t, unit) {
    if (t === null || t === undefined) return '–';
    if (unit === 'F') return Math.round(t * 9 / 5 + 32) + '°F';
    return (Math.round(t * 10) / 10) + '°C';
  }

  fetch(url).then(function (r) { return r.json(); }).then(function (data) {
    var arr = Array.isArray(data) ? data : [data];
    var warmest = null;
    arr.forEach(function (loc, i) {
      var item = cfg.items[i];
      var el = document.querySelector('[data-watertemp="' + item.slug + '"]');
      var t = loc && loc.current ? loc.current.sea_surface_temperature : null;
      if (el) el.textContent = fmt(t, 'C') + ' / ' + fmt(t, 'F');
      if (t !== null && t !== undefined && (!warmest || t > warmest.t)) warmest = { t: t, name: item.name };
    });
    var updated = document.getElementById('watertempUpdated');
    if (updated) {
      var now = new Date();
      updated.textContent = 'Updated: ' + now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }
    var warmestEl = document.getElementById('watertempWarmest');
    if (warmestEl && warmest) warmestEl.textContent = warmest.name + ' (' + fmt(warmest.t, 'C') + ')';
  }).catch(function () {});
})();
