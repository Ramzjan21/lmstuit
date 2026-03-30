# Smart Timetable App - TUIT LMS Integration

Aqlli Dars Jadvali - TUIT talabalari uchun maxsus ishlab chiqilgan mobil ilova.

## 🎯 Asosiy Xususiyatlar

### ✅ Amalga oshirilgan funksiyalar:

1. **LMS TUIT Integratsiyasi**
   - HEMIS ID orqali to'g'ridan-to'g'ri kirish
   - Dars jadvali avtomatik sinxronlash
   - Baholar va fanlar ma'lumotlarini olish
   - Vazifalar va deadlinelarni yuklash
   - Session cookie bilan xavfsiz autentifikatsiya

2. **Dars Jadvali (Timetable)**
   - Juft/Toq hafta avtomatik aniqlash
   - Darslar, vaqt, xona va o'qituvchi ma'lumotlari
   - Google Maps integratsiyasi
   - Dars qo'shish/tahrirlash/o'chirish
   - LMS bilan sinxronlash

3. **Vazifalar (Tasks)**
   - Vazifalarni kategoriyalar bo'yicha saralash
   - Countdown timer (qolgan vaqt)
   - Prioritet belgilash
   - Fayl biriktirish imkoniyati
   - LMS dan avtomatik yuklash

4. **Baholar (Grades)**
   - GPA hisoblash (4.0 shkala)
   - Har bir fan bo'yicha ball
   - NB (qoldirgan darslar) hisobi
   - Circular progress bar vizualizatsiya
   - LMS bilan sinxronlash

5. **AI Yordamchi (AI Chat)**
   - O'quv jarayoni bo'yicha savollar
   - Darslar, vazifalar, baholar haqida ma'lumot
   - Real-time chat interfeysi
   - Kontekstga mos javoblar

6. **Dashboard**
   - Bugungi darslar ko'rinishi
   - Yaqinlashayotgan vazifalar
   - Tezkor harakatlar (AI Chat, Vazifalar)
   - Bildirishnomalar boshqaruvi

## 🚀 O'rnatish va Ishga Tushirish

### Talablar:
- Node.js 16+
- npm yoki yarn

### O'rnatish:

```bash
# Dependencylarni o'rnatish
npm install

# Development rejimida ishga tushirish
npm run dev

# Production build
npm run build

# Android APK yaratish
npm run build
npx cap sync
npx cap open android
```

## 🔐 LMS Kirish

1. Login sahifasida "LMS (TUIT) Kirish" tugmasini bosing
2. HEMIS ID (masalan: 1BK34678) kiriting
3. LMS parolingizni kiriting
4. Tizim avtomatik ravishda barcha ma'lumotlarni yuklab oladi

## 🛠 Texnologiyalar

- **Frontend:** React 19.2.0
- **Build Tool:** Vite 7.3.1
- **Routing:** React Router DOM 7.13.1
- **Mobile:** Capacitor 6.2.1
- **Storage:** Capacitor Preferences
- **Icons:** Lucide React
- **Styling:** Custom CSS (Glassmorphism dizayn)

## 📱 Mobil Ilova

Android APK yaratish uchun:

```bash
npm run build
npx cap sync android
npx cap open android
```

Android Studio da "Build > Build Bundle(s) / APK(s) > Build APK(s)" ni tanlang.

## 🎨 Dizayn Xususiyatlari

- Dark mode (qorong'i rejim)
- Glassmorphism effektlari
- Gradient ranglar (Indigo + Pink)
- Responsive dizayn
- Smooth animatsiyalar
- Bottom navigation

## 📂 Proyekt Strukturasi

```
src/
├── pages/
│   ├── Dashboard.jsx      # Asosiy sahifa
│   ├── Timetable.jsx      # Dars jadvali
│   ├── Tasks.jsx          # Vazifalar
│   ├── Grades.jsx         # Baholar
│   ├── AIChat.jsx         # AI Yordamchi
│   ├── Login.jsx          # Kirish
│   └── Register.jsx       # Ro'yxatdan o'tish
├── components/
│   ├── Layout.jsx         # Asosiy layout
│   └── Navigation.jsx     # Bottom navigation
├── services/
│   └── lmsService.js      # LMS API integratsiya
└── App.jsx                # Asosiy app komponent
```

## 🔄 LMS Sinxronlash

LMS bilan sinxronlash quyidagi ma'lumotlarni oladi:

- **Dars jadvali:** `/student/schedule` dan
- **Fanlar va baholar:** `/student/subject` dan
- **Vazifalar:** `/student/deadlines` dan

## 🐛 Muammolarni Hal Qilish

### Dependency xatolari:
```bash
npm install --legacy-peer-deps
```

### Build xatolari:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📝 Litsenziya

Bu proyekt TUIT talabalari uchun maxsus ishlab chiqilgan.

## 👨‍💻 Muallif

Smart Timetable App - TUIT LMS Integration

---

**Eslatma:** Bu ilova rasmiy TUIT LMS ilovasi emas, balki talabalar uchun qulaylik yaratish maqsadida ishlab chiqilgan mustaqil proyekt.

