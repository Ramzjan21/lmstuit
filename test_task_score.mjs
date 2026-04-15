/**
 * Test script: Fetch task pages directly from LMS and print what score data is available.
 * Usage: node test_task_score.mjs "COOKIE_STRING" "https://lms.tuit.uz/student/my-courses/show/25630"
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.local') });

const COOKIE = process.argv[2] || '';
const TASK_URL = process.argv[3] || 'https://lms.tuit.uz/student/my-courses/show/25630';

if (!COOKIE) {
  console.error('❌ Usage: node test_task_score.mjs "<XSRF-TOKEN=...;tuitlms_session=...>" [task_url]');
  process.exit(1);
}

const client = axios.create({
  baseURL: 'https://lms.tuit.uz',
  timeout: 25000,
  maxRedirects: 5,
  validateStatus: () => true,
  headers: {
    'User-Agent': 'Mozilla/5.0',
    'Accept': 'text/html,application/json',
    'Cookie': COOKIE,
    'X-Requested-With': 'XMLHttpRequest'
  }
});

const strip = h => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

async function fetchAndAnalyze(url) {
  console.log(`\n🔍 Fetching: ${url}`);
  const res = await client.get(url);
  const html = String(res.data || '');
  console.log('Status:', res.status, '| HTML:', html.length, 'bytes');
  
  if (res.status >= 400) {
    console.log('❌ HTTP Error!');
    return;
  }
  if (html.includes('name="login"')) {
    console.log('❌ Redirected to login page - cookie expired!');
    return;
  }
  
  const text = strip(html);
  const filename = `debug_task_${Date.now()}.html`;
  fs.writeFileSync(filename, html);
  console.log(`💾 Saved to ${filename}`);
  
  // Look for score-related content
  console.log('\n--- Score text patterns ---');
  const scoreRegions = [];
  for (const kw of ['балл', 'ball', 'score', 'grade', 'оценка', 'baho', 'topshirilgan', 'submitted', 'сдано']) {
    const idx = text.toLowerCase().indexOf(kw.toLowerCase());
    if (idx !== -1) {
      const region = text.substring(Math.max(0, idx - 80), idx + 150);
      scoreRegions.push(`[${kw}]: ...${region}...`);
    }
  }
  scoreRegions.forEach(r => console.log(r, '\n'));
  
  // h4 numbers
  const h4s = [...html.matchAll(/<h4[^>]*>([\s\S]*?)<\/h4>/gi)].map(m => strip(m[1])).filter(t => t.trim());
  console.log('\n--- h4 tags ---', h4s);
  
  // Buttons with numbers  
  const numBtns = [...html.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/gi)]
    .map(m => strip(m[1]).trim())
    .filter(t => /^\d+(\.\d+)?$/.test(t));
  console.log('--- Numeric buttons ---', numBtns);
  
  // Slash patterns
  const slashes = [...text.matchAll(/(?<!\d)(\d{1,3})\s*\/\s*(\d{1,3})(?!\d)/g)]
    .map(m => `${m[1]}/${m[2]}`);
  console.log('--- X/Y patterns ---', slashes);
  
  // Try task detail API endpoint if it looks like a course page
  if (url.includes('/student/my-courses/show/')) {
    const courseId = url.match(/\/show\/(\d+)/)?.[1];
    if (courseId) {
      // Try to find task links inside the page
      const taskLinks = [...html.matchAll(/href="([^"]*\/task[^"]*|[^"]*activities[^"]*)"/ig)]
        .map(m => m[1])
        .filter(l => !l.includes('css') && !l.includes('js'))
        .slice(0, 5);
      
      if (taskLinks.length) {
        console.log('\n--- Task links found in page ---');
        taskLinks.forEach(l => console.log(' ', l.startsWith('/') ? `https://lms.tuit.uz${l}` : l));
      }
    }
  }
  
  return html;
}

await fetchAndAnalyze(TASK_URL);
console.log('\n✅ Done. Check the saved HTML file for full structure.');
