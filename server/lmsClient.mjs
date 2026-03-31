import axios from 'axios';
import {
  buildAcademicBundle,
  parseCalendarJson,
  parseCourseDetail,
  parseCourseLinks,
  parseCourseSemesterId,
  parseCoursesFromJson,
  parseDeadlineEvents,
  parseFinalRows,
  parseProfile,
  parseScheduleEvents,
  parseStudyPlan,
  parseDashboardName
} from './lmsParser.mjs';

const LMS_URL = 'https://lms.tuit.uz';

const splitSetCookieHeader = (rawCookieHeader) => {
  if (!rawCookieHeader) return [];
  if (Array.isArray(rawCookieHeader)) return rawCookieHeader;
  return String(rawCookieHeader).split(/,(?=[^;\s]+=)/g);
};

const parseCookies = (headers = {}) => {
  const raw = headers['set-cookie'] ?? headers['Set-Cookie'] ?? '';
  return splitSetCookieHeader(raw)
    .map((cookie) => cookie.split(';')[0].trim())
    .filter(Boolean)
    .join('; ');
};

const mergeCookieStrings = (...cookieStrings) => {
  const map = new Map();

  cookieStrings
    .filter(Boolean)
    .join('; ')
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((pair) => {
      const index = pair.indexOf('=');
      if (index < 1) return;
      map.set(pair.slice(0, index), pair.slice(index + 1));
    });

  return Array.from(map.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
};

const createClient = (cookie = '') => {
  const instance = axios.create({
    baseURL: LMS_URL,
    timeout: 20000,
    maxRedirects: 0,
    validateStatus: () => true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (TelegramWebApp LMS Client)',
      Accept: 'text/html,application/json,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      ...(cookie ? { Cookie: cookie } : {})
    }
  });

  return instance;
};

const requireCookie = (cookie) => {
  if (!cookie) {
    const error = new Error('Session topilmadi. Qayta login qiling.');
    error.status = 401;
    throw error;
  }
};

const fetchPage = async (cookie, path, headers = {}) => {
  requireCookie(cookie);
  const client = createClient(cookie);
  const response = await client.get(path, {
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      ...headers
    }
  });

  if (response.status >= 400) {
    const error = new Error(`LMS page error: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.data;
};

export const loginLms = async (login, password) => {
  const client = createClient();

  const loginPage = await client.get('/auth/login');
  const initCookies = parseCookies(loginPage.headers);
  const token = String(loginPage.data).match(/name="_token"\s+value="([^"]+)"/i)?.[1] || '';

  const authResponse = await client.post(
    '/auth/login',
    `_token=${encodeURIComponent(token)}&login=${encodeURIComponent(login)}&password=${encodeURIComponent(password)}`,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: initCookies
      }
    }
  );

  const authCookies = parseCookies(authResponse.headers);
  const cookie = mergeCookieStrings(initCookies, authCookies);

  const dashboard = await createClient(cookie).get('/dashboard/news');
  const dashboardHtml = String(dashboard.data || '');

  if (dashboardHtml.includes('name="login"') || dashboardHtml.includes('/auth/login')) {
    const error = new Error("Login yoki parol noto'g'ri!");
    error.status = 401;
    throw error;
  }

  return {
    cookie,
    name: parseDashboardName(dashboardHtml, login)
  };
};

export const fetchProfile = async (cookie) => {
  const html = await fetchPage(cookie, '/student/info');
  return parseProfile(html);
};

export const fetchSchedule = async (cookie) => {
  const html = await fetchPage(cookie, '/student/schedule');
  return parseScheduleEvents(parseCalendarJson(html));
};

export const fetchDeadlines = async (cookie) => {
  const html = await fetchPage(cookie, '/student/deadlines');
  return parseDeadlineEvents(parseCalendarJson(html));
};

export const fetchStudyPlan = async (cookie) => {
  const html = await fetchPage(cookie, '/student/study-plan');
  return parseStudyPlan(html);
};

export const fetchFinals = async (cookie) => {
  const html = await fetchPage(cookie, '/student/finals');
  const selected = html.match(/<option\s+value="(\d+)"\s+selected[^>]*>([\s\S]*?)<\/option>/i);
  const semesterId = selected?.[1] || '';
  const semesterLabel = selected?.[2] ? selected[2].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';

  if (!semesterId) {
    return { semesterId: null, semesterLabel: '', rows: [] };
  }

  const query = new URLSearchParams({
    semester_id: semesterId,
    draw: '1',
    start: '0',
    length: '200'
  });

  const raw = await fetchPage(cookie, `/student/finals/data?${query.toString()}`, {
    Accept: 'application/json, text/plain, */*'
  });

  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return {
    semesterId,
    semesterLabel,
    rows: parseFinalRows(Array.isArray(parsed?.data) ? parsed.data : [])
  };
};

export const fetchCourses = async (cookie) => {
  const html = await fetchPage(cookie, '/student/my-courses');
  const courseLinks = parseCourseLinks(html).slice(0, 40);

  const selectedSemester = html.match(/<option\s+value="(\d+)"\s+selected[^>]*>([\s\S]*?)<\/option>/i);
  const semesterId = selectedSemester?.[1] || html.match(/<option\s+value="(\d+)"/i)?.[1] || '';

  const coursesDict = new Map();
  courseLinks.forEach(c => coursesDict.set(String(c.courseId), c));

  if (semesterId) {
    try {
      const query = new URLSearchParams({ semester_id: semesterId, draw: '1', start: '0', length: '200' });
      const rawData = await fetchPage(cookie, `/student/my-courses/data?${query.toString()}`, {
        Accept: 'application/json, text/plain, */*'
      });
      const parsed = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      
      const jsonCourses = parseCoursesFromJson(parsed?.data || []);
      jsonCourses.forEach(jc => {
         const id = String(jc.courseId);
         if (coursesDict.has(id)) {
            const ext = coursesDict.get(id);
            ext.nb = jc.nb; // Prioritize exact JSON attendance
            if (!ext.limit && jc.limit) ext.limit = jc.limit;
            if (!ext.credit && jc.credit) ext.credit = jc.credit;
         } else {
            coursesDict.set(id, jc);
         }
      });
    } catch (e) {
      console.error("Failed to fetch accurate attendance data:", e.message);
    }
  }

  const coursesToFetch = Array.from(coursesDict.values());

  const details = await Promise.all(
    coursesToFetch.map(async (course) => {
      let parsedDetail = { ...course };
      try {
        const detailHtml = await fetchPage(cookie, `/student/my-courses/show/${course.courseId}`);
        const temp = parseCourseDetail(detailHtml, course);
        if (course.nb !== null && course.nb !== undefined) {
           temp.nb = course.nb; // Ensure precision
        }
        parsedDetail = temp;
      } catch (e) { }
      return parsedDetail;
    })
  );

  return details.map((item) => ({
    name: item.name,
    credit: item.credit || 0,
    score: item.score,
    nb: item.nb,
    limit: item.limit || (item.credit ? Math.max(4, item.credit + 3) : null)
  }));
};

export const fetchAcademicBundle = async (cookie) => {
  const [profile, schedule, deadlines, studyPlan, finals, courses] = await Promise.all([
    fetchProfile(cookie),
    fetchSchedule(cookie),
    fetchDeadlines(cookie),
    fetchStudyPlan(cookie),
    fetchFinals(cookie),
    fetchCourses(cookie)
  ]);

  return buildAcademicBundle({
    profile,
    schedule,
    deadlines,
    studyPlan,
    finals,
    courses
  });
};
