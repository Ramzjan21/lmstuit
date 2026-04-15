// Test how LMS file submission works - find the upload endpoint
import { loginLms } from './server/lmsClient.mjs';
import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const { cookie } = await loginLms('1bk34678', 'Muhishm2007');
const client = axios.create({
  baseURL: 'https://lms.tuit.uz', timeout: 30000, maxRedirects: 0,
  validateStatus: () => true,
  headers: { Cookie: cookie, 'User-Agent': 'Mozilla/5.0' }
});

// Get a course page to find the form submission URL
const courseId = '25630'; // Новейшая история
const resp = await client.get(`/student/my-courses/show/${courseId}`);
const html = String(resp.data);

// Save page
fs.writeFileSync('debug_upload_page.html', html);
console.log('Saved debug_upload_page.html');

// Find form action URLs
const forms = [...html.matchAll(/<form[^>]*action="([^"]*)"[^>]*>/gi)];
console.log('\nForms found:');
forms.forEach(f => console.log(' action:', f[1]));

// Find upload-related links
const uploadLinks = [...html.matchAll(/href="([^"]*(?:upload|submit|activity)[^"]*)"/gi)];
console.log('\nUpload links:');
uploadLinks.forEach(l => console.log(' ', l[1]));

// Find any AJAX/fetch endpoints in scripts
const ajaxUrls = [...html.matchAll(/['"]([^'"]*(?:upload|activity|submit)[^'"]*)['"]/gi)];
console.log('\nAJAX-like URLs in page:');
ajaxUrls.slice(0,10).forEach(u => console.log(' ', u[1]));

// Also check the CSRF token
const csrfMatch = html.match(/name="_token"\s+value="([^"]+)"/i) || 
                  html.match(/"csrfToken"\s*:\s*"([^"]+)"/i);
console.log('\nCSRF token:', csrfMatch?.[1]?.substring(0, 20) + '...');

// Find any task row with "upload" button - look for the upload form structure
const uploadFormArea = html.match(/<form[^>]*(?:enctype|multipart)[^>]*>([\s\S]{0,2000}?)<\/form>/i);
if (uploadFormArea) {
  console.log('\nUpload form area:', uploadFormArea[0].substring(0, 500));
}
