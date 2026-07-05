(function () {
  var SCATTER_DELAY_MS = 1300;
  var MAGNET_STRENGTH = 0.32;

  function initMockupAssembly(frame) {
    var mockup = frame.querySelector('[data-mockup]');
    var stage = frame.querySelector('[data-mockup-stage]');
    var hint = frame.querySelector('[data-hero-hint]');
    var hintText = frame.querySelector('[data-hero-hint-text]');
    var glow = frame.querySelector('[data-mockup-glow]');
    if (!mockup || !stage) return;

    // Capability, not a width check — a touch laptop gets the tap
    // model too, a hover-capable narrow window keeps hover.
    var touch = window.LwsUtil.isTouch();
    var scatterTimer = null;

    // Single source of truth: the hint's wording is a pure function of
    // the CURRENT scattered/assembled state, read straight off the
    // argument setScattered already has — no separate "tapped" flag
    // that can drift out of sync with what the mockup is actually
    // showing (that drift was the bug: a stale flag meant the hint got
    // stuck on "assembled" text forever after the first tap, even once
    // the user tapped again and scattered it back).
    function setHintText(scattered) {
      if (!hintText) return;
      hintText.textContent = touch
        ? (scattered ? 'Нажмите на макет — и сайт соберётся' : 'Готово — сайт собран')
        : 'Наведите на макет — блоки соберутся в сайт';
    }

    function setScattered(scattered) {
      stage.classList.toggle('is-scattered', scattered);
      // Touch keeps the hint on screen permanently once shown — it's
      // the only confirmation a tap did anything, so it switches
      // wording instead of disappearing right when the assembled state
      // it's confirming appears. Desktop keeps the original behavior:
      // visible only while scattered/un-hovered, since hovering is
      // itself the feedback there.
      if (hint) hint.classList.toggle('is-visible', touch ? true : scattered);
      if (glow) glow.classList.toggle('is-visible', !scattered);
      setHintText(scattered);
    }

    setScattered(false);
    scatterTimer = window.setTimeout(function () {
      setScattered(true);
    }, SCATTER_DELAY_MS);

    if (touch) {
      // A native 'click' only fires after a genuine tap — the browser
      // already suppresses it once the touch has moved past its own
      // scroll/swipe threshold, so this doubles as the tap-vs-swipe
      // guard the spec asks for without any manual touch math.
      mockup.addEventListener('click', function () {
        window.clearTimeout(scatterTimer);
        setScattered(!stage.classList.contains('is-scattered'));
      });
    } else {
      mockup.addEventListener('mouseenter', function () {
        window.clearTimeout(scatterTimer);
        setScattered(false);
      });

      mockup.addEventListener('mouseleave', function () {
        setScattered(true);
      });
    }
  }

  function initTilt(frame) {
    if (window.LwsUtil.isTouch()) return;

    var mockup = frame.querySelector('[data-mockup]');
    var tilt = frame.querySelector('[data-tilt]');
    if (!mockup || !tilt) return;

    mockup.addEventListener('mousemove', function (e) {
      var rect = mockup.getBoundingClientRect();
      var px = (e.clientX - rect.left) / rect.width - 0.5;
      var py = (e.clientY - rect.top) / rect.height - 0.5;
      tilt.style.transform =
        'rotateX(' + (-py * 9).toFixed(2) + 'deg) rotateY(' + (px * 12).toFixed(2) + 'deg)';
    });

    mockup.addEventListener('mouseleave', function () {
      tilt.style.transform = 'rotateX(0deg) rotateY(0deg)';
    });
  }

  function initMagnetButtons(frame) {
    if (window.LwsUtil.isTouch()) return;

    var buttons = frame.querySelectorAll('[data-magnet]');
    buttons.forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var mx = e.clientX - (rect.left + rect.width / 2);
        var my = e.clientY - (rect.top + rect.height / 2);
        btn.style.transform =
          'translate(' + (mx * MAGNET_STRENGTH).toFixed(1) + 'px,' + (my * MAGNET_STRENGTH).toFixed(1) + 'px)';
      });

      btn.addEventListener('mouseleave', function () {
        btn.style.transform = 'translate(0px,0px)';
      });
    });
  }

  function initSecondaryCta(frame) {
    var btn = frame.querySelector('[data-scroll-to]');
    if (!btn) return;

    btn.addEventListener('click', function () {
      window.LwsUtil.scrollToHash(btn.getAttribute('data-scroll-to'), window.LwsUtil.reduceMotion());
    });
  }

  function initHero() {
    var frame = document.querySelector('[data-hero]');
    if (!frame) return;

    initMockupAssembly(frame);
    initTilt(frame);
    initMagnetButtons(frame);
    initSecondaryCta(frame);
  }

  document.addEventListener('DOMContentLoaded', initHero);
})();
