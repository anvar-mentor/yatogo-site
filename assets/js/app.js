/* ============================================================
   YATOGO — логика лендинга. Без зависимостей.
   ============================================================ */
(function () {
  'use strict';

  var CFG   = window.SITE_CONFIG || {};
  var DICT  = window.I18N || {};
  var LANGS = ['ru', 'uz', 'en'];
  var lang  = 'ru';

  // Analytics failure must never interrupt navigation or form handling.
  function metrika(method, value) {
    if (typeof window.ym !== 'function') return;
    try { window.ym(113132820, method, value); } catch (e) { /* blocked analytics */ }
  }

  function initMetrikaGoals() {
    document.addEventListener('click', function (e) {
      if (!e.isTrusted || e.button !== 0) return;
      var cta = e.target.closest('[data-metrika-goal="cta_apply_click"]');
      if (cta) metrika('reachGoal', 'cta_apply_click');
    });
  }

  function t(key) {
    var d = DICT[lang] || DICT.ru || {};
    return Object.prototype.hasOwnProperty.call(d, key) ? d[key] : key;
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ──────────────────────────────────────────────────────────
     Матрица тарифов: [ключ услуги, Classic, Business, Premium]
     ────────────────────────────────────────────────────────── */
  var MATRIX = [
    ['compare.f1', 1, 1, 1],
    ['compare.f2', 1, 1, 1],
    ['compare.f3', 1, 1, 1],
    ['compare.f4', 1, 1, 1],
    ['compare.f5', 1, 1, 1],
    ['compare.f6', 1, 1, 1],
    ['compare.f7', 1, 1, 1],
    ['compare.f8', 1, 1, 1],
    ['compare.f9', 0, 1, 1],
    ['compare.f10', 0, 1, 1],
    ['compare.f11', 0, 1, 1],
    ['compare.f12', 0, 1, 1],
    ['compare.f13', 0, 1, 1],
    ['compare.f14', 0, 1, 1],
    ['compare.f15', 0, 1, 1],
    ['compare.f16', 0, 0, 1],
    ['compare.f17', 0, 0, 1],
    ['compare.f18', 0, 0, 1],
    ['compare.f19', 0, 0, 1]
  ];

  function buildCompareTable() {
    var tbody = $('#compareTable tbody');
    if (!tbody) return;
    // Статические строки доступны до JS; генерация остаётся запасным вариантом.
    if (tbody.children.length) return;
    var html = '';
    MATRIX.forEach(function (row) {
      html += '<tr><th scope="row" class="row-label" data-i18n="' + row[0] + '"></th>';
      for (var i = 1; i <= 3; i++) {
        var on = row[i] === 1;
        html += '<td class="is-center">'
              + '<span class="mark ' + (on ? 'mark--yes' : 'mark--no') + '" role="img"'
              + ' data-i18n-attr="aria-label:' + (on ? 'compare.yes' : 'compare.no') + '">'
              + (on ? '<svg aria-hidden="true"><use href="#i-check"></use></svg>' : '<span aria-hidden="true">—</span>')
              + '</span></td>';
      }
      html += '</tr>';
    });
    tbody.innerHTML = html;
  }

  /* ──────────────────────────────────────────────────────────
     Контакты из site.config.js
     ────────────────────────────────────────────────────────── */
  var tgHandle = String(CFG.telegram || '').replace(/^@/, '');
  var waDigits = String(CFG.whatsapp || '').replace(/\D/g, '');

  function applyConfig() {
    $$('[data-brand-name]').forEach(function (el) { el.textContent = CFG.brandName || 'YATOGO'; });
    $$('[data-tg-handle]').forEach(function (el) { el.textContent = '@' + tgHandle; });
    $$('[data-phone]').forEach(function (el) { el.textContent = CFG.phoneDisplay || ''; });
    $$('[data-email]').forEach(function (el) { el.textContent = CFG.email || ''; });

    $$('[data-tg-link]').forEach(function (el) { el.href = 'https://t.me/' + tgHandle; el.target = '_blank'; });
    $$('[data-wa-link]').forEach(function (el) { el.href = 'https://wa.me/' + waDigits; el.target = '_blank'; });
    $$('[data-mail-link]').forEach(function (el) { el.href = 'mailto:' + (CFG.email || ''); });

    $$('[data-phone-link]').forEach(function (el) { el.href = 'tel:+' + String(CFG.phoneDisplay || '').replace(/\D/g, ''); });

    var y = $('#year'); if (y) y.textContent = String(new Date().getFullYear());
  }

  function applyAddress() {
    var key = { ru: 'addressRu', uz: 'addressUz', en: 'addressEn' }[lang] || 'addressRu';
    $$('[data-address]').forEach(function (el) { el.textContent = CFG[key] || ''; });
  }

  function applyPrivacyLinks() {
    var href = '/privacy/?lang=' + lang;
    $$('[data-privacy-link]').forEach(function (el) { el.href = href; });
  }

  /* ──────────────────────────────────────────────────────────
     Перевод страницы
     ────────────────────────────────────────────────────────── */
  // Ключи, значение которых содержит разрешённую разметку (<b>).
  var HTML_KEYS = { 'hero.badge': true };

  function translate() {
    $$('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      el.removeAttribute('data-counting');
      if (HTML_KEYS[key]) el.innerHTML = t(key);
      else el.textContent = t(key);
    });

    // data-i18n-attr="placeholder:form.name.ph" — можно перечислять через запятую
    $$('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(',').forEach(function (pair) {
        var bits = pair.split(':');
        if (bits.length === 2) el.setAttribute(bits[0].trim(), t(bits[1].trim()));
      });
    });

    document.documentElement.lang = t('html.lang');
    document.title = t('meta.title');
    var canonical = 'https://yatogo.ru/' + (lang === 'ru' ? '' : '?lang=' + lang);
    $('link[rel="canonical"]').href = canonical;
    $('meta[property="og:url"]').content = canonical;
    var pageSchema = $('#page-schema');
    if (pageSchema) {
      var schema = JSON.parse(pageSchema.textContent);
      schema.url = canonical;
      schema['@id'] = canonical + '#webpage';
      schema.name = t('meta.title');
      schema.description = t('meta.desc');
      schema.inLanguage = lang;
      pageSchema.textContent = JSON.stringify(schema);
    }

    var badge = $('#langCurrent');
    if (badge) badge.textContent = lang.toUpperCase();
    $$('#lang [data-lang]').forEach(function (b) {
      b.setAttribute('aria-current', b.getAttribute('data-lang') === lang ? 'true' : 'false');
    });

    applyAddress();
    applyPrivacyLinks();
    renderReviews();
    renderQuiz();
  }

  function setLang(next, updateUrl) {
    if (LANGS.indexOf(next) === -1) return;
    var changed = lang !== next;
    lang = next;
    translate();
    // A language change replaces content without a document navigation.
    // Only the known language URL is sent; no form data or arbitrary query values.
    if (changed) metrika('hit', 'https://yatogo.ru/' + (next === 'ru' ? '' : '?lang=' + next));
    if (updateUrl === false) return;
    try {
      var url = new URL(window.location.href);
      url.searchParams.set('lang', next);   // URL уже несёт hash, добавлять его не нужно
      history.replaceState(null, '', url.toString());
    } catch (e) { /* file:// в некоторых браузерах не даёт менять историю */ }
  }

  function detectLang() {
    var q = new URLSearchParams(window.location.search).get('lang');
    // Один URL — один язык, независимо от браузера и сохранённых настроек.
    return LANGS.indexOf(q) !== -1 ? q : 'ru';
  }

  /* ──────────────────────────────────────────────────────────
     Шапка: меню языка, бургер, тень при скролле
     ────────────────────────────────────────────────────────── */
  function initHeader() {
    var langBox = $('#lang'), langBtn = $('#langBtn');
    function closeLang() {
      if (!langBox) return;
      langBox.setAttribute('data-open', 'false');
      langBtn.setAttribute('aria-expanded', 'false');
    }
    if (langBtn) {
      langBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = langBox.getAttribute('data-open') === 'true';
        langBox.setAttribute('data-open', open ? 'false' : 'true');
        langBtn.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
    }
    $$('#lang [data-lang]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        setLang(b.getAttribute('data-lang'));
        closeLang();
        langBtn.focus();
      });
    });
    document.addEventListener('click', closeLang);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeLang(); closeNav(); }
    });

    var burger = $('#burger');
    function closeNav() {
      document.body.classList.remove('nav-open');
      if (burger) burger.setAttribute('aria-expanded', 'false');
      if ($('#mobileNav')) $('#mobileNav').inert = true;
    }
    if (burger) {
      burger.addEventListener('click', function () {
        var open = document.body.classList.toggle('nav-open');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        $('#mobileNav').inert = !open;
      });
    }
    $$('#mobileNav a').forEach(function (a) { a.addEventListener('click', closeNav); });
    closeNav();

    var header = $('#header');
    var onScroll = function () {
      if (header) header.classList.toggle('is-stuck', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ──────────────────────────────────────────────────────────
     Появление блоков при скролле
     ────────────────────────────────────────────────────────── */
  function initReveal() {
    var items = $$('.reveal');
    if (!('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        setTimeout(function () { el.classList.remove('is-pending'); el.classList.add('is-in'); }, Math.min(i, 4) * 40);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px 12% 0px', threshold: 0 });
    items.forEach(function (el) {
      // Уже видимый контент не скрываем повторно при запуске JS.
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-in');
      else { io.observe(el); el.classList.add('is-pending'); }
    });
  }

  /* ──────────────────────────────────────────────────────────
     Кнопки «Узнать стоимость» подставляют тариф в форму
     ────────────────────────────────────────────────────────── */
  function initPlanButtons() {
    $$('[data-plan]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sel = $('#f-plan');
        if (sel) sel.value = btn.getAttribute('data-plan');
      });
    });
  }

  /* ──────────────────────────────────────────────────────────
     Форма заявки
     ────────────────────────────────────────────────────────── */
  function buildMessage(data) {
    var lines = [
      t('form.msg.title') + ' — ' + (CFG.brandName || 'YATOGO'),
      '',
      t('form.msg.name') + ': ' + data.name,
      t('form.msg.contact') + ': ' + data.contact
    ];
    if (data.service) lines.push(t('form.msg.service') + ': ' + data.service);
    if (data.plan)    lines.push(t('form.msg.plan') + ': ' + data.plan);
    if (data.comment) lines.push(t('form.msg.comment') + ': ' + data.comment);
    lines.push(t('form.msg.lang') + ': ' + lang.toUpperCase());
    return lines.join('\n');
  }

  function initForm() {
    var form = $('#leadForm');
    if (!form) return;
    $$('[data-service="ip"]').forEach(function (link) {
      link.addEventListener('click', function () { $('#f-service').value = 'ip'; });
    });
    var statusEl = $('#formStatus');
    var submitting = false;
    var submitButton = $('.form__submit', form);

    function setStatus(key, state) {
      if (!statusEl) return;
      statusEl.textContent = key ? t(key) : '';
      if (state) statusEl.setAttribute('data-state', state);
      else statusEl.removeAttribute('data-state');
    }
    function setError(inputId, errorId, key) {
      var input = $('#' + inputId), err = $('#' + errorId);
      if (err) err.textContent = key ? t(key) : '';
      if (input) {
        if (key) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
      }
      return !key;
    }

    ['f-name', 'f-phone'].forEach(function (id) {
      var el = $('#' + id);
      if (el) el.addEventListener('input', function () {
        el.removeAttribute('aria-invalid');
        var err = $('#e-' + (id === 'f-name' ? 'name' : 'phone'));
        if (err) err.textContent = '';
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (submitting) return;

      var data = {
        name:    $('#f-name').value.trim(),
        contact: $('#f-phone').value.trim(),
        service: $('#f-service').value === 'ip' ? t('form.service.ip') : $('#f-service').value.trim(),
        plan:    $('#f-plan').value.trim(),
        comment: $('#f-comment').value.trim(),
        lang:    lang
      };

      var ok = true;
      ok = setError('f-name',    'e-name',    data.name    ? '' : 'form.err.name')    && ok;
      ok = setError('f-phone',   'e-phone',   checkContact(data.contact))   && ok;
      var consent = $('#f-consent').checked;
      var ce = $('#e-consent');
      if (ce) ce.textContent = consent ? '' : t('form.err.consent');
      ok = consent && ok;

      if (!ok) {
        setStatus('', null);
        var firstBad = form.querySelector('[aria-invalid="true"]') || (!consent ? $('#f-consent') : null);
        if (firstBad) firstBad.focus();
        return;
      }

      var message = buildMessage(data);

      // Заглушка под бота: пока endpoint не задан, открываем Telegram
      // с уже готовым текстом — клиенту остаётся нажать «отправить».
      if (!CFG.leadEndpoint) {
        setStatus('form.status.tg', 'ok');
        window.open('https://t.me/' + tgHandle + '?text=' + encodeURIComponent(message), '_blank', 'noopener');
        form.reset();
        return;
      }

      submitting = true;
      submitButton.disabled = true;
      form.classList.add('is-busy');
      setStatus('form.status.pending', 'pending');

      fetch(CFG.leadEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead: data, message: message })
      })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          // No lead_success: HTTP 2xx alone does not confirm CRM acceptance.
          setStatus('form.status.ok', 'ok');
          form.reset();
        })
        .catch(function () {
          setStatus('form.status.error', 'error');
        })
        .then(function () {
          submitting = false;
          submitButton.disabled = false;
          form.classList.remove('is-busy');
        });
    });
    // В исходном HTML кнопка выключена: без JS данные не уйдут в URL через GET.
    $('.form__submit', form).disabled = false;
  }


  /* ──────────────────────────────────────────────────────────
     Отзывы: две бесконечные ленты
     ────────────────────────────────────────────────────────── */
  var AVATAR_COLORS = ['#0B7A5B', '#1F6FB2', '#7A4FB5', '#B5613A', '#2E8C8C', '#5B6B7A', '#A34A6B'];

  function esc(str) {
    return String(str).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function initials(name) {
    return name.split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase();
  }
  function reviewCard(rv, i) {
    var stars = '';
    for (var k = 1; k <= 5; k++) {
      stars += '<svg class="' + (k <= rv.s ? '' : 'off') + '" aria-hidden="true"><use href="#i-star"></use></svg>';
    }
    return '<figure class="review">'
      + '<div class="review__stars" role="img" aria-label="' + rv.s + '/5">' + stars + '</div>'
      + '<blockquote class="review__text">' + esc(rv.t[lang] || rv.t.ru) + '</blockquote>'
      + '<figcaption class="review__author">'
      +   '<span class="review__avatar" style="background:' + AVATAR_COLORS[i % AVATAR_COLORS.length] + '" aria-hidden="true">' + esc(initials(rv.n)) + '</span>'
      +   '<span><span class="review__name">' + esc(rv.n) + '</span><br>'
      +   '<span class="review__role">' + esc(rv.r[lang] || rv.r.ru) + '</span></span>'
      + '</figcaption></figure>';
  }
  function renderReviews() {
    var list = window.REVIEWS || [];
    var rows = $$('#reviewsMarquee .marquee__row');
    if (!rows.length || !list.length) return;
    var half = Math.ceil(list.length / rows.length);
    rows.forEach(function (row, r) {
      var html = '';
      list.slice(r * half, (r + 1) * half).forEach(function (rv, j) { html += reviewCard(rv, r * half + j); });
      // Дублируем набор: лента сдвигается на −50% и бесшовно начинается заново
      row.querySelector('.marquee__track').innerHTML = html + html.replace(/<figure class="review">/g, '<figure class="review" aria-hidden="true">');
    });
  }

  /* ──────────────────────────────────────────────────────────
     Трекер регистрации на первом экране
     ────────────────────────────────────────────────────────── */
  function initTracker() {
    var box = $('#tracker');
    if (!box) return;
    var steps = $$('.tracker__step', box);
    var bar = $('#trackerBar');
    var status = $('#trackerStatus');

    function setStatus(done) {
      box.classList.toggle('is-done', done);
      status.setAttribute('data-i18n', done ? 'tracker.done' : 'tracker.progress');
      status.textContent = t(done ? 'tracker.done' : 'tracker.progress');
    }
    function render(n) {            // n — сколько шагов завершено
      steps.forEach(function (el, i) {
        el.classList.toggle('is-done', i < n);
        el.classList.toggle('is-active', i === n);
      });
      bar.style.width = Math.round(n / steps.length * 100) + '%';
      setStatus(n >= steps.length);
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { render(steps.length); return; }

    var n = 0;
    render(0);
    (function tick() {
      n++;
      render(Math.min(n, steps.length));
      if (n >= steps.length) {
        setTimeout(function () { n = 0; render(0); setTimeout(tick, 900); }, 4200);
      } else {
        setTimeout(tick, 1100);
      }
    })();
  }


  /* ──────────────────────────────────────────────────────────
     Счётчики: «2 дня», «3», «100%» отсчитываются от нуля
     ────────────────────────────────────────────────────────── */
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function countUp(el) {
    var text = el.textContent;
    var m = text.match(/^(\D*)(\d+)(.*)$/);
    if (!m || REDUCED) return;
    var target = parseInt(m[2], 10), start = null, dur = 1200;
    el.setAttribute('data-counting', text);
    el.textContent = m[1] + '0' + m[3];
    function frame(ts) {
      if (start === null) start = ts;
      var k = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - k, 3);
      // язык могли переключить во время отсчёта — тогда просто останавливаемся
      if (el.getAttribute('data-counting') !== text) return;
      el.textContent = m[1] + Math.round(target * eased) + m[3];
      if (k < 1) requestAnimationFrame(frame);
      else el.removeAttribute('data-counting');
    }
    requestAnimationFrame(frame);
  }
  function initCounters() {
    var els = $$('[data-count]');
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        countUp(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ──────────────────────────────────────────────────────────
     Этапы: линия соединяет номера шагов и прорисовывается при скролле.
     Переходы между рядами идут по зазору между карточками, не по тексту.
     ────────────────────────────────────────────────────────── */
  function initStepsPath() {
    var grid = $('#stepsGrid');
    if (!grid) return;
    var svg = $('.steps__path', grid);
    var track = $('.steps__track', grid);
    var line = $('.steps__line', grid);
    var cards = $$('.step', grid);
    var total = 0, marks = [];

    function build() {
      var g = grid.getBoundingClientRect();
      var pts = cards.map(function (c) {
        var b = $('.step__num', c).getBoundingClientRect();
        var r = c.getBoundingClientRect();
        return { x: b.left + b.width / 2 - g.left, y: b.top + b.height / 2 - g.top,
                 left: r.left - g.left, top: r.top - g.top, bottom: r.bottom - g.top };
      });
      var d = 'M' + pts[0].x + ' ' + pts[0].y;
      for (var i = 1; i < pts.length; i++) {
        var a = pts[i - 1], b = pts[i];
        if (Math.abs(a.y - b.y) < 4) {
          d += ' L' + b.x + ' ' + b.y;                     // тот же ряд
        } else {
          var gapX = Math.min(a.left, b.left) - 10;         // слева от карточек
          var gapY = (a.bottom + b.top) / 2;                // между рядами
          if (Math.abs(a.x - b.x) < 4) {                    // одна колонка (телефон)
            d += ' L' + (a.left - 10) + ' ' + a.y + ' L' + (b.left - 10) + ' ' + b.y + ' L' + b.x + ' ' + b.y;
          } else {
            d += ' L' + (a.left - 10) + ' ' + a.y + ' L' + (a.left - 10) + ' ' + gapY +
                 ' L' + gapX + ' ' + gapY + ' L' + gapX + ' ' + b.y + ' L' + b.x + ' ' + b.y;
          }
        }
      }
      track.setAttribute('d', d);
      line.setAttribute('d', d);
      total = line.getTotalLength();
      line.style.strokeDasharray = total;
      // где на линии стоит каждый номер — чтобы подсвечивать пройденные шаги
      marks = pts.map(function (pt) {
        var best = 0, bestDist = Infinity;
        for (var s = 0; s <= total; s += 4) {
          var q = line.getPointAtLength(s);
          var dd = (q.x - pt.x) * (q.x - pt.x) + (q.y - pt.y) * (q.y - pt.y);
          if (dd < bestDist) { bestDist = dd; best = s; }
        }
        return best;
      });
      update();
    }

    function update() {
      var r = grid.getBoundingClientRect();
      var vh = window.innerHeight;
      // линия начинает рисоваться, когда верх сетки на 85% экрана, и заканчивает к 40%
      var progress = REDUCED ? 1 : (vh * 0.85 - r.top) / (r.height + vh * 0.45 - vh * 0.4);
      progress = Math.max(0, Math.min(1, progress));
      var drawn = total * progress;
      line.style.strokeDashoffset = total - drawn;
      cards.forEach(function (c, i) { c.classList.toggle('is-reached', drawn >= marks[i] - 1); });
    }

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { update(); ticking = false; });
    }, { passive: true });
    var t;
    window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(build, 150); });
    // шрифт и появление карточек меняют размеры — перестраиваем после них
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
    cards.forEach(function (c) { c.addEventListener('transitionend', function (e) { if (e.propertyName === 'transform') { clearTimeout(t); t = setTimeout(build, 60); } }); });
    setTimeout(build, 700);
    build();
  }


  /* ──────────────────────────────────────────────────────────
     Фон, живущий от прокрутки: пятна и контуры двери плывут
     с разной скоростью (параллакс). Только transform — без нагрузки.
     ────────────────────────────────────────────────────────── */
  function initScrollBg() {
    var layer = $('#scrollBg');
    if (!layer || REDUCED) return;
    var items = $$('[data-speed]', layer);
    var ticking = false;
    function apply() {
      var y = window.scrollY;
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      var p = y / max;                                   // 0…1 по всей странице
      items.forEach(function (el) {
        var sp = parseFloat(el.getAttribute('data-speed'));
        var rot = parseFloat(el.getAttribute('data-rot') || 0);
        var dx = parseFloat(el.getAttribute('data-dx') || 0);
        el.style.transform = 'translate3d(' + (dx * p) + 'px,' + (-y * sp) + 'px,0) rotate(' + (rot * p) + 'deg)';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    }, { passive: true });
    apply();
  }


  /* ──────────────────────────────────────────────────────────
     Маска телефона: +998 90 123 45 67.
     Поле принимает и Telegram-ник (@username), и иностранные номера
     (+90…, +7…) — их не переформатируем в узбекский вид.
     ────────────────────────────────────────────────────────── */
  function formatUz(d) {                    // d — цифры, начиная с 998
    d = d.slice(0, 12);
    var out = '+' + d.slice(0, 3);
    if (d.length > 3)  out += ' ' + d.slice(3, 5);
    if (d.length > 5)  out += ' ' + d.slice(5, 8);
    if (d.length > 8)  out += ' ' + d.slice(8, 10);
    if (d.length > 10) out += ' ' + d.slice(10, 12);
    return out;
  }
  function phoneKind(v) {
    v = v.trim();
    if (!v) return 'empty';
    if (/^@|^[a-z_]/i.test(v)) return 'username';
    var digits = v.replace(/\D/g, '');
    if (v.charAt(0) === '+') {
      if ('998'.indexOf(digits) === 0) return 'typing';     // «+», «+9», «+99» — ещё непонятно, чей номер
      if (digits.indexOf('998') !== 0) return 'foreign';    // +90…, +7… — иностранный
    }
    return 'uz';
  }
  function checkContact(v) {                // → ключ ошибки или ''
    var kind = phoneKind(v), digits = v.replace(/\D/g, '');
    if (kind === 'empty') return 'form.err.phone';
    if (kind === 'username') return v.replace(/^@/, '').length >= 4 ? '' : 'form.err.phone';
    if (kind === 'foreign' || kind === 'typing') return digits.length >= 8 ? '' : 'form.phone.err.short';
    return digits.length === 12 ? '' : 'form.phone.err.short';
  }
  function initPhoneMask() {
    var input = $('#f-phone');
    if (!input) return;
    input.addEventListener('focus', function () {
      if (!input.value) { input.value = '+998 '; }
    });
    input.addEventListener('blur', function () {
      if (/^\+?998\s*$/.test(input.value.trim())) input.value = '';
    });
    input.addEventListener('input', function (e) {
      var v = input.value;
      var kind = phoneKind(v);
      if (kind === 'username') { input.value = v.replace(/\s/g, ''); return; }
      if (kind === 'foreign')  { input.value = '+' + v.replace(/[^\d ]/g, '').replace(/^\s+/, '').slice(0, 20); return; }
      if (kind === 'empty' || kind === 'typing') return;
      // сколько цифр стояло до курсора — чтобы вернуть курсор на то же место
      var caret = input.selectionStart || v.length;
      var before = v.slice(0, caret).replace(/\D/g, '').length;
      var digits = v.replace(/\D/g, '');
      // к автоподставленному +998 дописали номер целиком, с 998 — убираем дубль
      if (digits.indexOf('998998') === 0) { digits = digits.slice(3); before = Math.max(3, before - 3); }
      if (digits.indexOf('998') !== 0) {
        // набрали местный номер (90 123 45 67) — дописываем код страны
        before += '998'.startsWith(digits) ? 0 : 3;
        digits = '998'.startsWith(digits) ? '998' : '998' + digits;
      }
      var out = formatUz(digits);
      input.value = out;
      if (e.inputType && e.inputType.indexOf('delete') === 0 && before <= 3) return;
      var pos = 0, seen = 0;
      while (pos < out.length && seen < before) { if (/\d/.test(out.charAt(pos))) seen++; pos++; }
      try { input.setSelectionRange(pos, pos); } catch (err) {}
    });
  }

  /* ──────────────────────────────────────────────────────────
     Подбор тарифа за 3 вопроса
     ────────────────────────────────────────────────────────── */
  var QUIZ = [
    { q: 'quiz.q1', opts: ['quiz.q1.a', 'quiz.q1.b'] },               // учредители: один / несколько
    { q: 'quiz.q2', opts: ['quiz.q2.a', 'quiz.q2.b'] },               // иностранный директор с разрешением
    { q: 'quiz.q3', opts: ['quiz.q3.a', 'quiz.q3.b', 'quiz.q3.c'] }   // срочность
  ];
  var PLAN_DAYS = { Classic: 10, Business: 5, Premium: 2 };
  var quizAnswers = [];

  // Правила взяты из таблицы тарифов: разрешение на работу и срок 2 дня —
  // только Premium; больше одного учредителя и срок 5 дней — от Business.
  function pickPlan(a) {
    if (a[1] === 1) return { plan: 'Premium',  why: 'quiz.why.premium.permit' };
    if (a[2] === 2) return { plan: 'Premium',  why: 'quiz.why.premium.fast' };
    if (a[0] === 1 || a[2] === 1) return { plan: 'Business', why: 'quiz.why.business' };
    return { plan: 'Classic', why: 'quiz.why.classic' };
  }

  function renderQuiz() {
    var body = $('#quizBody');
    if (!body) return;
    $('#quiz').hidden = false;
    var step = quizAnswers.length;
    var html;
    if (step < QUIZ.length) {
      var item = QUIZ[step], dots = '';
      for (var i = 0; i < QUIZ.length; i++) dots += '<span class="' + (i <= step ? 'on' : '') + '"></span>';
      html = '<div class="quiz__panel">'
        + '<div class="quiz__meta"><span>' + esc(t('quiz.step')) + ' ' + (step + 1) + ' ' + esc(t('quiz.of')) + ' ' + QUIZ.length + '</span>'
        + '<span class="quiz__dots" aria-hidden="true">' + dots + '</span></div>'
        + '<p class="quiz__q">' + esc(t(item.q)) + '</p>'
        + '<div class="quiz__opts">'
        + item.opts.map(function (k, i) { return '<button type="button" class="quiz__opt" data-answer="' + i + '">' + esc(t(k)) + '</button>'; }).join('')
        + '</div>'
        + (step > 0 ? '<button type="button" class="quiz__back" data-quiz="back">← ' + esc(t('quiz.back')) + '</button>' : '')
        + '</div>';
    } else {
      var r = pickPlan(quizAnswers);
      html = '<div class="quiz__panel quiz__result">'
        + '<span class="quiz__label">' + esc(t('quiz.result')) + '</span>'
        + '<div class="quiz__plan"><span class="quiz__plan-name">' + r.plan + '</span>'
        + '<span class="quiz__plan-days"><b>' + esc(t('plans.days' + PLAN_DAYS[r.plan])) + '</b> ' + esc(t('quiz.days')) + '</span></div>'
        + '<p class="quiz__why">' + esc(t(r.why)) + '</p>'
        + '<div class="quiz__actions">'
        + '<button type="button" class="btn btn--primary" data-quiz="choose" data-plan-pick="' + r.plan + '">' + esc(t('quiz.choose')) + '</button>'
        + '<button type="button" class="btn btn--ghost" data-quiz="restart">' + esc(t('quiz.restart')) + '</button>'
        + '</div></div>';
    }
    body.innerHTML = html;
    // подсветить рекомендованную карточку тарифа
    $$('.plan').forEach(function (card) {
      var btn = $('[data-plan]', card);
      var picked = step >= QUIZ.length && btn && btn.getAttribute('data-plan') === pickPlan(quizAnswers).plan;
      card.classList.toggle('is-picked', !!picked);
    });
  }

  function initQuiz() {
    var body = $('#quizBody');
    if (!body) return;
    body.addEventListener('click', function (e) {
      var opt = e.target.closest('[data-answer]');
      var act = e.target.closest('[data-quiz]');
      if (opt) {
        quizAnswers.push(parseInt(opt.getAttribute('data-answer'), 10));
        renderQuiz();
        var first = $('.quiz__opt, [data-quiz="choose"]', body);
        if (first && e.detail === 0) first.focus();   // для клавиатуры — фокус на следующий шаг
        return;
      }
      if (!act) return;
      var a = act.getAttribute('data-quiz');
      if (a === 'back')    { quizAnswers.pop(); renderQuiz(); }
      if (a === 'restart') { quizAnswers = []; renderQuiz(); }
      if (a === 'choose') {
        var sel = $('#f-plan');
        if (sel) sel.value = act.getAttribute('data-plan-pick');
        var contact = $('#contact');
        if (contact) contact.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
        setTimeout(function () { var n = $('#f-name'); if (n) n.focus({ preventScroll: true }); }, REDUCED ? 0 : 600);
      }
    });
    renderQuiz();
  }

  /* ──────────────────────────────────────────────────────────
     Меню: подсвечиваем раздел, который сейчас на экране
     ────────────────────────────────────────────────────────── */
  function initScrollSpy() {
    var links = $$('.nav a[href^="#"], .mobile-nav a[href^="#"]');
    var ids = [];
    links.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      if (id && ids.indexOf(id) === -1 && document.getElementById(id)) ids.push(id);
    });
    if (!ids.length || !('IntersectionObserver' in window)) return;
    function mark(id) {
      links.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + id;
        a.classList.toggle('is-current', on);
        if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
    }
    // «текущий» — тот раздел, который пересекает середину экрана
    var first = document.getElementById(ids[0]);
    function aboveFirst() { return first.getBoundingClientRect().top > window.innerHeight * 0.5; }
    var io = new IntersectionObserver(function (entries) {
      if (aboveFirst()) { mark(''); return; }
      entries.forEach(function (e) { if (e.isIntersecting) mark(e.target.id); });
    }, { rootMargin: '-45% 0px -54% 0px' });
    ids.forEach(function (id) { io.observe(document.getElementById(id)); });
    // выше первого раздела — ничего не подсвечиваем
    window.addEventListener('scroll', function () { if (aboveFirst()) mark(''); }, { passive: true });
  }


  /* ──────────────────────────────────────────────────────────
     Отзывы на сенсорных экранах: лента сама медленно едет через
     scrollLeft (а не CSS-анимацию), поэтому её можно листать пальцем.
     Пока палец на ленте и 2,5 с после — автопрокрутка стоит.
     ────────────────────────────────────────────────────────── */
  function initTouchReviews() {
    var mq = window.matchMedia('(hover: none), (max-width: 900px)');
    if (!mq.matches) return;
    $$('#reviewsMarquee .marquee__row').forEach(function (row, idx) {
      var dir = idx % 2 ? -1 : 1;                    // вторая лента едет навстречу
      var speed = 0.35;                              // пикселей за кадр
      var pos = null, pausedUntil = 0, touching = false;
      var track = $('.marquee__track', row);
      // период петли: набор карточек продублирован, между наборами — такой же зазор 18px
      function half() { return (track.offsetWidth + 18) / 2; }
      function pause() { pausedUntil = performance.now() + 2500; }
      row.addEventListener('touchstart', function () { touching = true; }, { passive: true });
      row.addEventListener('touchend',   function () { touching = false; pause(); }, { passive: true });
      row.addEventListener('pointerdown', pause);
      row.addEventListener('wheel', pause, { passive: true });
      (function frame(now) {
        var h = half();
        if (pos === null && h > 0) { pos = dir > 0 ? 0 : h; row.scrollLeft = pos; }
        if (pos !== null) {
          if (touching || now < pausedUntil || REDUCED) {
            pos = row.scrollLeft;                    // подхватываем место, куда долистал человек
          } else {
            pos += speed * dir;
            row.scrollLeft = pos;
          }
          // бесшовная петля: перескакиваем на такую же карточку в другой половине
          if (pos >= h) { pos -= h; row.scrollLeft = pos; }
          else if (pos <= 0 && dir < 0) { pos += h; row.scrollLeft = pos; }
        }
        requestAnimationFrame(frame);
      })(performance.now());
    });
  }

  /* ──────────────────────────────────────────────────────────
     Таблицы: тень у закреплённой колонки и подсказка «листайте»
     ────────────────────────────────────────────────────────── */
  function initTables() {
    $$('.table-shell').forEach(function (shell) {
      var wrap = $('.table-wrap', shell);
      function upd() {
        var more = wrap.scrollWidth - wrap.clientWidth - wrap.scrollLeft > 4;
        shell.classList.toggle('has-more', more);
        wrap.classList.toggle('is-scrolled', wrap.scrollLeft > 2);
      }
      wrap.addEventListener('scroll', upd, { passive: true });
      window.addEventListener('resize', upd);
      upd();
    });
  }

  /* Нижняя панель на телефоне: появляется после первого экрана,
     прячется у формы, чтобы не дублировать её и не закрывать кнопку «Отправить» */
  function initMobileBar() {
    var bar = $('.mbar');
    if (!bar) return;
    var hero = $('.hero__cta'), contact = $('#contact');   // кнопки первого экрана ушли — показываем панель
    function upd() {
      var pastHero = hero ? hero.getBoundingClientRect().bottom < 0 : true;
      var r = contact ? contact.getBoundingClientRect() : null;
      var atForm = r ? (r.top < window.innerHeight && r.bottom > 0) : false;
      bar.classList.toggle('is-visible', pastHero && !atForm);
    }
    window.addEventListener('scroll', upd, { passive: true });
    upd();
  }

  /* ────────────────────────────────────────────────────────── */
  function init() {
    buildCompareTable();   // до перевода: строки таблицы тоже несут data-i18n
    applyConfig();
    lang = detectLang();
    setLang(lang, false);
    window.addEventListener('popstate', function () { setLang(detectLang(), false); });
    initMetrikaGoals();
    initHeader();
    initReveal();
    initTracker();
    initCounters();
    initStepsPath();
    initScrollBg();
    initPhoneMask();
    initQuiz();
    initScrollSpy();
    initTouchReviews();
    initTables();
    initMobileBar();
    initPlanButtons();
    initForm();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
