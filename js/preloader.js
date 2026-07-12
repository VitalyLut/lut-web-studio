// Homepage-only loading screen. Structure/positioning is CSS (visible
// from first paint, no JS-load-order gap); this file drives the
// liquid-fill choreography itself — valve angle, stream draw-in,
// each letter's rising wavy liquid level — via one rAF loop that
// only runs while the preloader is on screen, plus the safe
// show/hide lifecycle (minimum visible time, load-gated, hard cap,
// scroll lock) carried over from the previous version.
(function () {
  // ---- Timeline (ms from animation start) — full motion, matching
  // the brief's own reference numbers: the valve opens, the stream
  // catches up partway through that turn, then L -> W -> S fill with
  // a small overlap between consecutive letters so the handoff reads
  // as one continuous pour instead of three separate triggers. ----
  var FULL = {
    total: 3700,
    valve: [0, 600],
    valveOvershoot: 6,          // degrees past the resting angle, then settles back
    valveAngle: 165,
    stream: [400, 650],         // draw-in (dash reveal) window
    streamEndThin: [3050, 3300],// stroke-width -> 0 alongside the settle
    letters: { L: [550, 1400], W: [1350, 2250], S: [2200, 3050] },
    settleTail: 250,            // extra ms of decaying wave after each letter's own window ends
    waveAmpMax: 26,             // viewBox units (~6% of an ~360-tall glyph early on)
    holdAfter: 180              // brief fixation before fade-out is allowed to start
  };

  var REDUCED = {
    total: 1000,
    valve: [0, 120],
    valveOvershoot: 0,
    valveAngle: 165,
    stream: [80, 190],
    streamEndThin: [860, 950],
    letters: { L: [130, 420], W: [400, 660], S: [640, 920] },
    settleTail: 0,
    waveAmpMax: 0,
    holdAfter: 20
  };

  var MIN_VISIBLE_MS_EXTRA = 5200;   // absolute safety cap if `load` never fires
  var FADE_OUT_MS = 500;
  var FADE_OUT_MS_REDUCED = 260;

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function easeInOutCubic(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  // Small, controlled overshoot: approaches 1, briefly exceeds it by
  // `back`, settles to 1 — used for the valve's "confident turn, tiny
  // mechanical settle" per the brief, not a springy/cartoonish bounce.
  function easeOutSmallBack(t, back) {
    var c1 = back;
    var c3 = c1 + 1;
    var p = t - 1;
    return 1 + c3 * p * p * p + c1 * p * p;
  }

  function windowProgress(t, win) {
    return clamp01((t - win[0]) / (win[1] - win[0]));
  }

  // Builds the liquid shape for one letter: a filled region from
  // `level` (0 = empty/bottom, 1 = full/top of the glyph's own
  // bounding box) down past the glyph's bottom, with a soft
  // multi-hump wavy top edge (quadratic beziers only — no straight
  // polygon segments, so there is nothing for a "triangle" to form
  // from). amplitude shrinks as the letter finishes filling; swayPx
  // gently shifts the whole wave sideways (bounded, sine-based, so it
  // can never scroll the wave off the padded edge).
  function buildLiquidPath(bbox, level, amplitude, swayPx) {
    var marginX = bbox.width * 0.16;
    var left = bbox.x - marginX;
    var right = bbox.x + bbox.width + marginX;
    var bottom = bbox.y + bbox.height + bbox.height * 0.08;
    var baseY = bbox.y + bbox.height - level * bbox.height;

    var humps = 3;
    var totalWidth = right - left;
    var segW = totalWidth / (humps * 2);
    var startX = left + swayPx;

    var d = 'M' + left.toFixed(1) + ',' + bottom.toFixed(1) +
      ' L' + left.toFixed(1) + ',' + baseY.toFixed(1);

    var dir = 1;
    for (var i = 0; i < humps * 2; i++) {
      var nx = startX + (i + 1) * segW;
      var cx = startX + (i + 0.5) * segW;
      var cy = baseY + dir * amplitude;
      d += ' Q' + cx.toFixed(1) + ',' + cy.toFixed(1) + ' ' + nx.toFixed(1) + ',' + baseY.toFixed(1);
      dir *= -1;
    }

    d += ' L' + right.toFixed(1) + ',' + bottom.toFixed(1) + ' Z';
    return d;
  }

  function initPreloader() {
    var root = document.querySelector('[data-preloader]');
    if (!root) return;

    var svg = root.querySelector('.lwsload__svg');
    if (!svg) return;

    var reduceMotion = window.LwsUtil.reduceMotion();
    var profile = reduceMotion ? REDUCED : FULL;

    window.LwsUtil.lockScroll();

    var valveEl = svg.querySelector('[data-valve]');
    var streamEl = svg.querySelector('[data-stream]');
    var faucetGroup = svg.querySelector('[data-faucet-group]');
    var streamLen = Math.abs(
      parseFloat(streamEl.getAttribute('y2')) - parseFloat(streamEl.getAttribute('y1'))
    );
    streamEl.style.strokeDasharray = streamLen;
    streamEl.style.strokeDashoffset = streamLen;

    // ---- Layout: the <text> glyphs are placed at rough starting x
    // positions in the markup, but real glyph widths depend on actual
    // font metrics — measured here, once, and used to reposition all
    // three for perfectly even gaps centered in the 1000-wide
    // viewBox. The faucet group is then nudged by a single
    // translateX so the stream still lands exactly on L's vertical
    // stroke, rather than hand-tuning pixel offsets that would drift
    // the moment the font or copy changes. ----
    var VIEWBOX_WIDTH = 1000;
    var LETTER_GAP = 42;
    // Stream x as authored in the markup above — chosen to already sit
    // almost exactly on L's real measured stroke center (~123, see
    // L_STROKE_CENTER_FRACTION below) so the runtime correction stays
    // near zero. A large correction here is what caused the valve/pipe
    // to run off the left edge on narrow viewports: shifting the whole
    // faucet-group by a big translateX pushed the pipe's authored
    // start (needed some distance to the left of the nozzle to read as
    // "entering from the side") past the scene's own edge, which has
    // very little spare margin on mobile (the scene is ~98vw there).
    var FAUCET_DESIGN_CENTER_X = 123;

    // L's own bounding box is centered on the WHOLE glyph (stroke +
    // foot), not the vertical stroke the stream needs to hit — the
    // foot pulls the box center well to the right of the stroke.
    // Measured directly off the rendered glyph (pixel-sampled the
    // stroke's left/right edges near the top of L, where only the
    // stroke exists): the stroke's own center sits at ~29.4% of the
    // full bbox width from its left edge. Fixed to this font/weight's
    // "L", not a stand-in guess.
    var L_STROKE_CENTER_FRACTION = 0.294;

    var letterIds = ['L', 'W', 'S'];
    var glyphEls = {};
    letterIds.forEach(function (id) { glyphEls[id] = svg.querySelector('#lwsGlyph' + id); });

    var naturalWidth = {};
    letterIds.forEach(function (id) { naturalWidth[id] = glyphEls[id].getBBox().width; });

    var totalWidth = naturalWidth.L + naturalWidth.W + naturalWidth.S + LETTER_GAP * 2;
    var startX = (VIEWBOX_WIDTH - totalWidth) / 2;
    var xL = startX;
    var xW = xL + naturalWidth.L + LETTER_GAP;
    var xS = xW + naturalWidth.W + LETTER_GAP;
    glyphEls.L.setAttribute('x', xL.toFixed(1));
    glyphEls.W.setAttribute('x', xW.toFixed(1));
    glyphEls.S.setAttribute('x', xS.toFixed(1));

    var letters = letterIds.map(function (id) {
      var liquid = svg.querySelector('[data-liquid="' + id + '"]');
      var bbox = glyphEls[id].getBBox();
      return { id: id, bbox: bbox, liquid: liquid, window: profile.letters[id], settled: false };
    });

    var lStrokeCenterX = letters[0].bbox.x + letters[0].bbox.width * L_STROKE_CENTER_FRACTION;
    faucetGroup.style.transform = 'translateX(' + (lStrokeCenterX - FAUCET_DESIGN_CENTER_X).toFixed(1) + 'px)';

    // Ring center as authored in the markup — the pivot for the SVG
    // native rotate(angle cx cy) transform below. Using literal
    // coordinates (not the group's own bounding box) means the
    // rotation always pivots around this exact point regardless of
    // what else lives in the group, so nothing can drift the way the
    // old fill-box/transform-origin approach did.
    var VALVE_CX = 75;
    var VALVE_CY = 95;

    var swayPhaseOffsets = { L: 0, W: 1.4, S: 2.7 };

    // ---- rAF timeline — runs once from first frame until every
    // letter (and the valve/stream) has settled, then stops for good.
    // If the site is still loading after that, the fully-filled LWS
    // just sits there (nothing left to compute, no more frames
    // requested); the show/hide lifecycle below is entirely
    // independent of this loop finishing. ----
    var lastSettleEnd = Math.max.apply(null, letters.map(function (l) { return l.window[1]; })) + profile.settleTail;
    var animEnd = Math.max(profile.valve[1], profile.streamEndThin[1], lastSettleEnd);
    var rafId = 0;
    var animStart = 0;

    function frame(now) {
      if (!animStart) animStart = now;
      var t = now - animStart;

      // Valve: confident turn to profile.valveAngle with a small
      // mechanical overshoot, then holds.
      var valveP = windowProgress(t, profile.valve);
      var eased = profile.valveOvershoot
        ? easeOutSmallBack(valveP, profile.valveOvershoot / profile.valveAngle)
        : valveP;
      var angle = eased * profile.valveAngle;
      valveEl.setAttribute('transform', 'rotate(' + angle.toFixed(2) + ' ' + VALVE_CX + ' ' + VALVE_CY + ')');

      // Stream: draws in (dash reveal) once the valve is most of the
      // way open, then thins to nothing right at the very end.
      var streamP = windowProgress(t, profile.stream);
      streamEl.style.strokeDashoffset = (streamLen * (1 - streamP)).toFixed(1);
      if (t >= profile.streamEndThin[0]) {
        streamEl.classList.add('is-ending');
      }

      // Letters: sequential level rise, each with its own decaying
      // wave amplitude that keeps going a little past that letter's
      // own fill window (a short settle wobble) before freezing.
      var stillAnimating = t < animEnd;
      letters.forEach(function (letter) {
        if (letter.settled) return;
        var win = letter.window;
        var settleEnd = win[1] + profile.settleTail;
        if (t < win[0] - 40) {
          // Not started yet — nothing to draw (stays at the initial
          // empty path set at setup time).
          return;
        }
        var levelP = easeInOutCubic(windowProgress(t, win));
        // Amplitude eases down as the letter fills (choppier when
        // mostly empty, calmer near the top), then — once past this
        // letter's own window — decays the rest of the way to 0 over
        // settleTail, instead of stopping dead the instant it hits 100%.
        var settleP = t <= win[1] ? 0 : clamp01((t - win[1]) / profile.settleTail);
        var fillAmplitude = profile.waveAmpMax * (1 - levelP * 0.6);
        var amplitude = fillAmplitude * (1 - settleP);
        var sway = amplitude > 0.15
          ? Math.sin(t / 380 + swayPhaseOffsets[letter.id]) * Math.min(10, amplitude * 0.4)
          : 0;
        letter.liquid.setAttribute('d', buildLiquidPath(letter.bbox, levelP, Math.max(amplitude, 0), sway));
        if (t >= settleEnd) letter.settled = true;
      });

      if (stillAnimating) {
        rafId = requestAnimationFrame(frame);
      } else {
        rafId = 0;
      }
    }

    rafId = requestAnimationFrame(frame);

    // ---- Show/hide lifecycle — unchanged in spirit from the
    // previous version: never hide before the visual cycle has had
    // time to finish, never wait past a hard cap regardless of how
    // long the page takes to load. ----
    var minVisibleMs = profile.total + profile.settleTail + profile.holdAfter;
    var fadeOutMs = reduceMotion ? FADE_OUT_MS_REDUCED : FADE_OUT_MS;
    var maxVisibleMs = minVisibleMs + MIN_VISIBLE_MS_EXTRA;
    var start = performance.now();
    var done = false;
    var maxTimer = 0;

    function remove() {
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
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

    maxTimer = window.setTimeout(finish, maxVisibleMs);
  }

  document.addEventListener('DOMContentLoaded', initPreloader);
})();
