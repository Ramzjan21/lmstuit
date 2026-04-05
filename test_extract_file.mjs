import { createClient } from './server/lmsClient.mjs';
import fs from 'fs';
import 'dotenv/config';

// FAKE COOKIE FOR TEST: We will just attempt to parse a local html file if we can't fetch
const testUrl = "https://lms.tuit.uz/student/my-courses/show/25630";

async function run() {
    // Let's create an html file manually or use 'info.html'
    if (fs.existsSync('info.html')) {
        console.log('info.html exist. Analyzing...');
       // let's do something
    }
}
run();
