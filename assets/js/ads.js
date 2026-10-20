/* ============================================================
   YATOGO — тег Google Ads и конверсии. Без зависимостей.
   Подключается на всех страницах рядом со счётчиком Метрики.
   ============================================================ */
(function () {
  'use strict';

  var ID = 'AW-18526692156';
  // Метки конверсий из Google Ads (Цели → Конверсии).
  var SEND_TO = {
    lead:     ID + '/n7lnCJrrqaMdELzGm4JF', // Успешная отправка заявки (основная)
    telegram: ID + '/11oICJ3rqaMdELzGm4JF', // Переход в Telegram (основная)
    whatsapp: ID + '/rfY2CKDrqaMdELzGm4JF', // Переход в WhatsApp (основная)
    phone:    ID + '/R3vWCKPrqaMdELzGm4JF', // Клик по номеру телефона (основная)
    email:    ID + '/ETxxCIbur6MdELzGm4JF', // Клик по email (дополнительная)
    apply:    ID + '/xBL2CInur6MdELzGm4JF'  // Клик «Оставить заявку» (дополнительная)
  };

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', ID);

  var tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  (document.head || document.documentElement).appendChild(tag);

  // Analytics failure must never interrupt navigation or form handling.
  function conversion(name) {
    if (!SEND_TO[name]) return;
    try { window.gtag('event', 'conversion', { send_to: SEND_TO[name] }); } catch (e) { /* blocked analytics */ }
  }
  window.yatogoAds = { conversion: conversion };

  // Same events as the Metrika goals: messenger, phone and e-mail links, and the
  // «Оставить заявку» buttons. Only real clicks count, not scripted ones.
  document.addEventListener('click', function (e) {
    if (!e.isTrusted || e.button !== 0 || !e.target.closest) return;
    var el = e.target.closest('a[href], [data-metrika-goal]');
    if (!el) return;
    if (el.getAttribute('data-metrika-goal') === 'cta_apply_click') conversion('apply');
    var href = el.getAttribute('href') || '';
    if (/^https?:\/\/(t\.me|telegram\.me)\//i.test(href)) conversion('telegram');
    else if (/^https?:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(href)) conversion('whatsapp');
    else if (/^tel:/i.test(href)) conversion('phone');
    else if (/^mailto:/i.test(href)) conversion('email');
  }, true);
})();
