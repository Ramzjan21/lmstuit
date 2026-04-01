import axios from 'axios';

const r = await axios.get('https://lms.tuit.uz/auth/login', {
  timeout: 15000,
  validateStatus: () => true,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
});

console.log('HTTP Status:', r.status);
console.log('_token mavjud:', String(r.data).includes('_token'));
console.log('login field:', String(r.data).includes('name="login"'));

const match = String(r.data).match(/name="_token"\s+value="([^"]+)"/i);
console.log('CSRF token:', match?.[1]?.slice(0, 40) || 'TOPILMADI');

// Log first 500 chars of page
console.log('\n--- Sahifa boshi ---');
console.log(String(r.data).slice(0, 600));
