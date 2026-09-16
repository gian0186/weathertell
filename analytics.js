(function () {
  var CONSENT_KEY = 'wt-cookie-consent';
  var GTM_ID = 'GTM-WHFJ3NMX';

  function getConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }
  function setConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); } catch (e) {}
  }

  function loadGTM() {
    if (window.__gtmLoaded) return;
    window.__gtmLoaded = true;
    (function (w, d, s, l, i) {
      w[l] = w[l] || [];
      w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      var f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
      j.async = true;
      j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
      f.parentNode.insertBefore(j, f);
    })(window, document, 'script', 'dataLayer', GTM_ID);

    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.googletagmanager.com/ns.html?id=' + GTM_ID;
    iframe.height = 0;
    iframe.width = 0;
    iframe.style.display = 'none';
    iframe.style.visibility = 'hidden';
    var wrap = document.createElement('noscript');
    wrap.appendChild(iframe);
    document.body.insertBefore(wrap, document.body.firstChild);
  }

  var reserveSpaceResizeHandler = null;

  function reserveSpaceFor(banner) {
    function apply() {
      document.body.style.paddingBottom = banner.offsetHeight + 'px';
    }
    apply();
    reserveSpaceResizeHandler = apply;
    window.addEventListener('resize', reserveSpaceResizeHandler);
  }

  function releaseReservedSpace() {
    document.body.style.paddingBottom = '';
    if (reserveSpaceResizeHandler) {
      window.removeEventListener('resize', reserveSpaceResizeHandler);
      reserveSpaceResizeHandler = null;
    }
  }

  function showBanner() {
    var existing = document.querySelector('.cookie-banner');
    if (existing) existing.remove();

    var banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.innerHTML =
      '<p>We use analytics cookies to see how visitors use the site. Do you agree?</p>' +
      '<div class="cookie-banner-actions">' +
      '<button type="button" class="cookie-banner-reject">Reject</button>' +
      '<button type="button" class="cookie-banner-accept">Accept</button>' +
      '</div>';
    document.body.appendChild(banner);
    reserveSpaceFor(banner);

    banner.querySelector('.cookie-banner-accept').addEventListener('click', function () {
      setConsent('granted');
      banner.remove();
      releaseReservedSpace();
      loadGTM();
    });
    banner.querySelector('.cookie-banner-reject').addEventListener('click', function () {
      setConsent('denied');
      banner.remove();
      releaseReservedSpace();
    });
  }

  var consent = getConsent();
  if (consent === 'granted') {
    loadGTM();
  } else if (consent !== 'denied') {
    showBanner();
  }

  var settingsLink = document.querySelector('.cookie-settings-link');
  if (settingsLink) {
    settingsLink.addEventListener('click', function (event) {
      event.preventDefault();
      showBanner();
    });
  }
})();
