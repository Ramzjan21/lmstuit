import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const baseUrl = 'https://tuit.uz';

// Titles to match after the dash
const titleKeywords = ['mudir', 'professor', 'dotsent', 'o\'qituvchi', 'o‘qituvchi', 'o`qituvchi', 'assistent', 'stajyor', 'kafedra mudiri'];

function isTeacherDesc(desc) {
  const lower = desc.toLowerCase();
  return titleKeywords.some(kw => lower.includes(kw));
}

async function main() {
  console.log('Fetching kafedralar list...');
  const res = await fetch(`${baseUrl}/kafedralar`);
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const links = [];
  $('a').each((i, el) => {
    const href = $(el).attr('href');
    if (href && href.startsWith(`${baseUrl}/`) && !href.includes('/ru/') && !href.includes('/en/') && !href.includes('/de/') && href.split('/').length === 4) {
      links.push(href);
    } else if (href && href.startsWith('/') && !href.includes('/ru/') && !href.includes('/en/') && !href.includes('/de/') && href.split('/').length === 2 && href.length > 1) {
      links.push(baseUrl + href);
    }
  });

  const uniqueLinks = [...new Set(links)];
  const teachers = [];

  for (const link of uniqueLinks) {
    try {
      const pageRes = await fetch(link);
      const pageHtml = await pageRes.text();
      const $$ = cheerio.load(pageHtml);
      
      let department = $$('h1, h2').text().trim().split('\n')[0] || '';

      $$('p, li').each((i, el) => {
        let text = $$(el).text().trim();
        // Remove leading numbers like "1. " or bullet points
        text = text.replace(/^[\d\.\-\•\*\s]+/, '');
        
        // Find the dash (hyphen, en-dash, em-dash)
        const parts = text.split(/\s*[-–—]\s*/);
        if (parts.length >= 2) {
          const namePart = parts[0].trim();
          const descPart = parts.slice(1).join(' ').trim();
          
          if (namePart.split(' ').length >= 2 && namePart.split(' ').length <= 5 && isTeacherDesc(descPart)) {
            // Capitalization check -> roughly a name
            if (/^[A-ZА-ЯOʻGʻShCh]/.test(namePart)) {
              teachers.push({
                id: namePart.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                name: namePart,
                title: descPart,
                department: department
              });
            }
          }
        }
      });
    } catch (e) {
      // ignore
    }
  }

  const uniqueTeachersMap = new Map();
  for (const t of teachers) {
    if (!uniqueTeachersMap.has(t.name)) {
      uniqueTeachersMap.set(t.name, t);
    }
  }

  const finalTeachers = Array.from(uniqueTeachersMap.values());
  console.log(`Found ${finalTeachers.length} teachers!`);
  
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
  }
  fs.writeFileSync(path.join(dataDir, 'teachers.json'), JSON.stringify(finalTeachers, null, 2));
  console.log('Saved to data/teachers.json');
}

main();
