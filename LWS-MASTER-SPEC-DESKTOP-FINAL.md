# MASTER IMPLEMENTATION SPEC — LUT WEB STUDIO — DESKTOP FINAL

> **Как использовать:** это готовый, самодостаточный промпт для Claude в VS Code. Скопируй целиком и выполняй по фазам (Phase 0→8), останавливаясь на git-чекпоинтах. Реализуется **только desktop**. Не нужно видеть файл аудита — здесь всё необходимое.
>
> **Роль:** ты — senior-команда (Creative Director + UX/UI + CRO + copywriter + frontend-инженер), работаешь доказательно: правка → проверка в браузере → коммит. НЕ ломай то, что помечено «НЕ ЛОМАТЬ».
>
> **ЖЁСТКИЕ ГРАНИЦЫ ЭТОГО ЭТАПА (desktop V2):**
> - НЕ подключать backend и НЕ отправлять формы (реальная интеграция — отдельный будущий этап).
> - НЕ начинать mobile/tablet adaptive (но не ломать возможность адаптива архитектурно).
> - НЕ публиковать сайт (публикация, legal и backend — отдельный PRE-LAUNCH этап, см. конец файла).
> - Тексты/цифры — только подтверждённые владельцем (ниже). Не выдумывать.

---

## PREREQUISITES — ПОДТВЕРЖДЁННЫЕ ДАННЫЕ ВЛАДЕЛЬЦА

- Реальный объём: **20+ проектов** (не «120+»).
- Средний ориентир запуска: **около 7 дней**.
- Опыт: **~2 года** — «8 лет опыта» и любые непроверенные заявления **добавлять запрещено**.
- Каналы будущих заявок (реализация позже): **e-mail + Telegram (+ возможно MAX)**.
- Backend/отправка/legal/публикация — **отдельный этап после desktop и адаптива**.
- Отзывы, доп. доказательства, автор-блок (фото позже) — давать как **рекомендации/заглушки** `TODO[owner]`, не выдумывать.

---

## A. CURRENT STATE

- **Commit-база:** `0455946` («pre-master-audit: complete desktop site state»), ветка `master`, tracked-файлы чистые.
- **Стек:** статический сайт (vanilla HTML/CSS/JS, без сборщика). Google Fonts: Unbounded/Onest/JetBrains Mono (**69 font-faces грузится — избыточно**).
- **Структура:** `index.html` (913 стр.); `css/` = `variables, reset, base, components` (глобальные) + `hero, assembly, portfolio, configurator, journey, faq, brief, project-modal, footer` (секции) + `responsive.css` (пустой); `js/` = `social-links, main, hero, assembly, portfolio, configurator, journey, faq, brief, footer, project-modal`. Ассеты: 5 реальных кейсов.
- **Реализовано и подтверждено вживую:** hero (scatter/tilt/magnet), assembly (340vh scroll), portfolio (orbit+drag), configurator (6 форматов+цены), journey (350vh scroll), FAQ (10, sticky), brief-квиз (7 шагов), footer, модалка (эталонная a11y).
- **НЕ ЛОМАТЬ (жёстко):** фон-canvas + прозрачность секций; логику модалки; reduced-motion fallbacks; `window.LWS_SOCIAL_LINKS`; safe-centering (configurator/faq/brief); configurator normal-flow; FAQ sticky-bounding; прозрачные цены; rAF-guard + IO-gating; signature-приёмы (scan/reveal-up/2.5D/glow); один `<h1>`; git-историю.
- **Известные live-факты для проверки:** страница 10 420px (13.9 экрана); `metaDesc:null, og:0, favicon:false, canonical:false`; 5/5 `<img>` без размеров; console чист, кроме `[project-modal] lead payload (no backend wired yet)`.

---

## B. TARGET STATE (Desktop V2)

