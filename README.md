# TATU LMS Telegram Web App

Bu loyiha to`liq **Telegram Web App** sifatida ishlaydi.
Android/Capacitor qismlari olib tashlangan.

## Nimalar ishlaydi

- LMS login
- Dashboard (aktual semestr bo`yicha)
- Dars jadvali
- Davomat va o`zlashtirish (real-time yangilash)
- Topshiriqlar (fan va kategoriya bo`yicha filtr)
- Leaderboard
- AI chat

## Arxitektura

LMS so`rovlari CORS/cookie sabab browserdan to`g`ridan-to`g`ri yuborilmaydi.
Shuning uchun backend proxy bor:

- Frontend: Vite (`http://localhost:5173`)
- Backend proxy: Express (`http://localhost:3030`)

Frontend `/api/lms/*` endpointlariga uradi, Vite proxy backendga uzatadi.

## Tez ishga tushirish

1) Paketlarni o`rnating

```bash
npm install
```

2) Frontend + backendni birga ishga tushiring

```bash
npm run dev:all
```

3) Brauzerda oching

`http://localhost:5173`

## Skriptlar

- `npm run dev` - faqat frontend
- `npm run dev:api` - faqat LMS proxy backend
- `npm run dev:all` - ikkalasi birga
- `npm run build` - production build

## Telegram Web App ulash

1. BotFather orqali bot yarating
2. Web App URL ni bot menyusiga ulang (HTTPS bo`lishi shart)
3. Telegram ichidan Web App ni oching

`index.html` da Telegram SDK ulangan:

`https://telegram.org/js/telegram-web-app.js`

`src/main.jsx` da `Telegram.WebApp.ready()` va `expand()` ishlatiladi.

## Environment

`.env.local` namunasi:

```env
VITE_AI_API_KEY=your_api_key
VITE_AI_API_URL=https://api.openai.com/v1/chat/completions
VITE_AI_MODEL=gpt-4o-mini
VITE_LMS_PROXY_URL=/api/lms
SESSION_SECRET=change_me_for_prod
PORT=3030
```

## LMS Proxy endpointlar

- `POST /api/lms/login`
- `POST /api/lms/logout`
- `GET /api/lms/profile`
- `GET /api/lms/schedule`
- `GET /api/lms/deadlines`
- `GET /api/lms/grades`
- `GET /api/lms/grades/realtime`
- `GET /api/lms/study-plan`
- `GET /api/lms/finals`
- `GET /api/lms/courses`
- `GET /api/lms/sync-all`
- `GET /api/lms/health`

## Eslatma

- Dev rejimda cookie session memoryda saqlanadi (server restart bo`lsa qayta login kerak)
- Productionda `express-session` store (Redis/Postgres store) ulash tavsiya etiladi
