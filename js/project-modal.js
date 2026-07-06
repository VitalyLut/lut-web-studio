(function () {
  var TYPE_DETAILS = {
    landing: 'Одностраничная система → заявка',
    corporate: 'Структура → доверие → обращение',
    ecommerce: 'Каталог → корзина → покупка',
    service: 'Услуги → доверие → запись',
    redesign: 'Аудит → пересборка → усиление',
    'tilda-upgrade': 'Проблема → исправление → результат'
  };

  var OPEN_EXIT_MS = 260;
  var STATE_SWAP_MS = 260;

  var SUBMIT_URL = 'https://mkazpfcbtktznyuqjaqq.supabase.co/functions/v1/submit-lead';

  var root, overlay, windowEl, body, formStateEl, successStateEl, form;
  var nameInput, phoneInput, typeButtons, typeDetailEl, submitBtn, submitLabelEl;
  var honeypotInput, submitErrorEl, successIdEl;
  var lastFocusedTrigger = null;
  var selectedType = null;
  var currentIdempotencyKey = null;
  var isSubmitting = false;

  // reduceMotion/lockScroll/unlockScroll/trapFocus now live in
  // window.LwsUtil (js/util.js) — menu.js shares the identical
  // implementation. These stay as thin aliases so every call site
  // below (5x reduceMotion(), 1x each of the others) is untouched.
  function reduceMotion() {
    return window.LwsUtil.reduceMotion();
  }

  function lockScroll() {
    window.LwsUtil.lockScroll();
  }

  function unlockScroll() {
    window.LwsUtil.unlockScroll();
  }

  // ---- phone formatting: soft, forgiving. Accepts 8 or +7, reformats
  // on every input while preserving caret position by digit count
  // (not raw character index) so typing/backspacing/pasting mid-string
  // doesn't feel broken. ----
  // Normalizes to a 7-led digit string. Replacing a leading 8 with 7 is
  // a straight substitution (same digit count, same position). Adding a
  // missing country code when someone starts typing the bare 10-digit
  // number *inserts* a digit at the front — callers need to know that
  // happened so the caret can be shifted by the same amount, otherwise
  // every digit typed after the first keystroke lands one place off.
  function normalizePhoneDigits(raw) {
    var digits = raw.replace(/\D/g, '');
    var prepended = 0;
    if (digits.charAt(0) === '8') {
      digits = '7' + digits.slice(1);
    } else if (digits.length && digits.charAt(0) !== '7') {
      digits = '7' + digits;
      prepended = 1;
    }
    return { digits: digits.slice(0, 11), prepended: prepended };
  }

  function formatDigits(digits) {
    if (!digits.length) return '';
    var out = '+7';
    if (digits.length > 1) out += ' ' + digits.slice(1, 4);
    if (digits.length > 4) out += ' ' + digits.slice(4, 7);
    if (digits.length > 7) out += '-' + digits.slice(7, 9);
    if (digits.length > 9) out += '-' + digits.slice(9, 11);
    return out;
  }

  function digitsBeforeCaret(value, caretPos) {
    return value.slice(0, caretPos).replace(/\D/g, '').length;
  }

  function caretPosForDigitCount(formatted, digitCount) {
    if (digitCount <= 0) return formatted.length ? 1 : 0;
    var count = 0;
    for (var i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted.charAt(i))) {
        count++;
        if (count === digitCount) return i + 1;
      }
    }
    return formatted.length;
  }

  function onPhoneInput() {
    var oldValue = phoneInput.value;
    var oldCaret = phoneInput.selectionStart == null ? oldValue.length : phoneInput.selectionStart;
    var digitsBefore = digitsBeforeCaret(oldValue, oldCaret);
    var norm = normalizePhoneDigits(oldValue);
    var formatted = formatDigits(norm.digits);
    phoneInput.value = formatted;
    var newCaret = caretPosForDigitCount(formatted, digitsBefore + norm.prepended);
    try { phoneInput.setSelectionRange(newCaret, newCaret); } catch (err) { /* some input types disallow this */ }
    clearError('phone');
  }

  // ---- errors ----
  function showError(field, message) {
    var input = root.querySelector('[data-pm-field="' + field + '"]');
    var errorEl = root.querySelector('[data-pm-error="' + field + '"]');
    var invalidTarget = input || (field === 'type' ? root.querySelector('[data-pm-types]') : null);

    if (errorEl) {
      if (message) errorEl.textContent = message;
      errorEl.classList.add('is-visible');
    }
    if (invalidTarget) {
      invalidTarget.classList.add('is-invalid');
      if (!reduceMotion()) {
        invalidTarget.classList.remove('is-shaking');
        void invalidTarget.offsetWidth;
        invalidTarget.classList.add('is-shaking');
      }
    }
  }

  function clearError(field) {
    var input = root.querySelector('[data-pm-field="' + field + '"]');
    var errorEl = root.querySelector('[data-pm-error="' + field + '"]');
    var invalidTarget = input || (field === 'type' ? root.querySelector('[data-pm-types]') : null);
    if (errorEl) errorEl.classList.remove('is-visible');
    if (invalidTarget) invalidTarget.classList.remove('is-invalid');
  }

  function clearAllErrors() {
    ['name', 'phone', 'type'].forEach(clearError);
  }

  // ---- submit-level error (network/server failure, not tied to a field) ----
  function showSubmitError(message) {
    if (!submitErrorEl) return;
    submitErrorEl.textContent = message;
    submitErrorEl.classList.add('is-visible');
  }

  function clearSubmitError() {
    if (!submitErrorEl) return;
    submitErrorEl.classList.remove('is-visible');
  }

  // ---- format type selection ----
  function setSelectedType(type) {
    selectedType = type || null;
    typeButtons.forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-pm-type') === selectedType);
    });
    typeDetailEl.textContent = selectedType ? TYPE_DETAILS[selectedType] : ' ';
    if (selectedType) clearError('type');
  }

  // ---- validation ----
  function validate() {
    var ok = true;
    var name = nameInput.value.trim();
    var phoneDigits = phoneInput.value.replace(/\D/g, '');

    if (!name) { showError('name', 'Укажите имя'); ok = false; } else { clearError('name'); }
    if (phoneDigits.length !== 11) { showError('phone', 'Введите номер телефона'); ok = false; } else { clearError('phone'); }
    if (!selectedType) { showError('type', 'Выберите формат сайта'); ok = false; }

    return ok;
  }

  // ---- reset / open / close ----
  function resetForm() {
    form.reset();
    setSelectedType(null);
    clearAllErrors();
    clearSubmitError();
    isSubmitting = false;
    submitBtn.disabled = false;
    submitBtn.classList.remove('is-loading');
    if (submitLabelEl) submitLabelEl.textContent = 'Отправить заявку →';
    formStateEl.hidden = false;
    formStateEl.classList.remove('is-exiting');
    successStateEl.hidden = true;
    successStateEl.classList.remove('is-visible');
    body.scrollTop = 0;
    // A fresh idempotency key per new attempt at filling out the form —
    // reused across retries/double-clicks of THIS attempt, replaced only
    // when the modal is opened again (see openModal()).
    currentIdempotencyKey = crypto.randomUUID();
  }

  function trapFocus(e) {
    window.LwsUtil.trapFocus(e, windowEl);
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      closeModal();
      return;
    }
    trapFocus(e);
  }

  function openModal(trigger) {
    lastFocusedTrigger = trigger || document.activeElement;

    resetForm();
    var type = trigger && trigger.getAttribute('data-project-type');
    setSelectedType(type || null);

    var source = (trigger && trigger.getAttribute('data-source')) || 'unknown';
    var sourceLabel = (trigger && (trigger.getAttribute('data-source-label') || (trigger.textContent || '').trim())) || '';
    root.setAttribute('data-active-source', source);
    root.setAttribute('data-active-source-label', sourceLabel);

    document.body.classList.add('is-modal-open');
    lockScroll();

    root.classList.add('is-open');
    root.setAttribute('aria-hidden', 'false');
    document.addEventListener('keydown', onKeydown);

    window.setTimeout(function () {
      nameInput.focus({ preventScroll: true });
    }, reduceMotion() ? 0 : 280);
  }

  function closeModal() {
    if (!root.classList.contains('is-open')) return;

    root.classList.remove('is-open');
    root.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', onKeydown);

    document.body.classList.remove('is-modal-open');
    unlockScroll();

    if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === 'function') {
      // preventScroll matters here: the scroll position was just
      // restored above, and the trigger button may not be inside the
      // viewport at that position (e.g. a hero CTA after scrolling to
      // the footer to open the modal) — a plain .focus() would yank
      // the page back to wherever the button lives.
      lastFocusedTrigger.focus({ preventScroll: true });
    }
  }

  // ---- submit ----
  function showSuccess(submissionId) {
    formStateEl.classList.add('is-exiting');
    var swapDelay = reduceMotion() ? 0 : STATE_SWAP_MS;
    window.setTimeout(function () {
      formStateEl.hidden = true;
      successStateEl.hidden = false;
      if (successIdEl) successIdEl.textContent = submissionId || '';
      void successStateEl.offsetWidth;
      successStateEl.classList.add('is-visible');
    }, swapDelay);
  }

  function endSubmitting() {
    isSubmitting = false;
    submitBtn.disabled = false;
    submitBtn.classList.remove('is-loading');
    if (submitLabelEl) submitLabelEl.textContent = 'Отправить заявку →';
  }

  function submitForm() {
    if (isSubmitting) return;
    if (!validate()) return;

    clearSubmitError();

    var payload = {
      name: nameInput.value.trim(),
      phone: phoneInput.value.trim(),
      projectType: selectedType,
      source: root.getAttribute('data-active-source') || 'unknown',
      pageUrl: window.location.href,
      idempotencyKey: currentIdempotencyKey,
      honeypot: honeypotInput ? honeypotInput.value : '',
      utm: window.LwsUtil.getUtmParams()
    };

    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.classList.add('is-loading');
    if (submitLabelEl) submitLabelEl.textContent = 'Отправляем...';

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
          showSuccess(result.data.submissionId);
          return;
        }
        endSubmitting();
        if (result.status === 429) {
          showSubmitError('Слишком много попыток. Подождите немного и попробуйте снова.');
        } else {
          showSubmitError('Не удалось отправить заявку. Попробуйте ещё раз.');
        }
      })
      .catch(function () {
        endSubmitting();
        showSubmitError('Не удалось отправить заявку. Попробуйте ещё раз.');
      });
  }

  // ---- global trigger delegation: any element with
  // [data-open-project-modal], anywhere on the page, opens the one
  // shared modal instance. No per-button binding needed. ----
  function initTriggers() {
    document.addEventListener('click', function (e) {
      var trigger = e.target && e.target.closest ? e.target.closest('[data-open-project-modal]') : null;
      if (!trigger) return;
      e.preventDefault();

      if (!reduceMotion()) {
        trigger.classList.remove('is-pressed');
        void trigger.offsetWidth;
        trigger.classList.add('is-pressed');
      }

      openModal(trigger);
    });
  }

  function init() {
    root = document.querySelector('[data-project-modal]');
    if (!root) return;

    overlay = root.querySelector('[data-project-modal-overlay]');
    windowEl = root.querySelector('[data-project-modal-window]');
    body = root.querySelector('[data-project-modal-body]');
    formStateEl = root.querySelector('[data-project-modal-form-state]');
    successStateEl = root.querySelector('[data-project-modal-success-state]');
    form = root.querySelector('[data-project-modal-form]');
    nameInput = root.querySelector('[data-pm-field="name"]');
    phoneInput = root.querySelector('[data-pm-field="phone"]');
    typeButtons = Array.prototype.slice.call(root.querySelectorAll('[data-pm-type]'));
    typeDetailEl = root.querySelector('[data-pm-type-detail]');
    submitBtn = root.querySelector('[data-pm-submit]');
    submitLabelEl = root.querySelector('[data-pm-submit-label]');
    honeypotInput = root.querySelector('[data-pm-honeypot]');
    submitErrorEl = root.querySelector('[data-pm-submit-error]');
    successIdEl = root.querySelector('[data-pm-success-id]');

    if (!windowEl || !form || !nameInput || !phoneInput || !submitBtn) return;

    root.querySelectorAll('[data-project-modal-close]').forEach(function (btn) {
      btn.addEventListener('click', closeModal);
    });
    overlay.addEventListener('click', closeModal);

    typeButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        setSelectedType(btn.getAttribute('data-pm-type'));
      });
    });

    nameInput.addEventListener('input', function () { clearError('name'); });
    phoneInput.addEventListener('input', onPhoneInput);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitForm();
    });

    initTriggers();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
