import express from 'express';
import session from 'express-session';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Teacher, Review, LeaderboardUser, Freelancer, FreelanceReview } from './models.mjs';
import {
  fetchAcademicBundle,
  fetchCourses,
  fetchDeadlines,
  fetchFinals,
  fetchProfile,
  fetchSchedule,
  fetchStudyPlan,
  loginLms
} from './lmsClient.mjs';

const PORT = Number(process.env.PORT || 3030);
const SESSION_SECRET = process.env.SESSION_SECRET || 'telegram-webapp-lms-dev-secret';

const app = express();
app.use(express.json({ limit: '1mb' }));

app.use(
  session({
    name: 'lms_webapp_sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

const sendError = (res, error) => {
  const status = Number(error?.status || 500);
  const message = error?.message || 'Server xatoligi';
  res.status(status).json({ error: message });
};

const requireSession = (req, res, next) => {
  if (!req.session?.lmsCookie) {
    return res.status(401).json({ error: 'Session topilmadi. Qayta login qiling.' });
  }
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
    req.session.lmsCookie = auth.cookie;
    req.session.lmsUser = {
      login,
      name: auth.name
    };

    return res.json({ ok: true, name: auth.name });
  } catch (error) {
    return sendError(res, error);
  }
});

app.post('/api/lms/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('lms_webapp_sid');
    res.json({ ok: true });
  });
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
    const tasks = await fetchDeadlines(req.session.lmsCookie);
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
    const bundle = await fetchAcademicBundle(req.session.lmsCookie);
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

const getTeachersLocal = () => {
  try { return JSON.parse(fs.readFileSync(path.join(dataDir, 'teachers.json'), 'utf8')); } catch { return []; }
};
const getReviewsLocal = () => {
  try { return JSON.parse(fs.readFileSync(path.join(dataDir, 'reviews.json'), 'utf8')); } catch { return {}; }
};
const saveReviewsLocal = (reviews) => {
  try { fs.writeFileSync(path.join(dataDir, 'reviews.json'), JSON.stringify(reviews, null, 2)); } catch {}
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
      // Local fallback
      const reviewsMap = getReviewsLocal();
      if (!reviewsMap[id]) reviewsMap[id] = [];
      const localReview = { ...newReview };
      delete localReview.teacherId; // keep original format
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

app.post('/api/leaderboard', requireSession, async (req, res) => {
  try {
    const { userEmail, ...data } = req.body;
    const loginEmail = req.session.lmsUser?.login;
    if (!loginEmail || loginEmail !== userEmail) {
       return res.status(403).json({ error: 'Faqat o`z hisobingizni yangilashingiz mumkin' });
    }

    if (isMongoConnected) {
      await LeaderboardUser.findOneAndUpdate(
        { userEmail }, 
        { ...data, userEmail, updatedAt: new Date() }, 
        { upsert: true, new: true }
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
    }
    res.json({ ok: true, freelancers });
  } catch (error) {
    sendError(res, error);
  }
});

app.post('/api/freelancers', requireSession, async (req, res) => {
  try {
    const { title, description, price, contact } = req.body;
    const userEmail = req.session.lmsUser?.login;
    const userName = req.session.lmsUser?.name;
    
    if (!userEmail) return res.status(401).json({ error: 'Auth required' });
    if (!title || !description || !price || !contact) return res.status(400).json({ error: 'Barcha maydonlar majburiy' });

    if (isMongoConnected) {
      await Freelancer.findOneAndUpdate(
        { id: userEmail },
        { id: userEmail, name: userName, title, description, price, contact },
        { upsert: true, new: true }
      );
      return res.json({ ok: true });
    }
    res.json({ ok: false, error: 'DB ishlamayapti' });
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
    }
    res.json({ ok: true, reviews });
  } catch(error) {
    sendError(res, error);
  }
});

app.post('/api/freelancers/:id/reviews', requireSession, async (req, res) => {
  try {
    const { id } = req.params;
    const { text, rating } = req.body;
    const authorEmail = req.session.lmsUser?.login;
    const authorName = req.session.lmsUser?.name;

    if (!authorEmail) return res.status(401).json({ error: 'Auth required' });
    if (!text || !rating) return res.status(400).json({ error: 'Matn/Rating majburiy' });
    if (authorEmail === id) return res.status(400).json({ error: 'O`zingizga baho bera olmaysiz' });

    if (isMongoConnected) {
      const newReview = new FreelanceReview({
        id: Date.now().toString(),
        freelancerId: id,
        authorEmail,
        authorName,
        text,
        rating: Number(rating)
      });
      await newReview.save();

      const allReviews = await FreelanceReview.find({ freelancerId: id }).lean();
      const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
      await Freelancer.findOneAndUpdate({ id }, { rating: avg.toFixed(1), reviewCount: allReviews.length });

      res.json({ ok: true, reviews: allReviews });
    } else {
      res.json({ ok: false, error: 'DB ishlamayapti' });
    }
  } catch(error) {
    sendError(res, error);
  }
});

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[lms-proxy] running on http://localhost:${PORT}`);
});
