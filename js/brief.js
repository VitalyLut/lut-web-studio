(function () {
  var QUIZ_STEPS = [
    {
      id: 'format', label: 'ФОРМАТ', question: 'Какой сайт нужен?',
      options: ['Лендинг', 'Корпоративный сайт', 'Интернет-магазин', 'Сайт услуг', 'Редизайн', 'Доработки на Tilda']
    },
    {
      id: 'stage', label: 'СТАДИЯ', question: 'На какой стадии проект?',
      options: ['Есть только идея', 'Есть материалы', 'Есть старый сайт', 'Нужно всё с нуля']
    },
    {
      id: 'goal', label: 'ЦЕЛЬ', question: 'Главная цель сайта?',
      options: ['Получать заявки', 'Упаковать бизнес', 'Показать услуги', 'Продавать товары', 'Обновить старый сайт', 'Подготовить к рекламе']
    },
    {
      id: 'content', label: 'КОНТЕНТ', question: 'Какие материалы уже есть?', multiSelect: true,
      options: ['Структура', 'Тексты', 'Фото', 'Логотип', 'Примеры сайтов', 'Ничего нет', 'Нужна помощь с контентом']
    },
    {
      id: 'timing', label: 'СРОК', question: 'Когда хотите запустить?',
      options: ['Как можно скорее', 'За 1–2 недели', 'В течение месяца', 'Пока выбираю подрядчика']
    },
    {
      id: 'channel', label: 'СВЯЗЬ', question: 'Куда удобнее написать?',
      options: ['Telegram', 'WhatsApp', 'MAX', 'Звонок', 'Email']
    },
    {
      id: 'contact', label: 'КОНТАКТЫ', question: 'Оставьте контакты', isContact: true
    }
  ];

  var FORMAT_MAP = {
    'Лендинг': { headline: 'Лендинг под заявки', sub: 'Структура, оффер и понятный путь к заявке.', url: 'landing.lutstudio.ru', preview: 'landing' },
    'Корпоративный сайт': { headline: 'Корпоративный сайт', sub: 'Главная, услуги, команда и контакты в одной системе.', url: 'company.lutstudio.ru', preview: 'corporate' },
    'Интернет-магазин': { headline: 'Интернет-магазин', sub: 'Каталог, товары, корзина и путь к покупке.', url: 'shop.lutstudio.ru', preview: 'ecommerce' },
    'Сайт услуг': { headline: 'Сайт услуг с записью', sub: 'Услуги, цены и быстрый путь к записи.', url: 'service.lutstudio.ru', preview: 'service' },
    'Редизайн': { headline: 'Редизайн сайта', sub: 'Усиливаем структуру, визуал и конверсию.', url: 'redesign.lutstudio.ru', preview: 'redesign' },
    'Доработки на Tilda': { headline: 'Доработки Tilda', sub: 'Технические правки и улучшения без хаоса.', url: 'tilda.lutstudio.ru', preview: 'tilda-upgrade' }
  };

  // Each builder returns a compact but CONCRETE visual schema of that
  // site type — enough real structure (image zones, prices, nav nodes,
  // status states) to read as "an actual landing/shop/service site" at
  // a glance, not an abstract shape. Kept deliberately light on DOM
  // (a dozen-ish elements) — this is a schema, not a cloned Configurator
  // scene. `data-zone` marks the spots that answer to the CONTENT step
  // (see applyContentZones) where that makes sense for the format.
  var PREVIEW_BUILDERS = {
    landing: function () {
      return (
        '<div class="brief-preview__landing">' +
          '<div class="brief-preview__landing-hero">' +
            '<span class="brief-preview__landing-visual" data-zone="photo"></span>' +
            '<div class="brief-preview__landing-hero-text">' +
              '<span class="ui-bar ui-bar--light" style="width:88%;height:9px" data-zone="text"></span>' +
              '<span class="ui-bar ui-bar--faint" style="width:60%;height:6px;margin-top:6px" data-zone="text"></span>' +
              '<span class="brief-preview__landing-cta">Оставить заявку</span>' +
            '</div>' +
          '</div>' +
          '<div class="brief-preview__landing-benefits">' +
            '<span class="brief-preview__landing-benefit"></span>' +
            '<span class="brief-preview__landing-benefit"></span>' +
            '<span class="brief-preview__landing-benefit"></span>' +
          '</div>' +
          '<div class="brief-preview__landing-proof">' +
            '<span class="brief-preview__landing-avatar"></span>' +
            '<span class="ui-bar ui-bar--faint" style="width:72%;height:6px" data-zone="text"></span>' +
          '</div>' +
          '<div class="brief-preview__landing-faq"><span></span><span></span></div>' +
        '</div>'
      );
    },
    ecommerce: function () {
      var prices = ['2 490 ₽', '1 290 ₽', '3 990 ₽'];
      var cards = prices.map(function (p) {
        return (
          '<div class="brief-preview__product">' +
            '<span class="brief-preview__product-fav">♥</span>' +
            '<span class="brief-preview__product-thumb" data-zone="photo"></span>' +
            '<span class="brief-preview__product-price">' + p + '</span>' +
          '</div>'
        );
      }).join('');
      return (
        '<div class="brief-preview__shop">' +
          '<div class="brief-preview__shop-grid">' + cards + '</div>' +
          '<div class="brief-preview__shop-cart">' +
            '<span class="brief-preview__shop-cart-label">Корзина · <b>3</b> товара</span>' +
            '<span class="brief-preview__shop-cart-total">7 770 ₽</span>' +
            '<span class="brief-preview__shop-cart-cta">Оформить заказ</span>' +
          '</div>' +
        '</div>'
      );
    },
    service: function () {
      var rows = [['Консультация', 'от 2 500 ₽'], ['Диагностика', 'от 4 000 ₽'], ['Полный курс', 'от 1 800 ₽']];
      var list = rows.map(function (r) {
        return '<div class="brief-preview__service-row"><span class="ui-bar ui-bar--light" style="width:58%" data-zone="text"></span><span class="brief-preview__service-price">' + r[1] + '</span></div>';
      }).join('');
      return (
        '<div class="brief-preview__service">' +
          '<div class="brief-preview__service-list">' + list + '</div>' +
          '<div class="brief-preview__service-steps">' +
            '<span class="brief-preview__service-step">1</span>' +
            '<span class="brief-preview__service-step">2</span>' +
            '<span class="brief-preview__service-step">3</span>' +
            '<span class="brief-preview__service-cta">Записаться</span>' +
          '</div>' +
        '</div>'
      );
    },
    corporate: function () {
      var pages = ['Услуги', 'Команда', 'Кейсы', 'Контакты'];
      return (
        '<div class="brief-preview__sitemap" data-zone="structure">' +
          '<span class="brief-preview__sitemap-root">Главная</span>' +
          '<div class="brief-preview__sitemap-branches">' +
            pages.map(function (p) { return '<span class="brief-preview__sitemap-node">' + p + '</span>'; }).join('') +
          '</div>' +
        '</div>'
      );
    },
    redesign: function () {
      return (
        '<div class="brief-preview__redesign">' +
          '<div class="brief-preview__redesign-cols">' +
            '<div class="brief-preview__redesign-col brief-preview__redesign-col--before">' +
              '<span class="brief-preview__redesign-tag">ДО</span>' +
              '<span class="ui-bar ui-bar--faint" style="width:85%"></span>' +
              '<span class="ui-bar ui-bar--faint" style="width:55%"></span>' +
              '<span class="ui-bar ui-bar--faint" style="width:68%"></span>' +
            '</div>' +
            '<div class="brief-preview__redesign-col brief-preview__redesign-col--after">' +
              '<span class="brief-preview__redesign-tag">СТАЛО</span>' +
              '<span class="ui-bar ui-bar--accent" style="width:92%"></span>' +
              '<span class="ui-bar ui-bar--light" style="width:78%"></span>' +
              '<span class="ui-bar ui-bar--light" style="width:85%"></span>' +
            '</div>' +
          '</div>' +
          '<div class="brief-preview__redesign-tags">' +
            '<span>Структура</span><span>Скорость</span><span>Конверсия</span>' +
          '</div>' +
        '</div>'
      );
    },
    'tilda-upgrade': function () {
      var fixes = [
        ['Zero Block', 'исправлено'],
        ['Адаптив', 'исправлено'],
        ['Формы', 'подключено'],
        ['Анимация', 'улучшено']
      ];
      return (
        '<div class="brief-preview__tilda">' +
          fixes.map(function (f) {
            return '<div class="brief-preview__tilda-row"><span class="brief-preview__tilda-dot"></span><span class="brief-preview__tilda-name">' + f[0] + '</span><span class="brief-preview__tilda-status">' + f[1] + '</span></div>';
          }).join('') +
        '</div>'
      );
    }
  };

  // Wires the CONTENT step to the format preview: a handful of tagged
  // zones (text/photo/structure) switch from a dashed "pending" look to
  // a filled one once that material is confirmed — without the preview
  // needing to know which format it is. Only 3 of the 7 content options
  // map to an actual visual zone; the rest (logo, examples, "нужна
  // помощь") have no independent zone to represent and stay out of this.
  function applyContentZones(root, contentAnswers) {
    if (!root) return;
    var list = Array.isArray(contentAnswers) ? contentAnswers : [];
    var has = function (label) { return list.indexOf(label) !== -1; };
    var filled = { text: has('Тексты'), photo: has('Фото'), structure: has('Структура') };
    Array.prototype.slice.call(root.querySelectorAll('[data-zone]')).forEach(function (el) {
      el.classList.toggle('is-filled', !!filled[el.getAttribute('data-zone')]);
    });
  }

  var SUBMIT_URL = 'https://mkazpfcbtktznyuqjaqq.supabase.co/functions/v1/submit-brief';

  var STAGE_MAP = {
    'Есть только идея': 'идея',
    'Есть материалы': 'материалы',
    'Есть старый сайт': 'старый сайт',
    'Нужно всё с нуля': 'с нуля'
  };

  var GOAL_MAP = {
    'Получать заявки': 'заявки',
    'Упаковать бизнес': 'доверие',
    'Показать услуги': 'каталог',
    'Продавать товары': 'продажи',
    'Обновить старый сайт': 'обновление',
    'Подготовить к рекламе': 'реклама'
  };

  var MATERIAL_LABELS = ['Структура', 'Тексты', 'Фото', 'Логотип', 'Примеры сайтов'];

  var TIMING_MAP = {
    'Как можно скорее': 'срочно',
    'За 1–2 недели': '1–2 недели',
    'В течение месяца': 'месяц',
    'Пока выбираю подрядчика': 'планирование'
  };

  var CHANNELS = ['Telegram', 'WhatsApp', 'MAX', 'Звонок', 'Email'];

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function initBrief() {
    var section = document.querySelector('[data-brief]');
    if (!section) return;

    var quizEl = section.querySelector('[data-brief-quiz]');
    var mockEl = section.querySelector('[data-brief-mock]');
    var mockBody = section.querySelector('[data-brief-mock-body]');
    var mockScan = section.querySelector('[data-brief-scan]');
    var mockUrl = section.querySelector('[data-brief-url]');
    var mockStatus = section.querySelector('[data-brief-mock-status]');
    var mockProgressFill = section.querySelector('[data-brief-mock-progress]');
    if (!quizEl || !mockEl || !mockBody) return;

    var quizCard = section.querySelector('[data-brief-quiz-card]');
    var quizContent = section.querySelector('[data-brief-quiz-content]');
    var progressLabel = section.querySelector('[data-brief-progress-label]');
    var progressFill = section.querySelector('[data-brief-progress-fill]');
    var backBtn = section.querySelector('[data-brief-back]');
    var nextBtn = section.querySelector('[data-brief-next]');
    var hintEl = section.querySelector('[data-brief-hint]');
    var placeholderEl = section.querySelector('[data-brief-placeholder]');
    var honeypotEl = document.querySelector('[data-brief-honeypot]');

    var reduceMotion = window.LwsUtil.reduceMotion();
    var EXIT_MS = 150;
    var swapTimer = null;

    var currentStep = 0;
    var answers = { format: null, stage: null, goal: null, content: null, timing: null, channel: null, name: '', contact: '', comment: '', consent: false };
    var submitted = false;
    var isSubmitting = false;
    var moduleEls = {};
    // One key per brief-filling attempt: created here for the initial
    // load, replaced in restart() for the next attempt. Reused as-is
    // across retries/double-clicks of the SAME attempt so a genuine
    // network-error retry never counts as a second submission.
    var idempotencyKey = crypto.randomUUID();
    var briefId = null;

    function isStepAnswered(step) {
      if (step.isContact) return answers.name.trim().length > 0 && answers.contact.trim().length > 0;
      if (step.multiSelect) return Array.isArray(answers[step.id]) && answers[step.id].length > 0;
      return !!answers[step.id];
    }

    function buildOptionsStep(step) {
      var current = step.multiSelect ? (answers[step.id] || []) : null;
      var optsHtml = step.options.map(function (opt) {
        var active = step.multiSelect ? current.indexOf(opt) !== -1 : answers[step.id] === opt;
        return (
          '<button type="button" class="brief-option' + (step.multiSelect ? ' brief-option--multi' : '') + (active ? ' is-active' : '') + '" data-brief-option="' + esc(opt) + '">' +
            '<span class="brief-option__dot"></span>' + opt +
          '</button>'
        );
      }).join('');
      return (
        '<div class="brief-rise brief-rise--1 brief__quiz-label">' + step.label + '</div>' +
        '<h3 class="brief-rise brief-rise--2 brief__quiz-question">' + step.question + '</h3>' +
        '<div class="brief-rise brief-rise--3 brief__quiz-options">' + optsHtml + '</div>'
      );
    }

    function buildContactStep(step) {
      return (
        '<div class="brief-rise brief-rise--1 brief__quiz-label">' + step.label + '</div>' +
        '<h3 class="brief-rise brief-rise--2 brief__quiz-question">' + step.question + '</h3>' +
        '<div class="brief-rise brief-rise--3 brief__fields">' +
          '<div class="brief__field">' +
            '<span class="brief__field-label">Имя</span>' +
            '<input type="text" class="field-input brief__input" data-brief-field="name" placeholder="Как к вам обращаться" value="' + esc(answers.name) + '">' +
            '<span class="field-error brief__field-error" data-brief-error="name">Укажите имя</span>' +
          '</div>' +
          '<div class="brief__field">' +
            '<span class="brief__field-label">Телефон или ник <span>в мессенджере</span></span>' +
            '<input type="text" class="field-input brief__input" data-brief-field="contact" placeholder="+7 999 000-00-00 или @username" value="' + esc(answers.contact) + '">' +
            '<span class="field-error brief__field-error" data-brief-error="contact">Укажите телефон или ник</span>' +
          '</div>' +
          '<div class="brief__field">' +
            '<span class="brief__field-label">Комментарий <span>(необязательно)</span></span>' +
            '<textarea class="field-input brief__textarea" data-brief-field="comment" placeholder="Коротко о задаче, если хочется">' + esc(answers.comment) + '</textarea>' +
          '</div>' +
          '<div class="brief__field brief__field--consent">' +
            '<label class="brief__consent">' +
              '<input type="checkbox" class="brief__consent-input" data-brief-consent' + (answers.consent ? ' checked' : '') + '>' +
              '<span>Я соглашаюсь на <a href="consent.html" target="_blank" rel="noopener">обработку персональных данных</a> и подтверждаю, что ознакомился с <a href="privacy.html" target="_blank" rel="noopener">Политикой конфиденциальности</a>.</span>' +
            '</label>' +
            '<span class="field-error brief__field-error" data-brief-error="consent">Подтвердите согласие на обработку персональных данных</span>' +
          '</div>' +
        '</div>' +
        '<span class="field-error brief__field-error" data-brief-submit-error></span>'
      );
    }

    function updateNav() {
      var step = QUIZ_STEPS[currentStep];
      if (backBtn) backBtn.disabled = currentStep === 0;
      if (nextBtn) {
        // The contact step stays clickable even when empty — submitting
        // with missing fields is handled by trySubmit()'s soft highlight
        // instead of a disabled button (a disabled submit can't explain
        // itself; a click that gently highlights what's missing can).
        nextBtn.disabled = step.isContact ? false : !isStepAnswered(step);
        nextBtn.textContent = currentStep === QUIZ_STEPS.length - 1 ? 'Отправить бриф' : 'Далее →';
      }
      if (hintEl) {
        if (step.isContact) {
          hintEl.innerHTML = '<span class="brief__quiz-hint-dot"></span>Свяжемся в течение 15 минут в рабочее время.';
          hintEl.classList.add('is-visible');
        } else {
          hintEl.classList.remove('is-visible');
        }
      }
    }

    function updateProgress() {
      var n = currentStep + 1;
      var pct = (n / QUIZ_STEPS.length * 100).toFixed(1) + '%';
      if (progressLabel) progressLabel.textContent = (n < 10 ? '0' : '') + n + ' / 0' + QUIZ_STEPS.length;
      if (progressFill) progressFill.style.width = pct;
      if (mockProgressFill) mockProgressFill.style.width = pct;
    }

    function bindContactInputs() {
      var inputs = Array.prototype.slice.call(quizContent.querySelectorAll('[data-brief-field]'));
      inputs.forEach(function (input) {
        input.addEventListener('input', function () {
          var key = input.getAttribute('data-brief-field');
          answers[key] = input.value;
          input.classList.remove('is-invalid');
          var err = quizContent.querySelector('[data-brief-error="' + key + '"]');
          if (err) err.classList.remove('is-visible');
          updateNav();
        });
      });
    }

    function bindConsentInput() {
      var input = quizContent.querySelector('[data-brief-consent]');
      if (!input) return;
      input.addEventListener('change', function () {
        answers.consent = input.checked;
        if (input.checked) {
          input.classList.remove('is-invalid');
          var err = quizContent.querySelector('[data-brief-error="consent"]');
          if (err) err.classList.remove('is-visible');
        }
      });
    }

    function bindOptionButtons(step) {
      var buttons = Array.prototype.slice.call(quizContent.querySelectorAll('[data-brief-option]'));
      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var value = btn.getAttribute('data-brief-option');

          if (step.multiSelect) {
            var current = (answers[step.id] || []).slice();
            if (value === 'Ничего нет') {
              current = current.indexOf('Ничего нет') !== -1 ? [] : ['Ничего нет'];
            } else {
              current = current.filter(function (v) { return v !== 'Ничего нет'; });
              var pos = current.indexOf(value);
              if (pos !== -1) current.splice(pos, 1); else current.push(value);
            }
            answers[step.id] = current;
            buttons.forEach(function (b) {
              b.classList.toggle('is-active', current.indexOf(b.getAttribute('data-brief-option')) !== -1);
            });
          } else {
            answers[step.id] = value;
            buttons.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
          }

          updateNav();
          renderMock();
        });
      });
    }

    function renderStep(skipExit) {
      var step = QUIZ_STEPS[currentStep];

      function paint() {
        quizContent.innerHTML = step.isContact ? buildContactStep(step) : buildOptionsStep(step);
        if (step.isContact) { bindContactInputs(); bindConsentInput(); } else bindOptionButtons(step);
        updateNav();
        updateProgress();
        void quizCard.offsetWidth;
        requestAnimationFrame(function () { quizCard.classList.add('is-in'); });
      }

      if (reduceMotion || skipExit) { paint(); return; }
      window.clearTimeout(swapTimer);
      quizCard.classList.remove('is-in');
      swapTimer = window.setTimeout(paint, EXIT_MS);
    }

    function ensureModule(id, className) {
      if (moduleEls[id]) return moduleEls[id];
      var el = document.createElement('div');
      el.className = 'brief-mod ' + className;
      mockBody.appendChild(el);
      moduleEls[id] = el;
      requestAnimationFrame(function () { el.classList.add('is-in'); });
      return el;
    }

    function renderMock() {
      if (submitted) return;

      if (placeholderEl) placeholderEl.classList.toggle('is-hidden', !!answers.format);
      if (mockStatus) mockStatus.textContent = answers.format ? 'СОБИРАЕМ' : 'ПУСТО';

      if (answers.format) {
        var info = FORMAT_MAP[answers.format] || { headline: answers.format, sub: '', url: 'project.lutstudio.ru' };
        ensureModule('format', 'brief-mod--format').innerHTML =
          '<span class="brief-mod__label">ФОРМАТ ПРОЕКТА</span><h3 class="brief-mod__h1">' + info.headline + '</h3>' +
          (info.sub ? '<p class="brief-mod__sub">' + info.sub + '</p>' : '');
        if (mockUrl) mockUrl.textContent = info.url;

        var buildPreview = PREVIEW_BUILDERS[info.preview];
        if (buildPreview) {
          ensureModule('preview', 'brief-mod--preview').innerHTML = buildPreview();
        }
      }

      if (answers.stage) {
        ensureModule('stage', 'brief-mod--stage').innerHTML =
          '<span class="brief-mod__label">СТАРТОВАЯ ТОЧКА</span><span class="brief-mod__chip"><span class="brief-mod__chip-dot"></span>' + (STAGE_MAP[answers.stage] || answers.stage) + '</span>';
      }

      if (answers.goal) {
        ensureModule('goal', 'brief-mod--goal').innerHTML =
          '<span class="brief-mod__label">ЦЕЛЬ САЙТА</span><span class="brief-mod__chip"><span class="brief-mod__chip-dot"></span>' + (GOAL_MAP[answers.goal] || answers.goal) + '</span>';
      }

      if (answers.content) {
        var contentAnswers = answers.content;
        var hasNothing = contentAnswers.indexOf('Ничего нет') !== -1;
        var wantsHelp = contentAnswers.indexOf('Нужна помощь с контентом') !== -1;
        var el = ensureModule('content', 'brief-mod--content');
        if (hasNothing) {
          el.innerHTML = '<span class="brief-mod__label">МАТЕРИАЛЫ</span><span class="brief-mod__chip"><span class="brief-mod__chip-dot"></span>Контент соберём с нуля</span>';
        } else {
          el.innerHTML = '<span class="brief-mod__label">МАТЕРИАЛЫ</span><div class="brief-mod__row">' +
            MATERIAL_LABELS.map(function (l) { return '<span class="brief-mod__pill' + (contentAnswers.indexOf(l) !== -1 ? ' is-done' : '') + '">' + l + '</span>'; }).join('') +
            (wantsHelp ? '<span class="brief-mod__pill brief-mod__pill--accent">нужна помощь</span>' : '') +
            '</div>';
        }
      }

      if (answers.timing) {
        ensureModule('timing', 'brief-mod--timing').innerHTML =
          '<span class="brief-mod__label">ЗАПУСК</span><span class="brief-mod__chip"><span class="brief-mod__chip-dot"></span>' + (TIMING_MAP[answers.timing] || answers.timing) + '</span>';
      }

      if (answers.channel) {
        ensureModule('channel', 'brief-mod--channel').innerHTML =
          '<span class="brief-mod__label">СВЯЗЬ</span><div class="brief-mod__row">' +
          CHANNELS.map(function (c) { return '<span class="brief-mod__channel' + (c === answers.channel ? ' is-active' : '') + '">' + c + '</span>'; }).join('') +
          '</div>';
      }

      // Re-applied every render (not just when format/preview is first
      // built) so answering CONTENT after the fact still updates the
      // already-visible preview in place.
      if (moduleEls.preview) applyContentZones(moduleEls.preview, answers.content);

      if (!reduceMotion && mockScan) {
        mockScan.classList.remove('is-scanning');
        void mockScan.offsetWidth;
        mockScan.classList.add('is-scanning');
      }
    }

    function renderSuccessLeft() {
      quizEl.innerHTML =
        '<div class="brief__success" data-brief-success>' +
          '<span class="status-pill"><span class="status-pill__dot"></span>БРИФ ГОТОВ</span>' +
          '<span class="check-dot">✓</span>' +
          '<h3 class="brief__success-title">Спасибо, бриф собран.</h3>' +
          '<p class="brief__success-text">Скоро свяжемся с вами и подскажем следующий шаг.</p>' +
          '<div class="brief__success-id"><span>НОМЕР БРИФА</span><b>' + briefId + '</b></div>' +
          '<button type="button" class="brief__restart-btn" data-brief-restart>Изменить ответы</button>' +
        '</div>';
      var successEl = quizEl.querySelector('[data-brief-success]');
      var restartBtn = quizEl.querySelector('[data-brief-restart]');
      if (restartBtn) restartBtn.addEventListener('click', restart);
      if (reduceMotion) {
        successEl.classList.add('is-visible');
      } else {
        requestAnimationFrame(function () { successEl.classList.add('is-visible'); });
      }
    }

    function summaryRow(label, value) {
      if (!value) return '';
      return '<div class="brief-mock-final__summary-item"><span>' + label + '</span><b>' + value + '</b></div>';
    }

    function renderMockFinal() {
      var contentValue = '—';
      if (answers.content) {
        contentValue = answers.content.indexOf('Ничего нет') !== -1 ? 'с нуля' : answers.content.filter(function (v) { return v !== 'Нужна помощь с контентом'; }).join(', ') || '—';
      }

      var summary =
        summaryRow('Формат', answers.format) +
        summaryRow('Стадия', answers.stage ? (STAGE_MAP[answers.stage] || answers.stage) : '') +
        summaryRow('Цель', answers.goal ? (GOAL_MAP[answers.goal] || answers.goal) : '') +
        summaryRow('Материалы', contentValue) +
        summaryRow('Срок', answers.timing ? (TIMING_MAP[answers.timing] || answers.timing) : '') +
        summaryRow('Связь', answers.channel);

      var final = document.createElement('div');
      final.className = 'brief-mock-final';
      final.innerHTML =
        '<span class="status-pill"><span class="status-pill__dot"></span>БРИФ ГОТОВ</span>' +
        '<h3 class="brief-mock-final__title">Проект собран</h3>' +
        '<p class="brief-mock-final__text">Следующий шаг — обсудить детали.</p>' +
        '<div class="brief-mock-final__summary">' + summary + '</div>' +
        '<div class="brief-mock-final__tech"><span>СТАТУС: <b>ОТПРАВЛЕНО</b></span><span>НОМЕР БРИФА: <b>' + briefId + '</b></span></div>';
      mockBody.innerHTML = '';
      mockBody.appendChild(final);
      if (mockStatus) mockStatus.textContent = 'ОТПРАВЛЕНО';
      if (mockProgressFill) mockProgressFill.style.width = '100%';
      if (reduceMotion) {
        final.classList.add('is-visible');
      } else {
        requestAnimationFrame(function () { final.classList.add('is-visible'); });
      }
    }

    function trySubmit() {
      var nameEl = quizContent.querySelector('[data-brief-field="name"]');
      var contactEl = quizContent.querySelector('[data-brief-field="contact"]');
      var nameErr = quizContent.querySelector('[data-brief-error="name"]');
      var contactErr = quizContent.querySelector('[data-brief-error="contact"]');
      var consentEl = quizContent.querySelector('[data-brief-consent]');
      var consentErr = quizContent.querySelector('[data-brief-error="consent"]');
      var submitErrorEl = quizContent.querySelector('[data-brief-submit-error]');
      var validName = answers.name.trim().length > 0;
      var validContact = answers.contact.trim().length > 0;
      var validConsent = !!answers.consent;
      if (!validName || !validContact || !validConsent) {
        if (!validName) {
          if (nameEl) nameEl.classList.add('is-invalid');
          if (nameErr) nameErr.classList.add('is-visible');
        }
        if (!validContact) {
          if (contactEl) contactEl.classList.add('is-invalid');
          if (contactErr) contactErr.classList.add('is-visible');
        }
        if (!validConsent) {
          if (consentEl) consentEl.classList.add('is-invalid');
          if (consentErr) consentErr.classList.add('is-visible');
        }
        return;
      }

      if (isSubmitting) return;
      if (submitErrorEl) submitErrorEl.classList.remove('is-visible');

      var payload = {
        name: answers.name.trim(),
        contact: answers.contact.trim(),
        comment: answers.comment ? answers.comment.trim() : '',
        answers: {
          format: answers.format,
          stage: answers.stage,
          goal: answers.goal,
          content: answers.content || [],
          timing: answers.timing,
          channel: answers.channel
        },
        pageUrl: window.location.href,
        idempotencyKey: idempotencyKey,
        honeypot: honeypotEl ? honeypotEl.value : '',
        utm: window.LwsUtil.getUtmParams()
      };

      isSubmitting = true;
      if (nextBtn) { nextBtn.disabled = true; nextBtn.textContent = 'Отправляем...'; }

      fetch(SUBMIT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            return { status: res.status, data: data };
          });
        })
        .then(function (result) {
          if (result.data && result.data.ok) {
            isSubmitting = false;
            submitted = true;
            briefId = result.data.submissionId;
            renderSuccessLeft();
            renderMockFinal();
            return;
          }
          isSubmitting = false;
          if (nextBtn) { nextBtn.disabled = false; nextBtn.textContent = 'Отправить бриф'; }
          var message = result.status === 429
            ? 'Слишком много попыток. Подождите немного и попробуйте снова.'
            : 'Не удалось отправить бриф. Попробуйте ещё раз.';
          if (submitErrorEl) { submitErrorEl.textContent = message; submitErrorEl.classList.add('is-visible'); }
        })
        .catch(function () {
          isSubmitting = false;
          if (nextBtn) { nextBtn.disabled = false; nextBtn.textContent = 'Отправить бриф'; }
          if (submitErrorEl) {
            submitErrorEl.textContent = 'Не удалось отправить бриф. Попробуйте ещё раз.';
            submitErrorEl.classList.add('is-visible');
          }
        });
    }

    function restart() {
      currentStep = 0;
      answers = { format: null, stage: null, goal: null, content: null, timing: null, channel: null, name: '', contact: '', comment: '', consent: false };
      submitted = false;
      isSubmitting = false;
      moduleEls = {};
      briefId = null;
      // A genuinely new brief attempt — next submit must not be treated
      // as a replay of the previous (already-accepted) one.
      idempotencyKey = crypto.randomUUID();

      quizEl.innerHTML =
        '<div class="brief__quiz-progress">' +
          '<span class="brief__quiz-progress-label" data-brief-progress-label>01 / 07</span>' +
          '<div class="brief__quiz-progress-track"><span class="brief__quiz-progress-fill" data-brief-progress-fill></span></div>' +
        '</div>' +
        '<div class="brief__quiz-card" data-brief-quiz-card><div data-brief-quiz-content></div></div>' +
        '<div class="brief__quiz-nav">' +
          '<button type="button" class="brief__nav-btn brief__nav-btn--back" data-brief-back>← Назад</button>' +
          '<button type="button" class="brief__nav-btn brief__nav-btn--next" data-brief-next disabled>Далее →</button>' +
        '</div>' +
        '<p class="brief__quiz-hint" data-brief-hint></p>';

      quizCard = quizEl.querySelector('[data-brief-quiz-card]');
      quizContent = quizEl.querySelector('[data-brief-quiz-content]');
      progressLabel = quizEl.querySelector('[data-brief-progress-label]');
      progressFill = quizEl.querySelector('[data-brief-progress-fill]');
      backBtn = quizEl.querySelector('[data-brief-back]');
      nextBtn = quizEl.querySelector('[data-brief-next]');
      hintEl = quizEl.querySelector('[data-brief-hint]');
      backBtn.addEventListener('click', goBack);
      nextBtn.addEventListener('click', goNext);

      mockBody.innerHTML = '<div class="brief__mock-placeholder" data-brief-placeholder><span class="brief__mock-placeholder-dot"></span>Проект ещё не собран</div>';
      placeholderEl = mockBody.querySelector('[data-brief-placeholder]');
      if (mockUrl) mockUrl.textContent = 'project.lutstudio.ru';
      if (mockStatus) mockStatus.textContent = 'ПУСТО';
      if (mockProgressFill) mockProgressFill.style.width = (100 / QUIZ_STEPS.length).toFixed(1) + '%';

      renderStep(true);
    }

    function goNext() {
      var step = QUIZ_STEPS[currentStep];
      if (currentStep === QUIZ_STEPS.length - 1) { trySubmit(); return; }
      if (!isStepAnswered(step)) return;
      currentStep++;
      renderStep();
    }

    function goBack() {
      if (currentStep === 0) return;
      currentStep--;
      renderStep();
    }

    if (backBtn) backBtn.addEventListener('click', goBack);
    if (nextBtn) nextBtn.addEventListener('click', goNext);

    renderStep(true);
  }

  document.addEventListener('DOMContentLoaded', initBrief);
})();
