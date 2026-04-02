import TelegramBot from 'node-telegram-bot-api';

// BOT_TOKEN is read inside initBot() so dotenv has already loaded by then
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'lmstuit1kbot';

let bot = null;

// Store for pending task reminders: Map<taskId, intervalId>
const taskReminders = new Map();

// Global states per user
const nbState = new Map();
const scoreState = new Map();
const tasksState = new Map();

// Temp link tokens: Map<token, {userEmail, lang, resolve}>
const pendingLinks = new Map();

export const initBot = (serverBaseUrl) => {
  // Read AFTER dotenv has been loaded by index.mjs
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('[TG-BOT] TELEGRAM_BOT_TOKEN topilmadi - bot ishga tushmadi');
    return null;
  }

  // Only poll on Render (production) to prevent 409 conflicts with local dev.
  const isProduction = process.env.NODE_ENV === 'production';
  const forcePolling = process.env.ENABLE_TG_POLLING === 'true';
  const usePolling = isProduction || forcePolling;

  bot = new TelegramBot(token, { polling: usePolling });

  if (!usePolling) {
    console.log('[TG-BOT] Bot tayyor (xabar yuborish rejimi, polling o\'chiq - lokal dev)');
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
            `• 🌟 Yangi baho qo'yilganda\n` +
            `• 📝 Yangi topshiriq yuklanganda\n` +
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
    // Silently ignore 409 conflict (happens when 2 instances run at once)
    if (err.message && err.message.includes('409')) return;
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

export const sendDocument = async (chatId, buffer, filename, caption = '') => {
  if (!bot || !chatId || !buffer) return;
  try {
    const fileOptions = { filename, contentType: 'application/octet-stream' };
    await bot.sendDocument(chatId, buffer, { caption, parse_mode: 'HTML' }, fileOptions);
  } catch (err) {
    console.error('[TG-BOT] sendDocument xatosi:', err.message);
  }
};

export const checkAndNotifyAll = async (chatId, userEmail, grades, tasks, lang = 'uz') => {
  if (!bot || !chatId) return;

  // 1. Check Grades (NB and Score)
  if (Array.isArray(grades)) {
    const prevNbState = nbState.get(userEmail) || new Map();
    const prevScoreState = scoreState.get(userEmail) || new Map();
    const newNbState = new Map();
    const newScoreState = new Map();

    for (const subject of grades) {
      const name = subject.name || subject.title || 'Fan';
      const nb = Number(subject.nb || 0);
      const limit = Number(subject.limit || 0);
      const score = Number(subject.score || 0);

      newNbState.set(name, nb);
      newScoreState.set(name, score);

      const prevNb = prevNbState.get(name) ?? null;
      const prevScore = prevScoreState.get(name) ?? null;

      // a) NB Check
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

      // b) Score Check
      if (prevScore !== null && score > prevScore) {
        const added = score - prevScore;
        const text = lang === 'ru'
          ? `🎉 <b>Новая оценка!</b>\n\n📚 Предмет: <b>${name}</b>\n🌟 Добавлено: <b>+${added}</b>\n💎 Общий балл: <b>${score}</b>`
          : `🎉 <b>Yangi baho!</b>\n\n📚 Fan: <b>${name}</b>\n🌟 Qo'shildi: <b>+${added}</b>\n💎 Jami ball: <b>${score}</b>`;
        await sendMessage(chatId, text);
      }
    }

    nbState.set(userEmail, newNbState);
    scoreState.set(userEmail, newScoreState);
  }

  // 2. Check New Tasks
  if (Array.isArray(tasks)) {
    const prevTasks = tasksState.get(userEmail) || new Set();
    const newTasks = new Set();

    for (const task of tasks) {
      if (!task.id) continue;
      newTasks.add(task.id);

      if (prevTasks.size > 0 && !prevTasks.has(task.id)) {
        // format deadline beautifully if possible, skipping for brevity
        const text = lang === 'ru'
          ? `📝 <b>Новое задание!</b>\n\n📚 Предмет: <b>${task.subject || 'LMS'}</b>\n📌 Название: <b>${task.title}</b>\n⏳ Дедлайн: <b>${task.deadline || 'Не указан'}</b>\n\n📲 Проверьте подробности в приложении!`
          : `📝 <b>Yangi topshiriq yuklandi!</b>\n\n📚 Fan: <b>${task.subject || 'LMS'}</b>\n📌 Nomi: <b>${task.title}</b>\n⏳ Muddat: <b>${task.deadline || 'Kiritilmagan'}</b>\n\n📲 Ilovaga kirib batafsil tanishing!`;
        await sendMessage(chatId, text);
      }
    }

    if (prevTasks.size === 0 && tasks.length > 0) {
      tasks.forEach(t => { if (t.id) newTasks.add(t.id); });
    }

    tasksState.set(userEmail, newTasks);
  }
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
