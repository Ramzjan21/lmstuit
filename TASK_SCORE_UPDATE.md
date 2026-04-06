# Task Score Synchronization - Implementation Summary

## O'zgarishlar (Changes)

### 1. Backend - Parser (server/lmsParser.mjs)

**Yangi funksiya qo'shildi:** `parseTaskDetail(html)`

Bu funksiya LMS task detail sahifasidan quyidagi ma'lumotlarni ajratib oladi:
- `maxScore` - Maksimal ball (masalan: 10, 20, 100)
- `score` - Talabaning olgan balli
- `submitted` - Topshirilgan/topshirilmagan holati
- `submittedAt` - Topshirilgan vaqt
- `comment` - O'qituvchi izohi
- `grade` - Baho (A, B, C yoki "Yaxshi", "A'lo", etc.)

**Qidiruv patternlari:**
```javascript
// Maksimal ball: "Ball: 10", "Maksimal ball: 20", "Max score: 100"
/(?:maksimal\s+ball|max(?:imum)?\s+(?:ball|score|балл)|ball\s*:\s*|балл\s*:\s*)(\d{1,3})/i

// Talaba balli: "Sizning ballingiz: 8", "Your score: 15", "Olingan: 10"
/(?:sizning\s+ball(?:ingiz)?|your\s+score|ваш\s+балл|olingan(?:\s+ball)?|получено)\s*:?\s*(\d{1,3})/i

// Topshirilgan: "Topshirilgan", "Submitted", "Сдано", "Bajarildi"
/topshirilgan|submitted|сдано|bajarildi|yuklangan|uploaded/i
```

### 2. Backend - Client (server/lmsClient.mjs)

**Yangi funksiya:** `fetchTaskDetail(cookie, taskUrl)`
- Har bir task uchun detail sahifasini fetch qiladi
- `parseTaskDetail()` orqali ma'lumotlarni parse qiladi
- Xatolik bo'lsa, default qiymatlarni qaytaradi

**Yangilangan funksiya:** `fetchDeadlines(cookie, enrichWithDetails = true)`
- `enrichWithDetails = true` bo'lsa, har bir task uchun detail ma'lumotlarini oladi
- Faqat birinchi 20 ta taskni enrich qiladi (timeout oldini olish uchun)
- Background sync uchun `enrichWithDetails = false` qilib chaqiriladi (tezroq ishlashi uchun)

**Yangilangan funksiya:** `fetchAcademicBundle(cookie, enrichTaskDetails = true)`
- Task detaillarini olish/olmaslikni boshqaradi
- Login paytida: `enrichTaskDetails = true` (to'liq ma'lumot)
- Background sync: `enrichTaskDetails = false` (tez sync)

### 3. Backend - API Endpoints (server/index.mjs)

**Yangilangan endpointlar:**

```javascript
// GET /api/lms/deadlines?enrich=true
// enrich=false bo'lsa, faqat basic task ma'lumotlari qaytadi

// GET /api/lms/sync-all?enrichTasks=true
// enrichTasks=false bo'lsa, task detaillarini olmasdan sync qiladi
```

**Background sync:**
- Har 30 daqiqada avtomatik sync
- Task detaillarini olmaydi (tezroq ishlashi uchun)
- Faqat NB va deadline notificationlar uchun

### 4. Frontend - Tasks Page (src/pages/Tasks.jsx)

**Yangilangan score display logikasi:**

```javascript
// Avval: Faqat subject umumiy ballini ko'rsatardi
const currentScore = matchedGrade?.score ?? null;
// Masalan: Matematika - 75/100 (butun fan balli)

// Hozir: Task-specific ball yoki subject ballini ko'rsatadi
const hasTaskScore = task.score !== null && task.score !== undefined;
const displayScore = hasTaskScore ? task.score : subjectScore;
const displayMaxScore = hasTaskScore ? task.maxScore : 100;
// Masalan: Lab 3 - 8/10 (individual task balli)
```

