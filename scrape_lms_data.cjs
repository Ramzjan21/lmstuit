const https = require('https');
const fs = require('fs');

async function scrapeLMSPages() {
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
    if (!cookies) return console.log('No cookie returned');
    const cookieStr = cookies.map(c => c.split(';')[0]).join('; ');

    const pages = [
        { name: 'schedule', url: 'https://lms.tuit.uz/student/schedule' },
        { name: 'subject', url: 'https://lms.tuit.uz/student/subject' }
    ];

    pages.forEach(page => {
        https.get(page.url, {
            headers: { 'Cookie': cookieStr, 'User-Agent': 'Mozilla/5.0' }
        }, (res2) => {
            let hdata = '';
            res2.on('data', d => hdata += d);
            res2.on('end', () => {
                fs.writeFileSync(`${page.name}.html`, hdata);
                console.log(`Saved ${page.name}.html`);
            });
        });
    });
  });

  req.write(data);
  req.end();
}

scrapeLMSPages();
