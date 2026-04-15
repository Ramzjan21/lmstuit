const DAY_NAMES = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

// LMS returns datetimes WITHOUT timezone (e.g. "2026-04-05T08:00:00").
// On Render/UTC servers this would be parsed as UTC, showing 5 hours early.
// Fix: if no timezone marker is present, treat value as Tashkent (UTC+5).
const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000; // +05:00

const parseEventDate = (value) => {
  if (!value) return new Date(NaN);
  const s = String(value).trim();
  // Already has timezone info (Z, +05:00, etc.) — parse as-is
  if (/[Zz]|[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s);
  // No timezone — LMS gives local Tashkent time, so append +05:00
  return new Date(s + '+05:00');
};

const ENTITY_MAP = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' '
};

export const decodeHtml = (text = '') => {
  return String(text)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (_, name) => ENTITY_MAP[name.toLowerCase()] ?? `&${name};`);
};

export const stripHtml = (html = '') => {
  return decodeHtml(
    String(html)
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
  ).trim();
};

export const parseNumber = (value, fallback = null) => {
  if (value === null || value === undefined) return fallback;
  const cleaned = String(value).replace(',', '.').replace(/[^\d.-]/g, '');
  if (!cleaned) return fallback;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const normalizeSubjectKey = (value = '') => {
  return stripHtml(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
};

const parseCredits = (text = '') => {
  const match = decodeHtml(text).match(/(\d+)\s*(?:kr|кредит|кредита|credits?)/i);
  return match ? parseNumber(match[1], 0) : 0;
};

const parseCourseCode = (text = '') => {
  const match = decodeHtml(text).match(/([A-Z]{2,}[0-9]{2,}(?:-[A-Z0-9]+)*)$/i);
  return match ? match[1] : '';
};

const normalizeSubjectName = (raw = '') => {
  const decoded = decodeHtml(raw);
  let subject = decoded
    .replace(/^[\[(][^\])]+[\])]\s*/g, '')
    .replace(/\s*-\s*[A-Z]{2,}[0-9]{2,}(?:-[A-Z0-9]+)*\s*$/i, '')
    .replace(/\(\s*\d+\s*(?:kr|кредит(?:а|ов)?|credits?)\s*\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!subject) subject = stripHtml(raw);
  return subject;
};

const splitLines = (title = '') => {
  return decodeHtml(title)
    .split(/\r?\n|\\n/g)
    .map((item) => item.trim())
    .filter(Boolean);
};

const inferLessonType = ({ type, className = '', title = '' }) => {
  const text = `${className} ${decodeHtml(title)}`.toLowerCase();
  if (Number(type) === 3 || /lab|лаборатор|brown/.test(text)) return 'Laboratoriya';
  if (Number(type) === 2 || /amaliy|практик/.test(text)) return 'Amaliyot';
  if (/seminar|семинар/.test(text)) return 'Seminar';
  return "Ma'ruza";
};

const inferTaskCategory = (text = '') => {
  const normalized = decodeHtml(text).toLowerCase();
  if (/лаборатор|laborator|lab/.test(normalized)) return 'Laboratoriya';
  if (/курс|project|loyiha/.test(normalized)) return 'Kurs ishi';
  if (/test|oraliq|midterm|контрол|exam|imtihon/.test(normalized)) return 'Oraliq';
  return 'Uy vazifasi';
};

const inferTaskPriority = (deadlineIso) => {
  const date = new Date(deadlineIso);
  if (Number.isNaN(date.getTime())) return 'medium';
  const diffHours = (date.getTime() - Date.now()) / (1000 * 60 * 60);
  if (diffHours <= 24) return 'high';
  if (diffHours <= 72) return 'medium';
  return 'low';
};

export const parseCalendarJson = (html = '') => {
  const match = html.match(/initCalendar\(\s*(\[[\s\S]*?\])\s*\)/i);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[1]);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const timeText = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '--:--';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tashkent',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
};

