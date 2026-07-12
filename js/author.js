(function () {
  var REVEAL_THRESHOLD = 0.3;
  var MAX_DEPTH_PX = 3;

  function initAuthor() {
    var section = document.querySelector('[data-author]');
    if (!section) return;

    var reduceMotion = window.LwsUtil.reduceMotion();

    // One-shot trigger: adds .is-active, which the portrait segment
    // settle, the bgtext/label reveals and their staggered
    // transition-delays all key off of (see css/author.css).
    // unobserve() after firing rules out a repeat run on a later
    // scroll back into view.
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

    // Depth-response — desktop/mouse only. Reduced motion and touch
    // both skip this entirely.
    if (reduceMotion || window.LwsUtil.isTouch()) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var stage = section.querySelector('[data-author-stage]');
    if (!stage) return;

    var inView = false;
    if ('IntersectionObserver' in window) {
      var visIo = new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
      }, { threshold: 0 });
      visIo.observe(section);
    } else {
      inView = true;
    }

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

  document.addEventListener('DOMContentLoaded', initAuthor);
})();
