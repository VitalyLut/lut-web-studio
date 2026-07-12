(function () {
  var REVEAL_THRESHOLD = 0.3;
  var MAX_DEPTH_PX = 3;
  var FILL_BASE = 62;
  var FILL_STRETCH_MAX = 46;
  var FILL_DECAY_MS = 320;

  function initAuthor() {
    var section = document.querySelector('[data-author]');
    if (!section) return;

    var reduceMotion = window.LwsUtil.reduceMotion();

    // One-shot trigger: adds .is-active, which the window/portrait
    // fade-up and every staggered text transition-delay key off of
    // (see css/author.css). unobserve() after firing rules out a
    // repeat run on a later scroll back into view.
    if (reduceMotion || !('IntersectionObserver' in window)) {
      section.classList.add('is-active');
    } else {
      var revealIo = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (!entries[i].isIntersecting) continue;
          section.classList.add('is-active');
          revealIo.unobserve(section);
          break;
        }
      }, { threshold: REVEAL_THRESHOLD });
      revealIo.observe(section);
    }

    if (reduceMotion) return;

    var fills = Array.prototype.slice.call(section.querySelectorAll('[data-author-fill]'));
    var hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    var inView = false;
    if ('IntersectionObserver' in window) {
      var visIo = new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
      }, { threshold: 0 });
      visIo.observe(section);
    } else {
      inView = true;
    }

    // ---- Desktop: cursor-fill (letters fill locally under the
    // pointer) + depth-response parallax. Both gated on the same
    // hover-capable check; neither runs on touch. ----
    if (hoverCapable) {
      var stage = section.querySelector('[data-author-stage]');
      var bgtext = section.querySelector('[data-author-bgtext]');

      if (stage) {
        var pendingDx = 0;
        var pendingDy = 0;
        var depthRafId = 0;

        function applyDepth() {
          depthRafId = 0;
          stage.style.setProperty('--dx', pendingDx.toFixed(2));
          stage.style.setProperty('--dy', pendingDy.toFixed(2));
        }

        stage.addEventListener('mousemove', function (e) {
          if (!inView) return;
          var rect = stage.getBoundingClientRect();
          var px = (e.clientX - rect.left) / rect.width - 0.5;
          var py = (e.clientY - rect.top) / rect.height - 0.5;
          pendingDx = px * 2 * MAX_DEPTH_PX;
          pendingDy = py * 2 * MAX_DEPTH_PX;
          if (!depthRafId) depthRafId = requestAnimationFrame(applyDepth);
        });

        stage.addEventListener('mouseleave', function () {
          pendingDx = 0;
          pendingDy = 0;
          if (!depthRafId) depthRafId = requestAnimationFrame(applyDepth);
        });
      }

      if (bgtext && fills.length) {
        var lastX = null;
        var lastY = null;
        var fillRafId = 0;
        var decayRafId = 0;
        var targets = fills.map(function () { return { fx: 50, fy: 50, fw: 0, fh: 0 }; });

        function applyFills() {
          fillRafId = 0;
          fills.forEach(function (el, i) {
            var t = targets[i];
            el.style.setProperty('--fx', t.fx.toFixed(1) + 'px');
            el.style.setProperty('--fy', t.fy.toFixed(1) + 'px');
            el.style.setProperty('--fw', t.fw.toFixed(1) + 'px');
            el.style.setProperty('--fh', t.fh.toFixed(1) + 'px');
          });
        }

        function stopDecay() {
          if (decayRafId) {
            cancelAnimationFrame(decayRafId);
            decayRafId = 0;
          }
        }

        bgtext.addEventListener('mousemove', function (e) {
          if (!inView) return;
          stopDecay();
          var vx = lastX === null ? 0 : e.clientX - lastX;
          var vy = lastY === null ? 0 : e.clientY - lastY;
          lastX = e.clientX;
          lastY = e.clientY;

          fills.forEach(function (el, i) {
            var rect = el.getBoundingClientRect();
            targets[i].fx = e.clientX - rect.left;
            targets[i].fy = e.clientY - rect.top;
            targets[i].fw = FILL_BASE + Math.min(FILL_STRETCH_MAX, Math.abs(vx) * 3.2);
            targets[i].fh = FILL_BASE + Math.min(FILL_STRETCH_MAX, Math.abs(vy) * 3.2);
          });

          if (!fillRafId) fillRafId = requestAnimationFrame(applyFills);
        });

        bgtext.addEventListener('mouseleave', function () {
          lastX = null;
          lastY = null;
          stopDecay();
          var start = performance.now();
          var startSizes = targets.map(function (t) { return { fw: t.fw, fh: t.fh }; });

          function decay(now) {
            var t = Math.min(1, (now - start) / FILL_DECAY_MS);
            var k = 1 - t;
            targets.forEach(function (target, i) {
              target.fw = startSizes[i].fw * k;
              target.fh = startSizes[i].fh * k;
            });
            applyFills();
            if (t < 1) {
              decayRafId = requestAnimationFrame(decay);
            } else {
              decayRafId = 0;
            }
          }
          decayRafId = requestAnimationFrame(decay);
        });
      }

      return;
    }

    // ---- Touch/no-hover: scroll-driven fill that rises once and
    // latches (never reverses), only while the visual wrapper is
    // anywhere near the viewport. ----
    var visual = section.querySelector('.author__visual');
    if (!visual || !fills.length) return;

    var maxProgress = 0;
    var scrollRafId = 0;

    function computeProgress() {
      scrollRafId = 0;
      if (!inView) return;
      var rect = visual.getBoundingClientRect();
      var vh = window.innerHeight;
      var centerY = rect.top + rect.height / 2;
      var startCenter = vh + rect.height / 2;
      var endCenter = vh / 2;
      var span = startCenter - endCenter;
      var raw = span > 0 ? (startCenter - centerY) / span : 0;
      var clamped = Math.max(0, Math.min(1, raw));
      if (clamped > maxProgress) {
        maxProgress = clamped;
        section.style.setProperty('--author-fill-progress', (maxProgress * 100).toFixed(1) + '%');
      }
    }

    window.addEventListener('scroll', function () {
      if (!scrollRafId) scrollRafId = requestAnimationFrame(computeProgress);
    }, { passive: true });

    computeProgress();
  }

  document.addEventListener('DOMContentLoaded', initAuthor);
})();
