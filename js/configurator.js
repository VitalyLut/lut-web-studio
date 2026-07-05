(function () {
  var FORMATS = [
    {
      id: 'landing', title: 'Лендинг', label: 'LANDING PAGE', price: 'от 50 000 ₽', url: 'landing.lutstudio.ru',
      headline: 'Лендинг, который ведёт к заявке',
      tagline: 'Структура, оффер, доверие и CTA в одной понятной странице.',
      description: 'Одностраничный сайт для услуги, продукта, эксперта или рекламной кампании. Быстро объясняет ценность и ведёт человека к заявке.',
      ctaLabel: 'Оставить заявку',
      modules: ['Первый экран', 'Преимущества', 'Услуга / продукт', 'Кейсы', 'Отзывы', 'FAQ', 'Форма заявки'],
      visualType: 'landing', ctaText: 'Обсудить лендинг'
    },
    {
      id: 'corporate', title: 'Корпоративный сайт', label: 'COMPANY WEBSITE', price: 'от 90 000 ₽', url: 'company.lutstudio.ru',
      headline: 'Корпоративный сайт для доверия',
      tagline: 'Главная, услуги, команда, кейсы и контакты в одной системе.',
      description: 'Сайт для компании, клиники, студии, производства или сервиса. Помогает показать уровень бизнеса, направления, команду, кейсы и доверие.',
      ctaLabel: 'Обсудить сайт',
      modules: ['Главная', 'Услуги', 'О компании', 'Команда', 'Кейсы', 'FAQ', 'Контакты'],
      visualType: 'corporate', ctaText: 'Обсудить сайт'
    },
    {
      id: 'ecommerce', title: 'Интернет-магазин', label: 'E-COMMERCE', price: 'от 120 000 ₽', url: 'shop.lutstudio.ru',
      headline: 'Интернет-магазин с каталогом',
      tagline: 'Категории, товары, корзина и путь к покупке.',
      description: 'Сайт для продажи товаров, каталогов и небольших e-commerce-проектов. Продумываем категории, карточки товаров, корзину, оплату и путь к покупке.',
      ctaLabel: 'Обсудить магазин',
      modules: ['Каталог', 'Категории', 'Карточки товаров', 'Фильтры', 'Корзина', 'Оплата', 'Оформление заказа'],
      visualType: 'ecommerce', ctaText: 'Обсудить магазин'
    },
    {
      id: 'service', title: 'Сайт услуг', label: 'SERVICE WEBSITE', price: 'от 70 000 ₽', url: 'service.lutstudio.ru',
      headline: 'Сайт услуг с записью',
      tagline: 'Услуги, цены, этапы и быстрый путь к обращению.',
      description: 'Формат для локального бизнеса, специалистов и сервисных компаний. Помогает понятно показать услуги, цены, этапы работы и привести клиента к записи или заявке.',
      ctaLabel: 'Записаться',
      modules: ['Услуги', 'Цены', 'Этапы', 'Специалисты', 'Отзывы', 'Запись', 'Мессенджеры'],
      visualType: 'service', ctaText: 'Обсудить сайт услуг'
    },
    {
      id: 'redesign', title: 'Редизайн', label: 'REDESIGN', price: 'от 45 000 ₽', url: 'redesign.lutstudio.ru',
      headline: 'Редизайн без потери смысла',
      tagline: 'Усиливаем структуру, визуал, адаптив и путь пользователя.',
      description: 'Если сайт уже есть, но выглядит устаревшим, плохо объясняет ценность или не даёт заявок — усиливаем структуру, визуал, адаптив и путь пользователя.',
      ctaLabel: 'Улучшить сайт',
      modules: ['Аудит', 'Новая структура', 'Новый визуал', 'Адаптив', 'CTA', 'Формы', 'Запуск'],
      visualType: 'redesign', ctaText: 'Обсудить редизайн'
    },
    {
      id: 'tilda-upgrade', title: 'Доработки на Tilda', label: 'TILDA UPGRADE', price: 'от 15 000 ₽', url: 'tilda.lutstudio.ru',
      headline: 'Доработки Tilda без хаоса',
      tagline: 'Zero Block, адаптив, формы, анимации и кастомный код.',
      description: 'Улучшаем уже существующий сайт на Tilda: Zero Block, адаптив, формы, анимации, визуальные правки, кастомный код и технические настройки.',
      ctaLabel: 'Обсудить доработки',
      modules: ['Zero Block', 'Адаптив', 'Анимации', 'Формы', 'Кастомный код', 'SEO-база', 'Исправления'],
      visualType: 'tilda', ctaText: 'Обсудить доработки'
    }
  ];

  var SERVICE_ICONS = [
    { label: 'Ремонт', price: 'от 2 500 ₽', svg: '<path d="M13.5 6.5a3 3 0 10-4.24 4.24L4 16l1.5 1.5 5.26-5.26A3 3 0 1013.5 6.5z"/>' },
    { label: 'Юрист', price: 'от 4 000 ₽', svg: '<path d="M10 3v14M4 6h12M4 6l-2 5a2 2 0 004 0L4 6zM16 6l-2 5a2 2 0 004 0l-2-5z"/>' },
    { label: 'Beauty', price: 'от 1 800 ₽', svg: '<circle cx="6" cy="15" r="2"/><circle cx="14" cy="15" r="2"/><path d="M7.5 13.5L16 4M12.5 13.5L4 4"/>' },
    { label: 'Клиника', price: 'от 3 200 ₽', svg: '<path d="M10 3v14M3 10h14"/>' },
    { label: 'Дом', price: 'от 5 000 ₽', svg: '<path d="M3 10l7-6 7 6M5 9v7h10v-7"/>' },
    { label: 'Обучение', price: 'от 2 000 ₽', svg: '<path d="M10 5c-1.5-1-4-1.5-6-1v11c2-.5 4.5 0 6 1 1.5-1 4-1.5 6-1V4c-2-.5-4.5 0-6 1z"/>' }
  ];

  function iconSvg(inner) {
    return '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
  }

  function head(format) {
    return (
      '<div class="cfg-preview__head cfg-rise cfg-rise--1">' +
        '<h3 class="cfg-preview__h1">' + format.headline + '</h3>' +
        '<p class="cfg-preview__sub">' + format.tagline + '</p>' +
        '<div class="cfg-preview__actions">' +
          '<button type="button" class="cfg-preview__cta" data-open-project-modal data-source="configurator" ' +
            'data-project-type="' + format.id + '" data-source-label="' + format.ctaLabel + '">' + format.ctaLabel + '</button>' +
          '<span class="cfg-preview__price">' + format.price + '</span>' +
        '</div>' +
      '</div>'
    );
  }

  var LANDING_ROUTE = ['Экран', 'Оффер', 'Доверие', 'Кейсы', 'FAQ', 'Заявка'];

  function buildLanding() {
    var n = LANDING_ROUTE.length;
    var dots = LANDING_ROUTE.map(function (label, i) {
      var pct = 4 + (i / (n - 1)) * 92;
      var pending = i >= 4;
      return '<span class="cfg-landing2__dot' + (pending ? ' cfg-landing2__dot--pending' : '') + '" style="left:' + pct.toFixed(1) + '%"></span>';
    }).join('');
    var labels = LANDING_ROUTE.map(function (label) { return '<span>' + label + '</span>'; }).join('');

    return (
      '<div class="cfg-landing2">' +
        '<div class="cfg-landing2__route cfg-rise cfg-rise--2">' + dots + '</div>' +
        '<div class="cfg-landing2__route-labels cfg-rise cfg-rise--2">' + labels + '</div>' +
        '<div class="cfg-landing2__row cfg-rise cfg-rise--3">' +
          '<div class="cfg-mini-card cfg-landing2__step">' +
            '<span class="cfg-label">Преимущества</span>' +
            '<div class="cfg-landing2__adv-row"><span class="cfg-landing2__adv-dot"></span><span class="ui-bar ui-bar--faint" style="width:76%"></span></div>' +
            '<div class="cfg-landing2__adv-row"><span class="cfg-landing2__adv-dot"></span><span class="ui-bar ui-bar--faint" style="width:58%"></span></div>' +
            '<div class="cfg-landing2__adv-row"><span class="cfg-landing2__adv-dot"></span><span class="ui-bar ui-bar--faint" style="width:66%"></span></div>' +
          '</div>' +
          '<div class="cfg-mini-card cfg-landing2__step">' +
            '<span class="cfg-label">Кейсы / отзывы</span>' +
            '<div class="cfg-landing2__case"><span class="cfg-avatar" style="width:18px;height:18px"></span><span class="cfg-stars">★★★★★</span></div>' +
            '<div class="cfg-landing2__case"><span class="cfg-avatar" style="width:18px;height:18px"></span><span class="cfg-stars">★★★★★</span></div>' +
          '</div>' +
          '<div class="cfg-mini-card cfg-landing2__step">' +
            '<span class="cfg-label">FAQ</span>' +
            '<span class="cfg-landing2__faq-row"></span>' +
            '<span class="cfg-landing2__faq-row" style="width:70%"></span>' +
          '</div>' +
          '<div class="cfg-mini-card cfg-landing2__step">' +
            '<span class="cfg-label">Форма заявки</span>' +
            '<span class="ui-bar ui-bar--faint" style="height:10px"></span>' +
            '<span class="ui-bar ui-bar--faint" style="height:10px"></span>' +
            '<span class="cfg-btn cfg-btn--solid cfg-btn--block cfg-btn--sm cfg-landing2__submit">Отправить</span>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function buildCorporate() {
    var navItems = ['Главная', 'Услуги', 'О компании', 'Команда', 'Кейсы', 'Контакты'];
    var nav = navItems.map(function (n) { return '<span>' + n + '</span>'; }).join('');
    return (
      '<div class="cfg-corp2">' +
        '<div class="cfg-corp2__nav cfg-rise cfg-rise--2">' + nav + '</div>' +
        '<div class="cfg-corp2__map cfg-rise cfg-rise--2">' +
          '<span class="cfg-corp2__node cfg-corp2__node--main">Главная</span>' +
          '<span class="cfg-corp2__link"></span>' +
          '<div class="cfg-corp2__branch">' +
            '<span class="cfg-corp2__node">Услуги</span>' +
            '<span class="cfg-corp2__node">О компании</span>' +
            '<span class="cfg-corp2__node">Команда</span>' +
            '<span class="cfg-corp2__node">Кейсы</span>' +
          '</div>' +
        '</div>' +
        '<div class="cfg-corp2__row cfg-rise cfg-rise--3">' +
          '<div class="cfg-mini-card cfg-corp2__block">' +
            '<span class="cfg-label">Команда</span>' +
            '<div class="cfg-corp2__avatars"><span class="cfg-avatar"></span><span class="cfg-avatar"></span><span class="cfg-avatar"></span></div>' +
          '</div>' +
          '<div class="cfg-mini-card cfg-corp2__block">' +
            '<span class="cfg-label">Кейсы</span>' +
            '<div class="cfg-corp2__cases"><span class="cfg-corp2__case"></span><span class="cfg-corp2__case"></span></div>' +
          '</div>' +
          '<div class="cfg-mini-card cfg-corp2__block">' +
            '<span class="cfg-label">Контакты</span>' +
            '<div class="cfg-corp2__status"><span class="ui-bar ui-bar--faint" style="width:60%;height:8px"></span><span class="check-dot">✓</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="cfg-corp2__trust cfg-rise cfg-rise--4">' +
          '<span><strong>8 лет</strong> опыта</span>' +
          '<span><strong>120+</strong> проектов</span>' +
          '<span>Договор и НДА</span>' +
        '</div>' +
      '</div>'
    );
  }

  var SHOP_ICONS = {
    fav: '<path d="M10 17s-6-3.7-6-8.3C4 6 6 4 8.3 4 9.5 4 10 5 10 5s.5-1 1.7-1C14 4 16 6 16 8.7 16 13.3 10 17 10 17z"/>',
    filter: '<path d="M3 5.5h14M3 10h14M3 14.5h14"/><circle cx="7" cy="5.5" r="1.5" fill="currentColor" stroke="none"/><circle cx="13" cy="10" r="1.5" fill="currentColor" stroke="none"/><circle cx="8" cy="14.5" r="1.5" fill="currentColor" stroke="none"/>',
    chevron: '<path d="M6 8l4 4 4-4"/>',
    delivery: '<path d="M10 3l7 3.5v7L10 17l-7-3.5v-7L10 3z"/><path d="M3 6.5l7 3.5 7-3.5M10 10v7"/>',
    card: '<rect x="3" y="5.5" width="14" height="9" rx="1.5"/><path d="M3 8.5h14"/>',
    split: '<circle cx="6.5" cy="6.5" r="2"/><circle cx="13.5" cy="13.5" r="2"/><path d="M15 5L5 15"/>',
    fast: '<path d="M11 3L5 11h4l-1 6 7-9h-4l1-5z"/>'
  };

  function buildEcommerce() {
    var prices = ['2 490 ₽', '1 290 ₽', '3 990 ₽', '990 ₽', '1 590 ₽', '2 190 ₽'];
    var items = prices.map(function (p) {
      return (
        '<div class="cfg-mini-card cfg-shop2__item">' +
          '<span class="cfg-shop2__fav">' + iconSvg(SHOP_ICONS.fav) + '</span>' +
          '<span class="cfg-shop2__thumb"></span>' +
          '<span class="cfg-shop2__item-price">' + p + '</span>' +
          '<span class="cfg-btn cfg-btn--outline cfg-btn--sm cfg-btn--block cfg-shop2__add">В корзину</span>' +
        '</div>'
      );
    }).join('');
    return (
      '<div class="cfg-shop2">' +
        '<div class="cfg-shop2__toolbar cfg-rise cfg-rise--2">' +
          '<span class="cfg-shop2__label">Каталог</span>' +
          '<span class="cfg-shop2__filter">' + iconSvg(SHOP_ICONS.filter) + 'Фильтры</span>' +
          '<span class="cfg-shop2__search"></span>' +
          '<span class="cfg-shop2__sort">По популярности' + iconSvg(SHOP_ICONS.chevron) + '</span>' +
        '</div>' +
        '<div class="cfg-shop2__layout cfg-rise cfg-rise--2">' +
          '<div class="cfg-shop2__grid">' + items + '</div>' +
          '<div class="cfg-mini-card cfg-shop2__cart">' +
            '<div class="cfg-shop2__cart-head">Корзина <span>3</span></div>' +
            '<div class="cfg-shop2__cart-line"><span>Товар 1</span><span>2 490 ₽</span></div>' +
            '<div class="cfg-shop2__cart-line"><span>Товар 2</span><span>1 290 ₽</span></div>' +
            '<div class="cfg-shop2__cart-line"><span>Товар 3</span><span>990 ₽</span></div>' +
            '<div class="cfg-shop2__cart-total"><span>Итого</span><span>4 770 ₽</span></div>' +
            '<span class="cfg-btn cfg-btn--solid cfg-btn--sm cfg-btn--block cfg-shop2__checkout">Оформить заказ</span>' +
            '<div class="cfg-shop2__delivery">' + iconSvg(SHOP_ICONS.delivery) + 'Доставка 1–2 дня</div>' +
            '<div class="cfg-shop2__pay">' +
              '<span class="cfg-shop2__pay-item">' + iconSvg(SHOP_ICONS.card) + '</span>' +
              '<span class="cfg-shop2__pay-item">' + iconSvg(SHOP_ICONS.split) + '</span>' +
              '<span class="cfg-shop2__pay-item">' + iconSvg(SHOP_ICONS.fast) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function buildService() {
    var cards = SERVICE_ICONS.map(function (icon) {
      return (
        '<div class="cfg-mini-card cfg-service2__card">' +
          '<span class="cfg-service2__mark">' + iconSvg(icon.svg) + '</span>' +
          '<span>' +
            '<span class="cfg-service2__card-name">' + icon.label + '</span>' +
            '<span class="cfg-service2__card-price">' + icon.price + '</span>' +
          '</span>' +
        '</div>'
      );
    }).join('');
    return (
      '<div class="cfg-service2">' +
        '<div class="cfg-service2__grid cfg-rise cfg-rise--2">' + cards + '</div>' +
        '<div class="cfg-service2__row cfg-rise cfg-rise--3">' +
          '<div class="cfg-mini-card cfg-service2__block">' +
            '<span class="cfg-label">Этапы работы</span>' +
            '<div class="cfg-service2__steps">' +
              '<div class="cfg-service2__step"><span class="cfg-service2__step-dot">1</span><span class="cfg-service2__step-label">Заявка</span></div>' +
              '<span class="cfg-service2__step-line"></span>' +
              '<div class="cfg-service2__step"><span class="cfg-service2__step-dot">2</span><span class="cfg-service2__step-label">Согласование</span></div>' +
              '<span class="cfg-service2__step-line"></span>' +
              '<div class="cfg-service2__step"><span class="cfg-service2__step-dot">3</span><span class="cfg-service2__step-label">Результат</span></div>' +
            '</div>' +
          '</div>' +
          '<div class="cfg-mini-card cfg-service2__block">' +
            '<span class="cfg-label">Отзывы</span>' +
            '<span class="cfg-stars">★★★★★</span> <span style="font-family:var(--font-mono);font-size:9px;color:var(--color-text-dim-3)">128 отзывов</span>' +
          '</div>' +
        '</div>' +
        '<div class="cfg-service2__form cfg-rise cfg-rise--4">' +
          '<span class="cfg-service2__form-bar"></span>' +
          '<button type="button" class="cfg-btn cfg-btn--solid cfg-btn--sm" data-open-project-modal ' +
            'data-source="configurator" data-project-type="service" data-source-label="Записаться">Записаться →</button>' +
        '</div>' +
      '</div>'
    );
  }

  function buildRedesign() {
    return (
      '<div class="cfg-redesign2">' +
        '<div class="cfg-redesign2__split cfg-rise cfg-rise--2">' +
          '<div class="cfg-redesign2__before">' +
            '<span class="cfg-redesign2__tag">ДО</span>' +
            '<div class="cfg-redesign2__status-row"><span class="cfg-redesign2__warn-dot">!</span><span class="cfg-redesign2__status-text">Слабая структура</span></div>' +
            '<span class="ui-bar" style="width:55%;margin-top:6px"></span>' +
            '<span class="ui-bar" style="width:35%"></span>' +
            '<span class="ui-bar" style="width:45%"></span>' +
            '<span class="cfg-btn cfg-btn--muted cfg-btn--sm cfg-redesign2__cta">Узнать больше</span>' +
          '</div>' +
          '<div class="cfg-redesign2__scanline"></div>' +
          '<span class="cfg-redesign2__arrow-label">Обновляем структуру →</span>' +
          '<div class="cfg-redesign2__after">' +
            '<span class="cfg-redesign2__tag cfg-redesign2__tag--accent">ПОСЛЕ</span>' +
            '<div class="cfg-redesign2__status-row"><span class="check-dot">✓</span><span class="cfg-redesign2__status-text">Чёткая структура</span></div>' +
            '<span class="ui-bar ui-bar--accent" style="width:65%;height:9px;margin-top:6px"></span>' +
            '<span class="ui-bar ui-bar--light" style="width:50%"></span>' +
            '<span class="ui-bar ui-bar--accent" style="width:40%"></span>' +
            '<button type="button" class="cfg-btn cfg-btn--solid cfg-btn--sm cfg-redesign2__cta" data-open-project-modal ' +
              'data-source="configurator" data-project-type="redesign" data-source-label="Улучшить сайт">Улучшить сайт</button>' +
          '</div>' +
        '</div>' +
        '<div class="cfg-redesign2__improvements cfg-rise cfg-rise--3">' +
          '<span>Структура</span><span>Визуал</span><span>Адаптив</span><span>CTA</span><span>Формы</span><span>Скорость</span>' +
        '</div>' +
        '<div class="cfg-redesign2__chart cfg-rise cfg-rise--4">' +
          '<div class="cfg-redesign2__bars-col">' +
            '<div class="cfg-redesign2__bars"><span style="height:24%"></span><span style="height:38%"></span><span style="height:55%"></span><span style="height:78%"></span><span style="height:100%;background:var(--color-accent)"></span></div>' +
            '<div class="cfg-redesign2__bar-labels"><span>до</span><span>после</span></div>' +
          '</div>' +
          '<div class="cfg-redesign2__chart-info">' +
            '<span class="cfg-redesign2__caption">Ясность · Заявки · Доверие</span>' +
            '<span class="cfg-redesign2__status"><span class="status-pill__dot"></span>UPGRADED</span>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  var TILDA_TOGGLES = [
    { label: 'Адаптив', on: true },
    { label: 'Анимации', on: true },
    { label: 'Формы', on: true },
    { label: 'SEO-база', on: false }
  ];

  var TILDA_FIXES = [
    ['Ошибки на мобильных', 'Адаптив исправлен'],
    ['Медленная загрузка', 'Скорость улучшена'],
    ['Устаревшая анимация', 'Анимации обновлены'],
    ['Неработающие формы', 'Формы подключены']
  ];

  function buildTilda() {
    var toggles = TILDA_TOGGLES.map(function (t) {
      return (
        '<div class="cfg-tilda2__toggle-row">' +
          '<button type="button" class="cfg-toggle' + (t.on ? ' is-on' : '') + '" data-cfg-toggle aria-pressed="' + (t.on ? 'true' : 'false') + '" aria-label="' + t.label + '"><span class="cfg-toggle__knob"></span></button>' +
          '<span>' + t.label + '</span>' +
        '</div>'
      );
    }).join('');

    var fixes = TILDA_FIXES.map(function (pair) {
      return (
        '<div class="cfg-tilda2__fix-row">' +
          '<span class="cfg-tilda2__fix-was">' + pair[0] + '</span>' +
          '<span class="cfg-tilda2__fix-arrow">→</span>' +
          '<span class="cfg-tilda2__fix-now"><span class="cfg-tilda2__fix-now-dot">✓</span>' + pair[1] + '</span>' +
        '</div>'
      );
    }).join('');

    return (
      '<div class="cfg-tilda2">' +
        '<div class="cfg-tilda2__top cfg-rise cfg-rise--2">' +
          '<div class="cfg-tilda2__code">' +
            '<span><b>.t-zero</b> {</span>' +
            '<span>&nbsp;&nbsp;display: grid;</span>' +
            '<span>&nbsp;&nbsp;gap: <b>24px</b>;</span>' +
            '<span>&nbsp;&nbsp;padding: <b>0 5%</b>;</span>' +
            '<span>}</span>' +
            '<div class="cfg-tilda2__code-grid"><span></span><span></span><span></span></div>' +
          '</div>' +
          '<div class="cfg-tilda2__mobile">' +
            '<span style="width:40%"></span>' +
            '<span style="width:80%"></span>' +
            '<span style="width:60%"></span>' +
            '<span class="accent"></span>' +
            '<span style="width:70%"></span>' +
            '<span style="width:50%"></span>' +
          '</div>' +
          '<div class="cfg-tilda2__toggles">' + toggles + '</div>' +
        '</div>' +
        '<div class="cfg-tilda2__fixlist cfg-rise cfg-rise--3">' +
          '<div class="cfg-tilda2__fixlist-heads"><span>Было</span><span></span><span>Стало</span></div>' +
          fixes +
        '</div>' +
        '<span class="cfg-tilda2__status cfg-rise cfg-rise--4"><span class="status-pill__dot"></span>TILDA FIX — ГОТОВО</span>' +
      '</div>'
    );
  }

  var VISUAL_BUILDERS = {
    landing: buildLanding,
    corporate: buildCorporate,
    ecommerce: buildEcommerce,
    service: buildService,
    redesign: buildRedesign,
    tilda: buildTilda
  };

  function buildChip(format, i) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'configurator-chip';
    btn.setAttribute('data-index', String(i));
    btn.innerHTML =
      '<span class="configurator-chip__num">0' + (i + 1) + '</span>' +
      '<span>' +
        '<span class="configurator-chip__title">' + format.title + '</span>' +
        '<span class="configurator-chip__label">' + format.label + '</span>' +
      '</span>';
    return btn;
  }

  function initConfigurator() {
    var section = document.querySelector('[data-configurator]');
    if (!section) return;

    var leftEl = section.querySelector('[data-chips-left]');
    var rightEl = section.querySelector('[data-chips-right]');
    var canvas = section.querySelector('[data-configurator-canvas]');
    var previewEl = section.querySelector('[data-configurator-preview]');
    var scan = section.querySelector('[data-configurator-scan]');
    var urlEl = section.querySelector('[data-configurator-url]');
    var labelEl = section.querySelector('[data-configurator-label]');
    var descEl = section.querySelector('[data-configurator-desc]');
    var ctaEl = section.querySelector('[data-configurator-cta]');
    if (!leftEl || !rightEl || !canvas || !previewEl) return;

    var reduceMotion = window.LwsUtil.reduceMotion();
    var EXIT_MS = 220;

    // Delegated so it survives previewEl.innerHTML being replaced on every
    // format switch — no per-render rebind needed. Pure UI state, no
    // persistence: just proves the panel is a real interactive surface.
    previewEl.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('[data-cfg-toggle]') : null;
      if (!btn) return;
      var nowOn = !btn.classList.contains('is-on');
      btn.classList.toggle('is-on', nowOn);
      btn.setAttribute('aria-pressed', nowOn ? 'true' : 'false');
    });

    var chips = FORMATS.map(function (format, i) {
      var chip = buildChip(format, i);
      (i < 3 ? leftEl : rightEl).appendChild(chip);
      return chip;
    });

    var activeIndex = -1;
    var swapTimer = null;

    function renderInner(format) {
      if (urlEl) urlEl.textContent = format.url;
      if (labelEl) labelEl.textContent = format.label;
      if (descEl) descEl.textContent = format.description;
      if (ctaEl) {
        ctaEl.textContent = format.ctaText + ' →';
        ctaEl.href = '#contact';
        ctaEl.setAttribute('data-project-type', format.id);
        ctaEl.setAttribute('data-source-label', format.ctaText);
      }

      var build = VISUAL_BUILDERS[format.visualType];
      previewEl.innerHTML =
        '<div class="cfg-preview cfg-preview--' + format.visualType + '">' +
          head(format) +
          '<div class="cfg-preview__body">' + (build ? build() : '') + '</div>' +
        '</div>';
    }

    function applyFormat(i) {
      var format = FORMATS[i];

      if (reduceMotion) {
        renderInner(format);
        canvas.classList.add('is-in');
        return;
      }

      window.clearTimeout(swapTimer);
      canvas.classList.remove('is-in');

      swapTimer = window.setTimeout(function () {
        renderInner(format);
        void canvas.offsetWidth;
        requestAnimationFrame(function () { canvas.classList.add('is-in'); });

        if (scan) {
          scan.classList.remove('is-scanning');
          void scan.offsetWidth;
          scan.classList.add('is-scanning');
        }
      }, EXIT_MS);
    }

    function setActiveFormat(i) {
      if (i === activeIndex) return;
      activeIndex = i;
      chips.forEach(function (c, ci) {
        c.classList.toggle('is-active', ci === i);
        c.classList.toggle('is-dim', ci !== i);
      });
      applyFormat(i);
    }

    chips.forEach(function (chip, i) {
      chip.addEventListener('mouseenter', function () { setActiveFormat(i); });
      chip.addEventListener('click', function () { setActiveFormat(i); });
      chip.addEventListener('focus', function () { setActiveFormat(i); });
    });

    // First paint: render immediately, no exit-animation wait.
    activeIndex = 0;
    chips[0].classList.add('is-active');
    for (var i = 1; i < chips.length; i++) chips[i].classList.add('is-dim');
    renderInner(FORMATS[0]);
    if (reduceMotion) {
      canvas.classList.add('is-in');
    } else {
      requestAnimationFrame(function () { canvas.classList.add('is-in'); });
    }
  }

  document.addEventListener('DOMContentLoaded', initConfigurator);
})();
