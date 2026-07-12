// Homepage-only loading screen. All of the visible animation (valve
// turn, stream, per-letter liquid fill) is pure CSS, running the
// instant the element paints — this script only decides WHEN it's
// safe to remove: not before a minimum time (so the animation reads
// as complete, not cut off), not before the page has actually
// finished loading, and never later than a hard safety cap (so a
// slow/broken resource can't strand a visitor behind the overlay).
(function () {
  var MIN_VISIBLE_MS = 2500;
  var MIN_VISIBLE_MS_REDUCED = 900;
  var MAX_VISIBLE_MS = 4500;
  var FADE_OUT_MS = 520;
  var FADE_OUT_MS_REDUCED = 280;

  function initPreloader() {
    var root = document.querySelector('[data-preloader]');
    if (!root) return;

    var reduceMotion = window.LwsUtil.reduceMotion();
    var minVisibleMs = reduceMotion ? MIN_VISIBLE_MS_REDUCED : MIN_VISIBLE_MS;
    var fadeOutMs = reduceMotion ? FADE_OUT_MS_REDUCED : FADE_OUT_MS;
    var start = performance.now();
    var done = false;
    var maxTimer = 0;

    window.LwsUtil.lockScroll();

    function remove() {
      if (root.parentNode) root.parentNode.removeChild(root);
      window.LwsUtil.unlockScroll();
    }

    function finish() {
      if (done) return;
      done = true;
      if (maxTimer) window.clearTimeout(maxTimer);
      root.classList.add('is-done');
      window.setTimeout(remove, fadeOutMs);
    }

    function afterMinimum() {
      var elapsed = performance.now() - start;
      var remaining = minVisibleMs - elapsed;
      if (remaining <= 0) finish();
      else window.setTimeout(finish, remaining);
    }

    if (document.readyState === 'complete') {
      afterMinimum();
    } else {
      window.addEventListener('load', afterMinimum, { once: true });
    }

    // Absolute ceiling — independent of the load/minimum logic above,
    // so nothing (slow images, a stalled request) can keep this on
    // screen indefinitely.
    maxTimer = window.setTimeout(finish, MAX_VISIBLE_MS);
  }

  document.addEventListener('DOMContentLoaded', initPreloader);
})();
