(function () {
  var cells = document.querySelectorAll('[data-hs]');
  if (!cells.length) return;

  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  fetch('/api/snow-stations').then(function (r) { return r.json(); }).then(function (data) {
    var st = data && data.stations;
    if (!st) return;
    var withSnow = 0, total = 0, noData = 0, best = null;

    Array.prototype.forEach.call(cells, function (el) {
      var key = el.getAttribute('data-hs');
      var s = st[key];
      if (!s || s.hs === null) {
        el.textContent = 'no reading';
        noData++;
        return;
      }
      el.textContent = s.hs + ' cm';
      el.classList.toggle('ws-has-snow', s.hs >= 1);
      total++;
      if (s.hs >= 1) withSnow++;
      if (!best || s.hs > best.hs) best = { hs: s.hs, name: el.getAttribute('data-n') };
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-hsd]'), function (el) {
      var s = st[el.getAttribute('data-hsd')];
      if (!s || s.hs === null || s.prev === null) return;
      var diff = s.hs - s.prev;
      el.textContent = diff === 0 ? '0 cm' : (diff > 0 ? '+' : '−') + Math.abs(diff) + ' cm';
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-hst]'), function (el) {
      var s = st[el.getAttribute('data-hst')];
      if (!s || !s.at) return;
      var d = new Date(s.at);
      el.textContent = s.daily
        ? d.getUTCDate() + ' ' + months[d.getUTCMonth()] + ' (daily reading)'
        : d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' });
    });

    var sum = document.getElementById('hsSummary');
    if (sum && total) {
      sum.textContent = (withSnow === 0
        ? 'Right now none of the ' + total + ' stations with a recent reading show snow on the ground. That is normal outside the ski season.'
        : withSnow + ' of the ' + total + ' stations with a recent reading show snow on the ground. The deepest measured snow depth is ' + best.hs + ' cm at ' + best.name + '.')
        + (noData ? ' ' + noData + ' station(s) currently have no snow depth reported, which is common outside the ski season.' : '');
    }
  }).catch(function () {
    var sum = document.getElementById('hsSummary');
    if (sum) sum.textContent = 'The measurements could not be loaded. Please try again later.';
  });
})();