Сайт, который: (1) за 5 сек объясняет «авторская сборка сайтов на Tilda уровня студии»; (2) доказывает уровень кейсами + отзывами + честными цифрами (20+/~2 года), а не громкими заявлениями; (3) не повторяет один аргумент двумя длинными scroll-секциями; (4) не имеет мёртвых CTA и вертикального клиппинга; (5) единый ритм движения (токены); (6) читаемый контраст (AA); (7) доступное меню и корректные якоря; (8) с рабочим `<head>` (SEO/OG/favicon) для «продающего» шеринга. Backend/отправка/публикация — следующий этап. Арт-дирекция и signature-эффекты — сохранены и сфокусированы.

---

## C. GLOBAL RULES (дизайн-система V2)

Добавить в `css/variables.css` (существующее не удалять до миграции ссылок):

```css
:root{
  /* SPACING SCALE (новое) */
  --space-1:8px; --space-2:12px; --space-3:16px; --space-4:24px;
  --space-5:32px; --space-6:48px; --space-7:64px; --space-8:96px;

  /* MOTION DURATIONS (новое — заменить ~25 разрозненных значений) */
  --dur-instant:.12s; --dur-fast:.2s; --dur:.3s; --dur-slow:.5s; --dur-reveal:.8s;
  /* --ease-rise, --ease-pop уже есть; убрать «сырой» cubic-bezier в .btn__liquid */

  /* CONTRAST FIX: серые ДЛЯ ТЕКСТА — минимум #8a8a80 (5.7:1) */
  --color-text-dim:#8a8a80;    /* было #6f6f68 (3.95:1 fail) */
  --color-text-dim-2:#8f8f86;  /* было #7a7a72 (4.31:1 fail) */

  /* ANCHOR OFFSET (чинит все якоря разом) */
  scroll-padding-top: calc(var(--header-height) + 16px);
}
```

- **Container/colors/border/glow/shadow токены** — не менять (кроме текстовых серых выше). Акцент `#c8ff2e` — не трогать.
- **Motion:** все `transition`/`animation` длительности → `--dur-*` (≤5 значений); все easing → `--ease-*`.
- **Vertical-fit:** ввести safe-centering в hero/assembly (как в configurator) + `@media (max-height:760px)` компактный режим.
- **A11y:** единый `:focus-visible { outline:1.5px solid var(--color-accent); outline-offset:2px; }` на всех интерактивных; под `prefers-reduced-motion` гасить ambient-glow (`lutBloom1/2`).
- **Performance:** сократить веса шрифтов в Google Fonts `<link>` (display 600;700 / body 400;500;600 / mono 500;700) — цель с 69 до ~9–12 faces; `<img>` — добавить `width/height`.

---

## D. EXACT COPY CHANGES

> Только подтверждённые формулировки. `TODO[owner]` — вставлять после данных владельца.

**D1. `index.html:99` badge** — «Сайты на Tilda под ключ» → **«Авторская веб-студия · Tilda»**
**D2. `index.html:101` H1** — «Соберём сайт, который `<span>`приводит клиентов`</span>`» → **«Собираем на Tilda сайты, `<span>`которые работают как система`</span>`»**
**D3. `index.html:102` subtitle** → **«Собираем структуру, смыслы, дизайн и путь до заявки — под вашу нишу, а не по шаблону. Лендинги, корпоративные сайты, магазины и доработки на Tilda.»**
**D4. `index.html:114-120` hero stats** → **«20+ проектов / запуск от 7 дней / 100% на Tilda»** (честные данные владельца; убрать «120+»).
**D5. `configurator.js:160-161` corporate mock** — убрать «8 лет опыта», «120+»; заменить на **«Договор / Прозрачные цены / Запуск под ключ»** (или «20+ проектов»).
**D6. `index.html:821`** — «© 2025» → **«© 2025–2026»**.
**D7. `<head>` meta description (новое)** → **«LUT Web Studio — авторская веб-студия Виталия Лута. Собираем на Tilda лендинги, корпоративные сайты и интернет-магазины со структурой, дизайном и путём до заявки. Прозрачные цены, запуск и настройка.»**
**D8. CTA-унификация** (см. §G): PRIMARY «Обсудить проект», SECONDARY «Смотреть работы»; контекстные — только configurator.
**D9. Proof-блок (новый, §E5)** — тексты отзывов/гарантии `TODO[owner]`.
**D10. Success fail-ветка (§E10)** — «Не получилось отправить — напишите в Telegram @VitalyLut».

