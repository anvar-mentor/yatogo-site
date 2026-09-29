/**
 * Конфигурация сайта. Всё, что нужно менять — здесь.
 * Строки, помеченные TODO, пока заглушки.
 */
window.SITE_CONFIG = {
  // ─── Бренд ────────────────────────────────────────────────────────────
  brandName: 'YATOGO',

  // ─── Контакты в кнопках ───────────────────────────────────────────────
  telegram: 'anwaryul',                 // t.me/anwaryul
  whatsapp: '998502259898',             // wa.me/998502259898
  phoneDisplay: '+998 50 225 98 98',
  email: 'info.yatogo@gmail.com',
  addressRu: "Xorazm viloyati, Urganch shahar, Umid MFY, Gurlan ko'chasi, 9/1-uy, 36-xonadon",
  addressUz: "Xorazm viloyati, Urganch shahar, Umid MFY, Gurlan ko'chasi, 9/1-uy, 36-xonadon",
  addressEn: "Xorazm viloyati, Urganch shahar, Umid MFY, Gurlan ko'chasi, 9/1-uy, 36-xonadon",

  // ─── Форма заявки ─────────────────────────────────────────────────────
  // Заглушка под бота. Пока leadEndpoint пустой, форма собирает ответы
  // и открывает ваш Telegram (@anwaryul) с уже готовым текстом заявки —
  // клиенту остаётся нажать «отправить».
  // Когда поднимете функцию (см. api/lead.js и README.md) — впишите '/api/lead',
  // и заявка будет приходить боту сама, без перехода в мессенджер.
  leadEndpoint: '',                     // TODO: '/api/lead' после деплоя функции
};
