import { CapacitorHttp } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const LMS_URL = 'https://lms.tuit.uz';

// Helper to strip HTML tags
const stripHtml = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

// Helper to build cookie string from header
const parseCookies = (headers) => {
  const raw = headers['Set-Cookie'] || headers['set-cookie'] || '';
  if (Array.isArray(raw)) return raw.map(c => c.split(';')[0]).join('; ');
  return raw.split(',').map(c => c.split(';')[0]).join('; ');
};

export const lmsService = {
  async login(login, password) {
    try {
      // Step 1: GET login page to get fresh CSRF token + cookies
      const page1 = await CapacitorHttp.get({ url: `${LMS_URL}/auth/login` });
      const initCookies = parseCookies(page1.headers);
      const tokenMatch = page1.data.match(/name="_token"\s+value="([^"]+)"/);
      const _token = tokenMatch ? tokenMatch[1] : '';

      // Step 2: POST credentials
      const postResp = await CapacitorHttp.post({
        url: `${LMS_URL}/auth/login`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': initCookies,
        },
        data: `_token=${encodeURIComponent(_token)}&login=${encodeURIComponent(login)}&password=${encodeURIComponent(password)}`,
        disableRedirects: true,
      });

      const sessionCookies = parseCookies(postResp.headers);
      const allCookies = initCookies + '; ' + sessionCookies;

      // Verify login by hitting dashboard
      const dashCheck = await CapacitorHttp.get({
        url: `${LMS_URL}/dashboard/news`,
        headers: { 'Cookie': allCookies }
      });

      // If we see the login form again, we failed
      if (dashCheck.data.includes('name="login"') || dashCheck.data.includes('/auth/login')) {
        return { success: false, error: "Login yoki parol noto'g'ri!" };
      }

      // Save session cookies and user info
      await Preferences.set({ key: 'lms_cookies', value: allCookies });

      // Extract student full name from dashboard
      const nameMatch = dashCheck.data.match(/class="page-header-title"[^>]*>\s*([\s\S]*?)\s*<\/h4>/);
      const dashboardName = nameMatch ? stripHtml(nameMatch[1]) : login;

      await Preferences.set({ key: 'lms_user', value: JSON.stringify({ login, name: dashboardName }) });

      return { success: true, name: dashboardName };
    } catch (error) {
      console.error('LMS Login error:', error);
      return { success: false, error: 'Server bilan aloqa yo\'qligi. Internet tekshiring.' };
    }
  },

  async getCookies() {
    const { value } = await Preferences.get({ key: 'lms_cookies' });
    return value || '';
  },

  // =====================================================
  //  SCHEDULE: Parse initCalendar JSON from /student/schedule
  // =====================================================
  async syncSchedule() {
    try {
      const cookies = await this.getCookies();
      const resp = await CapacitorHttp.get({
        url: `${LMS_URL}/student/schedule`,
        headers: { 'Cookie': cookies }
      });

      const match = resp.data.match(/initCalendar\(\s*(\[[\s\S]*?\])\s*\)/);
      if (!match) return null;

      const events = JSON.parse(match[1]);
      return this._parseScheduleToApp(events);
    } catch (e) {
      console.error('syncSchedule error:', e);
      return null;
    }
  },

  _parseScheduleToApp(events) {
    const DAYS_UZ = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
    const schedule = {};

    events.forEach(ev => {
      const date = new Date(ev.start);
      const dayName = DAYS_UZ[date.getDay()];
      if (!schedule[dayName]) schedule[dayName] = [];

      const parts = ev.title.split('\n');
      const room = parts[0] ? parts[0].replace(/[()]/g, '').trim() : '?';
      const rawSubject = parts[1] || ev.title;
      // Separate name from code: "Fizika 2 (4 kr)-PHY207-3" → "Fizika 2"
      const subjectName = rawSubject.split('-')[0].split('(')[0].trim();

      const hour = date.getHours();
      const min = date.getMinutes();
      const time = `${hour.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}`;

      // end time (typically 1h20m or 1h30m)
      const endDate = new Date(date.getTime() + 80 * 60000);
      const endTime = `${endDate.getHours().toString().padStart(2,'0')}:${endDate.getMinutes().toString().padStart(2,'0')}`;

      let type = "Ma'ruza";
      if (ev.className?.includes('brown')) type = "Laboratoriya";
      else if (ev.type === 2) type = "Amaliyot";

      schedule[dayName].push({
        id: `${dayName}_${time}_${Math.random().toString(36).substr(2,5)}`,
        name: subjectName,
        type,
        time: `${time} - ${endTime}`,
        location: `Xona: ${room}`,
        geo: "https://maps.google.com/?q=TUIT,Toshkent",
        teacher: { name: "LMS", phone: '', telegram: '' },
        dateISO: ev.start
      });
    });

    return schedule;
  },

  // =====================================================
  //  SUBJECTS + GRADES: Parse /student/subject
  // =====================================================
  async syncSubjects() {
    try {
      const cookies = await this.getCookies();
      const resp = await CapacitorHttp.get({
        url: `${LMS_URL}/student/subject`,
        headers: { 'Cookie': cookies }
      });

      return this._parseSubjects(resp.data);
    } catch (e) {
      console.error('syncSubjects error:', e);
      return [];
    }
  },

  async syncGrades() {
    return this.syncSubjects();
  },

  _parseSubjects(html) {
    const subjects = [];
    // Match subject card blocks
    // They look like: <h4 ...>Fanname</h4>...(N kredit)
    const blockRx = /<div[^>]+class="[^"]*subject[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
    const nameRx = /<h4[^>]*>([\s\S]*?)<\/h4>/i;
    const creditRx = /\((\d+)\s*kr/i;
    const scoreRx = /(\d{1,3})\s*ball/i;

    // Approach: split by anchor links to subject show pages
    const linkRx = /href="https:\/\/lms\.tuit\.uz\/student\/my-courses\/show\/(\d+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    while ((m = linkRx.exec(html)) !== null) {
      const id = m[1];
      const inner = m[2];
      const name = stripHtml(inner).trim();
      if (name.length < 2) continue;

      // Look for credit in nearby context
      const context = html.substring(Math.max(0, m.index - 500), m.index + 500);
      const creditM = creditRx.exec(context);
      const scoreM = scoreRx.exec(context);

      subjects.push({
        id: parseInt(id),
        name: name.split('(')[0].trim(),
        credit: creditM ? parseInt(creditM[1]) : 4,
        score: scoreM ? parseInt(scoreM[1]) : 0,
        nb: 0,
        limit: 12,
        lmsId: id
      });
    }

    // Deduplicate by lmsId
    const seen = new Set();
    return subjects.filter(s => {
      if (seen.has(s.lmsId)) return false;
      seen.add(s.lmsId);
      return true;
    });
  },

  // =====================================================
  //  DEADLINES / TASKS: Parse /student/deadlines
  // =====================================================
  async syncDeadlines() {
    try {
      const cookies = await this.getCookies();
      const resp = await CapacitorHttp.get({
        url: `${LMS_URL}/student/deadlines`,
        headers: { 'Cookie': cookies }
      });

      return this._parseDeadlines(resp.data);
    } catch (e) {
      console.error('syncDeadlines error:', e);
      return [];
    }
  },

  _parseDeadlines(html) {
    const tasks = [];
    // Tasks appear as table rows: <tr> ... subject name ... deadline date ... status
    // Pattern works as: look for all <tr> with date pattern
    const trRx = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const dateRx = /(\d{4}-\d{2}-\d{2}|\d{2}\.\d{2}\.\d{4})/;
    
    let m;
    while ((m = trRx.exec(html)) !== null) {
      const row = m[1];
      const dateM = dateRx.exec(row);
      if (!dateM) continue;
      
      const text = stripHtml(row);
      if (text.length < 5) continue;

      // Clean up the text
      const parts = text.split(/\s{2,}/).filter(p => p.trim().length > 0);
      const title = parts[0] || 'Vazifa';
      const dateStr = dateM[1];

      // Convert date format
      let dueDate = dateStr;
      if (dateStr.includes('.')) {
        const [d, mo, y] = dateStr.split('.');
        dueDate = `${y}-${mo}-${d}`;
      }

      tasks.push({
        id: Date.now() + Math.random(),
        title: title.substring(0, 80),
        description: parts.slice(1).join(' ').substring(0, 200),
        dueDate,
        completed: text.toLowerCase().includes('qabul qilindi') || text.toLowerCase().includes('bajarildi'),
        priority: 'medium',
        source: 'lms'
      });
    }

    return tasks.slice(0, 50); // max 50 tasks
  },

  // =====================================================
  //  FULL SYNC: Run all syncs and save to Preferences
  // =====================================================
  async syncAll(userEmail) {
    console.log('Starting full LMS sync...');

    const [scheduleData, subjectsData, deadlinesData] = await Promise.all([
      this.syncSchedule(),
      this.syncSubjects(),
      this.syncDeadlines()
    ]);

    const results = {};

    if (scheduleData) {
      // Flatten schedule to array format for Timetable component
      const scheduleArr = [];
      Object.entries(scheduleData).forEach(([day, lessons]) => {
        lessons.forEach(l => scheduleArr.push({ ...l, day }));
      });
      await Preferences.set({ key: `timetable_${userEmail}`, value: JSON.stringify(scheduleArr) });
      results.schedule = scheduleArr.length;
    }

    if (subjectsData?.length > 0) {
      await Preferences.set({ key: `grades_${userEmail}`, value: JSON.stringify(subjectsData) });
      results.subjects = subjectsData.length;
    }

    if (deadlinesData?.length > 0) {
      // Merge with existing tasks (keep manually added ones)
      const { value } = await Preferences.get({ key: `tasks_${userEmail}` });
      const existing = value ? JSON.parse(value) : [];
      const manual = existing.filter(t => !t.source);
      const merged = [...manual, ...deadlinesData];
      await Preferences.set({ key: `tasks_${userEmail}`, value: JSON.stringify(merged) });
      results.tasks = deadlinesData.length;
    }

    console.log('Sync complete:', results);
    return results;
  }
};
