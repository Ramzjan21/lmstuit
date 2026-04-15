// Check individual course detail pages to get score and attendance
import { loginLms } from './server/lmsClient.mjs';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

try {
  const { cookie } = await loginLms('1bk34678', 'Muhishm2007');
  
  const client = axios.create({
    baseURL: 'https://lms.tuit.uz',
    timeout: 30000, maxRedirects: 5, validateStatus: () => true,
    headers: { Cookie: cookie, 'User-Agent': 'Mozilla/5.0', 'X-Requested-With': 'XMLHttpRequest' }
  });
  
  // Course IDs from previous run
  const courses = [
    { id: '25630', name: 'Новейшая история' },
    { id: '25647', name: 'Исчисление 2' },
    { id: '25822', name: 'Академическое письмо' },
    { id: '26054', name: 'Программирование' },
    { id: '26145', name: 'Физика 2' },
    { id: '26603', name: 'Английский язык II' },
    { id: '25731', name: 'Инженерная графика' },
  ];
  
  for (const course of courses) {
    const resp = await client.get(`/student/my-courses/show/${course.id}`);
    const html = String(resp.data);
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Extract key metrics
    const nab = text.match(/Набранные\s+баллы\s+([\d.,]+)/i)?.[1];
    const maxBall = text.match(/Макс\.\s*балл\s+([\d.,]+)/i)?.[1];
    const usp = text.match(/Успеваемость\s+([\d.,]+)\s*%/i)?.[1];
    const ocenka = text.match(/Текущая\s+оценка\s+(\d)/i)?.[1];
    // NB from the page text — look for various patterns
    const nbDirect = text.match(/НБ\s*:?\s*(\d+)/i)?.[1] ||
                     text.match(/Прогул[ы]?\s*:?\s*(\d+)/i)?.[1] ||
                     text.match(/Пропуск[и]?\s*:?\s*(\d+)/i)?.[1];
    
    // Also look for the attendance table
    const attendanceArea = text.match(/Даты\s+занятий([\s\S]{0,500})/i)?.[0] || 
                           text.match(/Посещаемость([\s\S]{0,500})/i)?.[0] || '';
    
    console.log(`\n📚 ${course.name} (ID:${course.id})`);
    console.log(`   Набранные баллы: ${nab || '?'} / Макс: ${maxBall || '?'}`);
    console.log(`   Успеваемость: ${usp || '?'}%  |  Оценка: ${ocenka || '?'}`);
    console.log(`   НБ в тексте: ${nbDirect || '?'}`);
    
    // Look for the HTML attendance data (usually a table or badge)
    const nbBadge = html.match(/class="[^"]*(?:danger|nb|absent)[^"]*"[^>]*>\s*(\d+)\s*</i)?.[1];
    const nbSpan = html.match(/<span[^>]*>(\d+)<\/span>\s*(?:НБ|NB|пропус)/i)?.[1] ||
                   html.match(/(?:НБ|NB|пропус)[^<]*<[^>]+>\s*(\d+)/i)?.[1];
    if (nbBadge || nbSpan) console.log(`   НБ badge/span: ${nbBadge || nbSpan}`);
    
    // Print raw score area context
    const idx = text.search(/Набранные\s+баллы/i);
    if (idx !== -1) {
      console.log(`   Context: "${text.substring(idx, idx+150)}"`);
    }
  }
  
} catch(e) {
  console.error('FAILED:', e.message);
}
