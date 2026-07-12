(function () {
  var FOCUS_THRESHOLD = 0.32;

  function initAuthor() {
    var section = document.querySelector('[data-author]');
    if (!section) return;

    var reduceMotion = window.LwsUtil.reduceMotion();

    // One-shot trigger: adds .is-active, which both the clip-path
    // portrait reveal and the staggered text transitions key off of
    // (see css/author.css). unobserve() after firing rules out any
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
      }, { threshold: FOCUS_THRESHOLD });
      revealIo.observe(section);
    }

    // Cursor glow — desktop/mouse only. Reduced motion and touch both
    // skip this entirely (touch has no hover to react to anyway).
    if (reduceMotion || window.LwsUtil.isTouch()) return;

    var photo = section.querySelector('[data-author-photo]');
    if (!photo) return;

    // Mirrors the section's own IntersectionObserver rather than
    // reusing it, since this one needs to keep reporting in/out on
    // every crossing (not unobserve after the first hit) to gate the
    // mousemove listener while the section is off-screen.
    var inView = false;
    if ('IntersectionObserver' in window) {
      var visIo = new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
      }, { threshold: 0 });
      visIo.observe(section);
    } else {
      inView = true;
    }

    var pendingX = 50;
    var pendingY = 50;
    var glowRafId = 0;

    function applyGlow() {
      glowRafId = 0;
      photo.style.setProperty('--gx', pendingX.toFixed(1) + '%');
      photo.style.setProperty('--gy', pendingY.toFixed(1) + '%');
    }

    photo.addEventListener('mousemove', function (e) {
      if (!inView) return;
      var rect = photo.getBoundingClientRect();
      pendingX = ((e.clientX - rect.left) / rect.width) * 100;
      pendingY = ((e.clientY - rect.top) / rect.height) * 100;
      if (!glowRafId) glowRafId = requestAnimationFrame(applyGlow);
    });
  }

  document.addEventListener('DOMContentLoaded', initAuthor);
})();
