(function () {
  // headerOffset/scrollToHash now live in window.LwsUtil (js/util.js) —
  // identical implementation, shared with hero.js and (via a fresh
  // adoption) the menu.
  var scrollToHash = window.LwsUtil.scrollToHash;

  function renderSocials(root) {
    var mount = root.querySelector('[data-footer-socials]');
    if (!mount || !window.renderLwsSocialLinks) return;
    window.renderLwsSocialLinks(mount, 'footer__social-btn');
  }

  function initNav(root, reduceMotion) {
    var nav = root.querySelector('[data-footer-nav]');
    if (!nav) return;

    nav.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        scrollToHash(link.getAttribute('href'), reduceMotion);
      });
    });
  }

  function initLegalStubs(root) {
    root.querySelectorAll('[data-footer-legal-links] a').forEach(function (link) {
      link.addEventListener('click', function (e) { e.preventDefault(); });
    });
  }

  // The background LWS watermark answers whenever the visitor is over any
  // meaningful interactive element in the footer — one shared class on the
  // footer root, not a per-element effect, so it reads as "the brand
  // notices you" rather than N separate hover animations.
  function initInteractiveWatermark(root) {
    var targets = root.querySelectorAll(
      '.footer__contact-row, .footer__nav-link, .footer__social-btn, .footer__legal-link'
    );
    if (!targets.length) return;

    var enter = function () { root.classList.add('is-interacting'); };
    var leave = function () { root.classList.remove('is-interacting'); };

    targets.forEach(function (el) {
      el.addEventListener('mouseenter', enter);
      el.addEventListener('mouseleave', leave);
      el.addEventListener('focus', enter);
      el.addEventListener('blur', leave);
    });
  }

  function initFooter() {
    var root = document.querySelector('[data-footer]');
    if (!root) return;

    var reduceMotion = window.LwsUtil.reduceMotion();

    renderSocials(root);
    initNav(root, reduceMotion);
    initLegalStubs(root);
    initInteractiveWatermark(root);
  }

  document.addEventListener('DOMContentLoaded', initFooter);
})();
