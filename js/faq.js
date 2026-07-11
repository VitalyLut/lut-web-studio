(function () {
  var FAQ_ITEMS = [
    {
      label: 'TILDA',
      question: 'Tilda — это не слишком просто для серьёзного сайта?',
      answer: 'Нет, если сайт собирается не из шаблона. Tilda — это инструмент: итог зависит от структуры, дизайна, Zero Block, адаптива, анимаций, форм и логики страницы. Используем Tilda для быстрого запуска, а дизайн и структуру собираем под задачу бизнеса.',
      chips: ['Zero Block', 'адаптив', 'структура', 'запуск'],
      visualType: 'tilda'
    },
    {
      label: 'ФОРМАТ',
      question: 'Вы делаете только лендинги?',
      answer: 'Нет. Делаем лендинги, корпоративные сайты, сайты услуг, интернет-магазины, редизайн и доработки существующих проектов на Tilda. Формат подбирается под задачу: заявки, каталог, презентация компании, запись на услугу или обновление текущего сайта.',
      chips: ['лендинг', 'корпоративный', 'магазин', 'редизайн'],
      visualType: 'format'
    },
    {
      label: 'ЦЕНА',
      question: 'Сколько стоит сайт?',
      answer: 'Стоимость зависит от формата, объёма страниц, сложности дизайна, анимаций, адаптива и форм. Ниже стартовые цены — точную стоимость называем после короткого обсуждения задачи.',
      chips: ['от 50 000 ₽', 'формат', 'объём', 'сложность'],
      visualType: 'price'
    },
    {
      label: 'СРОКИ',
      question: 'Сколько времени занимает разработка?',
      answer: 'Небольшой лендинг можно запустить примерно за 7 дней, если быстро согласованы материалы и структура. Более сложные сайты, корпоративные проекты и магазины требуют больше времени — срок зависит от объёма, страниц и уровня анимаций.',
      chips: ['от 7 дней', 'объём', 'согласование', 'запуск'],
      visualType: 'timing'
    },
    {
      label: 'СТАРТ',
      question: 'Что нужно от меня для старта?',
      answer: 'Пригодятся понимание услуги или продукта, примеры сайтов, которые нравятся или нет, информация о бизнесе, фото, логотип и материалы, если они есть. Если структуры и текстов нет — поможем собрать логику страницы и ключевые смыслы.',
      chips: ['задача', 'материалы', 'примеры', 'смыслы'],
      visualType: 'start'
    },
    {
      label: 'ТЕКСТЫ',
      question: 'Вы пишете тексты или нужен готовый текст?',
      answer: 'Готовый текст не обязателен. Мы помогаем сформировать структуру, офферы, заголовки и логику подачи. Но факты о бизнесе, услугах, ценах и условиях всё равно нужны от вас — иначе сайт будет красивым, но не точным.',
      chips: ['оффер', 'структура', 'заголовки', 'факты'],
      visualType: 'texts'
    },
    {
      label: 'АДАПТИВ',
      question: 'Будет ли сайт нормально смотреться на телефоне?',
      answer: 'Да. Мобильную версию продумываем отдельно — это не «сжать desktop», а адаптировать блоки, кнопки, формы, отступы и размер текста под сценарий движения пользователя на телефоне.',
      chips: ['телефон', 'кнопки', 'формы', 'отступы'],
      visualType: 'adaptive'
    },
    {
      label: 'УПРАВЛЕНИЕ',
      question: 'Можно ли потом самому менять сайт?',
      answer: 'Да. После запуска сайт остаётся на Tilda, и базовые изменения можно делать самостоятельно: текст, фото, цены, простые блоки. Для более сложных правок можем объяснить логику сайта или остаться на поддержке.',
      chips: ['Tilda', 'тексты', 'фото', 'поддержка'],
      visualType: 'edit'
    },
    {
      label: 'ФОРМЫ',
      question: 'Подключаете формы, мессенджеры и заявки?',
      answer: 'Да. Продумываем кнопки, формы, мессенджеры и сценарии обращения. Можно подключить Telegram, MAX, почту, CRM или другие сервисы, если они нужны проекту.',
      chips: ['формы', 'Telegram', 'MAX', 'CRM'],
      visualType: 'forms'
    },
    {
      label: 'РЕДИЗАЙН',
      question: 'Что если у меня уже есть сайт, но он плохо работает?',
      answer: 'Можно сделать редизайн или точечные доработки: улучшить первый экран, структуру, адаптив, формы, визуал и путь пользователя до заявки. Не всегда нужно всё с нуля — иногда достаточно пересобрать слабые места.',
      chips: ['редизайн', 'адаптив', 'формы', 'путь заявки'],
      visualType: 'redesign'
    },
    {
      label: 'ОТЛИЧИЕ',
      question: 'Чем вы отличаетесь от агентства и фрилансера?',
      answer: 'От фрилансера — процессом: договор, этапы оплаты, гарантия 60 дней и письменные рекомендации клиентов. От агентства — ценой и скоростью: вы работаете напрямую со мной, без менеджеров-посредников, поэтому лендинг стоит от 50 000 ₽, а не от 150 000 ₽.',
      chips: ['договор', 'напрямую', 'гарантия 60 дней', 'от 50 000 ₽'],
      visualType: 'why'
    }
  ];

  function iconSvg(inner) {
    return '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
  }

  function viz(html) {
    return '<div class="faq-rise faq-rise--5 faq-viz">' + html + '</div>';
  }

  var VISUAL_BUILDERS = {
    tilda: function () {
      var steps = ['Задача', 'Структура', 'Дизайн', 'Tilda / Zero Block'];
      return viz(
        '<div class="faq-viz__chain">' +
          // Node+arrow as one inline-flex unit so a narrow/wrapped line
          // can't split them — an arrow wrapping onto its own line with
          // nothing after it was the reported bug on narrow screens.
          steps.map(function (s) { return '<span class="faq-viz__chain-step"><span class="faq-viz__node">' + s + '</span><span class="faq-viz__arrow">→</span></span>'; }).join('') +
          '<span class="faq-viz__node faq-viz__node--accent">Запуск</span>' +
        '</div>' +
        '<div class="faq-viz__status"><span class="status-pill__dot"></span>НЕ ШАБЛОН · СБОРКА ПОД ЗАДАЧУ</div>'
      );
    },
    format: function () {
      var items = [
        ['Лендинг', 'заявки'], ['Корпоративный', 'доверие'], ['Сайт услуг', 'запись'],
        ['Магазин', 'каталог'], ['Редизайн', 'обновление'], ['Доработки', 'исправления']
      ];
      return viz(
        '<div class="faq-viz__grid faq-viz__grid--6">' +
          items.map(function (i) { return '<div class="faq-viz__cell"><b>' + i[0] + '</b><span>' + i[1] + '</span></div>'; }).join('') +
        '</div>'
      );
    },
    price: function () {
      var rows = [
        ['Лендинг', 50000], ['Сайт услуг', 70000], ['Корпоративный', 90000],
        ['Интернет-магазин', 120000], ['Редизайн', 45000], ['Доработки', 15000]
      ];
      var max = 120000;
      return viz(
        '<div class="faq-viz__stack">' +
          rows.map(function (r) {
            var pct = Math.round((r[1] / max) * 100);
            var val = 'от ' + r[1].toLocaleString('ru-RU') + ' ₽';
            return (
              '<div class="faq-viz__price-row">' +
                '<span class="faq-viz__price-label">' + r[0] + '</span>' +
                '<span class="faq-viz__price-track"><span class="faq-viz__price-bar" style="width:' + pct + '%"></span></span>' +
                '<span class="faq-viz__price-val">' + val + '</span>' +
              '</div>'
            );
          }).join('') +
        '</div>'
      );
    },
    timing: function () {
      var steps = ['Бриф', 'Структура', 'Дизайн', 'Сборка', 'Адаптив', 'Запуск'];
      var stepsHtml = steps.map(function (s, i) {
        var dot = '<div class="faq-viz__step"><span class="faq-viz__step-dot">' + (i + 1) + '</span><span class="faq-viz__step-label">' + s + '</span></div>';
        return i < steps.length - 1 ? dot + '<span class="faq-viz__step-line"></span>' : dot;
      }).join('');
      return viz(
        '<div class="faq-viz__timeline">' + stepsHtml + '</div>' +
        '<div class="faq-viz__status"><span class="status-pill__dot"></span>ЛЕНДИНГ — ОТ 7 ДНЕЙ · СЛОЖНЫЙ ПРОЕКТ — ПОСЛЕ ОЦЕНКИ</div>'
      );
    },
    start: function () {
      var items = [
        ['задача', true], ['услуга / продукт', true], ['примеры сайтов', false],
        ['материалы', false], ['лого / фото', false], ['факты о бизнесе', false]
      ];
      var done = items.filter(function (i) { return i[1]; }).length;
      return viz(
        '<div class="faq-viz__grid faq-viz__grid--3">' +
          items.map(function (i) {
            return '<button type="button" class="faq-viz__check-cell' + (i[1] ? ' is-done' : '') + '" data-check aria-pressed="' + (i[1] ? 'true' : 'false') + '">' + i[0] + '</button>';
          }).join('') +
        '</div>' +
        '<div class="faq-viz__status">' +
          '<span class="status-pill__dot"></span>ЕСЛИ НЕТ СТРУКТУРЫ — СОБЕРЁМ' +
          '<span class="faq-viz__counter" data-check-counter>ГОТОВО: ' + done + ' / ' + items.length + '</span>' +
        '</div>'
      );
    },
    texts: function () {
      return viz(
        '<div class="faq-viz__builder">' +
          '<div class="faq-viz__builder-col">' +
            '<span class="faq-viz__label">От вас</span>' +
            '<span class="faq-viz__tag">факты</span><span class="faq-viz__tag">услуги</span>' +
            '<span class="faq-viz__tag">цены</span><span class="faq-viz__tag">преимущества</span>' +
          '</div>' +
          '<span class="faq-viz__arrow faq-viz__arrow--big">→</span>' +
          '<div class="faq-viz__builder-col">' +
            '<span class="faq-viz__label">Мы собираем</span>' +
            '<span class="faq-viz__tag faq-viz__tag--accent">структура</span><span class="faq-viz__tag faq-viz__tag--accent">оффер</span>' +
            '<span class="faq-viz__tag faq-viz__tag--accent">заголовки</span><span class="faq-viz__tag faq-viz__tag--accent">сценарий</span>' +
          '</div>' +
        '</div>'
      );
    },
    adaptive: function () {
      return viz(
        '<div class="faq-viz__devices">' +
          '<div class="faq-viz__device-col">' +
            '<span class="faq-viz__device-label">ПК-ВЕРСИЯ</span>' +
            '<div class="faq-viz__desktop">' +
              '<div class="faq-viz__desktop-menu"><span></span><span></span><span></span><span></span></div>' +
              '<span class="ui-bar ui-bar--light" style="width:60%"></span>' +
              '<span class="ui-bar ui-bar--faint" style="width:85%"></span>' +
              '<span class="faq-viz__desktop-btn">Кнопка</span>' +
            '</div>' +
          '</div>' +
          '<div class="faq-viz__device-arrow"><span class="faq-viz__arrow faq-viz__arrow--big">→</span><span class="faq-viz__arrow-label">АДАПТАЦИЯ</span></div>' +
          '<div class="faq-viz__device-col faq-viz__device-col--end">' +
            '<span class="faq-viz__device-label">ТЕЛЕФОН</span>' +
            '<div class="faq-viz__mobile">' +
              '<span class="faq-viz__mobile-cta"></span>' +
              '<span class="ui-bar ui-bar--faint"></span>' +
              '<span class="ui-bar ui-bar--faint"></span>' +
              '<span class="ui-bar ui-bar--faint" style="width:70%"></span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="faq-viz__status-row"><span>КНОПКИ</span><span>ФОРМЫ</span><span>ТЕКСТ</span><span>ОТСТУПЫ</span></div>'
      );
    },
    edit: function () {
      var rows = [
        ['Текст', iconSvg('<path d="M4 15.5l1-3.5 8-8 2.5 2.5-8 8-3.5 1z"/>')],
        ['Фото', iconSvg('<rect x="3" y="4" width="14" height="12" rx="1.5"/><circle cx="7.5" cy="8.5" r="1.5"/><path d="M17 13l-4-4-7 7"/>')],
        ['Цены', '<span class="faq-viz__edit-icon-rub">₽</span>'],
        ['Простые блоки', iconSvg('<rect x="3" y="4" width="6" height="6" rx="1"/><rect x="11" y="4" width="6" height="6" rx="1"/><rect x="3" y="12" width="14" height="4" rx="1"/>')]
      ];
      return viz(
        '<div class="faq-viz__edit-panel">' +
          rows.map(function (r) { return '<div class="faq-viz__edit-row"><span class="faq-viz__edit-icon">' + r[1] + '</span>' + r[0] + '</div>'; }).join('') +
        '</div>' +
        '<div class="faq-viz__status"><span class="status-pill__dot"></span>МОЖНО МЕНЯТЬ САМОСТОЯТЕЛЬНО · СЛОЖНОЕ — НА ПОДДЕРЖКЕ</div>'
      );
    },
    forms: function () {
      var fields = [['Имя', false], ['Телефон', false], ['Сообщение', true]];
      return viz(
        '<div class="faq-viz__flow">' +
          '<div class="faq-viz__mini-form">' +
            fields.map(function (f) {
              return '<span class="faq-viz__form-field"><span class="faq-viz__form-field-label">' + f[0] + '</span><span class="faq-viz__form-row' + (f[1] ? ' faq-viz__form-row--tall' : '') + '"></span></span>';
            }).join('') +
            '<span class="faq-viz__form-submit">Отправить заявку →</span>' +
            '<span class="faq-viz__form-ready"><span class="status-pill__dot"></span>Готово к отправке</span>' +
          '</div>' +
          '<span class="faq-viz__arrow faq-viz__arrow--big">→</span>' +
          '<div class="faq-viz__destinations">' +
            '<span class="faq-viz__dest">Telegram</span><span class="faq-viz__dest">MAX</span>' +
            '<span class="faq-viz__dest">Почта</span><span class="faq-viz__dest">CRM</span>' +
          '</div>' +
        '</div>'
      );
    },
    redesign: function () {
      var before = ['нет CTA', 'слабый экран', 'плохой адаптив'];
      var after = ['понятный оффер', 'путь до заявки', 'адаптив и формы'];
      return viz(
        '<div class="faq-viz__split">' +
          '<div class="faq-viz__before">' +
            '<span class="faq-viz__tag">ДО</span>' +
            before.map(function (t) { return '<span class="faq-viz__mini-line">' + t + '</span>'; }).join('') +
          '</div>' +
          '<span class="faq-viz__scanline"></span>' +
          '<div class="faq-viz__after">' +
            '<span class="faq-viz__tag faq-viz__tag--accent">СТАЛО</span>' +
            after.map(function (t) { return '<span class="faq-viz__mini-line faq-viz__mini-line--accent">' + t + '</span>'; }).join('') +
          '</div>' +
        '</div>'
      );
    },
    why: function () {
      var rows = [
        ['Фрилансер', 'риск и тишина'],
        ['Агентство', 'цена и сроки'],
        ['LUT Web Studio', 'лично и по договору']
      ];
      return viz(
        '<div class="faq-viz__grid faq-viz__grid--3">' +
          rows.map(function (r) { return '<div class="faq-viz__cell"><b>' + r[0] + '</b><span>' + r[1] + '</span></div>'; }).join('') +
        '</div>' +
        '<div class="faq-viz__status"><span class="status-pill__dot"></span>ЛИЧНО · ПО ДОГОВОРУ · БЕЗ ПОСРЕДНИКОВ</div>'
      );
    }
  };

  function initFaq() {
    var section = document.querySelector('[data-faq]');
    if (!section) return;

    var rows = Array.prototype.slice.call(section.querySelectorAll('[data-faq-index]'));
    var panelBody = section.querySelector('[data-faq-body]');
    var contentEl = section.querySelector('[data-faq-content]');
    var panelEl = section.querySelector('.faq__panel');
    var scan = section.querySelector('[data-faq-scan]');
    var idEl = section.querySelector('[data-faq-id]');
    if (!rows.length || !panelBody || !contentEl) return;

    var reduceMotion = window.LwsUtil.reduceMotion();
    var EXIT_MS = 140;

    var activeIndex = 0;
    var swapTimer = null;

    function renderContent(item, index) {
      var build = VISUAL_BUILDERS[item.visualType];
      var indexLabel = (index < 9 ? '0' : '') + (index + 1) + ' / ' + item.label;
      if (idEl) idEl.textContent = indexLabel;
      contentEl.innerHTML =
        '<div data-faq-content-inner>' +
          '<div class="faq-rise faq-rise--1 faq__panel-num">' + indexLabel + '</div>' +
          '<h3 class="faq-rise faq-rise--2 faq__panel-question">' + item.question + '</h3>' +
          '<p class="faq-rise faq-rise--3 faq__panel-answer">' + item.answer + '</p>' +
          '<div class="faq-rise faq-rise--4 faq__panel-chips">' +
            item.chips.map(function (c) { return '<span class="chip"><span class="chip__dot"></span>' + c + '</span>'; }).join('') +
          '</div>' +
          (build ? build() : '') +
        '</div>';
    }

    // The row a viewer is on — hover, click and keyboard focus all set
    // this the same way. There is no separate "locked" state: whichever
    // question was interacted with last simply stays active, including
    // after the mouse leaves.
    function applyActive(index) {
      if (index === activeIndex && panelBody.classList.contains('is-in')) return;
      activeIndex = index;
      var item = FAQ_ITEMS[index];

      rows.forEach(function (row, i) {
        var active = i === index;
        row.classList.toggle('is-active', active);
        row.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      if (panelEl) panelEl.setAttribute('aria-labelledby', 'faq-tab-' + index);

      if (reduceMotion) {
        renderContent(item, index);
        panelBody.classList.add('is-in');
        return;
      }

      window.clearTimeout(swapTimer);
      panelBody.classList.remove('is-in');

      swapTimer = window.setTimeout(function () {
        renderContent(item, index);
        void panelBody.offsetWidth;
        requestAnimationFrame(function () { panelBody.classList.add('is-in'); });

        if (scan) {
          scan.classList.remove('is-scanning');
          void scan.offsetWidth;
          scan.classList.add('is-scanning');
        }
      }, EXIT_MS);
    }

    // Portrait tablet/phone: the sticky side panel becomes a rich
    // accordion (see faq.css's max-width: 1023px block) — same panel
    // node, reparented to sit right after whichever row is open rather
    // than duplicated. Checked live on every click (not cached once)
    // so rotating a tablet mid-session still gets the right behavior.
    function isMobileAccordion() {
      return !!(window.matchMedia && window.matchMedia('(max-width: 1023px)').matches);
    }

    var mobileOpenIndex = -1;

    function closeMobilePanel(row) {
      mobileOpenIndex = -1;
      if (panelEl) panelEl.classList.remove('is-open');
      panelBody.classList.remove('is-in');
      row.classList.remove('is-active');
      row.setAttribute('aria-selected', 'false');
    }

    rows.forEach(function (row, i) {
      row.addEventListener('mouseenter', function () { if (!isMobileAccordion()) applyActive(i); });
      row.addEventListener('focus', function () { applyActive(i); });
      row.addEventListener('click', function () {
        if (isMobileAccordion()) {
          if (mobileOpenIndex === i) {
            closeMobilePanel(row);
            return;
          }
          mobileOpenIndex = i;
          if (panelEl) {
            row.insertAdjacentElement('afterend', panelEl);
            panelEl.classList.add('is-open');
          }
        }
        applyActive(i);
      });
    });

    // Start-kit checklist is decorative, session-only interactivity —
    // delegated on contentEl so it survives the innerHTML swap on every
    // question switch without needing to rebind per render.
    contentEl.addEventListener('click', function (e) {
      var cell = e.target && e.target.closest ? e.target.closest('[data-check]') : null;
      if (!cell) return;
      var nowDone = !cell.classList.contains('is-done');
      cell.classList.toggle('is-done', nowDone);
      cell.setAttribute('aria-pressed', nowDone ? 'true' : 'false');

      var counter = contentEl.querySelector('[data-check-counter]');
      if (counter) {
        var all = contentEl.querySelectorAll('[data-check]');
        var doneCount = contentEl.querySelectorAll('[data-check].is-done').length;
        counter.textContent = 'ГОТОВО: ' + doneCount + ' / ' + all.length;
      }
    });

    // First paint: render immediately, no exit-animation wait.
    renderContent(FAQ_ITEMS[0], 0);
    if (reduceMotion) {
      panelBody.classList.add('is-in');
    } else {
      requestAnimationFrame(function () { panelBody.classList.add('is-in'); });
    }

    // Mobile accordion opens with the first question already expanded,
    // matching the desktop default (question 0 pre-selected) instead of
    // starting on an all-collapsed, answer-less first impression.
    if (isMobileAccordion() && panelEl && rows[0]) {
      mobileOpenIndex = 0;
      rows[0].insertAdjacentElement('afterend', panelEl);
      panelEl.classList.add('is-open');
    }
  }

  document.addEventListener('DOMContentLoaded', initFaq);
})();
