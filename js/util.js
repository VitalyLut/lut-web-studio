// Shared utilities used across sections. Each function here previously
// existed as a near-identical (or, for scroll-lock/focus-trap, a
// to-be-duplicated) implementation in one or more section files —
// consolidated so there is one place to fix a bug in this class of
// behavior instead of N. Load this before any file that reads
// window.LwsUtil.
(function () {
  function reduceMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  // Capability, not viewport width — a touch laptop is still coarse/no-hover,
  // and a small hover-capable window is still a mouse. Sections use this to
  // choose interaction model (hover-reveal vs. tap, drag vs. swipe), never
  // a width check.
  function hasHover() {
    return !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  }

  function isTouch() {
    return !hasHover();
  }

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  var HEADER_OFFSET_BUFFER = 24;

  function headerOffset() {
    var raw = getComputedStyle(document.documentElement).getPropertyValue('--header-height');
    var n = parseInt(raw, 10);
    return (isNaN(n) ? 88 : n) + HEADER_OFFSET_BUFFER;
  }

  function scrollToHash(hash, reduceMotionFlag) {
    var target = document.querySelector(hash);
    if (!target) return;
    var top = target.getBoundingClientRect().top + window.scrollY - headerOffset();
    window.scrollTo({ top: Math.max(top, 0), behavior: reduceMotionFlag ? 'auto' : 'smooth' });
  }

  // ---- scroll lock: fixes body at its current offset and compensates
  // for the vanished scrollbar with equivalent padding, so nothing
  // reflows horizontally and the page comes back to the exact same
  // spot on close. (Originally project-modal.js-only; menu now shares it.) ----
  var savedScrollY = 0;

  function lockScroll() {
    savedScrollY = window.scrollY;
    var scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.position = 'fixed';
    document.body.style.top = -savedScrollY + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    if (scrollbarWidth > 0) document.body.style.paddingRight = scrollbarWidth + 'px';
  }

  function unlockScroll() {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.paddingRight = '';
    // Force a synchronous reflow before scrolling: without this, the
    // browser can still think the page has no scrollable overflow (the
    // state from a moment ago, while body was fixed) and clamp/ignore
    // the scrollTo call below.
    void document.body.offsetHeight;
    window.scrollTo(0, savedScrollY);
  }

  // ---- focus trap: cycles Tab/Shift+Tab within `context` only.
  // `context` is explicit here (project-modal.js used to close over its
  // own module-level `windowEl` instead) so the same implementation
  // works for any container. ----
  function getFocusable(context) {
    return Array.prototype.slice.call(
      context.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ).filter(function (el) { return el.offsetParent !== null; });
  }

  function trapFocus(e, context) {
    if (e.key !== 'Tab') return;
    var focusable = getFocusable(context);
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  window.LwsUtil = {
    reduceMotion: reduceMotion,
    hasHover: hasHover,
    isTouch: isTouch,
    clamp01: clamp01,
    scrollToHash: scrollToHash,
    lockScroll: lockScroll,
    unlockScroll: unlockScroll,
    getFocusable: getFocusable,
    trapFocus: trapFocus
  };
})();
