import { parseProfile } from './server/lmsParser.mjs';
import fs from 'fs';

const html = fs.readFileSync('info.html', 'utf-8');
const profile = parseProfile(html);
console.log("Parsed profile:", profile);

