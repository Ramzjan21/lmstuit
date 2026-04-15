// Find upload URL from LMS page
import fs from 'fs';
const h = fs.readFileSync('debug_upload_page.html', 'utf8');

// Find all JS code that has 'upload' or 'activity'
const scriptBlocks = [...h.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
for (const blk of scriptBlocks) {
  const code = blk[1];
  if (code.includes('upload') || code.includes('activity') || code.includes('modal')) {
    console.log('=== JS BLOCK ===');
    console.log(code.substring(0, 1500));
    console.log('...');
  }
}

// Also look for the modal form HTML
const modalIdx = h.indexOf('modal-upload');
if (modalIdx === -1) {
  const modalIdx2 = h.indexOf('id="uploadModal"');
  if (modalIdx2 !== -1) {
    console.log('\n=== Upload Modal HTML ===');
    console.log(h.substring(modalIdx2, modalIdx2 + 2000));
  }
} else {
  console.log('\n=== Upload Modal ===');
  console.log(h.substring(modalIdx, modalIdx + 2000));
}
