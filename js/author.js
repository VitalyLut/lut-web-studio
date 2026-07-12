(function () {
  var REVEAL_THRESHOLD = 0.3;

  // Mask radius — within the spec'd 130-220px (X) / 80-150px (Y) range;
  // base alone is already a clearly visible reveal, velocity only adds
  // a modest stretch on top rather than carrying most of the size.
  var FILL_BASE_X = 170;
  var FILL_BASE_Y = 110;
  var FILL_STRETCH_MAX_X = 45;
  var FILL_STRETCH_MAX_Y = 35;
  var FILL_VELOCITY_SCALE = 2.4;
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

    var stage = section.querySelector('[data-author-stage]');
    var canvas = section.querySelector('[data-author-canvas]');
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

    // ---- Desktop: single pointermove on the whole canvas drives both
    // the letter cursor-fill and the parallax depth-response. Listening
    // on .author__canvas (not .author__bgtext) means the event keeps
    // firing even while the pointer is over the portrait — the portrait
    // sits visually on top (z-index) but is a descendant of canvas, so
    // canvas still receives the bubbled event; decorative layers
    // (portrait, outline/fill text, connector lines/dots) additionally
    // get pointer-events:none in CSS so they never become an
    // accidental dead zone even for elements that aren't canvas
    // descendants of the bubble path. ----
    if (hoverCapable && canvas && stage) {
      var lastX = null;
      var lastY = null;
      var pendingEvent = null;
      var moveRafId = 0;
      var decayRafId = 0;

      function stopDecay() {
        if (decayRafId) {
          cancelAnimationFrame(decayRafId);
          decayRafId = 0;
        }
      }

      function applyFrame() {
        moveRafId = 0;
        var e = pendingEvent;
        if (!e) return;

        // Parallax signal — normalized -1..1 across the whole stage,
        // read by css/author.css via --nx/--ny on every depth layer.
        var stageRect = stage.getBoundingClientRect();
        var nx = ((e.clientX - stageRect.left) / stageRect.width - 0.5) * 2;
        var ny = ((e.clientY - stageRect.top) / stageRect.height - 0.5) * 2;
        nx = Math.max(-1, Math.min(1, nx));
        ny = Math.max(-1, Math.min(1, ny));
        stage.style.setProperty('--nx', nx.toFixed(3));
        stage.style.setProperty('--ny', ny.toFixed(3));

        // Letter cursor-fill — each line's mask is positioned relative
        // to that line's OWN rect, recomputed every frame (so it stays
        // correct even as the parallax transform above shifts bgtext).
        var vx = lastX === null ? 0 : e.clientX - lastX;
        var vy = lastY === null ? 0 : e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;

        fills.forEach(function (el) {
          var r = el.getBoundingClientRect();
          var fw = FILL_BASE_X + Math.min(FILL_STRETCH_MAX_X, Math.abs(vx) * FILL_VELOCITY_SCALE);
          var fh = FILL_BASE_Y + Math.min(FILL_STRETCH_MAX_Y, Math.abs(vy) * FILL_VELOCITY_SCALE);
          el.style.setProperty('--fx', (e.clientX - r.left).toFixed(1) + 'px');
          el.style.setProperty('--fy', (e.clientY - r.top).toFixed(1) + 'px');
          el.style.setProperty('--fw', fw.toFixed(1) + 'px');
          el.style.setProperty('--fh', fh.toFixed(1) + 'px');
        });
      }

      canvas.addEventListener('pointermove', function (e) {
        if (!inView) return;
        if (e.pointerType && e.pointerType !== 'mouse') return;
        stopDecay();
        pendingEvent = e;
        if (!moveRafId) moveRafId = requestAnimationFrame(applyFrame);
      });

      canvas.addEventListener('pointerleave', function () {
        lastX = null;
        lastY = null;

        // Parallax returns to center smoothly via each layer's own CSS
        // transition (see the depth-response rules) — just needs the
        // signal set back to 0 here.
        stage.style.setProperty('--nx', '0');
        stage.style.setProperty('--ny', '0');

        // Fill mask has no CSS transition on mask-size (custom
        // properties inside a radial-gradient() argument don't
        // transition), so it decays via a short rAF loop instead.
        stopDecay();
        var start = performance.now();
        var startSizes = fills.map(function (el) {
          return {
            fw: parseFloat(el.style.getPropertyValue('--fw')) || 0,
            fh: parseFloat(el.style.getPropertyValue('--fh')) || 0
          };
        });

        function decay(now) {
          var t = Math.min(1, (now - start) / FILL_DECAY_MS);
          var k = 1 - t;
          fills.forEach(function (el, i) {
            el.style.setProperty('--fw', (startSizes[i].fw * k).toFixed(1) + 'px');
            el.style.setProperty('--fh', (startSizes[i].fh * k).toFixed(1) + 'px');
          });
          if (t < 1) {
            decayRafId = requestAnimationFrame(decay);
          } else {
            decayRafId = 0;
          }
        }
        decayRafId = requestAnimationFrame(decay);
      });

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
