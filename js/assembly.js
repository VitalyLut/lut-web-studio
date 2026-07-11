(function () {
  var INTRO = 0.05;
  var SEG = 0.145;
  var LAYER_COUNT = 6;
  var DONE_THRESHOLD = 0.94;

  var LAYERS = [
    {
      code: '01', name: 'Аналитика ниши', en: 'РЫНОК',
      desc: 'Разбираем бизнес, конкурентов, аудиторию и точки доверия, чтобы сайт не выглядел «как у всех», а попадал в реальные причины выбора.',
      ex: -80, ey: -170, ez: -30, er: -6
    },
    {
      code: '02', name: 'Смыслы и оффер', en: 'ОФФЕР',
      desc: 'Формулируем, что вы предлагаете, почему это важно для клиента и почему стоит обратиться именно к вам.',
      ex: 88, ey: -104, ez: -8, er: 5
    },
    {
      // Deliberately NOT "conversion route" — that thesis (path to the
      // application) belongs to Journey. This layer is about ordering
      // blocks/hierarchy so people find what matters fast, not about
      // the path to submission.
      code: '03', name: 'Структура и приоритеты', en: 'ИЕРАРХИЯ',
      desc: 'Определяем порядок блоков и визуальную иерархию, чтобы человек сразу видел главное и не терялся в структуре страницы.',
      ex: -46, ey: -34, ez: 18, er: -4
    },
    {
      code: '04', name: 'Визуальная система', en: 'ДИЗАЙН-СИСТЕМА',
      desc: 'Создаём стиль под уровень бизнеса: типографику, сетку, цвета, карточки, акценты, ритм и ощущение бренда.',
      ex: 60, ey: 40, ez: -16, er: 6
    },
    {
      code: '05', name: 'Интерфейс и анимации', en: 'АНИМАЦИИ',
      desc: 'Добавляем hover, scroll-анимации и микродвижение, чтобы сайт выглядел живым, современным и запоминался.',
      ex: -74, ey: 110, ez: 14, er: -5
    },
    {
      code: '06', name: 'Запуск и заявки', en: 'ЗАПУСК',
      desc: 'Адаптируем сайт под устройства, подключаем формы, мессенджеры, домен, базовую SEO-подготовку и проверяем всё перед запуском.',
      ex: 50, ey: 182, ez: -36, er: 4
    }
  ];

  var CHIP_SCATTER = [
    { x: -210, y: -150 },
    { x: -260, y: 10 },
    { x: -190, y: 170 },
    { x: 230, y: -140 },
    { x: 255, y: 0 },
    { x: -235, y: 120 },
    { x: 210, y: 150 },
    { x: -150, y: -230 },
    { x: 170, y: -200 },
    { x: 0, y: 230 }
  ];

  var clamp01 = window.LwsUtil.clamp01;
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function computeProgress(trackEl) {
    var rect = trackEl.getBoundingClientRect();
    var total = trackEl.offsetHeight - window.innerHeight;
    if (total <= 0) return 0;
    return clamp01(-rect.top / total);
  }

  function getActiveIndex(p) {
    var ai = Math.floor((p - INTRO) / SEG);
    if (ai < -1) ai = -1;
    if (ai > LAYER_COUNT - 1) ai = LAYER_COUNT - 1;
    if (p >= INTRO + LAYER_COUNT * SEG) ai = LAYER_COUNT - 1;
    return ai;
  }

  function initAssembly() {
    var track = document.querySelector('[data-assembly-track]');
    if (!track) return;

    var layerEls = Array.prototype.slice.call(track.querySelectorAll('[data-layer]'));

    // LAYERS (above) is the single source of truth for each card's
    // code/name/en/desc — written into the cards once, here, so the
    // HTML's static text can never silently drift from what the left
    // panel shows during scroll (a real mismatch on layer 04's desc
    // was found and fixed this way). Runs before the reduced-motion
    // branch below, since the reduced-motion fallback is exactly where
    // .assembly__layer-desc is actually visible to a reader.
    layerEls.forEach(function (el, i) {
      var L = LAYERS[i];
      if (!L) return;
      var elCode = el.querySelector('.assembly__layer-code');
      var elName = el.querySelector('.assembly__layer-name');
      var elEn = el.querySelector('.assembly__layer-en');
      var elDesc = el.querySelector('.assembly__layer-desc');
      if (elCode) elCode.textContent = L.code;
      if (elName) elName.textContent = L.name;
      if (elEn) elEn.textContent = L.en;
      if (elDesc) elDesc.textContent = L.desc;
    });

    if (window.LwsUtil.reduceMotion()) {
      // CSS fallback renders a static, readable layout — no scroll-driven work needed.
      return;
    }

    var core = track.querySelector('[data-assembly-core]');
    var scan = track.querySelector('[data-assembly-scan]');
    var chipEls = Array.prototype.slice.call(track.querySelectorAll('[data-chip]'));
    var codeEl = track.querySelector('[data-assembly-code]');
    var nameEl = track.querySelector('[data-assembly-name]');
    var enEl = track.querySelector('[data-assembly-en]');
    var descEl = track.querySelector('[data-assembly-desc]');
    var dots = Array.prototype.slice.call(track.querySelectorAll('[data-assembly-progress] .assembly__progress-dot'));
    var finalEl = track.querySelector('[data-assembly-final]');
    var completeEl = track.querySelector('[data-assembly-complete]');

    var lastActiveIndex = -2;
    var lastDone = null;

    function setActiveLayer(index, done) {
      if (index === lastActiveIndex && done === lastDone) return;
      lastActiveIndex = index;
      lastDone = done;

      if (done) {
        codeEl.textContent = 'OK';
        nameEl.textContent = 'Система собрана';
        enEl.textContent = 'ПРОЕКТ СОБРАН';
        descEl.textContent = 'От первого экрана до заявки — единый работающий механизм.';
      } else if (index < 0) {
        codeEl.textContent = '00';
        nameEl.textContent = 'Готовность к сборке';
        enEl.textContent = 'ОЖИДАНИЕ';
        descEl.textContent = 'Листайте вниз — сайт собирается слой за слоем, из данных бизнеса в единую систему.';
      } else {
        var L = LAYERS[index];
        codeEl.textContent = L.code;
        nameEl.textContent = L.name;
        enEl.textContent = L.en;
        descEl.textContent = L.desc;
      }

      dots.forEach(function (dot, i) {
        var passed = done || i <= index;
        var active = !done && i === index;
        dot.classList.toggle('is-passed', passed);
        dot.classList.toggle('is-active', active);
      });

      finalEl.classList.toggle('is-visible', done);
      completeEl.classList.toggle('is-visible', done);
    }

    // .assembly__core is 580x620 on desktop — the coordinate space every
    // cascadeSlot()/LAYERS[].ey value below was tuned in. CSS shrinks
    // core's own HEIGHT at narrower breakpoints (620 -> 260 -> 220,
    // width stays 580 throughout), but never told this JS, which kept
    // computing y-offsets up to +-182px against a box that's now only
    // 220-260px tall — cards escaped upward past their own core and
    // overlapped .assembly__final's text above it (the reported "white
    // text under the cards" bug). Reading core's real CSS height at
    // runtime and scaling y-offsets by how much shorter it is than its
    // native 620px keeps the cascade's shape proportional to whatever
    // box it's actually laid out in, automatically, at every
    // breakpoint, without duplicating breakpoint numbers into JS. X is
    // untouched — core's width was never resized, so that coordinate
    // space still matches what ex/cascadeSlot.x were tuned for.
    var CORE_BASE_HEIGHT = 620;
    // Extra 0.72 on top of the height ratio itself — a bare 1:1 ratio
    // left only ~17px between the tallest card and .assembly__final's
    // text in this repo's own test environment, and real device text
    // metrics (line-wrapping, font hinting) can render that text a
    // little taller than that. This trades a slightly more compact
    // mobile cascade for a clearance margin wide enough to hold up
    // across real devices, not just the one this was measured on.
    var MOBILE_SAFETY = 0.72;
    function coreYScale() {
      var h = core.offsetHeight;
      if (!h) return 1;
      var ratio = h / CORE_BASE_HEIGHT;
      return ratio >= 1 ? 1 : ratio * MOBILE_SAFETY;
    }

    function cascadeSlot(i, yScale) {
      // Step (40px, pre-scale) is tuned to match .assembly__layer-head's
      // real rendered height (36px + a few px of breathing room): each
      // resting card shows exactly its header band, never a random
      // sliver of the next card's body — that partial-body peekaboo
      // was the main source of visual noise in the assembled stack.
      // Only the frontmost/last card (highest z) shows its full body.
      return {
        x: (i - 2.5) * 12,
        y: (i - 2.5) * 40 * yScale,
        z: i * 28
      };
    }

    function updateVisual(p) {
      var fin = clamp01((p - 0.85) / 0.13);
      var rx = lerp(14, 6, fin);
      var ry = lerp(-8, 0, fin);
      core.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';

      var yScale = coreYScale();

      for (var i = 0; i < LAYER_COUNT; i++) {
        var el = layerEls[i];
        if (!el) continue;
        var L = LAYERS[i];
        var ls = INTRO + i * SEG;
        var le = ls + SEG * 0.72;
        var a = easeOutCubic(clamp01((p - ls) / (le - ls)));
        var slot = cascadeSlot(i, yScale);

        var x = lerp(L.ex, slot.x, a);
        var y = lerp(L.ey * yScale, slot.y, a);
        var z = lerp(L.ez, slot.z, a);
        var rot = lerp(L.er, 0, a);
        var sc = lerp(0.9, 1, a);

        var heat = 0;
        if (p >= ls && p <= le + 0.02) {
          var mid = (ls + le) / 2;
          var half = (le - ls) / 2 + 0.02;
          heat = clamp01(1 - Math.abs((p - mid) / half));
        }
        var locked = p > le ? 1 : 0;

        // The active layer always steps toward the camera and grows
        // slightly, so it reads as the main object — chips and other
        // layers can never visually cover it.
        z += heat * 130;
        sc += heat * 0.1;

        el.style.transform =
          'translate(-50%,-50%) translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotateZ(' + rot.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';

        // Once locked into the stack, brightness ramps with recency
        // (index) instead of a flat value — the newest/frontmost card
        // (06, Launch Core) reads as the culmination, older ones recede
        // into a dimmer "history" trail instead of competing for
        // attention with equal weight.
        var recency = i / (LAYER_COUNT - 1);
        var lockedOpacity = lerp(0.48, 1, recency);
        var lockedBorderAlpha = lerp(0.15, 0.5, recency);

        var opacity = heat > 0.04 ? 1 : (locked ? lockedOpacity : lerp(0.32, 0.72, a));
        el.style.opacity = opacity.toFixed(3);

        el.style.borderColor = heat > 0.04
          ? 'rgba(200,255,46,' + (0.35 + 0.5 * heat).toFixed(2) + ')'
          : (locked ? 'rgba(200,255,46,' + lockedBorderAlpha.toFixed(2) + ')' : 'rgba(255,255,255,.09)');
        el.style.boxShadow =
          '0 30px 60px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.06)' +
          (heat > 0.04 ? ',0 0 ' + (26 + 60 * heat).toFixed(0) + 'px rgba(200,255,46,' + (0.4 * heat).toFixed(2) + ')' : '');
      }

      if (scan) {
        var sweep = clamp01((p - 0.03) / 0.85);
        var sy = lerp(-260, 260, sweep);
        scan.style.transform = 'translate(-50%,-50%) translateY(' + sy.toFixed(1) + 'px)';
        scan.style.opacity = (p > 0.03 && p < 0.9) ? '0.85' : '0';
      }

      for (var c = 0; c < chipEls.length; c++) {
        var chip = chipEls[c];
        var home = parseInt(chip.getAttribute('data-home-layer'), 10) || 0;
        var scatter = CHIP_SCATTER[c] || { x: 0, y: 0 };
        var homeSlot = cascadeSlot(home);
        var homeLs = INTRO + home * SEG;
        var ca = easeInOutCubic(clamp01((p - (homeLs - 0.04)) / (SEG * 0.65)));
        var ctx = lerp(scatter.x, homeSlot.x, ca);
        var cty = lerp(scatter.y, homeSlot.y, ca);
        var csc = lerp(1, 0.4, ca);
        // Chips stay well behind the cascade's Z range (up to ~120 +
        // active boost) so an active layer can never be covered by chip
        // clutter — they read as "raw material" feeding into the system.
        var cz = lerp(30, 10, ca);
        chip.style.transform =
          'translate(-50%,-50%) translate3d(' + ctx.toFixed(1) + 'px,' + cty.toFixed(1) + 'px,' + cz.toFixed(1) + 'px) scale(' + csc.toFixed(3) + ')';
        chip.style.opacity = lerp(0.9, 0, ca).toFixed(3);
      }
    }

    var rafId = 0;
    function tick() {
      rafId = 0;
      var p = computeProgress(track);
      updateVisual(p);
      setActiveLayer(getActiveIndex(p), p > DONE_THRESHOLD);
    }
    function requestTick() {
      if (rafId) return;
      rafId = requestAnimationFrame(tick);
    }

    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('resize', requestTick);
    requestTick();
  }

  document.addEventListener('DOMContentLoaded', initAssembly);
})();
