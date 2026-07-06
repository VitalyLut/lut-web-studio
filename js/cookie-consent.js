(function () {
  var STORAGE_KEY = 'lws_cookie_consent';
  var ACCEPTED = 'accepted';
  var NECESSARY = 'necessary';
  var METRIKA_ID = 104469602;

  function getConsent() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      // Private-browsing/storage-disabled edge cases — treat as "no
      // choice yet" rather than throwing, so the banner still works.
      return null;
    }
  }

  function setConsent(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch (err) { /* storage unavailable — consent just won't persist */ }
  }

  function clearConsent() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (err) { /* nothing to clear */ }
  }

  // ---- Yandex Metrika: idempotent, consent-gated loader. Never runs
  // before the user has actively chosen "Принять" — no static <script>
  // in <head>, no noscript pixel (that would fire unconditionally and
  // bypass consent entirely). ----
  function loadYandexMetrika() {
    if (window.__lwsMetrikaLoaded) return;
    window.__lwsMetrikaLoaded = true;

    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      for (var j = 0; j < e.scripts.length; j++) {
        if (e.scripts[j].src === r) { return; }
      }
      k = e.createElement(t); a = e.getElementsByTagName(t)[0];
      k.async = 1; k.src = r;
      a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=' + METRIKA_ID, 'ym');

    window.ym(METRIKA_ID, 'init', {
      ssr: true,
      webvisor: true,
      clickmap: true,
      ecommerce: 'dataLayer',
      referrer: document.referrer,
      url: location.href,
      accurateTrackBounce: true,
      trackLinks: true
    });
  }

  // ---- Banner: built once, appended to <body>, identical on every
  // page (same pattern as js/social-links.js's shared render). ----
  function buildBanner() {
    var el = document.createElement('div');
    el.className = 'cookie-consent';
    el.setAttribute('data-cookie-consent-banner', '');
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Настройки cookie');
    el.innerHTML =
      '<div class="cookie-consent__inner">' +
        '<div class="cookie-consent__copy">' +
          '<p class="cookie-consent__title">Настройки cookie</p>' +
          '<p class="cookie-consent__text">Мы используем необходимые технологии для работы сайта и, с вашего согласия, Яндекс.Метрику для анализа посещаемости и улучшения сайта. <a class="cookie-consent__link" href="/cookies.html">Подробнее</a></p>' +
        '</div>' +
        '<div class="cookie-consent__actions">' +
          '<button type="button" class="cookie-consent__btn cookie-consent__btn--necessary" data-cookie-necessary>Только необходимые</button>' +
          '<button type="button" class="cookie-consent__btn cookie-consent__btn--accept" data-cookie-accept>Принять</button>' +
        '</div>' +
      '</div>';
    return el;
  }

  function showBanner() {
    if (document.querySelector('[data-cookie-consent-banner]')) return;
    var banner = buildBanner();
    document.body.appendChild(banner);
    requestAnimationFrame(function () { banner.classList.add('is-visible'); });

    banner.querySelector('[data-cookie-accept]').addEventListener('click', function () {
      setConsent(ACCEPTED);
      hideBanner(banner);
      loadYandexMetrika();
    });
    banner.querySelector('[data-cookie-necessary]').addEventListener('click', function () {
      setConsent(NECESSARY);
      hideBanner(banner);
    });
  }

  function hideBanner(banner) {
    banner.classList.remove('is-visible');
    window.setTimeout(function () {
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    }, 300);
  }

  // Exposed for cookies.html's "Изменить настройки cookie" button: clears
  // the stored choice and re-shows the banner in the current page. It
  // does not (and cannot) retroactively un-send analytics data already
  // dispatched this session — only affects future page loads/choices.
  window.LwsCookieConsent = {
    reset: function () {
      clearConsent();
      showBanner();
    },
    getConsent: getConsent
  };

  // Wires cookies.html's "Изменить настройки cookie" button, if present
  // on the current page — a no-op everywhere else.
  function initResetButton() {
    var btn = document.querySelector('[data-cookie-reset-btn]');
    if (!btn) return;
    var status = document.querySelector('[data-cookie-reset-status]');
    btn.addEventListener('click', function () {
      window.LwsCookieConsent.reset();
      if (status) {
        status.classList.add('is-visible');
        window.setTimeout(function () { status.classList.remove('is-visible'); }, 4000);
      }
    });
  }

  function init() {
    var consent = getConsent();
    if (consent === ACCEPTED) {
      loadYandexMetrika();
    } else if (consent !== NECESSARY) {
      showBanner();
    }
    // consent === NECESSARY: nothing to do, Metrika stays unloaded.
    initResetButton();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
