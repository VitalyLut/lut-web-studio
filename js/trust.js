(function () {
  var TRUST_MODES = [
    { id: 'conditions', number: '01', title: 'Условия' },
    { id: 'contract', number: '02', title: 'Договор' },
    { id: 'guarantee', number: '03', title: 'Гарантия' },
    { id: 'evidence', number: '04', title: 'Доказательства' },
    { id: 'live', number: '05', title: 'Живой след' }
  ];

  // Real, verified recommendation letters (see assets/proof/letters/).
  // No voice testimonials exist yet (see assets/proof/audio/README.md) —
  // every item is type:'letter' for now so the archive never teases an
  // "Есть голосовой отзыв" link that only leads to a pending state.
  // Flip an item to 'letter+voice' and fill audioFile/audioDuration once
  // a real recording is added — renderArchive()/bindVoicePlayer() already
  // branch on whichever fields are filled in, no component rewrite needed.
  var PROOF_ITEMS = [
    { id: 'proof-01', company: 'ООО «4А Денталь»', type: 'letter', letterImage: 'assets/proof/letters/letter-01.webp', audioFile: null, audioDuration: null, source: 'Официальное письмо с печатью · г. Краснодар', verified: true },
    { id: 'proof-02', company: 'ООО «Эстетик Стом+»', type: 'letter', letterImage: 'assets/proof/letters/letter-02.webp', audioFile: null, audioDuration: null, source: 'Официальное письмо с печатью · г. Казань', verified: true },
    { id: 'proof-03', company: 'Milin Bouquet (ИП Усманов Р.Р.)', type: 'letter', letterImage: 'assets/proof/letters/letter-03.webp', audioFile: null, audioDuration: null, source: 'Благодарственное письмо-рекомендация', verified: true },
    { id: 'proof-04', company: 'ООО «Стоматология «Арт-Дент»»', type: 'letter', letterImage: 'assets/proof/letters/letter-04.webp', audioFile: null, audioDuration: null, source: 'Официальное письмо с печатью · г. Волгоград', verified: true },
    { id: 'proof-05', company: 'ООО «Дента»', type: 'letter', letterImage: 'assets/proof/letters/letter-05.webp', audioFile: null, audioDuration: null, source: 'Официальное письмо с печатью · г. Новороссийск', verified: true },
    { id: 'proof-06', company: 'ООО «Солнечная стоматология»', type: 'letter', letterImage: 'assets/proof/letters/letter-06.webp', audioFile: null, audioDuration: null, source: 'Официальное письмо с печатью · г. Казань', verified: true }
  ];

  // Content platforms only — Telegram/MAX/WhatsApp are contact channels,
  // not public content, so they're deliberately excluded even though
  // they exist in window.LWS_SOCIAL_LINKS. Content is largely the same
  // across all four, so this intentionally does NOT invent a different
  // description per platform — the static subtitle in HTML covers it,
  // and each node is just a plain, honest link.
  var LIVE_SIGNAL_ORDER = ['instagram', 'youtube', 'tiktok', 'vk'];

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) return '--:--';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  // ---- Evidence archive: a static outer slot (fan position, NEVER
  // changes on hover — this is what fixes the earlier hover-jitter,
  // whose root cause was the hovered element itself moving out from
  // under the cursor, causing a mouseleave/mouseenter flicker loop) plus
  // an inner button that does the actual lift/scale via plain :hover /
  // :focus-visible CSS. Hovering a descendant still counts as hovering
  // the ancestor, so the outer slot's hit region never shrinks away. ----
  function renderArchive(section) {
    var mount = section.querySelector('[data-trust-archive]');
    if (!mount) return;

    var mid = (PROOF_ITEMS.length - 1) / 2;
    mount.innerHTML = PROOF_ITEMS.map(function (item, i) {
      var angle = ((i - mid) * 9).toFixed(1);
      var x = Math.round((i - mid) * 44);
      var z = Math.round(-Math.abs(i - mid) * 12);
      var hasLetter = !!item.letterImage;
      var hasAudio = !!item.audioFile;
      var inner = hasLetter
        ? '<img src="' + item.letterImage + '" alt="' + (item.company ? 'Рекомендательное письмо — ' + item.company : 'Рекомендательное письмо') + '">'
        : '<span class="trust__letter-head"></span>' +
          '<span class="trust__letter-lines">' +
            '<span></span><span></span><span></span>' +
          '</span>' +
          '<span class="trust__letter-seal" aria-hidden="true"></span>' +
          '<span class="trust__letter-num">№' + (i + 1) + '</span>' +
          '<span class="trust__letter-slot-text">оригинал будет добавлен</span>';
      return (
        '<div class="trust__letter-slot" data-trust-letter="' + i + '" style="--fan-a:' + angle + 'deg;--fan-x:' + x + 'px;--fan-z:' + z + 'px">' +
          '<button type="button" class="trust__letter" aria-label="Рекомендательное письмо №' + (i + 1) + (hasLetter ? '' : ' — оригинал будет добавлен') + '">' +
            '<span class="trust__letter-face' + (hasLetter ? ' trust__letter-face--photo' : '') + '">' + inner + (hasAudio ? '<span class="trust__letter-voice-mark">Есть голос</span>' : '') + '</span>' +
          '</button>' +
        '</div>'
      );
    }).join('');

    var captionLabel = section.querySelector('[data-evidence-label]');
    var captionText = section.querySelector('[data-evidence-text]');
    var evidenceLink = section.querySelector('[data-evidence-link]');
    var slots = Array.prototype.slice.call(mount.querySelectorAll('[data-trust-letter]'));

    function activate(i) {
      var item = PROOF_ITEMS[i];
      slots.forEach(function (l, li) { l.classList.toggle('is-active', li === i); });
      if (captionLabel) captionLabel.textContent = item.company ? item.company : 'Рекомендательное письмо №' + (i + 1);
      if (captionText) captionText.textContent = item.verified ? (item.source || 'Подтверждённый источник.') : 'Оригинал будет добавлен после загрузки материалов. Нажмите, чтобы открыть предпросмотр.';
      if (evidenceLink) evidenceLink.classList.toggle('is-visible', item.type === 'letter+voice' || item.type === 'voice');
      bindVoicePlayer(section, item);
    }

    function reset() {
      if (mount.contains(document.activeElement)) return;
      slots.forEach(function (l) { l.classList.remove('is-active'); });
      if (captionLabel) captionLabel.textContent = 'Архив рекомендаций';
      if (captionText) captionText.textContent = 'Нажмите на письмо, чтобы открыть документ.';
      if (evidenceLink) evidenceLink.classList.remove('is-visible');
      bindVoicePlayer(section, null);
    }

    slots.forEach(function (slot, i) {
      var btn = slot.querySelector('.trust__letter');
      slot.addEventListener('mouseenter', function () { activate(i); });
      slot.addEventListener('mouseleave', reset);
      btn.addEventListener('focus', function () { activate(i); });
      btn.addEventListener('blur', reset);
      btn.addEventListener('click', function () { openViewer(section, PROOF_ITEMS[i], i); });
    });

    reset();
  }

  // ---- Document preview viewer — reuses window.LwsUtil for scroll-lock
  // and focus-trap (same shared implementation Menu uses), rather than
  // a third bespoke modal system. ----
  var viewerLastFocused = null;
  var viewerKeydownBound = null;

  function buildViewerBody(item, index) {
    var hasLetter = !!item.letterImage;
    var hasAudio = !!item.audioFile;
    var letterHtml = hasLetter
      ? '<img src="' + item.letterImage + '" alt="Рекомендательное письмо — ' + (item.company || '') + '">'
      : '<div class="trust__viewer-doc-placeholder">' +
          '<span class="trust__viewer-doc-head"></span>' +
          '<span class="trust__viewer-doc-lines"><span></span><span></span><span></span><span></span></span>' +
          '<span class="trust__viewer-doc-seal" aria-hidden="true"></span>' +
        '</div>';
    return (
      '<div class="trust__viewer-doc">' +
        '<span class="trust__viewer-doc-label">Рекомендательное письмо №' + (index + 1) + '</span>' +
        '<div class="trust__viewer-doc-frame">' + letterHtml + '</div>' +
        '<p class="trust__viewer-doc-status">' + (item.verified ? 'Подтверждённый документ.' : 'Оригинал документа будет добавлен после загрузки материалов.') + '</p>' +
      '</div>' +
      '<div class="trust__voice" data-trust-voice>' +
        '<span class="trust__voice-label">Голосовой отзыв</span>' +
        '<span class="trust__voice-company" data-voice-company>' + (item.company ? item.company : 'Компания будет указана после загрузки материалов.') + '</span>' +
        '<div class="trust__voice-player" data-voice-player>' +
          '<button type="button" class="trust__voice-play" data-voice-play disabled aria-label="Воспроизвести">▶</button>' +
          '<div class="trust__voice-wave" data-voice-wave></div>' +
          '<span class="trust__voice-time" data-voice-time>--:-- / --:--</span>' +
        '</div>' +
        '<p class="trust__voice-pending" data-voice-pending>Аудиозапись будет добавлена после загрузки оригинала.</p>' +
      '</div>'
    );
  }

  function initViewer(section) {
    var viewer = section.querySelector('[data-trust-viewer]');
    var overlay = section.querySelector('[data-trust-viewer-overlay]');
    var closeBtn = section.querySelector('[data-trust-viewer-close]');
    var windowEl = section.querySelector('.trust__viewer-window');
    if (!viewer) return;

    function onKeydown(e) {
      if (e.key === 'Escape') {
        closeViewer(section);
        return;
      }
      window.LwsUtil.trapFocus(e, windowEl);
    }
    viewerKeydownBound = onKeydown;

    overlay.addEventListener('click', function () { closeViewer(section); });
    closeBtn.addEventListener('click', function () { closeViewer(section); });
  }

  function revealViewer(section) {
    var viewer = section.querySelector('[data-trust-viewer]');
    var closeBtn = section.querySelector('[data-trust-viewer-close]');
    viewerLastFocused = document.activeElement;
    viewer.classList.add('is-open');
    viewer.setAttribute('aria-hidden', 'false');
    window.LwsUtil.lockScroll();
    document.addEventListener('keydown', viewerKeydownBound);
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }

  function openViewer(section, item, index) {
    var viewer = section.querySelector('[data-trust-viewer]');
    var body = section.querySelector('[data-trust-viewer-body]');
    if (!viewer || !body) return;

    body.innerHTML = buildViewerBody(item, index);
    bindVoicePlayer(section, (item.type === 'letter+voice' || item.type === 'voice') ? item : null, true);
    revealViewer(section);
  }

  function closeViewer(section) {
    var viewer = section.querySelector('[data-trust-viewer]');
    if (!viewer || !viewer.classList.contains('is-open')) return;
    viewer.classList.remove('is-open');
    viewer.setAttribute('aria-hidden', 'true');
    window.LwsUtil.unlockScroll();
    document.removeEventListener('keydown', viewerKeydownBound);
    stopCurrentAudio();
    if (viewerLastFocused && typeof viewerLastFocused.focus === 'function') {
      viewerLastFocused.focus({ preventScroll: true });
    }
  }

  // ---- custom audio player — real Audio() API, custom UI. Every
  // PROOF_ITEM currently has audioFile:null, so this always renders the
  // disabled/pending branch today; the working-file branch is written
  // and ready for when assets/proof/audio gets real MP3s. `inViewer`
  // scopes the query to the open viewer instead of the archive caption. ----
  var currentAudio = null;
  function stopCurrentAudio() {
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
  }

  function bindVoicePlayer(section, item, inViewer) {
    var scope = inViewer ? section.querySelector('[data-trust-viewer-body]') : section.querySelector('[data-trust-scene="evidence"]');
    if (!scope) return;
    var voiceEl = scope.querySelector('[data-trust-voice]');
    if (!voiceEl) return;
    var playBtn = scope.querySelector('[data-voice-play]');
    var waveEl = scope.querySelector('[data-voice-wave]');
    var timeEl = scope.querySelector('[data-voice-time]');
    var playerEl = scope.querySelector('[data-voice-player]');
    var pendingEl = scope.querySelector('[data-voice-pending]');

    stopCurrentAudio();
    if (playBtn) playBtn.onclick = null;
    if (waveEl) waveEl.onclick = null;

    var show = !!item && (item.type === 'letter+voice' || item.type === 'voice');
    voiceEl.classList.toggle('is-hidden', !show);
    if (!show) return;

    var hasAudio = !!item.audioFile;
    if (playerEl) playerEl.classList.toggle('is-disabled', !hasAudio);
    if (pendingEl) pendingEl.classList.toggle('is-visible', !hasAudio);
    if (playBtn) {
      playBtn.disabled = !hasAudio;
      playBtn.textContent = '▶';
      playBtn.classList.remove('is-playing');
    }

    if (!hasAudio) {
      if (timeEl) timeEl.textContent = '--:-- / ' + (item.audioDuration ? formatTime(item.audioDuration) : '--:--');
      if (waveEl) waveEl.style.setProperty('--progress', '0%');
      return;
    }

    var audio = new Audio(item.audioFile);
    function updateTime() {
      var dur = audio.duration || item.audioDuration || 0;
      if (timeEl) timeEl.textContent = formatTime(audio.currentTime) + ' / ' + formatTime(dur);
      if (waveEl) waveEl.style.setProperty('--progress', (dur ? (audio.currentTime / dur) * 100 : 0).toFixed(1) + '%');
    }
    playBtn.onclick = function () {
      if (audio.paused) {
        stopCurrentAudio();
        currentAudio = audio;
        audio.play();
        playBtn.classList.add('is-playing');
        playBtn.textContent = '❚❚';
      } else {
        audio.pause();
        playBtn.classList.remove('is-playing');
        playBtn.textContent = '▶';
      }
    };
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', function () {
      playBtn.classList.remove('is-playing');
      playBtn.textContent = '▶';
    });
    if (waveEl) {
      waveEl.onclick = function (e) {
        var rect = waveEl.getBoundingClientRect();
        var pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        audio.currentTime = pct * (audio.duration || item.audioDuration || 0);
      };
    }
    updateTime();
  }

  function renderNetwork(section) {
    var mount = section.querySelector('[data-trust-network-nodes]');
    if (!mount || !window.LWS_SOCIAL_LINKS) return;

    var items = window.LWS_SOCIAL_LINKS
      .filter(function (s) { return LIVE_SIGNAL_ORDER.indexOf(s.id) !== -1; })
      .sort(function (a, b) { return LIVE_SIGNAL_ORDER.indexOf(a.id) - LIVE_SIGNAL_ORDER.indexOf(b.id); });

    mount.innerHTML = items.map(function (item, i) {
      return (
        '<a class="trust__network-node" data-net-node="' + i + '" href="' + item.href + '" target="_blank" rel="noopener noreferrer" aria-label="Открыть ' + item.label + '">' +
          '<span class="trust__network-node-icon">' + item.svg + '</span>' +
          '<span class="trust__network-node-name">' + item.label + '</span>' +
          '<span class="trust__network-node-cta">Открыть</span>' +
        '</a>'
      );
    }).join('');
  }

  function buildContractViewerBody() {
    return (
      '<div class="trust__viewer-doc">' +
        '<span class="trust__viewer-doc-label">Шаблон договора</span>' +
        '<div class="trust__viewer-doc-frame">' +
          '<div class="trust__viewer-doc-placeholder">' +
            '<span class="trust__viewer-doc-head"></span>' +
            '<span class="trust__viewer-doc-lines"><span></span><span></span><span></span><span></span></span>' +
            '<span class="trust__viewer-doc-seal" aria-hidden="true"></span>' +
          '</div>' +
        '</div>' +
        '<p class="trust__viewer-doc-status">Шаблон договора будет доступен здесь после согласования индивидуальных условий проекта.</p>' +
      '</div>'
    );
  }

  function openContractViewer(section) {
    var viewer = section.querySelector('[data-trust-viewer]');
    var body = section.querySelector('[data-trust-viewer-body]');
    if (!viewer || !body) return;

    body.innerHTML = buildContractViewerBody();
    revealViewer(section);
  }

  function initContractButton(section) {
    var btn = section.querySelector('[data-trust-contract-btn]');
    if (!btn) return;
    btn.addEventListener('click', function () {
      openContractViewer(section);
    });
  }

  function initTrust() {
    var section = document.querySelector('[data-trust]');
    if (!section) return;

    var navItems = Array.prototype.slice.call(section.querySelectorAll('[data-trust-nav-item]'));
    var scenes = Array.prototype.slice.call(section.querySelectorAll('[data-trust-scene]'));
    var modeReadout = section.querySelector('[data-trust-mode-readout]');
    var seenReadout = section.querySelector('[data-trust-seen-readout]');
    var scanEl = section.querySelector('[data-trust-scan]');

    renderArchive(section);
    renderNetwork(section);
    initContractButton(section);
    initViewer(section);

    var reduceMotion = window.LwsUtil.reduceMotion();
    var activeIndex = 0;
    var viewedModes = {};
    viewedModes[TRUST_MODES[0].id] = true;

    function updateSeen() {
      var count = Object.keys(viewedModes).length;
      var done = count >= TRUST_MODES.length;
      var label = done ? 'Все разделы просмотрены' : 'Просмотрено ' + count + ' из ' + TRUST_MODES.length;
      if (seenReadout) {
        seenReadout.textContent = label;
        seenReadout.classList.toggle('is-complete', done);
      }
    }
    updateSeen();

    var trustTimers = [];
    function clearTrustTimers() {
      trustTimers.forEach(function (id) { window.clearTimeout(id); });
      trustTimers = [];
    }
    function trustTimeout(fn, delay) {
      trustTimers.push(window.setTimeout(fn, delay));
    }

    function playPaymentSequence() {
      var steps = Array.prototype.slice.call(section.querySelectorAll('[data-pay-step]'));
      var pulses = Array.prototype.slice.call(section.querySelectorAll('[data-pay-pulse]'));
      var final = section.querySelector('[data-pay-final]');
      function setStep(i, state) {
        var s = steps[i];
        if (!s) return;
        s.classList.toggle('is-active', state === 'active');
        s.classList.toggle('is-locked', state === 'locked');
        var status = s.querySelector('[data-pay-status]');
        if (status) status.textContent = state === 'active' ? 'Текущий этап' : state === 'locked' ? 'Согласовано' : 'Ожидает';
      }
      steps.forEach(function (_, i) { setStep(i, 'pending'); });
      pulses.forEach(function (p) { p.classList.remove('is-active'); });
      if (final) final.classList.remove('is-visible');

      trustTimeout(function () { setStep(0, 'active'); }, 150);
      trustTimeout(function () { if (pulses[0]) pulses[0].classList.add('is-active'); }, 750);
      trustTimeout(function () { setStep(0, 'locked'); setStep(1, 'active'); if (pulses[0]) pulses[0].classList.remove('is-active'); }, 950);
      trustTimeout(function () { if (pulses[1]) pulses[1].classList.add('is-active'); }, 1550);
      trustTimeout(function () { setStep(1, 'locked'); setStep(2, 'active'); if (pulses[1]) pulses[1].classList.remove('is-active'); }, 1750);
      trustTimeout(function () { setStep(2, 'locked'); }, 2350);
      trustTimeout(function () { if (final) final.classList.add('is-visible'); }, 2550);
    }

    function playContractSequence() {
      var checks = Array.prototype.slice.call(section.querySelectorAll('[data-doc-check]'));
      var scan = section.querySelector('[data-trust-doc-scan]');
      var final = section.querySelector('[data-trust-doc-final]');
      var stamp = section.querySelector('[data-doc-stamp]');
      checks.forEach(function (c) { c.classList.remove('is-done'); });
      if (final) final.classList.remove('is-visible');
      if (stamp) stamp.classList.remove('is-visible');
      if (scan) { scan.classList.remove('is-scanning'); void scan.offsetWidth; scan.classList.add('is-scanning'); }
      checks.forEach(function (c, i) {
        trustTimeout(function () { c.classList.add('is-done'); }, 350 + i * 220);
      });
      trustTimeout(function () {
        if (final) final.classList.add('is-visible');
        if (stamp) stamp.classList.add('is-visible');
      }, 350 + checks.length * 220 + 200);
    }

    function playGuaranteeSequence() {
      var nodes = Array.prototype.slice.call(section.querySelectorAll('[data-ring-node]'));
      var signal = section.querySelector('[data-ring-signal]');
      var statusEl = section.querySelector('[data-ring-status]');
      var warnIndex = 1;
      nodes.forEach(function (n) { n.classList.remove('is-warning'); });
      if (signal) signal.classList.remove('is-active');

      if (statusEl) statusEl.innerHTML = 'Проверяем систему<b>…</b>';
      trustTimeout(function () { if (nodes[warnIndex]) nodes[warnIndex].classList.add('is-warning'); }, 350);
      trustTimeout(function () {
        if (statusEl) statusEl.innerHTML = '<b>Проверка</b> найденной проблемы…';
        if (signal) signal.classList.add('is-active');
      }, 950);
      trustTimeout(function () {
        if (nodes[warnIndex]) nodes[warnIndex].classList.remove('is-warning');
        if (signal) signal.classList.remove('is-active');
        if (statusEl) statusEl.innerHTML = 'Проблема <b>исправлена</b>';
      }, 1750);
      trustTimeout(function () {
        if (statusEl) statusEl.innerHTML = '60 дней <b>технической гарантии</b>';
      }, 2450);
    }

    function playModeAnimation(id) {
      clearTrustTimers();
      if (reduceMotion) return;
      if (id === 'conditions') playPaymentSequence();
      else if (id === 'contract') playContractSequence();
      else if (id === 'guarantee') playGuaranteeSequence();
    }

    // ---- transition choreography: old scene recedes (~200ms), brief
    // pause, new scene's children stagger in (main object -> supporting
    // -> text, via CSS nth-child transition-delay on .is-active > *). ----
    var RECEDE_MS = 200;

    function setActiveMode(index) {
      if (index === activeIndex) return;
      var prevScene = scenes[activeIndex];
      activeIndex = index;
      var mode = TRUST_MODES[index];
      viewedModes[mode.id] = true;
      updateSeen();

      navItems.forEach(function (btn, i) {
        var active = i === index;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-current', active ? 'true' : 'false');
      });

      if (modeReadout) modeReadout.textContent = mode.number + ' · ' + mode.title;
      if (scanEl && !reduceMotion) {
        scanEl.classList.remove('is-scanning');
        void scanEl.offsetWidth;
        scanEl.classList.add('is-scanning');
      }

      var delay = reduceMotion ? 0 : RECEDE_MS;
      if (prevScene && !reduceMotion) prevScene.classList.add('is-leaving');

      trustTimeout(function () {
        scenes.forEach(function (scene) {
          scene.classList.remove('is-active', 'is-leaving');
        });
        var nextScene = section.querySelector('[data-trust-scene="' + mode.id + '"]');
        if (nextScene) nextScene.classList.add('is-active');
        playModeAnimation(mode.id);
      }, delay);
    }

    navItems.forEach(function (btn, i) {
      btn.addEventListener('click', function () { setActiveMode(i); });
    });

    // First mode's one-shot sequence plays once on load (skipped under
    // reduced motion, where the settled end-state is shown directly).
    if (!reduceMotion) {
      playPaymentSequence();
    } else {
      settlePaymentSequence(section);
      settleContractSequence(section);
      settleGuaranteeSequence(section);
    }
  }

  function settlePaymentSequence(section) {
    Array.prototype.slice.call(section.querySelectorAll('[data-pay-step]')).forEach(function (s) {
      s.classList.add('is-locked');
      var status = s.querySelector('[data-pay-status]');
      if (status) status.textContent = 'Согласовано';
    });
    var final = section.querySelector('[data-pay-final]');
    if (final) final.classList.add('is-visible');
  }

  function settleContractSequence(section) {
    Array.prototype.slice.call(section.querySelectorAll('[data-doc-check]')).forEach(function (c) {
      c.classList.add('is-done');
    });
    var final = section.querySelector('[data-trust-doc-final]');
    if (final) final.classList.add('is-visible');
    var stamp = section.querySelector('[data-doc-stamp]');
    if (stamp) stamp.classList.add('is-visible');
  }

  function settleGuaranteeSequence(section) {
    var statusEl = section.querySelector('[data-ring-status]');
    if (statusEl) statusEl.innerHTML = '60 дней <b>технической гарантии</b>';
  }

  document.addEventListener('DOMContentLoaded', initTrust);
})();
