import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.local') });

import { loginLms } from './server/lmsClient.mjs';

const LOGIN = process.argv[2] || 'test_login';
const PASS  = process.argv[3] || 'test_pass';

console.log(`[TEST] Logging in as: ${LOGIN}`);

try {
  const result = await loginLms(LOGIN, PASS);
  console.log('[TEST] SUCCESS! Name:', result.name);
  console.log('[TEST] Cookie (first 80 chars):', result.cookie.slice(0, 80));
} catch (err) {
  console.error('[TEST] FAILED:', err.message);
  console.error('[TEST] Status:', err.status);
}
