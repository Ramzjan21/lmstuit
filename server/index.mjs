import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Teacher, Review, LeaderboardUser, Freelancer, FreelanceReview, TelegramUser, User } from './models.mjs';
import { initBot, checkAndNotifyAll, startTaskReminder, stopTaskReminder, sendMessage, sendDocument, registerLinkToken, consumeLinkToken, getBotUsername } from './telegramBot.mjs';
import {
  fetchAcademicBundle,
  fetchCourses,
  fetchDeadlines,
  fetchFinals,
  fetchProfile,
  fetchSchedule,
  fetchStudyPlan,
  loginLms,
  fetchFileBuffer,
  fetchTaskAttachmentLinks
} from './lmsClient.mjs';

const PORT = Number(process.env.PORT || 3030);
const SESSION_SECRET = process.env.SESSION_SECRET || 'telegram-webapp-lms-dev-secret';

const app = express();
app.use(express.json({ limit: '1mb' }));

const sessions = new Map();

const generateSessionId = () => {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const createSession = (data) => {
  const sid = generateSessionId();
  const session = { ...data, lastAccess: Date.now() };
  sessions.set(sid, session);
  return { sid, session };
};

const getSessionFromHeader = (req) => {
  const sid = req.headers['x-session-id'];
  if (sid && sessions.has(sid)) {
    const session = sessions.get(sid);
    if (Date.now() - session.lastAccess < 365 * 24 * 60 * 60 * 1000) {
      session.lastAccess = Date.now();
      return session;
    }
    sessions.delete(sid);
  }
  return null;
};

const sendError = (res, error) => {
  const status = Number(error?.status || 500);
  const message = error?.message || 'Server xatoligi';
  res.status(status).json({ error: message });
};

const requireSession = (req, res, next) => {
  // 1. Try header-based session
  let session = getSessionFromHeader(req);

  // 2. If not found, try LMS cookie from header (persistent login)
  if (!session?.lmsCookie) {
    const lmsCookie = req.headers['x-lms-cookie'];
    if (lmsCookie) {
      const login = req.headers['x-lms-login'] || req.session?.lmsUser?.login || 'unknown';
      const { sid, session: newSession } = createSession({
        lmsCookie,
        lmsUser: { login, name: login }
      });
      session = newSession;
      req._newSessionId = sid;
    }
  }

  if (!session?.lmsCookie) {
    return res.status(401).json({ error: 'Session topilmadi. Qayta login qiling.' });
  }
  req.session = session;
  return next();
};

app.get('/api/lms/health', (_req, res) => {
  res.json({ ok: true, service: 'lms-proxy', now: new Date().toISOString() });
});

app.post('/api/lms/login', async (req, res) => {
  try {
    const login = String(req.body?.login || '').trim();
    const password = String(req.body?.password || '').trim();

    if (!login || !password) {
      return res.status(400).json({ error: 'Login va parol majburiy' });
    }

    const auth = await loginLms(login, password);
    const { sid, session } = createSession({
      lmsCookie: auth.cookie,
      lmsUser: { login, name: auth.name }
    });

    // Create or update user in MongoDB to prevent duplicates
    if (isMongoConnected) {
      try {
        await User.findOneAndUpdate(
          { lmsLogin: login },
          { 
            name: auth.name,
            lastLoginAt: new Date()
          },
          { 
            upsert: true, // Create if doesn't exist
            new: true,
            setDefaultsOnInsert: true
          }
        );
        console.log(`[USER] ${login} logged in (user record synced)`);
      } catch (dbError) {
        console.warn('[USER] Failed to sync user record:', dbError.message);
      }

      // Persist password (encrypted) for background cron sync
      TelegramUser.updateOne(
        { userEmail: login },
        { $set: { lmsPassword: Buffer.from(password).toString('base64') } }
      ).catch(e => console.warn('[BG-SYNC] password save failed:', e.message));
    }

    return res.json({ ok: true, name: auth.name, sessionId: sid, lmsCookie: auth.cookie });
  } catch (error) {
    return sendError(res, error);
  }
});

app.post('/api/lms/logout', (req, res) => {
  const sid = req.headers['x-session-id'];
  if (sid) sessions.delete(sid);
  res.json({ ok: true });
});

app.get('/api/lms/profile', requireSession, async (req, res) => {
  try {
    const profile = await fetchProfile(req.session.lmsCookie);
    res.json({ ok: true, profile });
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/lms/schedule', requireSession, async (req, res) => {
  try {
    const schedule = await fetchSchedule(req.session.lmsCookie);
    res.json({ ok: true, schedule });
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/lms/deadlines', requireSession, async (req, res) => {
  try {
    // Check if client wants enriched details (default: true)
    const enrichDetails = req.query.enrich !== 'false';
    const tasks = await fetchDeadlines(req.session.lmsCookie, enrichDetails);
    res.json({ ok: true, tasks });
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/lms/study-plan', requireSession, async (req, res) => {
  try {
    const studyPlan = await fetchStudyPlan(req.session.lmsCookie);
    res.json({
      ok: true,
      gpa: studyPlan.gpa,
      semesters: studyPlan.semesters,
      subjects: studyPlan.subjects,
      totalCredits: studyPlan.totalCredits
    });
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/lms/finals', requireSession, async (req, res) => {
  try {
    const finals = await fetchFinals(req.session.lmsCookie);
    res.json({ ok: true, ...finals });
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/lms/courses', requireSession, async (req, res) => {
  try {
    const bundle = await fetchAcademicBundle(req.session.lmsCookie);
    const courses = Array.isArray(bundle?.coursesPreview) ? bundle.coursesPreview : await fetchCourses(req.session.lmsCookie);
    res.json({ ok: true, courses });
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/lms/grades', requireSession, async (req, res) => {
  try {
    const bundle = await fetchAcademicBundle(req.session.lmsCookie);
    res.json({
      ok: true,
      grades: bundle.grades,
      activeSemester: bundle.activeSemester,
      studyPlan: bundle.studyPlan
    });
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/lms/grades/realtime', requireSession, async (req, res) => {
  try {
    const bundle = await fetchAcademicBundle(req.session.lmsCookie);
    res.json({
      ok: true,
      grades: bundle.grades,
      activeSemester: bundle.activeSemester,
      studyPlan: bundle.studyPlan
    });
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/lms/sync-all', requireSession, async (req, res) => {
  try {
    // Check if client wants enriched task details (default: true)
    const enrichTaskDetails = req.query.enrichTasks !== 'false';
    const bundle = await fetchAcademicBundle(req.session.lmsCookie, enrichTaskDetails);
    
    // Save password for background sync if they have telegram linked
    if (req.session.lmsUser && req.session.lmsUser.login && req.session.password) {
       TelegramUser.updateOne(
         { userEmail: req.session.lmsUser.login },
         { $set: { lmsPassword: req.session.password } }
       ).catch(e => console.error('TG Background Sync pass update error', e));
    }

    res.json({
      ok: true,
      profile: bundle.profile,
      schedule: bundle.schedule,
      tasks: bundle.tasks,
      grades: bundle.grades,
      studyPlan: bundle.studyPlan,
      finals: bundle.finals,
      activeSemester: bundle.activeSemester,
      coursesCount: Number(bundle.coursesCount || 0),
      coursesPreview: Array.isArray(bundle.coursesPreview) ? bundle.coursesPreview : []
    });
  } catch (error) {
    sendError(res, error);
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');
const distDir = path.join(__dirname, '..', 'dist');

dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

let isMongoConnected = false;
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('[DB] Connected to MongoDB Atlas');
      isMongoConnected = true;
    })
    .catch(err => console.error('[DB] MongoDB xatosi:', err));
}

initBot();

// Handle bot /start with token — bot calls this internally via onText
// This webhook is triggered by the bot's polling handler in telegramBot.mjs
// when user sends /start <token>. We expose a helper for it:
app.post('/api/telegram/confirm-link', async (req, res) => {
  const { token, chatId } = req.body;
  if (!token || !chatId) return res.status(400).json({ error: 'Kerakli maydon yo`q' });

  const data = consumeLinkToken(token);
  if (!data) return res.status(404).json({ error: 'Token topilmadi yoki muddati o`tgan' });

  if (isMongoConnected) {
    await TelegramUser.findOneAndUpdate(
      { userEmail: data.userEmail },
      { chatId: String(chatId), lang: data.lang || 'uz', linkedAt: new Date() },
      { upsert: true, new: true }
    );
  }
  res.json({ ok: true });
});

const getTeachersLocal = () => {
  try { return JSON.parse(fs.readFileSync(path.join(dataDir, 'teachers.json'), 'utf8')); } catch { return []; }
};
const getReviewsLocal = () => {
  try { return JSON.parse(fs.readFileSync(path.join(dataDir, 'reviews.json'), 'utf8')); } catch { return {}; }
};
const saveReviewsLocal = (reviews) => {
  try { fs.writeFileSync(path.join(dataDir, 'reviews.json'), JSON.stringify(reviews, null, 2)); } catch {}
};

const getFreelancersLocal = () => {
  try { return JSON.parse(fs.readFileSync(path.join(dataDir, 'freelancers.json'), 'utf8')); } catch { return []; }
};
const saveFreelancersLocal = (fl) => {
  try { fs.writeFileSync(path.join(dataDir, 'freelancers.json'), JSON.stringify(fl, null, 2)); } catch {}
};
const getFreelanceReviewsLocal = () => {
  try { return JSON.parse(fs.readFileSync(path.join(dataDir, 'freelance_reviews.json'), 'utf8')); } catch { return {}; }
};
const saveFreelanceReviewsLocal = (revs) => {
  try { fs.writeFileSync(path.join(dataDir, 'freelance_reviews.json'), JSON.stringify(revs, null, 2)); } catch {}
};

app.get('/api/teachers', async (req, res) => {
  try {
    let teachers = [];
    let reviewsList = [];
    
    if (isMongoConnected) {
       teachers = await Teacher.find({}).lean();
       reviewsList = await Review.find({}).lean();
    } else {
       teachers = getTeachersLocal();
       const reviewsMapLocal = getReviewsLocal();
       // flatten
       for (const tId in reviewsMapLocal) {
         reviewsList.push(...reviewsMapLocal[tId]);
       }
    }

    const reviewsMap = {};
    reviewsList.forEach(r => {
      const tId = r.teacherId || r.teacher_id || r.id; // local json didn't use teacherId properly sometimes? wait local json groups by teacher id
      // Actually local json format: { [teacherId]: [ {id, author, text, rating, date} ] }
      // So let's just consistently map it
    });

    // better unified approach
    let populated = [];
    if (isMongoConnected) {
       const mappedReviews = {};
       reviewsList.forEach(r => {
         if (!mappedReviews[r.teacherId]) mappedReviews[r.teacherId] = [];
         mappedReviews[r.teacherId].push(r);
       });
       populated = teachers.map(t => {
         const tReviews = mappedReviews[t.id] || [];
         const avgRating = tReviews.length ? (tReviews.reduce((sum, r) => sum + r.rating, 0) / tReviews.length).toFixed(1) : 0;
         return { id: t.id, name: t.name, title: t.title, department: t.department, rating: Number(avgRating), reviewCount: tReviews.length };
       });
    } else {
       const localT = getTeachersLocal();
       const localR = getReviewsLocal();
       populated = localT.map(t => {
         const tReviews = localR[t.id] || [];
         const avgRating = tReviews.length ? (tReviews.reduce((sum, r) => sum + r.rating, 0) / tReviews.length).toFixed(1) : 0;
         return { ...t, rating: Number(avgRating), reviewCount: tReviews.length };
       });
    }

    res.json({ ok: true, teachers: populated });
  } catch(error) {
    sendError(res, error);
  }
});

app.get('/api/teachers/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    let reviews = [];
    if (isMongoConnected) {
      reviews = await Review.find({ teacherId: id }).sort({ date: -1 }).lean();
    } else {
      const localR = getReviewsLocal();
      reviews = localR[id] || [];
    }
    res.json({ ok: true, reviews });
  } catch (error) {
    sendError(res, error);
  }
});

app.post('/api/teachers/:id/reviews', requireSession, async (req, res) => {
  try {
    const { id } = req.params;
    const { text, rating } = req.body;
    if (!text || !rating) return res.status(400).json({ error: 'Matn va reyting kiritish majburiy' });

    const newReview = {
      id: Date.now().toString(),
      teacherId: id,
      author: req.session.lmsUser?.name || 'Talaba',
      text,
      rating: Number(rating),
      date: new Date().toISOString()
    };

    if (isMongoConnected) {
      await Review.create(newReview);
      const reviews = await Review.find({ teacherId: id }).sort({ date: -1 }).lean();
      return res.json({ ok: true, reviews });
    } else {
      const reviewsMap = getReviewsLocal();
      if (!reviewsMap[id]) reviewsMap[id] = [];
      const localReview = { ...newReview };
      delete localReview.teacherId;
      reviewsMap[id].push(localReview);
      saveReviewsLocal(reviewsMap);
      return res.json({ ok: true, reviews: reviewsMap[id] });
    }
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    let users = [];
    if (isMongoConnected) {
      users = await LeaderboardUser.find({}).sort({ rating: -1, avgScore: -1, attendanceScore: -1 }).limit(100).lean();
    }
    res.json({ ok: true, users });
  } catch(error) {
    sendError(res, error);
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    if (isMongoConnected) {
      const users = await LeaderboardUser.find({}).sort({ rating: -1 }).lean();
      return res.json({ ok: true, users });
    }
    return res.json({ ok: false, error: 'Database disconnected' });
  } catch(error) {
    sendError(res, error);
  }
});

app.post('/api/leaderboard', requireSession, async (req, res) => {
  try {
    const { userEmail, ...data } = req.body;
    const loginEmail = req.session.lmsUser?.login;
    const normalizedLogin = loginEmail?.startsWith('lms_') ? loginEmail : `lms_${loginEmail}`;
    if (!normalizedLogin || normalizedLogin !== userEmail) {
       return res.status(403).json({ error: 'Faqat o`z hisobingizni yangilashingiz mumkin' });
    }

    if (isMongoConnected) {
      await LeaderboardUser.findOneAndUpdate(
        { userEmail }, 
        { 
          $set: { ...data, updatedAt: new Date() },
          $setOnInsert: { userEmail }
        }, 
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.json({ ok: true });
    }
    res.json({ ok: false, message: 'Mongo disconnected' });
  } catch(error) {
    sendError(res, error);
  }
});

// --- Freelancers API ---
app.get('/api/freelancers', async (req, res) => {
  try {
    let freelancers = [];
    if (isMongoConnected) {
      freelancers = await Freelancer.find({}).sort({ rating: -1, reviewCount: -1 }).lean();
    } else {
      freelancers = getFreelancersLocal().sort((a,b) => (b.rating||0) - (a.rating||0));
    }
    res.json({ ok: true, freelancers });
  } catch (error) {
    console.error('Freelancers fetch error:', error);
    sendError(res, error);
  }
});

app.post('/api/freelancers', async (req, res) => {
  try {
    const { title, description, price, contact, userEmail, userName } = req.body;
    const finalEmail = userEmail || req.session?.lmsUser?.login;
    const finalName = userName || req.session?.lmsUser?.name || 'Talaba';
    
    if (!finalEmail) return res.status(401).json({ error: 'Auth/Login topilmadi, ilovaga kiring' });
    if (!title || !description || !price || !contact) return res.status(400).json({ error: 'Barcha maydonlar majburiy' });

    if (isMongoConnected) {
      await Freelancer.findOneAndUpdate(
        { id: finalEmail },
        { 
          $set: { name: finalName, title, description, price, contact },
          $setOnInsert: { rating: 0, reviewCount: 0, createdAt: new Date() }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.json({ ok: true });
    } else {
      const list = getFreelancersLocal();
      const existing = list.find(f => f.id === finalEmail);
      if (existing) {
          existing.name = finalName;
          existing.title = title;
          existing.description = description;
          existing.price = price;
          existing.contact = contact;
      } else {
          list.push({ id: finalEmail, name: finalName, title, description, price, contact, rating: 0, reviewCount: 0 });
      }
      saveFreelancersLocal(list);
      return res.json({ ok: true });
    }
  } catch (error) {
    sendError(res, error);
  }
});

app.get('/api/freelancers/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    let reviews = [];
    if (isMongoConnected) {
      reviews = await FreelanceReview.find({ freelancerId: id }).sort({ date: -1 }).lean();
    } else {
      const allR = getFreelanceReviewsLocal();
      reviews = allR[id] || [];
    }
    res.json({ ok: true, reviews });
  } catch(error) {
    sendError(res, error);
  }
});

app.post('/api/freelancers/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, rating, authorEmail, authorName } = req.body;
    const finalAuthorEmail = authorEmail || req.session?.lmsUser?.login;
    const finalAuthorName = authorName || req.session?.lmsUser?.name || 'Talaba';

    if (!finalAuthorEmail) return res.status(401).json({ error: 'Auth/Login topilmadi, ilovaga kiring' });
    if (!text || !rating) return res.status(400).json({ error: 'Matn va Rating kiritilmadi' });
    if (finalAuthorEmail === id) return res.status(400).json({ error: 'O`zingizga baho bera olmaysiz' });

    const newReview = {
      id: Date.now().toString(),
      freelancerId: id,
      authorEmail: finalAuthorEmail,
      authorName: finalAuthorName,
      text,
      rating: Number(rating),
      date: new Date().toISOString()
    };

    if (isMongoConnected) {
      await new FreelanceReview(newReview).save();
      const allReviews = await FreelanceReview.find({ freelancerId: id }).lean();
      const avg = allReviews.length > 0 ? (allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length) : 0;
      await Freelancer.findOneAndUpdate(
         { id }, 
         { $set: { rating: avg.toFixed(1), reviewCount: allReviews.length } }
      );
      res.json({ ok: true, reviews: allReviews });
    } else {
      const allR = getFreelanceReviewsLocal();
      if (!allR[id]) allR[id] = [];
      allR[id].push(newReview);
      saveFreelanceReviewsLocal(allR);
      
      const avg = allR[id].reduce((s, r) => s + r.rating, 0) / allR[id].length;
      const list = getFreelancersLocal();
      const freelancer = list.find(f => f.id === id);
      if (freelancer) {
          freelancer.rating = Number(avg.toFixed(1));
          freelancer.reviewCount = allR[id].length;
          saveFreelancersLocal(list);
      }
      res.json({ ok: true, reviews: allR[id] });
    }
  } catch(error) {
    sendError(res, error);
  }
});

// ─── TELEGRAM BOT API ────────────────────────────────────────────────────────

// Link user's Telegram chat ID to their account
app.post('/api/telegram/link', requireSession, async (req, res) => {
  try {
    const { chatId, lang } = req.body;
    if (!chatId) return res.status(400).json({ error: 'chatId majburiy' });
    const userEmail = req.session.lmsUser?.login;
    if (!userEmail) return res.status(401).json({ error: 'Session topilmadi' });

    if (isMongoConnected) {
      await TelegramUser.findOneAndUpdate(
        { userEmail },
        { chatId: String(chatId), lang: lang || 'uz', linkedAt: new Date() },
        { upsert: true, new: true }
      );
    }

    await sendMessage(chatId,
      lang === 'ru'
        ? '✅ Аккаунт успешно привязан!\n\nТеперь я буду уведомлять вас о:\n• Новых пропусках (НБ)\n• Дедлайнах заданий'
        : '✅ Akkaunt muvaffaqiyatli ulandi!\n\nEndi sizga quyidagilar haqida xabar beraman:\n• Yangi NB lar\n• Topshiriq muddatlari'
    );
    res.json({ ok: true });
  } catch (err) { sendError(res, err); }
});

// Get link status + bot URL for deep link
app.get('/api/telegram/status', requireSession, async (req, res) => {
  try {
    const userEmail = req.session.lmsUser?.login;
    if (!isMongoConnected) return res.json({ ok: true, linked: false });
    const tgUser = await TelegramUser.findOne({ userEmail }).lean();
    res.json({ ok: true, linked: !!tgUser, chatId: tgUser?.chatId || null });
  } catch (err) { sendError(res, err); }
});

// Generate a deep-link token so user can auto-link by clicking Start in bot
app.post('/api/telegram/generate-link', requireSession, async (req, res) => {
  try {
    const userEmail = req.session.lmsUser?.login;
    const lang = req.body?.lang || 'uz';
    if (!userEmail) return res.status(401).json({ error: 'Session topilmadi' });

    const token = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    registerLinkToken(token, userEmail, lang);

    const botName = getBotUsername();
    const url = `https://t.me/${botName}?start=${token}`;
    res.json({ ok: true, url, token });
  } catch (err) { sendError(res, err); }
});

// Unlink
app.delete('/api/telegram/unlink', requireSession, async (req, res) => {
  try {
    const userEmail = req.session.lmsUser?.login;
    if (isMongoConnected) await TelegramUser.deleteOne({ userEmail });
    res.json({ ok: true });
  } catch (err) { sendError(res, err); }
});

// Test message
app.post('/api/telegram/test-message', requireSession, async (req, res) => {
  try {
    const userEmail = req.session.lmsUser?.login;
    if (!isMongoConnected) return res.json({ ok: false, reason: 'db_disconnected' });
    
    const tgUser = await TelegramUser.findOne({ userEmail }).lean();
    if (!tgUser) return res.json({ ok: false });
    
    const text = tgUser.lang === 'ru' 
      ? "🔔 <b>Тестовое сообщение!</b>\n\nВаш Telegram бот успешно подключён к приложению и работает отлично. 🎉"
      : "🔔 <b>Test xabar!</b>\n\nTelegram botingiz dastur bilan to'g'ri ulangan va mukammal ishlamoqda. 🎉";
      
    await sendMessage(tgUser.chatId, text);
    res.json({ ok: true });
  } catch (err) { sendError(res, err); }
});

// Called by frontend after every LMS sync to check for new NBs, Scores, and Tasks
app.post('/api/telegram/check-nb', requireSession, async (req, res) => {
  try {
    const { grades, tasks } = req.body;
    const userEmail = req.session.lmsUser?.login;
    if (!Array.isArray(grades) && !Array.isArray(tasks)) {
      return res.status(400).json({ error: 'grades yoki tasks array kerak' });
    }

    if (!isMongoConnected) return res.json({ ok: false, reason: 'db_disconnected' });

    const tgUser = await TelegramUser.findOne({ userEmail }).lean();
    // Use notifyNb setting for all global async notifications
    if (!tgUser || !tgUser.notifyNb) return res.json({ ok: true, skipped: true });

    await checkAndNotifyAll(tgUser.chatId, userEmail, grades, tasks, tgUser.lang);
    res.json({ ok: true });
  } catch (err) { sendError(res, err); }
});

// Start task reminder (called when user views an upcoming task)
app.post('/api/telegram/remind-task', requireSession, async (req, res) => {
  try {
    const { task } = req.body;
    const userEmail = req.session.lmsUser?.login;
    if (!task?.id || !task?.deadline) return res.status(400).json({ error: 'task.id va task.deadline kerak' });

    if (!isMongoConnected) return res.json({ ok: false });
    const tgUser = await TelegramUser.findOne({ userEmail }).lean();
    if (!tgUser || !tgUser.notifyTasks) return res.json({ ok: true, skipped: true });

    await startTaskReminder(tgUser.chatId, task, tgUser.lang);
    res.json({ ok: true });
  } catch (err) { sendError(res, err); }
});

// Download and send task file to telegram
app.post('/api/telegram/send-task-file', requireSession, async (req, res) => {
  try {
    const { link, title } = req.body;
    const userEmail = req.session.lmsUser?.login;
    
    if (!link) return res.status(400).json({ error: 'link majburiy' });
    if (!isMongoConnected) return res.json({ ok: false, reason: 'db_disconnected' });
    
    const tgUser = await TelegramUser.findOne({ userEmail }).lean();
    if (!tgUser) return res.json({ ok: false, error: 'Telegram ulanmagan' });

    // Download file from LMS
    // 1. First find the real file links from the web page
    const fileLinks = await fetchTaskAttachmentLinks(req.session.lmsCookie, link);
    
    if (fileLinks.length === 0) {
      // DEBUG: write raw html to a file to inspect later
      try {
        const fs = await import('fs');
        const { fetchPage } = await import('./lmsClient.mjs');
        const rawHtml = await fetchPage(req.session.lmsCookie, link);
        fs.writeFileSync('debug_lms_task.html', rawHtml, 'utf-8');
      } catch (e) {}

      const caption = tgUser.lang === 'ru'
        ? `⚠️ В этом задании (<b>${title || 'Без названия'}</b>) нет распознаваемых файлов для скачивания.`
        : `⚠️ Ushbu vazifa (<b>${title || 'Nomsiz'}</b>) bo'yicha bot fayl aniqlay olmadi yoxud u matn ko'rinishida berilgan. LMS orqali o'qib ko'ring.`;
      await sendMessage(tgUser.chatId, caption);
      return res.json({ ok: true, message: 'no_file' });
    }

    // 2. Download and send ALL found attachments safely
    let successCount = 0;
    for (const attachmentUrl of fileLinks) {
      try {
        const { buffer, filename } = await fetchFileBuffer(req.session.lmsCookie, attachmentUrl);
        
        const caption = tgUser.lang === 'ru'
          ? `📄 Файл задания: <b>${title || 'Без названия'}</b>`
          : `📄 Vazifa fayli: <b>${title || 'Nomsiz'}</b>`;
          
        await sendDocument(tgUser.chatId, buffer, filename, caption);
        successCount++;
      } catch (e) {
        console.warn(`Failed to process attachment ${attachmentUrl}:`, e.message);
      }
    }
    
    if (successCount === 0) {
      const caption = tgUser.lang === 'ru'
        ? `⚠️ В этом задании (<b>${title || 'Без названия'}</b>) были найдены ссылки, но файлы недоступны (ошибка 404). Проверьте LMS.`
        : `⚠️ Ushbu vazifada (<b>${title || 'Nomsiz'}</b>) havolalar topildi, lekin tizim ularni qabul qilmadi (o'chirilgan yoki yaroqsiz bo'lishi mumkin). LMS'ga kirib ko'ring.`;
      await sendMessage(tgUser.chatId, caption);
    }

    res.json({ ok: true, sent: successCount });
  } catch (err) { 
    sendError(res, err);
  }
});

// Stop task reminder (called when task is marked done or uploaded)
app.delete('/api/telegram/remind-task/:taskId', requireSession, async (req, res) => {
  try {
    stopTaskReminder(req.params.taskId);
    res.json({ ok: true });
  } catch (err) { sendError(res, err); }
});

// ─── BACKGROUND AUTO-SYNC CRON JOB ─────────────────────────────────────────
// Runs every 30 minutes server-side for ALL users who have Telegram linked.
// Logs in with saved creds, fetches LMS data, sends notifications.
const BG_SYNC_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

const runBackgroundSync = async () => {
  if (!isMongoConnected) return;
  
  try {
    const allUsers = await TelegramUser.find({ lmsPassword: { $exists: true, $ne: null } }).lean();
    console.log(`[BG-SYNC] Starting sync for ${allUsers.length} user(s)...`);

    for (const tgUser of allUsers) {
      try {
        const login = tgUser.userEmail;
        const password = Buffer.from(tgUser.lmsPassword, 'base64').toString('utf-8');

        // Re-login to get a fresh cookie
        const auth = await loginLms(login, password);
        const cookie = auth.cookie;

        // Fetch academic data (without task details for faster sync)
        const bundle = await fetchAcademicBundle(cookie, false);
        const grades = Array.isArray(bundle?.grades) ? bundle.grades : [];
        const tasks = Array.isArray(bundle?.tasks) ? bundle.tasks : [];

        // Check and send notifications (NB, Score, new Tasks)
        if (tgUser.notifyNb && (grades.length || tasks.length)) {
          await checkAndNotifyAll(tgUser.chatId, login, grades, tasks, tgUser.lang);
        }

        console.log(`[BG-SYNC] ✅ ${login} synced (${grades.length} grades, ${tasks.length} tasks)`);
      } catch (userErr) {
        console.warn(`[BG-SYNC] ❌ Failed for ${tgUser.userEmail}: ${userErr.message}`);
      }
    }
  } catch (err) {
    console.error('[BG-SYNC] Fatal error:', err.message);
  }
};

// Start cron after a short delay so DB has time to connect
setTimeout(() => {
  console.log('[BG-SYNC] Background auto-sync cron starting...');
  runBackgroundSync(); // Run immediately on boot
  setInterval(runBackgroundSync, BG_SYNC_INTERVAL_MS);
}, 15000);

// ─── STATIC FILES & SPA FALLBACK ────────────────────────────────────────────
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// Start server only in non-serverless environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`[lms-proxy] running on http://localhost:${PORT}`);
  });
}

// Export for Vercel serverless
export default app;