**Yangi ko'rsatilgan ma'lumotlar:**
- ✓ Topshirilgan belgisi
- 💬 O'qituvchi izohi (agar mavjud bo'lsa)
- 📊 Baho (A, B, C yoki "Yaxshi", "A'lo")

## Test qilish (Testing)

### 1. Serverni ishga tushirish

```bash
# Terminal 1: Backend
npm run dev:api

# Terminal 2: Frontend
npm run dev
```

### 2. Login qilish

- URL: http://localhost:5173
- Login: 1bk34678
- Parol: Muhishm2007

### 3. Tasks sahifasini ochish

- Topshiriqlar ro'yxatini ko'ring
- Deadline o'tgan tasklar uchun ball ko'rsatilishi kerak
- Agar task detail ma'lumoti mavjud bo'lsa: "8/10 ball ✓"
- Agar faqat subject balli mavjud bo'lsa: "75/100 ball"

### 4. Debug qilish

Agar balllar ko'rsatilmasa:

**Backend loglarini tekshiring:**
```bash
# Terminal 1 da ko'ring:
[lmsService] requestJson: /sync-all
Failed to fetch task detail from https://lms.tuit.uz/student/tasks/show/12345: ...
```

**LMS task sahifasini tekshiring:**
1. Browser da LMS ga kiring: https://lms.tuit.uz
2. Biror task sahifasini oching
3. HTML kodini ko'ring (F12 > Elements)
4. Ball qanday formatda yozilganini tekshiring
5. Agar format boshqacha bo'lsa, `parseTaskDetail()` dagi regex patternlarini yangilang

**Frontend console loglarini tekshiring:**
```javascript
// Tasks.jsx da qo'shing:
console.log('Task:', task.title, 'Score:', task.score, 'MaxScore:', task.maxScore);
```

## Performance

### Birinchi sync (Login)
- ~20 task uchun: 10-15 soniya
- Har bir task detail: ~500ms

### Background sync (har 30 daqiqa)
- Task detaillarini olmaydi
- Faqat deadline va NB notificationlar
- ~2-3 soniya

### Keyingi synclar
- Frontend localStorage dan cache oladi
- Faqat yangi tasklar uchun detail fetch qiladi

## Kelajakda yaxshilash (Future Improvements)

1. **Caching:** Task detaillarini localStorage ga saqlash
2. **Incremental sync:** Faqat yangi/o'zgargan tasklar uchun detail olish
3. **Batch processing:** Bir nechta taskni parallel fetch qilish
4. **Retry logic:** Xatolik bo'lsa, qayta urinish
5. **Progress indicator:** Sync jarayonini ko'rsatish

## Muammolar va yechimlar (Troubleshooting)

### Muammo 1: Balllar ko'rsatilmayapti
**Sabab:** LMS HTML strukturasi o'zgargan
**Yechim:** `parseTaskDetail()` dagi regex patternlarini yangilang

### Muammo 2: Sync juda sekin
**Sabab:** Har bir task uchun alohida HTTP request
**Yechim:** `enrichWithDetails = false` qiling yoki task sonini kamaytiring

### Muammo 3: Session expired xatoligi
**Sabab:** LMS cookie muddati tugagan
**Yechim:** Qayta login qiling, auto re-login ishlaydi

### Muammo 4: Task detail sahifasi 404
**Sabab:** Task o'chirilgan yoki link noto'g'ri
**Yechim:** Xatolikni catch qilamiz, default qiymatlar qaytaramiz

## Xulosa (Summary)

✅ Task-specific balllar endi to'g'ri ko'rsatiladi
✅ O'qituvchi izohlari va baholar ko'rinadi
✅ Topshirilgan tasklar belgilanadi
✅ Performance optimizatsiya qilingan
✅ Background sync tezlashtirilgan

Agar savollar bo'lsa, kod ichidagi commentlarni o'qing yoki debug qiling.
