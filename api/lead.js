/**
 * ЗАГЛУШКА ПОД TELEGRAM-БОТА.
 *
 * Серверная функция: принимает заявку с сайта и отправляет её вам в Telegram.
 * Формат — Vercel / Netlify Functions (Node.js). Пока не задеплоена,
 * сайт работает без неё: форма открывает ваш Telegram с готовым текстом.
 *
 * ЧТОБЫ ВКЛЮЧИТЬ:
 *   1. Создайте бота у @BotFather → получите TELEGRAM_BOT_TOKEN.
 *   2. Напишите боту любое сообщение, затем откройте
 *      https://api.telegram.org/bot<ТОКЕН>/getUpdates и возьмите оттуда chat.id
 *      → это TELEGRAM_CHAT_ID (для группы id будет отрицательным).
 *   3. Пропишите обе переменные в настройках хостинга
 *      (Vercel: Settings → Environment Variables).
 *   4. В site.config.js укажите leadEndpoint: '/api/lead'.
 *
 * ВАЖНО: токен живёт только здесь, в переменных окружения. В site.config.js
 * и вообще в любой файл, который отдаётся браузеру, его класть нельзя —
 * его увидит каждый посетитель.
 */

const RATE = new Map();          // примитивная защита от спама: IP → время
const RATE_WINDOW_MS = 20_000;   // не чаще одной заявки в 20 секунд с адреса

function escapeHtml(str) {
  return String(str).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

function clean(value, maxLength) {
  return String(value == null ? '' : value).trim().slice(0, maxLength);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    // Переменные не заданы — значит бота ещё не подключили.
    return res.status(503).json({ error: 'Telegram bot is not configured yet' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const last = RATE.get(ip);
  if (last && now - last < RATE_WINDOW_MS) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  RATE.set(ip, now);

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Bad JSON' }); }
  }
  const lead = (body && body.lead) || {};

  const name    = clean(lead.name, 100);
  const contact = clean(lead.contact, 100);
  if (!name || !contact) {
    return res.status(400).json({ error: 'Name and contact are required' });
  }

  const rows = [
    ['Имя', name],
    ['Контакт', contact],
    ['Услуга', clean(lead.service, 120)],
    ['Тариф', clean(lead.plan, 40)],
    ['Комментарий', clean(lead.comment, 2000)],
    ['Язык сайта', clean(lead.lang, 5).toUpperCase()],
  ].filter(([, value]) => value);

  const text =
    '<b>Новая заявка с сайта</b>\n\n' +
    rows.map(([label, value]) => `<b>${escapeHtml(label)}:</b> ${escapeHtml(value)}`).join('\n');

  try {
    const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    if (!tg.ok) {
      const detail = await tg.text();
      console.error('Telegram API error:', tg.status, detail);
      return res.status(502).json({ error: 'Telegram rejected the message' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Telegram request failed:', err);
    return res.status(502).json({ error: 'Could not reach Telegram' });
  }
}
