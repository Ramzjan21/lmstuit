// Full integration test: login, fetch deadlines, check score enrichment
import { loginLms, fetchDeadlines } from './server/lmsClient.mjs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

try {
  console.log('Logging in...');
  const { cookie } = await loginLms('1bk34678', 'Muhishm2007');
  console.log('Login OK!\n');
  
  console.log('Fetching deadlines with score enrichment...');
  const tasks = await fetchDeadlines(cookie, true);
  
  console.log(`\nTotal tasks: ${tasks.length}\n`);
  for (const t of tasks.slice(0, 15)) {
    const scoreStr = t.score !== null ? `${t.score}/${t.maxScore}` : '—';
    const isPast = new Date(t.deadline) < new Date();
    console.log(`[${isPast ? '✓' : '⏳'}] ${t.title?.substring(0, 60)}`);
    console.log(`    Score: ${scoreStr} | Submitted: ${t.submitted} | Deadline: ${t.dueDate}`);
  }
} catch(e) {
  console.error('FAILED:', e.message);
}
