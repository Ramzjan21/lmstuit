import TelegramBot from 'node-telegram-bot-api';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'lmstuit1kbot';

let bot = null;

// Store for pending task reminders: Map<taskId, intervalId>
const taskReminders = new Map();

// Store for NB state per user: Map<userEmail, Map<subjectName, nbCount>>
const nbState = new Map();

// Temp link tokens: Map<token, {userEmail, lang, resolve}>
const pendingLinks = new Map();

export const initBot = (serverBaseUrl) => {
  if (!BOT_TOKEN) {
    console.warn('[TG-BOT] TELEGRAM_BOT_TOKEN topilmadi - bot ishga tushmadi');
    return null;
  }

  // On local dev, run without polling to avoid 409 conflict with Render instance.
  // Set ENABLE_TG_POLLING=true in .env.local only if you want polling locally.
  const isProduction = process.env.NODE_ENV === 'production';
  const forcePolling = process.env.ENABLE_TG_POLLING === 'true';
  const usePolling = isProduction || forcePolling;

  bot = new TelegramBot(BOT_TOKEN, { polling: usePolling });

  if (!usePolling) {
    console.log('[TG-BOT] Bot xabar yuborish rejimida (polling o\'chiq - lokal dev)');
    return bot;
  }

  console.log('[TG-BOT] Telegram bot polling rejimida ishga tushdi');

  const BASE = serverBaseUrl || `http://localhost:${process.env.PORT || 3030}`;

  // Handle /start command with deep link token
  bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
    const chatId = String(msg.chat.id);
    const token = (match[1] || '').trim();

    if (token) {
      try {
        // Tell the server: this chatId confirmed this token
        const res = await fetch(`${BASE}/api/telegram/confirm-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, chatId })
        });
        const data = await res.json();

        if (data.ok) {
          // Detect lang from token data (stored in linkTokens map)
          const text =
            `✅ <b>Akkaunt muvaffaqiyatli ulandi!</b>\n\n` +
            `Endi sizga quyidagilar haqida xabar beraman:\n` +
            `• 🔴 Yangi NB qo'yilganda\n` +
            `• ⏰ Topshiriq muddati yaqinlashganda (har 5 daqiqa)\n\n` +
            `O'qishlaringiz omadli bo'lsin! 🎓`;
          await sendMessage(chatId, text);
        } else {
          await sendMessage(chatId, '❌ Ulanish muddati o\'tgan. Ilovadan qayta urinib ko\'ring.');
        }
      } catch (e) {
        console.error('[TG-BOT] confirm-link xatosi:', e.message);
        await sendMessage(chatId, '⚠️ Server bilan bog\'liqlikda muammo. Biroz kutib qayta urinib ko\'ring.');
      }
    } else {
      await sendMessage(chatId,
        `👋 Salom! Men TATU LMS eslatma botiman.\n\n` +
        `📱 Ilovadagi <b>Sozlamalar → Telegram Bot</b> bo'limidan "Ulash" tugmasini bosib, avtomatik ulanasiz!`
      );
    }
  });

  bot.on('polling_error', (err) => {
    console.error('[TG-BOT] Polling xatosi:', err.message);
  });

  return bot;
};

/**
 * Generate a one-time token and return the bot deep link URL.
 * Returns a Promise that resolves with chatId when user clicks Start in bot.
 */
export const generateLinkToken = (userEmail, lang = 'uz') => {
  return new Promise((resolve) => {
    const token = `${userEmail}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const safeToken = Buffer.from(token).toString('base64').replace(/[+=\/]/g, '').slice(0, 64);

    pendingLinks.set(safeToken, { userEmail, lang, resolve });

    // Auto-expire after 10 minutes
    setTimeout(() => {
      if (pendingLinks.has(safeToken)) {
        pendingLinks.delete(safeToken);
        resolve(null); // timeout
      }
    }, 10 * 60 * 1000);

    resolve.__token = safeToken;
    resolve.__url = `https://t.me/${BOT_USERNAME}?start=${safeToken}`;
  });
};

/**
 * Create link token without waiting — returns {token, url}
 */
export const createLinkToken = (userEmail, lang = 'uz') => {
  const token = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  return new Promise((resolve) => {
    const waitForLink = (chatId) => {
      resolve(chatId);
    };

    pendingLinks.set(token, { userEmail, lang, resolve: waitForLink });

    // Auto-expire after 10 minutes
    setTimeout(() => {
      pendingLinks.delete(token);
    }, 10 * 60 * 1000);
  });
};

/**
 * Simple token registry — just store token and resolve when bot receives it
 */
const linkTokens = new Map(); // token -> { userEmail, lang }

export const registerLinkToken = (token, userEmail, lang) => {
  linkTokens.set(token, { userEmail, lang });
  setTimeout(() => linkTokens.delete(token), 10 * 60 * 1000);
};

