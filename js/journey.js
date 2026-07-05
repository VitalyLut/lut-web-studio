(function () {
  var JOURNEY_STEPS = [
    {
      title: 'Первый экран',
      question: 'Куда я попал?',
      answer: 'Первый экран сразу объясняет услугу, город/нишу, ценность и следующий шаг.',
      modules: ['Заголовок', 'Услуга', 'CTA', 'Визуал']
    },
    {
      title: 'Оффер',
      question: 'Что мне предлагают?',
      answer: 'Оффер показывает, что именно вы делаете, для кого и почему это важно.',
      modules: ['Предложение', 'УТП', 'Польза', 'Формат']
    },
    {
      title: 'Польза',
      question: 'Почему это мне нужно?',
      answer: 'Сайт показывает результат: что человек получит, какую проблему решит и почему стоит остаться.',
      modules: ['Выгода', 'Результат', 'Отличие', 'Сценарий']
    },
    {
      title: 'Доверие',
      question: 'Можно ли им верить?',
      answer: 'Доверие собирается из отзывов, команды, опыта, цифр, фото, документов и понятной подачи.',
      modules: ['Отзывы', 'Опыт', 'Команда', 'Факты']
    },
    {
      title: 'Кейсы / доказательства',
      question: 'У них уже получалось?',
      answer: 'Кейсы и примеры показывают, что за красивыми словами есть реальные работы и результат.',
      modules: ['Проекты', 'До/после', 'Результат', 'Примеры']
    },
    {
      title: 'FAQ / возражения',
      question: 'А если дорого? А если не подойдёт?',
      answer: 'FAQ, этапы, условия и честные пояснения снимают сомнения до того, как человек уйдёт.',
      modules: ['FAQ', 'Цена', 'Сроки', 'Условия']
    },
    {
      title: 'Заявка',
      question: 'Окей, хочу обсудить. Что дальше?',
      answer: 'Форма, мессенджеры и понятный CTA превращают интерес в конкретное обращение.',
      modules: ['Форма', 'Телефон', 'Мессенджер', 'Отправить']
    }
  ];

  // Station i sits at this fraction of the route's real arc length (via
  // getPointAtLength) AND becomes "active" once scroll progress crosses
  // the same value — one number drives both placement and timing, so a
  // station's node, its chip, and the moment its card appears can never
  // drift apart. The trailing 1.001 is a sentinel so getActiveIndex's
  // lookup loop needs no special last-case.
  var STATION_FRAC = [0.10, 0.20, 0.35, 0.50, 0.65, 0.78, 0.90];
  var STATION_THRESH = STATION_FRAC.concat([1.001]);

  // Was 0.97 — station 07 becomes active at STATION_FRAC's last entry
  // (0.90), so the old 0.97 threshold left only 0.90-0.97 (7% of the
  // track) for the form to read as "active," then just 0.97-1.0 (3%)
  // for the complete/final card to actually be seen before the sticky
  // stage releases into FAQ. That's the mobile bug: the final card had
  // almost no scroll distance of its own, so FAQ appeared to arrive
  // before the card had finished being shown. 0.94 (matching the same
  // convention as assembly.js's DONE_THRESHOLD) roughly doubles that
  // hold to 6% of the track.
  var COMPLETE_THRESHOLD = 0.94;

  // Per-station chip offset from its station point, in the SVG's own
  // viewBox units (1000x400) — small nudges to keep each chip in clear
  // space near its node without covering the curve or the bottom panels.
  var CHIP_OFFSETS = [
    { dx: 0, dy: -55 },
    { dx: 0, dy: -55 },
    { dx: -25, dy: -60 },
    { dx: 0, dy: -55 },
    { dx: 25, dy: -60 },
    { dx: 0, dy: -55 },
    { dx: -75, dy: -50 }
  ];

  var VIEW_W = 1000;
  var VIEW_H = 400;

  var clamp01 = window.LwsUtil.clamp01;

  function computeProgress(trackEl) {
    var rect = trackEl.getBoundingClientRect();
    var total = trackEl.offsetHeight - window.innerHeight;
    if (total <= 0) return 0;
    return clamp01(-rect.top / total);
  }

  function getActiveIndex(p) {
    for (var i = 0; i < STATION_THRESH.length; i++) {
      if (p < STATION_THRESH[i]) return i - 1;
    }
    return STATION_THRESH.length - 1;
  }

  function initJourney() {
    var section = document.querySelector('[data-journey]');
    if (!section) return;

    var track = section.querySelector('[data-journey-track]');
    if (!track) return;

    if (window.LwsUtil.reduceMotion()) {
      // Static .journey__rm fallback (pure CSS) covers this — no scroll-
      // driven work needed, matches assembly.js's early-return pattern.
      return;
    }

    var routeFg = section.querySelector('[data-journey-route-fg]');
    var signal = section.querySelector('[data-journey-signal]');
    var glow = section.querySelector('[data-journey-glow]');
    var trail = section.querySelector('[data-journey-trail]');
    var stations = Array.prototype.slice.call(section.querySelectorAll('[data-station]'));
    var chips = Array.prototype.slice.call(section.querySelectorAll('[data-chip-station]'));
    var connectors = Array.prototype.slice.call(section.querySelectorAll('[data-connector]'));
    var card = section.querySelector('[data-journey-card]');
    var mock = section.querySelector('[data-journey-mock]');
    var mockProgressFill = section.querySelector('[data-journey-mock-progress]');
    var kickerEl = section.querySelector('[data-journey-kicker]');
    var questionEl = section.querySelector('[data-journey-question]');
    var answerEl = section.querySelector('[data-journey-answer]');
    var modulesEl = section.querySelector('[data-journey-modules]');
    var formPreview = section.querySelector('[data-journey-form-preview]');
    var submitBtn = section.querySelector('[data-journey-submit]');
    var mockBlocks = Array.prototype.slice.call(section.querySelectorAll('[data-mock-block]'));
    var finalEl = section.querySelector('[data-journey-final]');
    var railDots = Array.prototype.slice.call(section.querySelectorAll('[data-rail-dot]'));
    var railFill = section.querySelector('[data-journey-rail-fill]');

    if (!routeFg || !signal || !card || typeof routeFg.getPointAtLength !== 'function') return;

    var totalLength = 0;

    // point() returns both raw viewBox coords (for the SVG connector
    // lines) and scene-percentage coords (for the absolutely-positioned
    // HTML station/chip/signal elements) from a single sample.
    function point(fraction) {
      var len = totalLength * clamp01(fraction);
      var pt = routeFg.getPointAtLength(len);
      return { x: pt.x, y: pt.y, xPct: (pt.x / VIEW_W) * 100, yPct: (pt.y / VIEW_H) * 100 };
    }

    var stationPts = [];

    // Matches the max-width: 1023px breakpoint in journey.css where
    // .journey__route/.journey__chaos switch to display:none in favor
    // of the vertical rail. Below that width, none of the SVG path
    // geometry work this guards (getTotalLength/getPointAtLength,
    // station/chip/connector placement) has any visible effect — it
    // was still running every scroll frame against a hidden SVG
    // regardless, real wasted CPU on exactly the devices that can
    // least afford it. Re-checked on resize so rotating a tablet
    // through the breakpoint still gets the right behavior.
    function isMobileRoute() {
      return !!(window.matchMedia && window.matchMedia('(max-width: 1023px)').matches);
    }

    function layoutRoute() {
      if (isMobileRoute()) return;

      totalLength = routeFg.getTotalLength();
      stationPts = STATION_FRAC.map(point);

      stations.forEach(function (st) {
        var i = parseInt(st.getAttribute('data-station'), 10);
        var p = stationPts[i];
        if (!p) return;
        st.style.left = p.xPct.toFixed(2) + '%';
        st.style.top = p.yPct.toFixed(2) + '%';
      });

      chips.forEach(function (chip) {
        var i = parseInt(chip.getAttribute('data-chip-station'), 10);
        var base = stationPts[i];
        var off = CHIP_OFFSETS[i];
        if (!base || !off) return;
        var cx = base.x + off.dx;
        var cy = base.y + off.dy;
        chip.style.left = ((cx / VIEW_W) * 100).toFixed(2) + '%';
        chip.style.top = ((cy / VIEW_H) * 100).toFixed(2) + '%';

        var connector = connectors[i];
        if (connector) {
          connector.setAttribute('x1', base.x.toFixed(1));
          connector.setAttribute('y1', base.y.toFixed(1));
          connector.setAttribute('x2', cx.toFixed(1));
          connector.setAttribute('y2', cy.toFixed(1));
        }
      });
    }

    function renderModules(step) {
      if (!modulesEl) return;
      modulesEl.innerHTML = step.modules.map(function (m) {
        return '<span class="chip"><span class="chip__dot"></span>' + m + '</span>';
      }).join('');
    }

    var lastIndex = -2;
    var lastComplete = null;
    var lastStationCount = JOURNEY_STEPS.length - 1;

    function setActiveStation(index, complete) {
      if (index === lastIndex && complete === lastComplete) return;
      lastIndex = index;
      lastComplete = complete;

      var reached = index >= 0;
      card.classList.toggle('is-visible', reached);
      if (mock) mock.classList.toggle('is-visible', reached);

      stations.forEach(function (st) {
        var i = parseInt(st.getAttribute('data-station'), 10);
        st.classList.toggle('is-done', i < index);
        st.classList.toggle('is-active', i === index);
      });

      // Mobile vertical rail — same index, same done/active meaning as
      // the desktop stations above, just a plain dot list instead of
      // points sampled along the SVG curve.
      railDots.forEach(function (dot) {
        var i = parseInt(dot.getAttribute('data-rail-dot'), 10);
        dot.classList.toggle('is-done', i < index);
        dot.classList.toggle('is-active', i === index);
      });

      // Each question chip dissolves individually the moment its own
      // station is reached — not the whole group at once — so passing
      // a station reads as "that question resolved."
      chips.forEach(function (chip) {
        var i = parseInt(chip.getAttribute('data-chip-station'), 10);
        chip.classList.toggle('is-hidden', index >= i);
      });
      connectors.forEach(function (connector) {
        var i = parseInt(connector.getAttribute('data-connector'), 10);
        connector.classList.toggle('is-hidden', index >= i);
      });

      mockBlocks.forEach(function (b) {
        var i = parseInt(b.getAttribute('data-mock-block'), 10);
        b.classList.toggle('is-done', i < index);
        b.classList.toggle('is-active', i === index);
        b.classList.toggle('is-complete', i === lastStationCount && complete);
      });

      if (reached) {
        var step = JOURNEY_STEPS[index];
        var isLast = index === lastStationCount;

        if (kickerEl) kickerEl.textContent = 'СТАНЦИЯ 0' + (index + 1) + ' / 07 — ' + step.title.toUpperCase();
        if (questionEl) questionEl.textContent = step.question;
        if (answerEl) answerEl.textContent = step.answer;

        card.classList.toggle('is-form', isLast);
        if (isLast) {
          if (formPreview) formPreview.classList.toggle('is-sent', complete);
          if (submitBtn) submitBtn.textContent = complete ? 'Отправлено ✓' : 'Отправить заявку';
        } else {
          renderModules(step);
        }
      }

      if (finalEl) finalEl.classList.toggle('is-visible', complete);
    }

    function updateVisual(p) {
      // Desktop-only: SVG dash-offset + two getPointAtLength samples
      // (signal, trail) per scroll frame, all invisible work once
      // .journey__route is display:none below 1024px (see
      // isMobileRoute above layoutRoute).
      if (!isMobileRoute()) {
        routeFg.style.strokeDashoffset = (100 * (1 - p)).toFixed(2);

        var pos = point(p);
        signal.style.left = pos.xPct.toFixed(2) + '%';
        signal.style.top = pos.yPct.toFixed(2) + '%';
        if (glow) {
          glow.style.left = pos.xPct.toFixed(2) + '%';
          glow.style.top = pos.yPct.toFixed(2) + '%';
        }
        if (trail) {
          var tp = point(p - 0.025);
          trail.style.left = tp.xPct.toFixed(2) + '%';
          trail.style.top = tp.yPct.toFixed(2) + '%';
        }
      }

      if (mockProgressFill) mockProgressFill.style.width = (p * 100).toFixed(1) + '%';
      if (railFill) railFill.style.height = (p * 100).toFixed(1) + '%';
    }

    var rafId = 0;
    function tick() {
      rafId = 0;
      var p = computeProgress(track);
      updateVisual(p);
      setActiveStation(getActiveIndex(p), p > COMPLETE_THRESHOLD);
    }
    function requestTick() {
      if (rafId) return;
      rafId = requestAnimationFrame(tick);
    }

    layoutRoute();
    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('resize', function () {
      layoutRoute();
      requestTick();
    });
    requestTick();
  }

  document.addEventListener('DOMContentLoaded', initJourney);
})();
