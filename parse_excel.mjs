import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

const workbook = xlsx.readFile('ustozlar.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

const teachers = [];
const uniqueNames = new Set();

data.forEach((row, i) => {
  if (!row[0]) return;
  let rawText = row[0].toString().trim();
  if (i === 0 && rawText.includes('F.I.O')) return;
  
  // Split titles
  let namePart = rawText.split(/\s*[-—–]\s*/)[0].trim();
  
  // Also split by comma in case they used comma for titles
  namePart = namePart.split(',')[0].trim();
  
  // Keep only first two words if there are many
  const words = namePart.split(/\s+/);
  let ismFamiliya = namePart;
  if (words.length >= 2) {
    // some words might be initials like "X.Yu." so we shouldn't necessarily truncate them if they are 3 words, but user said "faqat ism familyasi". So 2 words is usually Lastname Firstname.
    ismFamiliya = words[0] + ' ' + words[1];
  }

  if (!uniqueNames.has(ismFamiliya) && ismFamiliya.length > 5) {
    uniqueNames.add(ismFamiliya);
    
    // Extract title if exists from the split
    let title = 'O`qituvchi';
    const parts = rawText.split(/\s*[-—–]\s*/);
    if (parts.length > 1) {
      title = parts[1].split(',')[0].trim(); // Take the first title word
    }

    teachers.push({
      id: ismFamiliya.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      name: ismFamiliya,
      title: title,
      department: 'TATU'
    });
  }
});

const dataDir = path.join(process.cwd(), 'server', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(path.join(dataDir, 'teachers.json'), JSON.stringify(teachers, null, 2));

console.log(`Zor! Topilgan va qayta ishlangan ustozlar soni: ${teachers.length}`);
