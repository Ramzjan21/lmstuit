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
  parseDashboardName,
  parseTaskDetail
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

  if (response.status === 301 || response.status === 302 || response.status === 303) {
    const error = new Error('Session expired');
    error.status = 401;
    throw error;
  }

  if (response.status >= 400) {
    const error = new Error(`LMS page error: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const responseHtml = String(response.data || '');
  if (responseHtml.includes('name="login"') && responseHtml.includes('/auth/login')) {
    const error = new Error('Session expired (HTML)');
    error.status = 401;
    throw error;
  }

  return response.data;
};

export const fetchFileBuffer = async (cookie, urlPath) => {
  requireCookie(cookie);
  const client = createClient(cookie);
  const response = await client.get(urlPath, {
    responseType: 'arraybuffer'
  });
  
  if (response.status === 301 || response.status === 302 || response.status === 303) {
    const error = new Error('Session expired');
    error.status = 401;
    throw error;
  }
  if (response.status >= 400) {
    throw new Error(`File download failed: ${response.status}`);
  }

  const contentDisposition = response.headers['content-disposition'];
  let filename = 'task_file';
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    if (match) filename = match[1];
  }
  return { buffer: Buffer.from(response.data), filename };
};

export const fetchTaskDetail = async (cookie, taskUrl) => {
  try {
    requireCookie(cookie);
    const html = await fetchPage(cookie, taskUrl);
    return parseTaskDetail(html);
  } catch (error) {
    console.warn(`Failed to fetch task detail from ${taskUrl}:`, error.message);
    return {
      maxScore: null,
      score: null,
      submitted: false,
      submittedAt: null,
      comment: null,
      grade: null
    };
  }
};

export const fetchTaskAttachmentLinks = async (cookie, taskUrl, depth = 0) => {
  if (depth > 1) return []; // limit recursion depth

  const html = await fetchPage(cookie, taskUrl);
  const matches1 = Array.from(html.matchAll(/href="([^"]+)"/ig));
  const matches2 = Array.from(html.matchAll(/href='([^']+)'/ig));
  const matches = [...matches1, ...matches2];
  const links = new Set();
  
  for (const match of matches) {
    let url = match[1];
    const lower = url.toLowerCase();
    
    // Check if it's a file
    const isFile = 
      lower.includes('/download') || 
      lower.includes('/file') ||
      lower.includes('storage') ||
      lower.includes('upload') ||
      lower.includes('attachment') ||
      lower.includes('/dl/') ||
      lower.match(/\.(pdf|docx?|pptx?|xlsx?|zip|rar|7z|txt|rtf|jpeg|jpg|png|mp4|webm)$/);

    const isTaskDetails = !isFile && (lower.includes('/task/') || lower.includes('/tasks/show'));

    if ((isFile || isTaskDetails) && !lower.includes('play.google') && !lower.includes('apple.com') && !lower.includes('.css') && !lower.includes('.js')) {
      if (url.startsWith('/')) {
        url = `https://lms.tuit.uz${url}`;
      } else if (!url.startsWith('http')) {
        continue; 
      }
      
      if (url !== taskUrl && !url.includes('student/profile')) {
        if (isFile) {
          links.add(url);
        } else if (isTaskDetails && depth === 0) {
          // If we found a task details link on a course page, scrape THAT page for files!
          try {
            const nestedFiles = await fetchTaskAttachmentLinks(cookie, url, depth + 1);
            nestedFiles.forEach(f => links.add(f));
          } catch(e) {}
        }
      }
    }
  }
  
  return Array.from(links).slice(0, 5);
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

export const fetchDeadlines = async (cookie, enrichWithDetails = true) => {
  const html = await fetchPage(cookie, '/student/deadlines');
  const tasks = parseDeadlineEvents(parseCalendarJson(html));
  
  // If enrichWithDetails is false, return basic tasks without fetching details
  if (!enrichWithDetails) {
    return tasks;
  }
  
  // Fetch detailed information for each task (max 20 tasks to avoid timeout)
  const tasksToEnrich = tasks.slice(0, 20);
  const enrichedTasks = await Promise.all(
    tasksToEnrich.map(async (task) => {
      if (!task.link) return task;
      
      try {
        const details = await fetchTaskDetail(cookie, task.link);
        return {
          ...task,
          maxScore: details.maxScore,
          score: details.score,
          submitted: details.submitted,
          submittedAt: details.submittedAt,
          comment: details.comment,
          grade: details.grade
        };
      } catch (error) {
        console.warn(`Failed to enrich task ${task.id}:`, error.message);
        return task;
      }
    })
  );
  
  // Return enriched tasks + remaining tasks without details
  return [...enrichedTasks, ...tasks.slice(20)];
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

export const fetchAcademicBundle = async (cookie, enrichTaskDetails = true) => {
  const [profile, schedule, studyPlan, finals, courses] = await Promise.all([
    fetchProfile(cookie),
    fetchSchedule(cookie),
    fetchStudyPlan(cookie),
    fetchFinals(cookie),
    fetchCourses(cookie)
  ]);
  
  // Fetch deadlines separately to control detail enrichment
  const deadlines = await fetchDeadlines(cookie, enrichTaskDetails);

  return buildAcademicBundle({
    profile,
    schedule,
    deadlines,
    studyPlan,
    finals,
    courses
  });
};