---

## E. SECTION-BY-SECTION IMPLEMENTATION

### E1. HEADER + MENU
- **Сохранить:** сжатие LWS, бренд-mark, floating-стиль.
- **Изменить (P1-7):** меню → стандарт модалки — вынести `lockScroll/unlockScroll` + `getFocusable/trapFocus` из `project-modal.js` в общий `js/util.js`; добавить Escape-close, scroll-lock, focus-trap, возврат фокуса на бургер. Поправить позицию `.menu__label` (перекрывает «01 Главная» на низкой высоте) — сместить/уменьшить, чтобы не наезжала на первый пункт.
- **Изменить (P1-2 header overlap):** дать секциям достаточный top-pad, чтобы H2 не заходил под 88px header; опц. лёгкий backdrop у header при `.is-scrolled`.
- **Добавить:** `scrollToHash()` (из footer) в util; повесить на меню-ссылки и hero secondary CTA (единый smooth-scroll). `scroll-padding-top` в variables.
- **Acceptance:** Escape закрывает меню; Tab не выходит из меню; фон не скроллится; label не перекрывает пункт; клик по якорю — заголовок секции НЕ под header; фокус вернулся на бургер.

### E2. HERO
- **Сохранить:** сборку по hover, tilt, glow, halo, mockup.
- **Изменить copy:** D1–D4.
- **Изменить CTA (P0-2):** «Смотреть работы» (`index.html:105-112`) → рабочий скролл к `#portfolio` (util-scroll). `data-magnet` сохранить.
- **Изменить default-state (P2-5):** сделать **default = собранный аккуратный вид**, scatter — реакцией/микро-движением; ИЛИ ограничить scatter-таргеты (`--sx/--sy` в `hero.css:190-228`) правой сценой, чтобы шарды **не заходили на колонку H1** (на ≤1366 сейчас наезжают).
- **Изменить layout (P1-1 vertical-fit):** safe-centering вместо жёсткого центрирования; не клиппировать контент `overflow:hidden` (прятать только фон); `@media (max-height:760px)` — уменьшить top-pad и `--fs-h1` (напр. 44px). Цель: на `1366×591` статистика видна.
- **Изменить motion:** амплитуду `lutFloat*` −30% или пауза на assembled; tilt/magnet — обернуть запись transform в `requestAnimationFrame`.
- **Responsive (не реализовывать, не ломать):** сетка `.82fr/1.18fr` должна легко коллапсировать в 1 колонку.
- **Acceptance (live):** на 1920/1440/1366 и высоте ~600–700 весь hero-контент (вкл. stats) виден; обе кнопки работают; клик secondary → плавный скролл к portfolio; шарды не наезжают на H1.

### E3. ASSEMBLY
- **Сохранить:** 2.5D-каскад, scan, reduced-motion fallback, «Система собрана».
- **Изменить (P1-6 дубль):** убрать из слоя 03 формулировку «CONVERSION ROUTE / маршрут до заявки»; переименовать в «**Структура и приоритеты**», текст — про порядок блоков/иерархию, без «пути до заявки» (эта тема остаётся у journey/FAQ).
- **Изменить длину:** `assembly.css:10` track `340vh` → `~230vh` (пересчитать `SEG` в `assembly.js` пропорционально; проверить читаемость каждого слоя).
- **Изменить (P3 рассинхрон):** `.assembly__layer-desc` рендерить из того же массива, что и панель (устранить расхождение `index.html:326` ↔ `assembly.js:24`).
- **Изменить layout:** safe-centering + top-pad, чтобы H2 не под header.
- **Acceptance:** нет «до заявки»/«conversion route» в assembly; прокрутка короче; тексты панели=карточек; H2 не под header; активная карточка читаема на всех шагах.

