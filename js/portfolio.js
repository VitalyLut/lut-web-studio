(function () {
  // Real cases — swap `image`/`url` here as new work ships. Placeholder
  // entries (placeholder: true) render a distinct "open slot" card instead
  // of a screenshot; add more the same way.
  var PROJECTS = [
    {
      title: 'Стоматология СМ', type: 'Сайт стоматологической клиники', geo: 'Подольск', tag: 'Стоматология',
      description: 'Сайт для стоматологической клиники: услуги, врачи, структура доверия, адаптив и путь пациента до заявки.',
      fact: 'Полная структура сайта: 7 страниц, от услуг до записи',
      image: 'assets/images/portfolio/biryukov-dental.ru.webp', imgW: 1600, imgH: 1000,
      alt: 'Главная страница сайта стоматологической клиники в Подольске',
      domain: 'biryukov-dental.ru', url: 'https://biryukov-dental.ru'
    },
    {
      title: 'Стоматология 4А', type: 'Сайт стоматологии', geo: '', tag: 'Стоматология',
      description: 'Лёгкая и аккуратная упаковка стоматологии с акцентом на услуги, доверие и удобный первый контакт.',
      fact: 'Клиника упакована с нуля: структура, визуал, адаптив',
      image: 'assets/images/portfolio/4a-dental.ru.webp', imgW: 1600, imgH: 1000,
      alt: 'Главная страница сайта стоматологии 4А',
      domain: '4a-dental.ru', url: 'https://4a-dental.ru'
    },
    {
      title: 'Эстетик Стом', type: 'Корпоративный сайт стоматологии', geo: 'Казань', tag: 'Стоматология',
      description: 'Сайт для сети стоматологий: направления лечения, врачи, доверие, структура услуг и понятная запись на приём.',
      fact: 'Полный редизайн: новая структура и визуал сайта',
      image: 'assets/images/portfolio/es-stom.ru.webp', imgW: 1600, imgH: 867,
      alt: 'Главная страница сайта стоматологической клиники Эстетик Стом в Казани',
      domain: 'es-stom.ru', url: 'https://es-stom.ru'
    },
    {
      title: 'Milin Bouquet', type: 'Сайт цветочного магазина', geo: '', tag: 'Цветы',
      description: 'Визуальная упаковка цветочного проекта: каталог, атмосфера бренда, акцент на букеты и быстрый путь к заказу.',
      fact: 'Полный редизайн и визуальная пересборка сайта',
      image: 'assets/images/portfolio/milin-bouquet.ru.webp', imgW: 1600, imgH: 1000,
      alt: 'Главная страница сайта цветочного магазина Milin Bouquet',
      domain: 'milin-bouquet.ru', url: 'https://milin-bouquet.ru'
    },
    {
      title: 'Модная стоматология', type: 'Сайт стоматологической клиники', geo: 'Краснодар', tag: 'Стоматология',
      description: 'Сайт клиники с мягким визуалом, услугами, доверительными блоками и понятным сценарием обращения.',
      fact: 'Лендинг с архитектурой под будущее расширение',
      image: 'assets/images/portfolio/modnaya-stom.ru.webp', imgW: 1600, imgH: 1000,
      alt: 'Главная страница сайта стоматологической клиники в Краснодаре',
      domain: 'modnaya-stom.ru', url: 'https://modnaya-stom.ru'
    },
    {
      title: 'Здесь может быть ваш сайт', type: 'Новый проект', tag: 'Свободно',
      description: 'Свободное место в подборке для бизнеса, которому нужен сайт с сильной структурой, визуалом и заявками.',
      domain: 'lutstudio.ru', url: '#contact', placeholder: true
    },
    {
      title: 'Соберём ваш проект', type: 'LUT Web Studio', tag: 'Свободно',
      description: 'Лендинг, корпоративный сайт или интернет-магазин — под задачу, нишу и путь клиента.',
      domain: 'lutstudio.ru', url: '#contact', placeholder: true
    },
    {
      title: 'Следующий кейс', type: 'В разработке', tag: 'Скоро',
      description: 'Новая digital-система скоро появится в портфолио.',
      domain: 'lutstudio.ru', url: '#', placeholder: true
    }
  ];

  var ANGLE_STEP = 360 / PROJECTS.length;
  var RADIUS = 460;
  var TILT_X = 8;
  var TILT_Z = -2;
  var AUTO_SPEED = 360 / 42000;
  var DRAG_SENSITIVITY = 0.28;
  var FRICTION = 0.94;
  var MIN_VELOCITY = 0.003;
  var CLICK_SUPPRESS_PX = 6;
  var SPEED_EASE = 0.07;
  var HOVER_EASE = 0.1;

  function now() {
    return window.performance && performance.now ? performance.now() : Date.now();
  }
  var clamp01 = window.LwsUtil.clamp01;
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function normalizeAngle(a) {
    a = a % 360;
    if (a > 180) a -= 360;
    if (a < -180) a += 360;
    return a;
  }
  function easeTowards(current, target, ease, dt) {
    var factor = 1 - Math.pow(1 - ease, dt / 16.67);
    return current + (target - current) * factor;
  }

  function mockPreview(i) {
    var pattern = i % 3;
    if (pattern === 0) {
      return (
        '<span class="ui-bar ui-bar--faint" style="width:38%;height:6px"></span>' +
        '<span class="ui-bar ui-bar--light" style="width:78%;height:11px;margin-top:6px"></span>' +
        '<span class="ui-bar ui-bar--accent" style="width:52%;height:11px;margin-top:6px"></span>' +
        '<span class="ui-bar ui-bar--accent" style="width:86px;height:20px;border-radius:5px;margin-top:10px"></span>'
      );
    }
    if (pattern === 1) {
      return (
        '<div style="flex:1;border-radius:6px;background:repeating-linear-gradient(135deg,rgba(200,255,46,.08) 0 8px,rgba(255,255,255,.02) 8px 16px);border:1px solid rgba(255,255,255,.1)"></div>' +
        '<span class="ui-bar ui-bar--light" style="width:70%"></span>' +
        '<span class="ui-bar ui-bar--faint" style="width:46%"></span>'
      );
    }
    return (
      '<div class="portfolio-card__preview-row"><span class="ui-dot" style="width:16px;height:16px"></span><span class="ui-bar ui-bar--light" style="width:60%"></span></div>' +
      '<div class="portfolio-card__preview-row"><span class="ui-dot ui-dot--outline" style="width:16px;height:16px"></span><span class="ui-bar ui-bar--faint" style="width:70%"></span></div>' +
      '<div class="portfolio-card__preview-row"><span class="ui-dot" style="width:16px;height:16px"></span><span class="ui-bar ui-bar--faint" style="width:50%"></span></div>'
    );
  }

  function buildCard(project, i) {
    var a = document.createElement('a');
    a.className = 'portfolio-card' + (project.placeholder ? ' portfolio-card--placeholder' : '');
    a.href = project.url || '#';
    a.setAttribute('data-index', String(i));
    a.setAttribute('aria-label', project.title);
    if (/^https?:\/\//.test(project.url || '')) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
    if (project.placeholder) {
      // Open slots have no real site to link to — the whole card opens
      // the quick-contact popup instead. The orbit's existing drag-vs-
      // click guard (ring's click handler stops propagation before this
      // ever reaches the popup's document-level listener) already keeps
      // a drag release from triggering this.
      a.setAttribute('data-open-project-modal', '');
      a.setAttribute('data-source', 'portfolio');
      a.setAttribute('data-source-label', 'Обсудить проект');
    }

    var previewHTML;
    if (project.placeholder) {
      previewHTML =
        '<div class="portfolio-card__placeholder">' +
          '<div class="portfolio-card__placeholder-grid"></div>' +
          '<span class="portfolio-card__placeholder-mark">+</span>' +
          '<span class="portfolio-card__placeholder-text">' + project.description + '</span>' +
          '<span class="portfolio-card__placeholder-cta">Обсудить проект</span>' +
        '</div>';
    } else if (project.image) {
      previewHTML = '<img src="' + project.image + '" alt="' + project.alt + '" width="' + project.imgW + '" height="' + project.imgH + '" loading="lazy" decoding="async">';
    } else {
      previewHTML = '<div class="portfolio-card__preview-mock">' + mockPreview(i) + '</div>';
    }

    a.innerHTML =
      '<div class="portfolio-card__inner">' +
        '<div class="portfolio-card__frame">' +
          '<div class="portfolio-card__bar">' +
            '<span class="browser-bar__dot browser-bar__dot--red"></span>' +
            '<span class="browser-bar__dot browser-bar__dot--yellow"></span>' +
            '<span class="browser-bar__dot browser-bar__dot--green"></span>' +
            '<span class="portfolio-card__url">' + project.domain + '</span>' +
          '</div>' +
          '<div class="portfolio-card__preview">' + previewHTML + '</div>' +
          '<span class="portfolio-card__tag">' + project.tag + '</span>' +
        '</div>' +
        '<div class="portfolio-card__meta">' +
          '<span class="portfolio-card__title">' + project.title + '</span>' +
          '<span class="portfolio-card__type">' + project.type + '</span>' +
        '</div>' +
      '</div>';
    return a;
  }

  function initPortfolio() {
    var section = document.querySelector('[data-portfolio]');
    if (!section) return;
    var orbit = section.querySelector('[data-orbit-viewport]');
    var ring = section.querySelector('[data-orbit-ring]');
    if (!orbit || !ring) return;

    PROJECTS.forEach(function (project, i) {
      ring.appendChild(buildCard(project, i));
    });

    var indexEl = section.querySelector('[data-portfolio-index]');
    var typeEl = section.querySelector('[data-portfolio-type]');
    var titleEl = section.querySelector('[data-portfolio-title]');
    var descEl = section.querySelector('[data-portfolio-desc]');
    var factEl = section.querySelector('[data-portfolio-fact]');
    var linkEl = section.querySelector('[data-portfolio-link]');

    function setCaption(i) {
      var p = PROJECTS[i];
      if (!p) return;
      if (indexEl) indexEl.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(PROJECTS.length).padStart(2, '0');
      if (typeEl) typeEl.textContent = p.type + (p.geo ? ' · ' + p.geo : '');
      if (titleEl) titleEl.textContent = p.title;
      if (descEl) descEl.textContent = p.description;
      if (factEl) {
        if (p.fact) {
          factEl.textContent = p.fact;
          factEl.hidden = false;
        } else {
          factEl.hidden = true;
          factEl.textContent = '';
        }
      }
      if (linkEl) {
        linkEl.href = p.url || '#';
        linkEl.textContent = p.placeholder ? 'Обсудить проект →' : 'Смотреть проект →';
        if (/^https?:\/\//.test(p.url || '')) {
          linkEl.target = '_blank';
          linkEl.rel = 'noopener noreferrer';
        } else {
          linkEl.removeAttribute('target');
          linkEl.removeAttribute('rel');
        }
        if (p.placeholder) {
          linkEl.setAttribute('data-open-project-modal', '');
          linkEl.setAttribute('data-source', 'portfolio');
          linkEl.setAttribute('data-source-label', 'Обсудить проект');
        } else {
          linkEl.removeAttribute('data-open-project-modal');
          linkEl.removeAttribute('data-source');
          linkEl.removeAttribute('data-source-label');
        }
      }
    }

    setCaption(0);

    var cards = Array.prototype.slice.call(ring.querySelectorAll('.portfolio-card'));

    // The orbit is the signature mechanic on every device, touch
    // included — Pointer Events already unify mouse/touch/pen, so
    // pointerdown/pointermove/pointerup below drive rotation from a
    // finger drag exactly as they do from a mouse drag, no separate
    // touch path needed. Only reduced-motion gets a different
    // (fully static, non-rotating) layout — see portfolio.css.
    var reduceMotion = window.LwsUtil.reduceMotion();
    if (reduceMotion) return; // CSS renders a static, scrollable row — nothing else to wire up

    var inners = cards.map(function (c) { return c.querySelector('.portfolio-card__inner'); });

    cards.forEach(function (card, i) {
      card.style.transform = 'translate(-50%,-50%) rotateY(' + (i * ANGLE_STEP) + 'deg) translateZ(' + RADIUS + 'px)';
      card.addEventListener('mouseenter', function () { hoveredIndex = i; });
      card.addEventListener('mouseleave', function () { if (hoveredIndex === i) hoveredIndex = -1; });
    });

    var baseAngle = 0;
    var hoveredIndex = -1;
    var lastActiveIndex = -1;
    var velocity = 0;
    var currentSpeed = AUTO_SPEED;
    var hoverAmount = 0;

    var dragging = false;
    var dragLastX = 0;
    var dragLastT = 0;
    var dragMoved = 0;

    function onPointerDown(e) {
      dragging = true;
      velocity = 0;
      dragMoved = 0;
      dragLastX = e.clientX;
      dragLastT = now();
      orbit.classList.add('is-dragging');
      if (e.cancelable) e.preventDefault();
    }

    function onPointerMove(e) {
      if (!dragging) return;
      var t = now();
      var dx = e.clientX - dragLastX;
      var dt = Math.max(1, t - dragLastT);
      dragMoved += Math.abs(dx);
      baseAngle += dx * DRAG_SENSITIVITY;
      velocity = (dx * DRAG_SENSITIVITY) / dt;
      dragLastX = e.clientX;
      dragLastT = t;
    }

    function onPointerUp() {
      if (!dragging) return;
      dragging = false;
      orbit.classList.remove('is-dragging');
    }

    orbit.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    ring.addEventListener('click', function (e) {
      if (dragMoved > CLICK_SUPPRESS_PX) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    function tick(dt) {
      if (!dragging) {
        if (Math.abs(velocity) > MIN_VELOCITY) {
          // Inertia after a drag release — decays smoothly, then hands off
          // to the auto-rotate/hover-speed logic below.
          baseAngle += velocity * dt;
          velocity *= Math.pow(FRICTION, dt / 16.67);
          currentSpeed = velocity;
        } else {
          velocity = 0;
          var targetSpeed = hoveredIndex >= 0 ? 0 : AUTO_SPEED;
          currentSpeed = easeTowards(currentSpeed, targetSpeed, SPEED_EASE, dt);
          baseAngle += currentSpeed * dt;
        }
      }

      var hoverTarget = hoveredIndex >= 0 ? 1 : 0;
      hoverAmount = easeTowards(hoverAmount, hoverTarget, HOVER_EASE, dt);

      ring.style.transform =
        'rotateX(' + TILT_X + 'deg) rotateZ(' + TILT_Z + 'deg) rotateY(' + baseAngle.toFixed(2) + 'deg)';

      var bestIndex = 0;
      var bestDepth = -Infinity;

      for (var i = 0; i < cards.length; i++) {
        var angle = normalizeAngle(baseAngle + i * ANGLE_STEP);
        var rad = (angle * Math.PI) / 180;
        var depth = Math.cos(rad);
        var depthT = clamp01((depth + 1) / 2);
        var eased = Math.pow(depthT, 1.3);

        var isHovered = i === hoveredIndex;
        var scale = lerp(0.78, 1, eased);
        var opacity = lerp(0.25, 1, eased);
        var blur = lerp(5, 0, eased);

        if (isHovered) {
          scale = lerp(scale, Math.min(1.08, scale + 0.1), hoverAmount);
          opacity = lerp(opacity, 1, hoverAmount);
          blur = lerp(blur, 0, hoverAmount);
        } else if (hoveredIndex >= 0) {
          opacity = lerp(opacity, opacity * 0.55, hoverAmount);
        }

        inners[i].style.transform = 'scale(' + scale.toFixed(3) + ')';
        inners[i].style.opacity = opacity.toFixed(3);
        inners[i].style.filter = blur > 0.05 ? 'blur(' + blur.toFixed(2) + 'px)' : 'none';

        if (depth > bestDepth) {
          bestDepth = depth;
          bestIndex = i;
        }
      }

      var activeIndex = hoveredIndex >= 0 ? hoveredIndex : bestIndex;
      cards.forEach(function (c, i) { c.classList.toggle('is-active', i === activeIndex); });
      if (activeIndex !== lastActiveIndex) {
        lastActiveIndex = activeIndex;
        setCaption(activeIndex);
      }
    }

    tick(0);

    var isVisible = true;
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { isVisible = entry.isIntersecting; });
      }, { threshold: 0.05 });
      io.observe(section);
    }

    var lastT = 0;
    function loop(t) {
      if (!lastT) lastT = t;
      var dt = t - lastT;
      lastT = t;
      if (isVisible) tick(dt);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  document.addEventListener('DOMContentLoaded', initPortfolio);
})();
