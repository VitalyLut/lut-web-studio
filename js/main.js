(function () {
  var HEADER_SCROLL_THRESHOLD = 100;

  function initHeaderScrollState() {
    var header = document.querySelector('[data-site-header]');
    if (!header) return;

    var rafId = 0;
    function apply() {
      rafId = 0;
      header.classList.toggle('is-scrolled', window.scrollY > HEADER_SCROLL_THRESHOLD);
    }
    function requestApply() {
      if (rafId) return;
      rafId = requestAnimationFrame(apply);
    }

    window.addEventListener('scroll', requestApply, { passive: true });
    requestApply();
  }

  function initSiteHalo() {
    var halo = document.querySelector('[data-site-halo]');
    if (!halo) return;
    if (window.LwsUtil.reduceMotion()) return;
    if (window.LwsUtil.isTouch()) return;

    // rAF-coalesced: mousemove can fire far more often than the display
    // refreshes, so writing style on every single event does redundant
    // work the browser would have overwritten before the next paint
    // anyway. Collapsing to at most one write per frame is visually
    // identical (the halo still tracks the latest known pointer
    // position every frame) and cheaper.
    var pendingX = 0, pendingY = 0, haloRafId = 0;
    function applyHalo() {
      haloRafId = 0;
      halo.style.transform = 'translate(' + pendingX.toFixed(1) + 'px,' + pendingY.toFixed(1) + 'px)';
      halo.style.opacity = '1';
    }
    document.addEventListener('mousemove', function (e) {
      pendingX = e.clientX;
      pendingY = e.clientY;
      if (!haloRafId) haloRafId = requestAnimationFrame(applyHalo);
    });

    document.addEventListener('mouseleave', function () {
      halo.style.opacity = '0';
    });
  }

  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.reveal, .reveal-up'));
    if (!items.length) return;

    var reduceMotion = window.LwsUtil.reduceMotion();
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-revealed'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

    items.forEach(function (el) { io.observe(el); });
  }

  function initMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var menu = document.querySelector('[data-menu]');
    if (!toggle || !menu) return;

    var socialsMount = menu.querySelector('[data-menu-socials]');
    if (socialsMount && window.renderLwsSocialLinks) window.renderLwsSocialLinks(socialsMount);

    var reduceMotion = window.LwsUtil.reduceMotion();

    // Closed by default — `inert` keeps every link/phone/social button
    // out of the Tab order while hidden (aria-hidden alone doesn't stop
    // keyboard focus from landing on an invisible menu).
    menu.inert = true;

    function onKeydown(e) {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      window.LwsUtil.trapFocus(e, menu);
    }

    function setOpen(open) {
      menu.classList.toggle('is-open', open);
      menu.setAttribute('aria-hidden', String(!open));
      menu.inert = !open;
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));

      if (open) {
        window.LwsUtil.lockScroll();
        document.addEventListener('keydown', onKeydown);
      } else {
        window.LwsUtil.unlockScroll();
        document.removeEventListener('keydown', onKeydown);
        toggle.focus({ preventScroll: true });
      }
    }

    toggle.addEventListener('click', function () {
      setOpen(!menu.classList.contains('is-open'));
    });

    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href') || '';
        if (href.charAt(0) === '#') {
          e.preventDefault();
          setOpen(false);
          window.LwsUtil.scrollToHash(href, reduceMotion);
        } else {
          setOpen(false);
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHeaderScrollState();
    initSiteHalo();
    initMenu();
    initReveal();
  });
})();