### E4. PORTFOLIO
- **Сохранить:** orbit, drag/инерцию, click-suppress, реальные ссылки, подписи.
- **Изменить (P1-3):** сократить плейсхолдеры до **0–1** (`portfolio.js` PROJECTS — оставить 5 реальных; счётчик станет «01/05»). Каждому кейсу — 1 факт-результат в описание (`TODO[owner]`: срок/экраны/результат).
- **Изменить (a11y P2-8):** клавиатурная операбельность (кнопки «‹ ›» или фокус-к-карте с доворотом).
- **Изменить (perf P2-7):** `buildCard` — `width`/`height` на `<img>`; рассмотреть `.webp`.
- **Изменить (P3):** дефолт-подпись `index.html:419-423` = `PROJECTS[0]` (убрать «мигание»).
- **Acceptance (live):** ≤1 плейсхолдер; при drag в центр НЕ выезжают «СВОБОДНО/СКОРО»; у каждого кейса факт; нет CLS; орбита с клавиатуры.

### E5. PROOF / TRUST (НОВЫЙ, компактный)
- **Добавить:** между Portfolio и Configurator. НЕ scroll-секция, ≤1 экрана, стилистика `glass-card`.
- **Содержимое:** 2–3 отзыва (`TODO[owner]`: имя+ниша+текст) + 1–2 принципа/гаранта (`TODO[owner]`: договор / правки до результата / прозрачные цены). Зарезервировать слот под будущий **автор-блок** (фото позже) — сетка, без финальной композиции.
- **Acceptance:** статичен, читаем, не ломает ритм, работает без фото автора и с 1–3 отзывами.

### E6. CONFIGURATOR
- **Сохранить (жёстко):** normal-flow, прозрачные цены, 6 форматов, смену mockup, `data-project-type`, safe-centering.
- **Изменить (P3 affordance):** декоративные «кнопки»-`span` (В корзину/Оформить заказ) — убрать вид кнопки или `aria-hidden`; реальные CTA (Записаться/Улучшить сайт) — оставить.
- **Изменить (CTA §G):** контекстные подписи оставить, привести к единому стилю кнопки.
- **Responsive (не ломать):** стек 180+740+180 переполнится <~1300px — при адаптиве нужен перенос; сейчас на 1366 ок, не хардкодить непреодолимо.
- **Acceptance:** на 1366+ ряд помещается; декор ≠ CTA; цены на месте; смена форматов работает.

### E7. JOURNEY
- **Решение (P1-6):** **свернуть scroll-jack.** Сделать основным desktop-видом статический `journey__rm` (готов, читаем), убрать 350vh-трек ИЛИ сократить до ~150vh лёгкой анимации. Разместить между Portfolio/Proof и Configurator ИЛИ перед FAQ, но коротко.
- **Сохранить:** вопросы клиента (сильная эмпатия), final CTA, reduced-motion (он и станет базой).
- **Развести смысл:** journey = психология/возражения клиента; assembly = процесс. Не повторять «система/маршрут» дважды.
- **Acceptance:** страница короче на ~200–300vh; journey не дублирует assembly; H2 не под header; reduced-motion работает.

### E8. FAQ
- **Сохранить (жёстко):** sticky-панель + bounding, safe-centering, per-answer визуалы, честные тексты, прозрачные цены (график совпадает с configurator).
- **Изменить (a11y P2-8):** Arrow ↑/↓ навигация по табам.
- **Возможность (D-сценарий):** краткую версию тезиса «Tilda — инструмент, а не потолок» вынести выше (assembly-интро или proof).
- **Acceptance:** стрелки листают; фокус видим; контент не прыгает; H2 не под header.

### E9. BRIEF (QUIZ)
- **Сохранить:** 7 шагов, multi-select, live-preview (работает вживую), success/restart, safe-centering (272px floor).
- **Изменить (P3-2):** `BRIEF ID` — генерировать (timestamp), не хардкод.
- **Подготовить (не подключать):** точку сбора payload из `answers` (для будущего backend) + `source:'brief'`. **Не отправлять.**
- **Роль:** квиз = «узнать формат/цену/шаг»; короткая модалка = primary «Обсудить проект».
- **Acceptance:** квиз проходится 2× с разными ответами; preview строится; ID уникален; отправка НЕ выполняется (этап позже).

