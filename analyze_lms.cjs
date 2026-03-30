const https = require('https');

async function analyzePages() {
  const url = 'https://lms.tuit.uz/auth/login';
  const data = new URLSearchParams({
    'login': '1BK34678',
    'password': 'Muhishm2007'
  }).toString();

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(data),
      'User-Agent': 'Mozilla/5.0'
    }
  };

  const req = https.request(url, options, (res) => {
    const cookies = res.headers['set-cookie'];
    if (!cookies) return console.log('No cookie');
    const cookieStr = cookies.map(c => c.split(';')[0]).join('; ');
    
    // Get deadlines page
    https.get('https://lms.tuit.uz/student/deadlines', {
      headers: { 'Cookie': cookieStr, 'User-Agent': 'Mozilla/5.0' }
    }, (r) => {
      let html = '';
      r.on('data', d => html += d);
      r.on('end', () => {
        // Find specific content section
        const idx = html.indexOf('content-page-title');
        console.log('=== DEADLINES CONTENT START ===');
        console.log(html.substring(idx, idx + 3000));
      });
    });

    // Get finals page
    https.get('https://lms.tuit.uz/student/finals', {
      headers: { 'Cookie': cookieStr, 'User-Agent': 'Mozilla/5.0' }
    }, (r) => {
      let html = '';
      r.on('data', d => html += d);
      r.on('end', () => {
        const idx = html.indexOf('content-page-title');
        console.log('\n=== FINALS CONTENT START ===');
        console.log(html.substring(idx, idx + 5000));
      });
    });

    // Get student info page
    https.get('https://lms.tuit.uz/student/info', {
      headers: { 'Cookie': cookieStr, 'User-Agent': 'Mozilla/5.0' }
    }, (r) => {
      let html = '';
      r.on('data', d => html += d);
      r.on('end', () => {
        const idx = html.indexOf('content-page-title');
        console.log('\n=== INFO CONTENT START ===');
        console.log(html.substring(idx, idx + 3000));
      });
    });
  });

  req.write(data);
  req.end();
}

analyzePages();