export const consumeLinkToken = (token) => {
  const data = linkTokens.get(token);
  if (data) linkTokens.delete(token);
  return data || null;
};

export const getBotUsername = () => BOT_USERNAME;

export const sendMessage = async (chatId, text) => {
  if (!bot || !chatId) return;
  try {
    await bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
  } catch (err) {
    console.error('[TG-BOT] sendMessage xatosi:', err.message);
  }
};

export const checkAndNotifyNb = async (chatId, userEmail, grades, lang = 'uz') => {
  if (!bot || !chatId || !Array.isArray(grades)) return;

  const prevState = nbState.get(userEmail) || new Map();
  const newState = new Map();

  for (const subject of grades) {
    const name = subject.name || subject.title || 'Fan';
    const nb = Number(subject.nb || 0);
    const limit = Number(subject.limit || 0);
    newState.set(name, nb);

    const prevNb = prevState.get(name) ?? null;

    if (prevNb !== null && nb > prevNb) {
      const added = nb - prevNb;
      const remaining = limit > 0 ? limit - nb : '?';

      let text;
      if (lang === 'ru') {
        text =
          `⚠️ <b>Новый пропуск!</b>\n\n` +
          `📚 Предмет: <b>${name}</b>\n` +
          `🔴 Добавлено НБ: <b>+${added}</b>\n` +
          `📊 Всего НБ: <b>${nb}</b> из <b>${limit || '?'}</b>\n` +
          `✅ Осталось допустимых: <b>${remaining}</b>\n\n` +
          (remaining <= 2 && remaining >= 0 ? `🚨 <b>Внимание! Вы близко к лимиту!</b>` : `💡 Будьте внимательны на занятиях.`);
      } else {
        text =
          `⚠️ <b>Yangi NB qo'yildi!</b>\n\n` +
          `📚 Fan: <b>${name}</b>\n` +
          `🔴 Qo'shilgan NB: <b>+${added}</b>\n` +
          `📊 Jami NB: <b>${nb}</b> ta (limit: <b>${limit || '?'}</b>)\n` +
          `✅ Qolgan ruxsat: <b>${remaining}</b> ta\n\n` +
          (remaining <= 2 && remaining >= 0 ? `🚨 <b>Diqqat! Limitga yaqinlashyapsiz!</b>` : `💡 Darslarga qatnashing!`);
      }
      await sendMessage(chatId, text);
    }

    if (prevNb === null && limit > 0 && nb >= limit - 1 && nb > 0) {
      const remaining = limit - nb;
      const text = lang === 'ru'
        ? `🚨 <b>Почти у лимита!</b>\nПредмет: <b>${name}</b>\nНБ: ${nb}/${limit} — осталось ${remaining}`
        : `🚨 <b>Limitga yaqin!</b>\nFan: <b>${name}</b>\nNB: ${nb}/${limit} — qoldi ${remaining} ta`;
      await sendMessage(chatId, text);
    }
  }

  nbState.set(userEmail, newState);
};

export const startTaskReminder = async (chatId, task, lang = 'uz') => {
  if (!bot || !chatId || !task?.id) return;
  if (taskReminders.has(task.id)) return;

  const sendReminder = async () => {
    if (!task.deadline) return;
    const now = Date.now();
    const target = new Date(task.deadline).getTime();
    const diffMs = target - now;

    if (diffMs <= 0) {
      stopTaskReminder(task.id);
      const text = lang === 'ru'
        ? `❌ Срок задания истёк!\n📝 ${task.title || task.subject}`
        : `❌ Topshiriq muddati o'tdi!\n📝 ${task.title || task.subject}`;
      await sendMessage(chatId, text);
      return;
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const timeLeft = hours > 0
      ? (lang === 'ru' ? `${hours} ч ${minutes} мин` : `${hours} soat ${minutes} daqiqa`)
      : (lang === 'ru' ? `${minutes} минут` : `${minutes} daqiqa`);

    const text = lang === 'ru'
      ? `⏰ <b>Напоминание о задании!</b>\n\n📝 <b>${task.title || task.subject}</b>\n⏱ Осталось: <b>${timeLeft}</b>\n\nЗагрузите задание на LMS!`
      : `⏰ <b>Topshiriq eslatmasi!</b>\n\n📝 <b>${task.title || task.subject}</b>\n⏱ Qoldi: <b>${timeLeft}</b>\n\nTopshiriqni LMS ga yuklang!`;

    await sendMessage(chatId, text);
  };

  await sendReminder();
  const intervalId = setInterval(sendReminder, 5 * 60 * 1000);
  taskReminders.set(task.id, intervalId);
};

export const stopTaskReminder = (taskId) => {
  if (taskReminders.has(taskId)) {
    clearInterval(taskReminders.get(taskId));
    taskReminders.delete(taskId);
  }
};