### E10. MODAL (глобальная форма)
- **Сохранить (жёстко):** ВСЮ логику a11y/scroll-lock/phone-format/Escape/валидацию (подтверждено вживую — эталон).
- **Подготовить (не подключать backend):** оставить единую точку `submitForm()`; добавить **fail-ветку UI** (D10) на будущее; НЕ выполнять реальный `fetch`. Success-текст оставить, но помнить, что публикация — после подключения канала.
- **Acceptance:** open/Escape/overlay/trap/phone-format/валидация работают; success показывается (демо); реальная отправка не подключена.

### E11. FOOTER
- **Сохранить:** контакты, соц-single-source, watermark-hover, smooth-scroll nav.
- **Изменить (P3):** `© 2025`→`2025–2026`. Legal-ссылки — **оставить заглушками на этом этапе** (реальные документы — PRE-LAUNCH этап), но подготовить корректную разметку под будущие URL.
- **Acceptance:** год актуален; nav скроллит с offset.

### E12. `<head>` / SEO (публикабельная база, P1-8)
- **Добавить:** meta description (D7); Open Graph (`og:title/description/image/url/type`) + `twitter:card`; `link canonical`; favicon (SVG+png); `theme-color:#08080a`; JSON-LD `ProfessionalService` (name, url, telephone, sameAs[соцсети], priceRange «₽₽») + `FAQPage` (10 вопросов из FAQ).
- **Подготовить ассет:** og-image 1200×630 (можно из hero).
- **Acceptance:** ссылка в Telegram/WhatsApp даёт превью с картинкой; фавикон во вкладке; валидный JSON-LD; `metaDesc`/`og` больше не пустые.

---

## F. GLOBAL REFACTORING

- **Вынести в `js/util.js` (подключить первым):** `scrollToHash`, `lockScroll/unlockScroll`, `getFocusable/trapFocus`, `reduceMotion()`. Использовать в menu/footer/hero/modal.
- **Вынести в `variables.css`:** spacing + duration-токены; затем прогнать замену «сырых» значений по секциям (по 1 секции за коммит).
- **Дедупликация:** тексты слоёв assembly (единый источник); свести 5 серых токенов к 3 ролям (`muted/dim/faint`) с миграцией ссылок; проверить re-declared glass-поверхности vs `.glass-card`.
- **НЕЛЬЗЯ объединять:** section-per-file CSS (не схлопывать); modal и menu — общий util, но разные компоненты; configurator НЕ в sticky.

---

## G. BUTTON / CTA SYSTEM (единая)

- **PRIMARY** `.btn--primary`: заливка `--color-accent`, **один** стиль тени (выбрать offset ЛИБО мягкую — не смешивать с liquid). Текст всегда **«Обсудить проект»** → модалка. Hero, footer, journey-final, proof.
- **SECONDARY** `.btn--secondary`: контур; текст **«Смотреть работы»** → скролл к portfolio. Liquid-fill оставить ТОЛЬКО как secondary-стиль ЛИБО заменить на простой hover-fill — применить одинаково.
- **CONTEXTUAL** (только configurator): «Обсудить лендинг/магазин/…», «Записаться» — primary-стиль в мини-размере.
- **TEXT-LINK** `.text-link`: mono-стрелки внутри карточек/финалов — оставить.
- **Правила:** ≤1 primary на секцию; новых формулировок не вводить; `:focus-visible` у всех; magnet — только hero.

---

## H. MOTION SYSTEM

- **Токены:** `--dur-instant/fast/dur/slow/reveal` + `--ease-rise/pop` (+ опц. `--ease-liquid`).
- **Правила:** hover/feedback → `--dur-fast`; смена контента/панелей → `--dur`; крупные reveal → `--dur-reveal`. Easing: UI → `--ease-rise`, «прибытие» → `--ease-pop`; убрать дефолт `ease`/сырые cubic-bezier.
- **Сохранить signature:** scan / reveal-up / 2.5D-сборка / glow-пульс — на единых токенах.
- **Сжать:** assembly −100vh, journey свернуть; hero-float приглушить; default-hero = собранный. Под reduced-motion гасить `lutBloom*`.
- **Принцип:** движение объясняет сборку, не украшает. Новых тяжёлых эффектов не добавлять.

