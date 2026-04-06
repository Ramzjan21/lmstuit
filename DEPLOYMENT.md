# TATU LMS Timetable App - Deployment Guide

## Architecture

- **Frontend:** Vercel (https://lmstuit-vod3.vercel.app)
- **Backend:** Render.com (https://your-backend.onrender.com)

## Vercel Setup (Frontend Only)

### 1. Environment Variables

Go to Vercel Dashboard → Settings → Environment Variables and add:

```
VITE_LMS_PROXY_URL=https://your-backend.onrender.com/api/lms
VITE_AI_API_KEY=your_openai_api_key
VITE_AI_API_URL=https://api.openai.com/v1/chat/completions
VITE_AI_MODEL=gpt-4o-mini
```

**IMPORTANT:** Replace `your-backend.onrender.com` with your actual Render backend URL!

### 2. Deploy

Push to GitHub → Vercel auto-deploys

## Render.com Setup (Backend Only)

### 1. Create New Web Service

- Connect GitHub repository
- Build Command: `npm install`
- Start Command: `npm start`
- Environment: Node

### 2. Environment Variables

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
TELEGRAM_BOT_TOKEN=123456789:ABC...
SESSION_SECRET=random_secret_key_min_32_chars
PORT=3030
```

### 3. Deploy

Render auto-deploys on push to main branch

## Testing

1. Backend health check:
   ```
   https://your-backend.onrender.com/api/lms/health
   ```

2. Frontend:
   ```
   https://lmstuit-vod3.vercel.app
   ```

## Current Issue

Vercel serverless functions don't work well with ES6 modules (.mjs).

**Solution:** Keep backend on Render.com, frontend on Vercel.

## Next Steps

1. Find your Render backend URL
2. Update VITE_LMS_PROXY_URL in Vercel
3. Redeploy Vercel
4. Test!
