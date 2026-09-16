(function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
  }

  var INSTALL_DISMISS_KEY = 'wt-install-dismissed';
  var COOLDOWN_DAYS = 14;

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function recentlyDismissed(key) {
    var raw;
    try { raw = localStorage.getItem(key); } catch (e) { return false; }
    if (!raw) return false;
    return Date.now() - parseInt(raw, 10) < COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  }

  function markDismissed(key) {
    try { localStorage.setItem(key, String(Date.now())); } catch (e) {}
  }

  function updateBannerPadding() {
    var banner = document.querySelector('.install-banner');
    document.body.style.paddingBottom = banner ? banner.offsetHeight + 'px' : '';
  }

  if ('MutationObserver' in window) {
    var bannerPaddingObserver = new MutationObserver(updateBannerPadding);
    bannerPaddingObserver.observe(document.body, { childList: true });
    window.addEventListener('resize', updateBannerPadding);
  }

  function buildBanner(text, buttonLabel, onAction, dismissKey) {
    var existing = document.querySelectorAll('.install-banner');
    for (var i = 0; i < existing.length; i++) existing[i].remove();

    var banner = document.createElement('div');
    banner.className = 'install-banner';
    banner.innerHTML =
      '<img class="install-banner-icon" src="/icon-192.png" alt="">' +
      '<div class="install-banner-text"><strong>WeatherTell as an app</strong><span>' + text + '</span></div>' +
      '<div class="install-banner-actions">' +
      (buttonLabel ? '<button type="button" class="install-banner-install">' + buttonLabel + '</button>' : '') +
      '<button type="button" class="install-banner-close" aria-label="Close">&times;</button>' +
      '</div>';
    banner.querySelector('.install-banner-close').addEventListener('click', function () {
      markDismissed(dismissKey);
      banner.remove();
      updateBannerPadding();
    });
    if (onAction) banner.querySelector('.install-banner-install').addEventListener('click', onAction);
    document.body.appendChild(banner);
    updateBannerPadding();
    return banner;
  }

  if (isStandalone()) return;

  var cookieConsentPending;
  try { cookieConsentPending = localStorage.getItem('wt-cookie-consent') === null; } catch (e) { cookieConsentPending = false; }
  if (cookieConsentPending) return;

  if (recentlyDismissed(INSTALL_DISMISS_KEY)) return;

  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferredPrompt = event;
    var banner = buildBanner('Check the weather instantly, right from your home screen.', 'Install', function () {
      banner.remove();
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function () {
        markDismissed(INSTALL_DISMISS_KEY);
        deferredPrompt = null;
      });
    }, INSTALL_DISMISS_KEY);
  });

  var ua = window.navigator.userAgent || '';
  var isIos = /iphone|ipad|ipod/i.test(ua);
  var isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
  if (isIos && isSafari) {
    buildBanner('Tap the share icon below and choose "Add to Home Screen".', null, null, INSTALL_DISMISS_KEY);
  } else if (isIos && !isSafari) {
    buildBanner('Open this site in Safari to add it to your iPhone home screen.', null, null, INSTALL_DISMISS_KEY);
  }
})();