---

## I. TESTING PLAN (после каждой фазы, с реальным браузером)

- **Смоук:** открыть локально (Live Server); пройти сверху вниз; **console — 0 ошибок** (кроме намеренного); все CTA открывают модалку/скроллят; формы показывают success (отправка не подключена — ок).
- **Viewport-матрица (Phase 8), обязательно вживую (Claude in Chrome):** 1920/1536/1440/1366 (сколько достижимо на дисплее) **и малая высота (≤700, напр. 1366×591)**. Проверить: hero БЕЗ клиппинга (stats видны); H2 не под header; assembly/journey читаемы; configurator ряд помещается; brief влезает; FAQ sticky корректен; портфолио без плейсхолдеров в центре.
- **Интеракции (live):** hero сборка/hover/scatter-не-наезжает; portfolio drag/инерция; configurator 6 форматов; journey прогресс (если оставлен); FAQ hover/click/**стрелки**; квиз 2× (multi-select/back/next/restart/validation); модалка (open/Escape/overlay/trap/phone/валидация/success/**fail-ветка**); меню (Escape/lock/trap/label).
- **A11y (live):** только клавиатура (меню, формы, focus-visible); `prefers-reduced-motion` → статичные fallbacks + ambient off; контраст серых ≥4.5:1.
- **Perf (live):** DevTools Performance при скролле assembly/journey/hero — long tasks/jank от blur/backdrop; Lighthouse (Perf/A11y/SEO/Best-Practices, desktop, цель ≥90).
- **SEO:** валид JSON-LD; OG-превью (Telegram/WhatsApp); один H1; canonical; favicon.

---

## J. ORDER OF IMPLEMENTATION (фазы; порядок скорректирован под desktop-этап)

- **Phase 0 — Checkpoint.** Ветка `desktop-v2` от `0455946`; каталог чист.
- **Phase 1 — Desktop-blocking fixes.** P0-2 dead CTA → scroll; P1-1 vertical-fit (hero/assembly/journey safe-centering + `max-height` media); P1-2 header-overlap; P1-7 меню (Escape/lock/trap/label); `scroll-padding-top`. *(Backend/legal — НЕ здесь, это PRE-LAUNCH.)*
- **Phase 2 — Design system / foundations.** `util.js`; spacing+duration-токены; контраст-фикс; `:focus-visible` глобально; сокращение весов шрифтов; (опц.) A/B display-шрифта.
- **Phase 3 — Copy / positioning.** D1–D8 (честные цифры 20+/~2 года/от 7 дней); CTA-унификация текстов; meta description.
- **Phase 4 — Sections.** Assembly (убрать дубль + сжать 340→~230vh + единый текст слоёв); journey (свернуть scroll-jack); portfolio (плейсхолдеры↓ + факты + img size + дефолт-подпись); **proof-блок (новый)**; configurator (декор vs CTA); FAQ (стрелки); hero default-assembled.
- **Phase 5 — Motion/interaction.** Прогон duration/easing-токенов; hero float/tilt/magnet; reduced-motion ambient off.
- **Phase 6 — Performance.** Изображения (webp/size/CLS); ревизия blur поверх sticky-сцен; `content-visibility` для нижних секций; Lighthouse-итерация.
- **Phase 7 — SEO/Accessibility base.** `<head>` OG/JSON-LD(ProfessionalService+FAQPage)/canonical/favicon; финальный a11y-проход. *(Legal-документы — PRE-LAUNCH.)*
- **Phase 8 — Final desktop QA.** Полный тест-план §I на 4+ viewport и малой высоте, **вживую через Claude in Chrome**; регресс; фикс.
- **PRE-LAUNCH STAGE (отдельно, ПОСЛЕ desktop и адаптива):** backend (e-mail+Telegram+MAX), реальная отправка форм + fail-ветка вживую, legal-документы + согласие на ПД, публикация. **Сейчас НЕ выполнять.**

> Логика: сначала чинить то, что портит именно DESKTOP-версию (мёртвый CTA, клиппинг, header-overlap, меню), затем фундамент/контент/секции/движение/перф/SEO, затем финальный QA. Backend/legal/публикация вынесены в отдельный этап по требованию владельца.

---

## K. GIT CHECKPOINTS

- P1: `fix(desktop-v2): dead hero CTA scroll + vertical-fit clipping + header overlap + menu a11y`
- P2: `feat(desktop-v2): shared util, spacing/motion tokens, AA contrast, focus-visible, font-weight trim`
- P3: `copy(desktop-v2): H1/badge/subtitle + honest stats (20+/~2y) + CTA wording`
- P4a: `refactor(desktop-v2): assembly dedupe route message + shorten track + single-source layer text`
- P4b: `refactor(desktop-v2): collapse journey scroll-jack to compact`
- P4c: `feat(desktop-v2): portfolio trim placeholders + result facts + img dims`
- P4d: `feat(desktop-v2): compact proof/trust block (+author slot reserved)`
- P4e: `fix(desktop-v2): configurator affordance, faq arrow-keys, hero default-assembled`
- P5: `style(desktop-v2): apply motion tokens; tune hero motion; reduced-motion ambient off`
- P6: `perf(desktop-v2): image webp/dimensions, content-visibility, blur review`
- P7: `feat(desktop-v2): head SEO/OG/JSON-LD/favicon + a11y pass`
- P8: `test(desktop-v2): live viewport-matrix regression fixes`

> Мержить `desktop-v2` в `master` только после Phase 8. Историю не переписывать; коммиты атомарны и откатываемы.

---

## L. ACCEPTANCE CRITERIA (чек-лист готовности Desktop V2)

**Bugs / blockers**
- [ ] Hero «Смотреть работы» скроллит к portfolio (live-проверено).
- [ ] На 1366×~600 hero-статистика видна; H2 секций не под header (live).
- [ ] Меню: Escape закрывает, scroll-lock, focus-trap, label не перекрывает пункт (live).
- [ ] Нет мёртвых/наезжающих интеракций; console 0 ошибок.

**Copy / positioning**
- [ ] H1/badge/subtitle обновлены; за 5 сек ясно «авторская сборка на Tilda уровня студии».
- [ ] Цифры честные: 20+ проектов, запуск от 7 дней, 100% Tilda; «120+/8 лет» удалены.
- [ ] CTA сведены: primary «Обсудить проект» / secondary «Смотреть работы».

**Структура / ритм**
- [ ] Assembly без «conversion route/до заявки»; journey свёрнут; страница короче на ~200–300vh.
- [ ] ≤1 плейсхолдер портфолио; у каждого кейса факт; при drag плейсхолдеры не в центре.
- [ ] Есть компактный proof/trust; зарезервирован слот автора.

**Дизайн-система**
- [ ] spacing + duration-токены; ≤5 длительностей; easing токенизирован.
- [ ] Контраст всех текстовых серых ≥4.5:1.
- [ ] Шрифт-веса сокращены (~9–12 faces); (опц.) решение по display зафиксировано.

**A11y / SEO / perf**
- [ ] `:focus-visible` везде; FAQ стрелки; reduced-motion гасит ambient.
- [ ] `<head>`: description, OG(+image), canonical, favicon, JSON-LD (ProfessionalService+FAQPage).
- [ ] Изображения с `width/height` (нет CLS); Lighthouse desktop Perf/A11y/SEO ≥90.

**Live-регресс**
- [ ] На всех достижимых viewport и малой высоте: hero/assembly/journey/configurator/faq/brief — без клиппинга и наложений (проверено в Claude in Chrome).

**Сохранность**
- [ ] Всё из «НЕ ЛОМАТЬ» цело: модалка, фон-canvas, reduced-motion, soc-single-source, safe-centering, configurator flow, FAQ sticky, прозрачные цены, signature-эффекты.

**Явно НЕ в этом этапе (PRE-LAUNCH, позже):** backend/отправка форм, legal-документы+согласие, публикация, mobile/tablet.

---

*Конец MASTER-ТЗ (FINAL). Выполнять по фазам, коммитить по чекпоинтам, тестировать по §I вживую, принимать по §L. Backend, legal и mobile — отдельные последующие этапы.*