const buildTimeRange = (isoOrDate, duration = 80) => {
  const start = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(start.getTime())) return { startTime: '--:--', endTime: '--:--', time: '--:--' };
  const end = new Date(start.getTime() + duration * 60 * 1000);
  const startTime = timeText(start);
  const endTime = timeText(end);
  return { startTime, endTime, time: `${startTime} - ${endTime}` };
};

export const parseScheduleEvents = (events = []) => {
  return events
    .map((event, index) => {
      const startDate = parseEventDate(event?.start);
      if (Number.isNaN(startDate.getTime())) return null;

      const lines = splitLines(event.title || '');
      const room = (lines[0] || '').replace(/[()]/g, '').trim();
      const subjectLine = lines[1] || lines[0] || 'Fan';
      const subject = normalizeSubjectName(subjectLine);
      const teacher = lines.find((line, i) => i > 1 && !parseCourseCode(line)) || 'LMS';
      const code = parseCourseCode(subjectLine) || parseCourseCode(lines.join(' '));
      const credits = parseCredits(subjectLine);
      const { startTime, endTime, time } = buildTimeRange(startDate, 80);

      // Extract the correct day index in Tashkent time
      const dayIndexStr = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tashkent', weekday: 'short' }).format(startDate);
      const isSunday = dayIndexStr.startsWith('Sun'); // 0
      const dayIndex = isSunday ? 0 : 
                       dayIndexStr.startsWith('Mon') ? 1 : 
                       dayIndexStr.startsWith('Tue') ? 2 : 
                       dayIndexStr.startsWith('Wed') ? 3 : 
                       dayIndexStr.startsWith('Thu') ? 4 : 
                       dayIndexStr.startsWith('Fri') ? 5 : 6;

      return {
        id: `lms_schedule_${startDate.getTime()}_${index}`,
        source: 'lms',
        name: subject,
        type: inferLessonType(event),
        day: DAY_NAMES[dayIndex] || 'Dushanba',
        dateISO: startDate.toISOString(),
        startTime,
        endTime,
        time,
        location: room ? `Xona: ${room}` : 'Xona ko`rsatilmagan',
        room,
        geo: 'https://maps.google.com/?q=TUIT,Toshkent',
        teacher: {
          name: teacher,
          phone: '',
          telegram: ''
        },
        lmsMeta: {
          code,
          credits,
          className: event.className || '',
          rawType: Number(event.type || 0)
        }
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime());
};

export const parseDeadlineEvents = (events = []) => {
  return events
    .map((event, index) => {
      const due = parseEventDate(event?.start);
      if (Number.isNaN(due.getTime())) return null;
      const lines = splitLines(event.title || '');
      const subject = normalizeSubjectName(lines[0] || 'Fan vazifasi');
      const work = lines[1] || 'Topshiriq';
      const code = parseCourseCode(lines[2] || '');
      const teacher = lines[3] || '';

      return {
        id: `lms_deadline_${due.getTime()}_${index}`,
        source: 'lms',
        title: `${subject}: ${work}`,
        taskName: work, // raw task name for matching scores on course page
        subject,
        category: inferTaskCategory(work),
        description: [code ? `Kod: ${code}` : '', teacher ? `O'qituvchi: ${teacher}` : ''].filter(Boolean).join(' | '),
        deadline: due.toISOString(),
        dueDate: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent', year: 'numeric', month: '2-digit', day: '2-digit' }).format(due),
        completed: false,
        priority: inferTaskPriority(due.toISOString()),
        link: event.url || null
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
};

/**
 * Parse ALL task scores from a course "show" page.
 * The page HTML has blocks like:
 *   <div>Задание 1....</div>  <button class="btn-default">6</button> <button class="btn-primary">6</button>
 * Returns: [{ taskName: string, score: number, maxScore: number }]
 */
export const parseCourseTaskScores = (html = '') => {
  const results = [];
  
  // Each task appears inside a row/block that contains:
  // 1. The task name text
  // 2. Two consecutive buttons: first is earned score (btn-default), second is max (btn-primary)
  
  // Find all blocks that contain both a task name AND two score buttons nearby.
  // Pattern: find a text label near two sequential buttons with numbers
  const blockPattern = /(?:<tr[^>]*>|<div[^>]*class="[^"]*row[^"]*"[^>]*>)([\s\S]*?)(?:<\/tr>|(?=<tr[^>]*>)|<\/div)\s*>/gi;
  
  // Simpler approach: find all btn groups (pairs of score buttons)
  // Then look backwards in the HTML for the nearest task/assignment label
  const btnPairPattern = /<button[^>]*class="[^"]*btn-default[^"]*"[^>]*>\s*(\d+[\.,]?\d*)\s*<\/button>[\s\S]{0,300}?<button[^>]*class="[^"]*btn-primary[^"]*"[^>]*>\s*(\d+[\.,]?\d*)\s*<\/button>/gi;
  
  let match;
  while ((match = btnPairPattern.exec(html)) !== null) {
    const score = parseNumber(match[1], null);
    const maxScore = parseNumber(match[2], null);
    
    if (score === null || maxScore === null) continue;
    
    // Look backwards from this match for the nearest task name
    const beforeText = html.substring(Math.max(0, match.index - 2000), match.index);
    const stripped = stripHtml(beforeText);
    
    // Find task name — it will be the last mention of "Задание", "Topshiriq", "task" etc. before the button
    const taskNameMatch = stripped.match(/(?:Задание|Task|Topshiriq|Vazifa|Задача|Рубеж|Oraliq|Laboratoriya|Kurs)\s*[\d.]*[\s:.-]([^\n\r]{3,80})$/i) 
      || stripped.match(/([^\n\r]{5,80})\s*$/);
    
    const rawName = taskNameMatch ? taskNameMatch[1]?.trim() || taskNameMatch[0]?.trim() : null;
    const taskName = rawName ? stripHtml(rawName).replace(/\s+/g, ' ').trim() : null;
    
    results.push({ taskName, score, maxScore });
  }
  
  return results;
};


export const parseProfile = (html = '') => {
  const rows = Array.from(html.matchAll(/<strong[^>]*>\s*([^:<]+):?\s*<\/strong>\s*([\s\S]*?)(?=<\/p>)/gi));
  const map = new Map();

  rows.forEach(([, label, value]) => {
    const key = stripHtml(label).toLowerCase().replace(/['`’]/g, '').trim();
    const val = stripHtml(value);
    if (key && val) map.set(key, val);
  });

  const isRussianInterface = html.toLowerCase().includes('профиль') || map.has('ф.и.о') || map.has('пол');
  const interfaceLanguage = isRussianInterface ? 'ru' : 'uz';

  const fullName =
    map.get('ф.и.о') ||
    map.get('f.i.sh.') ||
    map.get('f.i.sh') ||
    map.get('fio') ||
    stripHtml(html.match(/dropdown-content[\s\S]*?<div[^>]*>([\s\S]*?)<\/div>/i)?.[1] || '') ||
    'Talaba';

  return {
    interfaceLanguage,
    fullName,
    firstName: fullName.split(' ')[0] || 'Talaba',
    birthDate: map.get('дата рождения') || map.get('tugilgan sanasi') || map.get('tugilgan sana') || '',
    gender: map.get('пол') || map.get('jinsi') || map.get('jins') || '',
    recordBook: map.get('зачётная книжка') || map.get('зачетная книжка') || map.get('sinov daftarchasi') || map.get('reyting daftarchasi') || '',
    permanentAddress: map.get('адрес') || map.get('doimiy yashash manzili') || map.get('manzil') || '',
    currentAddress: map.get('адрес(вр)') || map.get('vaqtinchalik manzil') || map.get('manzil(vaqtinchalik)') || '',
    direction: map.get('направление') || map.get('talim yonalishi') || map.get('muassasa yonalish kodi') || '',
    language: map.get('язык обучения') || map.get('talim tili') || '',
    degree: map.get('степень') || map.get('darajasi') || map.get('daraja') || '',
    educationType: map.get('тип обучения') || map.get('talim turi') || '',
    course: parseNumber(map.get('курс') || map.get('kursi') || map.get('kurs'), 0),
    group: map.get('группа') || map.get('guruhi') || map.get('guruh') || '',
    curator: map.get('куратор') || map.get('guruh rahbari') || map.get('kurator') || '',
    scholarship: map.get('стипендия') || map.get('stipendiyasi') || map.get('stipendiya') || ''
  };
};

export const parseStudyPlan = (html = '') => {
  const gpaMatch = html.match(/GPA\s*:\s*<\/?.*?>?\s*([\d.,]+)/i) || html.match(/GPA\s*:\s*([\d.,]+)/i);
  const gpa = parseNumber(gpaMatch?.[1], null);

  const semesterBlocks = Array.from(
    html.matchAll(/<p[^>]*font-weight-bold[^>]*>([^<]*семестр)<\/p>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/gi)
  );

  const semesters = semesterBlocks.map(([, semesterName, tbody]) => {
    const rows = Array.from(tbody.matchAll(/<tr>([\s\S]*?)<\/tr>/gi)).map(([, rowHtml], idx) => {
      const cells = Array.from(rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)).map(([, cell]) => stripHtml(cell));
      const name = normalizeSubjectName(cells[0] || '');
      const credit = parseNumber(cells[1], 0);
      const grade5 = parseNumber(cells[2], null);
      return {
        id: `plan_${normalizeSubjectKey(name)}_${idx}`,
        name,
        credit,
        semester: stripHtml(semesterName),
        grade5,
        score: grade5 !== null ? Math.max(0, Math.min(100, Math.round((grade5 / 5) * 100))) : null
      };
    });

    const valid = rows.filter((row) => row.name);
    const credits = valid.reduce((sum, row) => sum + Number(row.credit || 0), 0);

    return {
      semester: stripHtml(semesterName),
      subjects: valid,
      credits
    };
  });

  const subjects = semesters.flatMap((semester) => semester.subjects);

  return {
    gpa,
    semesters,
    subjects,
    totalCredits: subjects.reduce((sum, subject) => sum + Number(subject.credit || 0), 0)
  };
};

export const parseFinalRows = (rows = []) => {
  return rows
    .map((row, index) => {
      const subject = normalizeSubjectName(row?.subject || '');
      if (!subject) return null;

      const rawScore = parseNumber(row?.f_grade, null);
      const score = rawScore === null
        ? null
        : rawScore <= 5
          ? Math.max(0, Math.min(100, Math.round((rawScore / 5) * 100)))
          : Math.max(0, Math.min(100, rawScore));

      return {
        id: `final_${index}_${normalizeSubjectKey(subject)}`,
        subject,
        stream: stripHtml(row?.stream || ''),
        date: stripHtml(row?.date || ''),
        time: stripHtml(row?.from || ''),
        room: stripHtml(row?.room || ''),
        score,
        rawScore,
        finalLimit: parseNumber(row?.final_limit, null),
        link: row?.final_url || null
      };
    })
    .filter(Boolean);
};

export const parseCourseLinks = (html = '') => {
  const links = Array.from(
    html.matchAll(/href="https:\/\/lms\.tuit\.uz\/student\/my-courses\/show\/(\d+)"[^>]*>([\s\S]*?)<\/a>/gi)
  );
  const unique = new Map();

  links.forEach(([, id, text]) => {
    const name = normalizeSubjectName(stripHtml(text));
    if (!name) return;
    if (!unique.has(id)) {
      unique.set(id, {
        courseId: id,
        name,
        credit: parseCredits(text),
        score: parseNumber(text.match(/(\d{1,3})\s*(?:ball|балл)/i)?.[1], null),
        nb: null,
        limit: null
      });
    }
  });

  return Array.from(unique.values());
};

export const parseCourseSemesterId = (html = '') => {
  // Parse selected semester option
  const selected = String(html).match(/<option\s+value="(\d+)"\s+selected[^>]*>/i);
  if (selected) return selected[1];
  // Fallback: first option
  const first = String(html).match(/<option\s+value="(\d+)"/i);
  return first ? first[1] : null;
};

export const parseCoursesFromJson = (data = [], studyPlanSubjects = []) => {
  const rows = Array.isArray(data) ? data : [];
  return rows.map((row) => {
    const name = normalizeSubjectName(String(row.subject || ''));
    if (!name) return null;

    // Credit from subject name e.g. "Математика (4 кр)" or from study plan
    const credit = parseCredits(String(row.subject || '')) || (() => {
      const key = normalizeSubjectKey(name);
      const planMatch = studyPlanSubjects.find(s => normalizeSubjectKey(s.name || '') === key);
      return planMatch ? Number(planMatch.credit || 0) : 0;
    })();

    const nb = Number.isFinite(Number(row.attendance)) ? Math.max(0, Number(row.attendance)) : null;
    const limit = credit > 0 ? Math.max(4, credit + 3) : null;

    return {
      courseId: String(row.id || ''),
      name,
      credit,
      score: null,
      nb,
      limit
    };
  }).filter(Boolean);
};

export const parseCourseDetail = (html = '', fallback = {}) => {
  const text = stripHtml(html);
  const nb = parseNumber(text.match(/(?:\bNB\b|НБ|пропуск[^\d]{0,15})(\d{1,2})/i)?.[1], null);
  const limit = parseNumber(text.match(/(?:лимит|limit|max)[^\d]{0,15}(\d{1,2})/i)?.[1], null);
  const score = parseNumber(text.match(/(?:балл|ball|score|рейтинг|итог)[^\d]{0,15}(\d{1,3})/i)?.[1], null);

  return {
    ...fallback,
    nb,
    limit,
    score: score !== null ? Math.max(0, Math.min(100, score)) : fallback.score ?? null
  };
};

export const parseTaskDetail = (html = '') => {
  const text = stripHtml(html);
  
  let taskScore = null;
  let taskMax = null;
  
  // --- Strategy 1: JSON data embedded in page ---
  // LMS often embeds JS data like: var task = {...,"grade":8,"max_grade":10,...}
  const jsonDataMatch = html.match(/(?:var\s+task|"task"\s*:|\btask\s*=)\s*({[\s\S]*?});/i);
  if (jsonDataMatch) {
    try {
      const obj = JSON.parse(jsonDataMatch[1]);
      if (obj.grade !== undefined && obj.max_grade !== undefined) {
        taskScore = parseNumber(obj.grade, null);
        taskMax = parseNumber(obj.max_grade, null);
      }
    } catch {}
  }
  
  // --- Strategy 2: LMS-specific grade display in form "X bal Y baldan" ---
  if (taskScore === null) {
    const uzMatch = text.match(/(\d+[\.,]?\d*)\s*(?:ball?|балл)\s+(\d+[\.,]?\d*)\s*(?:ball?|балл|dan|дан|из)/i);
    if (uzMatch) {
      taskScore = parseNumber(uzMatch[1], null);
      taskMax = parseNumber(uzMatch[2], null);
    }
  }
  
  // --- Strategy 3: "Sizning balingiz: X / Y" or "Ваш балл: X из Y" ---
  if (taskScore === null) {
    const directMatch = text.match(/(?:sizning\s+bal|vaш\s+балл|your\s+(?:score|grade))[^\d]*?(\d+[\.,]?\d*)[\s/]+(\d+[\.,]?\d*)/i);
    if (directMatch) {
      taskScore = parseNumber(directMatch[1], null);
      taskMax = parseNumber(directMatch[2], null);
    }
  }
  
  // --- Strategy 4: <h4> number pairs inside grade widget ---
  if (taskScore === null) {
    // Find the grade widget area specifically
    const gradeWidgetMatch = html.match(/(?:grade|baho|балл|оценка|score)[^\n]{0,200}?<h4[^>]*>(\d+)<\/h4>[\s\S]{0,200}?<h4[^>]*>(\d+)<\/h4>/i);
    if (gradeWidgetMatch) {
      taskScore = parseNumber(gradeWidgetMatch[1], null);
      taskMax = parseNumber(gradeWidgetMatch[2], null);
    }
  }
  
  // --- Strategy 5: Two consecutive <h4> numbers anywhere in page ---
  if (taskScore === null) {
    const h4s = [...html.matchAll(/<h4[^>]*>(\d+)<\/h4>/gi)].map(m => parseNumber(m[1], null));
    if (h4s.length >= 2) {
      // Only trust if it seems like score / max (max should be > 0 and <= 100)
      const first = h4s[0];
      const second = h4s[1];
      if (second !== null && second > 0 && second <= 100 && first !== null && first <= second) {
        taskScore = first;
        taskMax = second;
      }
    }
  }
  
  // --- Strategy 6: "X / Y" slash pattern with reasonable values ---
  if (taskScore === null) {
    for (const match of text.matchAll(/(?<!\d)(\d{1,3})\s*\/\s*(\d{1,3})(?!\d)/g)) {
      const s = parseNumber(match[1], null);
      const m = parseNumber(match[2], null);
      if (m !== null && m >= 1 && m <= 100 && s !== null && s >= 0 && s <= m) {
        taskScore = s;
        taskMax = m;
        break;
      }
    }
  }
  
  // --- Detect submission ---
  const submitted = 
    /href="[^"]*uploads\/activities[^"]*"/i.test(html) ||
    /topshirilgan|submitted|сдан[оа]|bajarildi|yuklangan|uploaded/i.test(text);
  
  const submittedAtMatch = text.match(/(?:topshirilgan|submitted|сдано|yuklangan)\s*:?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}(?:\s+\d{1,2}:\d{2})?)/i);
  const submittedAt = submittedAtMatch?.[1] || null;
  
  const gradeMatch = html.match(/(?:Текущая\s+оценка|Current\s+grade|Joriy\s+baho)[\s\S]*?<h4[^>]*>(\d+)<\/h4>/i);
  const grade = gradeMatch ? gradeMatch[1] : null;
  
  const commentMatch = html.match(/<div[^>]*(?:class|id)="[^"]*(?:comment|feedback|izoh|комментарий)[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  const comment = commentMatch ? stripHtml(commentMatch[1]).trim() : null;
  
  return {
    maxScore: taskMax !== null ? Math.max(0, Math.round(taskMax)) : null,
    max_score: taskMax !== null ? Math.max(0, Math.round(taskMax)) : null,
    score: taskScore !== null ? Math.max(0, Math.round(taskScore)) : null,
    submitted,
    submittedAt,
    comment: comment && comment.length > 5 ? comment : null,
    grade
  };
};

const detectSemesterToken = (text = '') => {
  const normalized = stripHtml(text).toLowerCase();
  const roman = stripHtml(text).toUpperCase().match(/\b([IVX]{1,4})\s*[- ]*СЕМЕСТР/i)?.[1];
  if (roman) return roman;
  if (/перв|first|1/.test(normalized)) return 'I';
  if (/втор|second|2/.test(normalized)) return 'II';
  if (/трет|third|3/.test(normalized)) return 'III';
  if (/четв|fourth|4/.test(normalized)) return 'IV';
  if (/пят|fifth|5/.test(normalized)) return 'V';
  if (/шест|sixth|6/.test(normalized)) return 'VI';
  if (/седьм|seventh|7/.test(normalized)) return 'VII';
  if (/восьм|eighth|8/.test(normalized)) return 'VIII';
  return '';
};

const filterPlanSubjectsBySemester = (subjects = [], semesterLabel = '') => {
  const token = detectSemesterToken(semesterLabel);
  if (!token) return subjects;
  const filtered = subjects.filter((subject) => detectSemesterToken(subject.semester || '') === token);
  return filtered.length ? filtered : subjects;
};

const subjectMatchesSemester = (subjectName, semesterSubjects = []) => {
  const lessonKey = normalizeSubjectKey(subjectName);
  if (!lessonKey) return false;
  return semesterSubjects.some((subject) => {
    const subjectKey = normalizeSubjectKey(subject?.name || subject);
    if (!subjectKey) return false;
    return subjectKey === lessonKey || subjectKey.includes(lessonKey) || lessonKey.includes(subjectKey);
  });
};

const mergeSubjects = ({ planSubjects = [], courseSubjects = [], finalSubjects = [] }) => {
  const map = new Map();

  const upsert = (subject) => {
    const key = normalizeSubjectKey(subject?.name);
    if (!key) return;

    const prev = map.get(key) || {
      id: `lms_subject_${key}`,
      source: 'lms',
      name: subject.name,
      credit: 0,
      semester: '',
      score: null,
      grade5: null,
      finalScore: null,
      nb: 0,
      limit: 7
    };

    if (subject.name && subject.name.length > prev.name.length) prev.name = subject.name;
    if (subject.credit) prev.credit = Number(subject.credit);
    if (subject.semester && !prev.semester) prev.semester = subject.semester;
    if (subject.grade5 !== null && subject.grade5 !== undefined) prev.grade5 = Number(subject.grade5);
    if (subject.finalScore !== null && subject.finalScore !== undefined) prev.finalScore = Number(subject.finalScore);
    if (subject.score !== null && subject.score !== undefined) prev.score = Number(subject.score);
    if (subject.nb !== null && subject.nb !== undefined) prev.nb = Math.max(0, Number(subject.nb));
    if (subject.limit !== null && subject.limit !== undefined && Number(subject.limit) > 0) prev.limit = Number(subject.limit);

    map.set(key, prev);
  };

  planSubjects.forEach(upsert);
  courseSubjects.forEach(upsert);
  finalSubjects.forEach(upsert);

  return Array.from(map.values())
    .map((subject) => {
      const score =
        subject.score ??
        subject.finalScore ??
        (subject.grade5 !== null ? Math.max(0, Math.min(100, Math.round((subject.grade5 / 5) * 100))) : 0);

      const limit = subject.limit || (subject.credit ? Math.max(4, Number(subject.credit) + 3) : 7);

      return {
        ...subject,
        score: Math.max(0, Math.min(100, Math.round(score || 0))),
        nb: Math.max(0, Number(subject.nb || 0)),
        limit: Math.max(1, Number(limit || 12))
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
};

const pickActiveSemesterLabel = (studyPlan = {}, finals = {}) => {
  const semesters = Array.isArray(studyPlan?.semesters) ? studyPlan.semesters : [];
  const second = semesters.find((semester) => detectSemesterToken(semester?.semester || '') === 'II');
  if (second?.semester) return second.semester;
  if (finals?.semesterLabel) return finals.semesterLabel;
  return semesters[0]?.semester || '';
};

const makeLeaderboardEntry = ({ userEmail, profile, grades }) => {
  const subjects = Array.isArray(grades) ? grades : [];
  if (!subjects.length) return null;

  const avgScore = Math.round(subjects.reduce((sum, item) => sum + Number(item.score || 0), 0) / subjects.length);
  const attendanceRatios = subjects
    .filter((item) => Number(item.limit || 0) > 0)
    .map((item) => 100 - Math.min(100, Math.max(0, (Number(item.nb || 0) / Number(item.limit || 1)) * 100)));

  const attendanceScore = attendanceRatios.length
    ? Math.round(attendanceRatios.reduce((sum, item) => sum + item, 0) / attendanceRatios.length)
    : 0;

  const credits = subjects.reduce((sum, item) => sum + Number(item.credit || 0), 0);
  const points = subjects.reduce((sum, item) => {
    const score = Number(item.score || 0);
    const credit = Number(item.credit || 0);
    if (score >= 86) return sum + 4 * credit;
    if (score >= 71) return sum + 3 * credit;
    if (score >= 56) return sum + 2 * credit;
    if (score >= 50) return sum + 1 * credit;
    return sum;
  }, 0);

  return {
    userEmail,
    name: profile?.fullName || profile?.firstName || 'Talaba',
    group: profile?.group || '',
    course: profile?.course || 0,
    direction: profile?.direction || '',
    subjectCount: subjects.length,
    avgScore,
    attendanceScore,
    gpa: credits ? Number((points / credits).toFixed(2)) : 0,
    rating: Math.round(avgScore * 0.7 + attendanceScore * 0.3),
    updatedAt: new Date().toISOString()
  };
};

const sortLeaderboard = (items = []) => {
  return [...items].sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
    return b.attendanceScore - a.attendanceScore;
  });
};

export const parseDashboardName = (html = '', fallback = '') => {
  return stripHtml(
    html.match(/class="page-header-title"[^>]*>\s*([\s\S]*?)\s*<\/h4>/i)?.[1] ||
      html.match(/dropdown-content[\s\S]*?<div[^>]*>([\s\S]*?)<\/div>/i)?.[1] ||
      fallback ||
      'Talaba'
  );
};

export const buildAcademicBundle = ({ profile, schedule, deadlines, studyPlan, finals, courses }) => {
  const activeSemester = pickActiveSemesterLabel(studyPlan, finals);
  const semesterSubjects = filterPlanSubjectsBySemester(studyPlan.subjects, activeSemester);

  const filteredSchedule = schedule.filter((lesson) => {
    if (!semesterSubjects.length) return true;
    return subjectMatchesSemester(lesson.name, semesterSubjects);
  });

  const scheduleResult = (() => {
    if (!schedule.length) return [];
    if (!semesterSubjects.length) return schedule;
    const minExpected = Math.max(3, Math.floor(schedule.length * 0.4));
    return filteredSchedule.length >= minExpected ? filteredSchedule : schedule;
  })();

  const semesterKeySet = new Set(semesterSubjects.map((item) => normalizeSubjectKey(item.name)));

  const semesterCourses = courses.filter((course) => {
    if (!semesterKeySet.size) return true;
    return semesterKeySet.has(normalizeSubjectKey(course.name));
  });

  const semesterFinals = finals.rows
    .map((row) => {
      const key = normalizeSubjectKey(row.subject);
      if (semesterKeySet.size && !semesterKeySet.has(key)) return null;
      return {
        name: row.subject,
        score: row.score,
        finalScore: row.score,
        semester: activeSemester
      };
    })
    .filter(Boolean);

  const merged = mergeSubjects({
    planSubjects: semesterSubjects,
    courseSubjects: semesterCourses,
    finalSubjects: semesterFinals
  });

  const mergedByKey = new Map(merged.map((item) => [normalizeSubjectKey(item.name), item]));

  const gradesWithAttendance = semesterSubjects
    .map((plan) => {
      const key = normalizeSubjectKey(plan.name);
      const base = mergedByKey.get(key);
      if (!base) return null;

      const course = semesterCourses.find((item) => normalizeSubjectKey(item.name) === key);

      return {
        ...base,
        nb: Number.isFinite(Number(course?.nb)) ? Math.max(0, Number(course.nb)) : Math.max(0, Number(base.nb || 0)),
        limit: Number.isFinite(Number(course?.limit)) && Number(course.limit) > 0
          ? Number(course.limit)
          : Math.max(1, Number(base.limit || 12))
      };
    })
    .filter(Boolean);

  const grades = (gradesWithAttendance.length ? gradesWithAttendance : merged).filter((item) => {
    // Don't filter if no semester subjects - show all
    if (!semesterSubjects.length) return true;
    // Always include subjects that have attendance or score data
    if (item.nb > 0 || item.score > 0) return true;
    // Otherwise check if it matches semester
    return subjectMatchesSemester(item.name, semesterSubjects);
  });

  const semesterTaskSubjects = semesterSubjects.length
    ? semesterSubjects
    : gradesWithAttendance.length
      ? gradesWithAttendance
      : semesterCourses;

  const tasks = deadlines.filter((task) => {
    // Don't filter if no semester subjects - show all tasks
    if (!semesterTaskSubjects.length) return true;
    const subjectText = task.subject || task.title || '';
    return subjectMatchesSemester(subjectText, semesterTaskSubjects);
  });

  const coursesPreview = semesterCourses.map((course) => ({
    name: course.name,
    credit: Number(course.credit || 0),
    score: Number(course.score || 0)
  }));

  return {
    profile,
    schedule: scheduleResult,
    tasks,
    grades,
    studyPlan: {
      ...studyPlan,
      activeSemester,
      subjects: semesterSubjects.length ? semesterSubjects : studyPlan.subjects
    },
    finals,
    activeSemester,
    coursesCount: courses.length,
    coursesPreview
  };
};
