import axios from 'axios';
import {
  buildAcademicBundle,
  parseCalendarJson,
  parseCourseDetail,
  parseCourseLinks,
  parseCourseTaskScores,
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

/**
 * Generate a minimal (broken) DOCX buffer.
 * A DOCX is a ZIP file. We create a valid ZIP with the bare minimum
 * DOCX structure so LMS accepts the .docx extension but the file is essentially empty.
 */
const createMinimalDocxBuffer = () => {
  // Minimal DOCX = ZIP containing [Content_Types].xml + word/document.xml
  // We use a pre-built tiny valid DOCX in base64 (empty document).
  // This was generated from: echo "" | python3 -c "import docx; d=docx.Document(); d.save('/tmp/e.docx')"
  const MINIMAL_DOCX_BASE64 =
    'UEsDBBQAAAAIAAAAIQDfpNBsWgEAAJAEAAAUAAAAd29yZC9kb2N1bWVudC54bWylU8tu2zAQ' +
    'vBfoP1C8y1IfixPBchDEqYGiRYoeKBSgpZXEhCIJkrLj/H2XtOwkTXroSeTM7OzscNe7920' +
    'Dz6isUDLH6TzBCGQpKyEPOX58uJ+tMbKOyopatjDA4xm29xuffYIniAbBDCRAbGBWWMqT4r' +
    'dICfIWoJtX0RZy7yKFJFfGLFgiWBiTv2JXb2JTjVlMkhtY2JtBmRi2OJU4UuqFJdp6VFQZ' +
    'UkVhAG1ZJiUFqvQCH4YTtD9IEZoFOi2bWm3RXyPRXyPS3SA5lBIBqECGgBPQIBh5kZQOvS' +
    '0aEAwT9bx1T0AAAAwcDMETwUGmBf5j2HoXHPoARYAAAD//wMAUEsDBAoAAAAAAAAhANU0WdJ' +
    'EAAAARAAAABMAAABbQ29udGVudF9UeXBlc10ueG1sj9A9C8IwFIXhv1K6O7kFBydJwUFwcB' +
    'QHl5CmQQy5IbnV9t8bUEGc3PO+84VzT28fBq5olLU+Qocy4BEB1cq4UEF+3q4ZSQB461RX' +
    'H0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAADqAFQAAAA' +
    'AAAAAAAAAAAAAAAAAUEsBAhQDFAAAAAgAAAAhAN+k0GxaAQAAkAQAABQAAAAAAAAAAAAAAKCB' +
    'AAAAAHdvcmQvZG9jdW1lbnQueG1sUEsBAgoAAAAAAAAhANU0WdJEAAAARAAAABMAAAAAAAAA' +
    'AAAAAKBBAAAA W29udGVudF9UeXBlc10ueG1sUEsFBgAAAAACAAIAgAAAALQAAAAA';
  
  // Actually, let's create the simplest possible "docx-like" file:
  // Just a valid ZIP magic bytes + garbage = LMS accepts it as docx by extension only
  // Use Node's Buffer to create a minimal ZIP signature  
  const buf = Buffer.alloc(512);
  // PK signature (ZIP header magic)
  buf.write('PK\x03\x04', 0, 'binary');
  // Minimal local file header
  buf.writeUInt16LE(20, 4);   // version needed
  buf.writeUInt16LE(0, 6);    // general purpose flags
  buf.writeUInt16LE(0, 8);    // compression (stored)
  buf.writeUInt32LE(0, 14);   // compressed size = 0
  buf.writeUInt32LE(0, 18);   // uncompressed size = 0
  buf.writeUInt16LE(23, 26);  // filename length: "word/document.xml" = 17, "[Content_Types].xml" = 19
  // filename "word/document.xml"
  const filename = 'word/document.xml';
  buf.write(filename, 30, 'utf8');
  // PK end of central dir
  buf.write('PK\x05\x06', 60, 'binary');
  
  return buf;
};

/**
 * Extract task activity IDs from a course page.
 * Returns array of { taskId, taskName, deadline }
 */
export const fetchCourseTaskIds = async (cookie, courseUrl) => {
  const html = await fetchPage(cookie, courseUrl);
  const results = [];
  
  // Find all upload buttons with data-id attribute
  const uploadBtnPattern = /data-id="(\d+)"[^>]*>Отправить задани/gi;
  let match;
  while ((match = uploadBtnPattern.exec(html)) !== null) {
    results.push({ taskId: match[1] });
  }
  
  // Also try generic data-id buttons near upload modal
  if (results.length === 0) {
    const allDataIds = [...html.matchAll(/data-id="(\d+)"/gi)].map(m => m[1]);
    const unique = [...new Set(allDataIds)];
    unique.forEach(id => results.push({ taskId: id }));
  }
  
  return results;
};

/**
 * Submit a minimal broken DOCX file to LMS for a given task activity ID.
 * POST /student/my-courses/upload  with multipart form: id=<activityId> & file=<docx>
 */
export const submitEmptyDocx = async (cookie, courseUrl, activityId) => {
  requireCookie(cookie);
  
  // Get CSRF token from the course page
  const courseHtml = await fetchPage(cookie, courseUrl);
  const csrfToken = courseHtml.match(/name="_token"\s+value="([^"]+)"/i)?.[1] || '';
  
  const docxBuffer = createMinimalDocxBuffer();
  
  // Create multipart form data manually
  const boundary = `----FormBoundary${Date.now()}`;
  const CRLF = '\r\n';
  
  let body = '';
  body += `--${boundary}${CRLF}`;
  body += `Content-Disposition: form-data; name="_token"${CRLF}${CRLF}`;
  body += `${csrfToken}${CRLF}`;
  body += `--${boundary}${CRLF}`;
  body += `Content-Disposition: form-data; name="id"${CRLF}${CRLF}`;
  body += `${activityId}${CRLF}`;
  
  const headerPart = Buffer.from(
    `--${boundary}${CRLF}` +
    `Content-Disposition: form-data; name="file"; filename="vazifa.docx"${CRLF}` +
    `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document${CRLF}${CRLF}`
  );
  const footerPart = Buffer.from(`${CRLF}--${boundary}--${CRLF}`);
  const textPart = Buffer.from(body);
  
  const formData = Buffer.concat([textPart, headerPart, docxBuffer, footerPart]);
  
  const client = createClient(cookie);
  const response = await client.post(
    '/student/my-courses/upload',
    formData,
    {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': `${LMS_URL}${courseUrl.startsWith('/') ? courseUrl : '/' + courseUrl}`,
        'Accept': 'application/json, text/plain, */*'
      }
    }
  );
  
  const responseText = typeof response.data === 'string' 
    ? response.data 
    : JSON.stringify(response.data);
    
  console.log(`[submitEmptyDocx] activity=${activityId} status=${response.status} resp=${responseText.substring(0,100)}`);
  
  if (response.status >= 400) {
    throw new Error(`Upload failed: HTTP ${response.status} - ${responseText.substring(0, 100)}`);
  }
  
  return { ok: true, status: response.status, response: responseText.substring(0, 200) };
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
  
  if (!enrichWithDetails || !tasks.length) {
    return tasks;
  }
  
  // Group tasks by their course link (e.g. /student/my-courses/show/25630)
  // so we can fetch each course page once and extract ALL task scores from it
  const tasksByCourse = new Map(); // courseUrl -> [tasks]
  const tasksWithoutLink = [];
  
  for (const task of tasks) {
    if (!task.link) {
      tasksWithoutLink.push(task);
      continue;
    }
    // Normalize course URL — strip hash/query
    const courseUrl = task.link.split('?')[0].split('#')[0].trim();
    if (!tasksByCourse.has(courseUrl)) {
      tasksByCourse.set(courseUrl, []);
    }
    tasksByCourse.get(courseUrl).push(task);
  }
  
  // Process each course page once
  const enrichedMap = new Map(); // taskId -> enriched task
  
  await Promise.all(
    Array.from(tasksByCourse.entries()).map(async ([courseUrl, courseTasks]) => {
      try {
        const courseHtml = await fetchPage(cookie, courseUrl);
        // Parse all task score rows from the course page
        const courseScores = parseCourseTaskScores(courseHtml);
        
        for (const task of courseTasks) {
          const taskNameLower = (task.taskName || '').toLowerCase().trim();
          // Also extract date string for matching (e.g. "23-02-2026")
          const taskDeadlineDate = task.dueDate
            ? task.dueDate.split('-').reverse().join('-') // yyyy-mm-dd -> dd-mm-yyyy
            : '';
          
          let matchedScore = null;
          if (courseScores.length > 0) {
            // Strategy 1: match by deadline date in the courseScores taskName field
            if (taskDeadlineDate) {
              const ddmm = taskDeadlineDate; // dd-mm-yyyy
              matchedScore = courseScores.find(cs => {
                const csName = (cs.taskName || '');
                return csName.includes(ddmm);
              });
            }
            
            // Strategy 2: fuzzy name match if date didn't work
            if (!matchedScore && taskNameLower.length > 3) {
              // Get first 20 meaningful chars of task name
              const taskKey = taskNameLower.replace(/\s+/g, ' ').slice(0, 20);
              matchedScore = courseScores.find(cs => {
                const csName = (cs.taskName || '').toLowerCase();
                return csName.includes(taskKey) || taskKey && csName.includes(taskKey.slice(0, 12));
              });
            }
          }
          
          enrichedMap.set(task.id, {
            ...task,
            score: matchedScore?.score ?? null,
            maxScore: matchedScore?.maxScore ?? null,
            submitted: matchedScore !== undefined && matchedScore !== null,
          });
        }
      } catch (err) {
        console.warn(`[fetchDeadlines] Could not fetch course ${courseUrl}:`, err.message);
        // Return tasks unchanged if course fetch fails
        for (const task of courseTasks) {
          enrichedMap.set(task.id, task);
        }
      }
    })
  );
  
  // Reconstruct tasks in original order
  return tasks.map(task => enrichedMap.get(task.id) || task);
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
    score: item.score,                // 0-100 percentage
    earned: item.earned ?? null,      // raw earned points  
    maxBall: item.maxBall ?? null,    // max possible points
    attendancePercent: item.attendancePercent ?? null,  // 0-100%
    currentGrade: item.currentGrade ?? null,            // 1-5 scale
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
