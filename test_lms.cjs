const https = require('https');
const fs = require('fs');

async function testWebScrape() {
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
    
    // Cookie string to use in next request
    const cookieStr = cookies.map(c => c.split(';')[0]).join('; ');
    console.log('Got cookie:', cookieStr);
    console.log('Redirect:', res.headers.location);
    
    // Fetch dashboard using the exact URL provided in the location header
    const dashUrl = res.headers.location || 'https://lms.tuit.uz/dashboard';
    
    https.get(dashUrl, {
        headers: { 'Cookie': cookieStr, 'User-Agent': 'Mozilla/5.0' }
    }, (res2) => {
        let hdata = '';
        res2.on('data', d => hdata += d);
        res2.on('end', () => {
            fs.writeFileSync('dashboard.html', hdata);
            console.log('Saved dashboard.html (Length:', hdata.length, ')');
        });
    });
  });

  req.write(data);
  req.end();
}

testWebScrape();
