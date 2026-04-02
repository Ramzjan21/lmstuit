import { createContext, useContext } from 'react';

const messages = {
  uz: {
    app: {
      loading: 'Yuklanmoqda...'
    },
    nav: {
      home: 'Asosiy',
      schedule: 'Jadval',
      attendance: 'Davomat',
      tasks: 'Topshiriq',
      top: 'Top'
    },
    common: {
      unknown: 'Noma`lum',
      unknownSemester: 'Noma`lum semestr',
      sync: 'Yangilash',
      viewAll: 'Barchasi',
      noData: 'Ma`lumot topilmadi'
    },
    login: {
      title: 'TATU Cyber Portal',
      subtitle: 'Faqat LMS autentifikatsiya orqali kirish',
      loginLabel: 'LMS Login',
      passwordLabel: 'LMS Parol',
      loginPlaceholder: '3131331000...',
      passwordPlaceholder: '••••••••',
      submit: 'LMS orqali kirish',
      connecting: 'LMS ga ulanmoqda...',
      syncing: 'Talaba ma`lumotlari sinxronlanmoqda...',
      loadingHint: 'TATU LMS dan aktual ma`lumotlar olinmoqda...',
      errorGeneric: 'Kirishda xatolik yuz berdi.',
      syncError: "Sinxronizatsiyada xatolik yuz berdi. Qayta urinib ko'ring.",
      loginError: "Login jarayonida xatolik yuz berdi. Qayta urinib ko'ring.",
      loadingHint: 'TATU LMS dan aktual ma`lumotlar olinmoqda...',
      telegram: 'Telegram'
    },
    dashboard: {
      online: '{name}, tizim online',
      subtitle: 'TATU cyber-academic panel',
      activeSemester: 'Aktiv semestr',
      lastSync: 'Oxirgi sync',
      noSync: 'Hali sync yo`q',
      gpa: 'GPA',
      average: 'O`rtacha',
      credits: 'Kredit',
      profile: 'Talaba profili',
      profileDesc: 'To`liq ma`lumotlar',
      leaderboard: 'Leaderboard',
      leaderboardDesc: 'Talabalar reytingi',
      grades: 'Baholar',
      gradesDesc: 'Semestr natijalari',
      ai: 'AI Chat',
      aiDesc: 'O`quv yordamchi',
      teachers: 'Ustozlar',
      teachersDesc: 'TATU ustozlarini baholash va sharhlar',
      warning: 'Davomat ogohlantirishi',
      warningDesc: '{count} ta fanda NB limiti xavf zonasida.',
      freelance: 'Xizmatlar',
      freelanceDesc: 'Talabalar xizmati (Freelance)',
      nextLesson: 'Yaqin dars',
      noNextLesson: 'Yaqin dars topilmadi',
      todayLessons: 'Bugungi darslar',
      noTodayLessons: 'Bugun dars yo`q',
      upcomingTasks: 'Yaqin topshiriqlar',
      noTasks: 'Topshiriq topilmadi',
      schedule: 'Jadval'
    },
    timetable: {
      title: 'Dars jadvali',
      evenWeek: 'Juft hafta',
      oddWeek: 'Toq hafta',
      activeSemester: 'Aktiv semestr',
      weeklyLessons: 'Haftalik darslar',
      lessonsCount: '{count} ta dars',
      noLessons: 'Bu kunga dars qo`yilmagan',
      roomMissing: 'Xona ko`rsatilmagan',
      teacher: 'O`qituvchi',
      noDayLessons: 'Bu kunga dars qo`yilmagan',
      unknownSubject: 'Noma`lum fan',
      types: {
         "ma'ruza": "Ma'ruza",
         "amaliyot": "Amaliyot",
         "laboratoriya": "Laboratoriya",
         "seminar": "Seminar"
      }
    },
    tasks: {
      title: 'Topshiriqlar',
      subtitle: 'Aktual semestr bo`yicha fanlarga filtrlangan LMS topshiriqlari',
      activeSemester: 'Aktiv semestr',
      activeTasks: 'Faol topshiriqlar',
      urgent: 'Shoshilinch',
      deadline: 'Tugash vaqti',
      noFiltered: 'Tanlangan filtr bo`yicha topshiriq topilmadi',
      openLms: 'LMS topshiriqni ochish',
      noTime: 'Vaqt noma`lum',
      expired: 'Muddat tugagan',
      leftMinutes: '{value} daqiqa qoldi',
      leftHours: '{h} soat {m} daqiqa qoldi',
      leftDays: '{d} kun {h} soat qoldi',
      unknownSubject: 'Noma`lum fan',
      countTasks: '{count} ta topshiriq',
      tgReminder: 'Eslatma',
      tgReminderOn: 'Telegram eslatmasi faol',
      tgReminderOff: 'Telegram eslatmasi yopiq',
      tgReminderMsg: 'uchun Telegram eslatmasi yoqildi',
      categories: {
        all: 'Barchasi',
        homework: 'Uy vazifasi',
        lab: 'Laboratoriya',
        coursework: 'Kurs ishi',
        midterm: 'Oraliq'
      }
    },
    grades: {
      title: 'O`zlashtirish va davomat',
      subtitle: 'Fanlar bo`yicha real ballar, GPA va dars qoldirish holati',
      activeSemester: 'Aktiv semestr',
      lastLiveSync: 'Oxirgi live yangilanish',
      gpa: 'GPA (4.0)',
      avgScore: 'O`rtacha ball',
      credits: 'Kreditlar',
      warning: 'Davomat ogohlantirishi',
      warningDesc: '{count} ta fanda NB limiti 75% dan oshgan.',
      semesterOverview: 'Semestr kesimida o`zlashtirish',
      noGrade: 'Baho yo`q',
      attendanceRealtime: 'Davomat real vaqt rejimida LMS dan yangilanadi',
      noSubjects: 'Fanlar ma`lumoti topilmadi',
      liveOn: 'LIVE ON',
      liveOff: 'LIVE OFF',
      attendance: 'Davomat (NB)',
      high: 'Yuqori',
      good: 'Yaxshi',
      low: 'Past'
    },
    profile: {
      title: 'Talaba profili',
      subtitle: 'LMS dagi to`liq shaxsiy va akademik ma`lumotlar',
      lastSync: 'Oxirgi sync',
      noSync: 'Hali sync bo`lmagan',
      activeSemester: 'Aktiv semestr',
      labels: {
        fio: 'F.I.O',
        group: 'Guruh',
        course: 'Kurs',
        direction: 'Yo`nalish',
        birthDate: 'Tug`ilgan sana',
        gender: 'Jinsi',
        recordBook: 'Reyting daftarchasi',
        degree: 'Darajasi',
        language: 'Ta`lim tili',
        educationType: 'Ta`lim turi',
        curator: 'Kurator',
        scholarship: 'Stipendiya',
        permanentAddress: 'Doimiy manzil',
        currentAddress: 'Joriy manzil'
      }
    },
    leaderboard: {
      title: 'Leaderboard',
      subtitle: 'TATU talabalari orasida o`zlashtirish va davomat reytingi',
      yourRank: 'Sizning o`rningiz',
      rating: 'Reyting',
      score: 'Ball',
      attendance: 'Davomat',
      gpa: 'GPA',
      empty: 'Leaderboard hozircha bo`sh',
      showing: 'Ko`rsatilmoqda: {count} ta talaba'
    },
    library: {
      title: 'Kutubxona',
      subtitle: 'Web app uchun o`quv materiallari va tezkor qaydlar',
      materials: 'Materiallar',
      notes: 'Ovozli qayd',
      upload: 'Yangi material yuklash',
      empty: 'Materiallar yo`q',
      recording: 'Yozilmoqda...',
      noteTitle: 'Aqlli qayd',
      notePlaceholder: 'Mikrofonni yoqing yoki qo`lda yozing...',
      stop: 'To`xtatish',
      start: 'Yozishni boshlash',
      save: 'Saqlash'
    },
    ai: {
      title: 'AI Yordamchi',
      subtitle: 'O`quv jarayoni bo`yicha savollaringizga javob beraman',
      inputPlaceholder: 'Savolingizni yozing...',
      loading: 'Javob tayyorlanmoqda...'
    },
    settings: {
      title: 'Sozlamalar',
      profileInfo: 'Profil ma`lumotlari',
      regName: 'Ro`yxatdan o`tgan nom:',
      sysId: 'Tizim ID (LMS):',
      sysConfig: 'Tizim moslamalari',
      appLang: 'Ilova Tili',
      theme: 'Dizayn Mavzusi',
      themeDark: 'Qorong`i (Dark)',
      themeLight: 'Yorug` (Light)',
      clearCache: 'Oflayn keshni tozalash',
      clearCacheDesc: 'Dastur xotirani ko`p band qilsa',
      clearing: 'Tozalanmoqda...',
      notifications: 'Bildirishnomalar',
      about: 'Dastur haqida',
      version: 'Loyiha versiyasi',
      backendStatus: 'LMS Server (Backend)',
      online: 'Faol (Online)',
      logout: 'Hisobdan chiqish',
      confirmClear: 'Haqiqatdan ham barcha oflayn kesh ma`lumotlarni tozalaysizmi? (Kiritilgan sozlamalar saqlab qolinadi)',
      cleared: 'Ma`lumotlar xotiradan muvaffaqiyatli tozalandi!'
    },
    teachers: {
      title: 'Ustozlar Reytingi',
      search: 'Ism yoki kafedrani izlang...',
      empty: 'Hech qanday ustoz topilmadi',
      reviews: 'sharh',
      reviewEmpty: 'Hali sharhlar yo`q!\nBirinchi bo`lib baholang va sharh qoldiring.',
      rate: 'BAHO BERING:',
      reviewPlaceholder: 'Ustoz haqdagi fikringizni yozing...',
      submitReview: 'Sharh yuborish',
      avgRating: 'O`RTACHA BAHO',
      totalReviews: 'Umumiy {count} ta sharh'
    },
    freelance: {
      title: 'Talabalar Xizmati',
      subtitle: 'TATU talabalari tomonidan taqdim etiladigan xizmatlar (Freelance)',
      search: 'Xizmat yoki frilanserni izlang...',
      empty: 'Siz izlagan xizmat topilmadi',
      reviews: 'sharh',
      reviewEmpty: 'Hali sharhlar yo`q!\nBirinchi bo`lib baholang va sharh qoldiring.',
      rate: 'BAHO BERING:',
      reviewPlaceholder: 'Xizmat haqdagi fikringizni yozing...',
      submitReview: 'Sharh yuborish',
      contact: 'Aloqa uchun (Telegram / Tel)',
      myServices: 'Mening xizmatlarim',
      price: 'Narxi:',
      addService: 'Yangi xizmat qo`shish',
      serviceName: 'Xizmat nomi',
      description: 'Qisqacha ta`rif',
      priceLabel: 'Narxi (so`m)',
      save: 'Saqlash',
      contactInfo: 'Bog`lanish uchun (Telegram yoki Tel)',
      avgRating: 'O`RTACHA BAHO',
      totalReviews: 'Umumiy {count} ta sharh'
    }
  },
  ru: {
    app: {
      loading: 'Загрузка...'
    },
    nav: {
      home: 'Главная',
      schedule: 'Расписание',
      attendance: 'Посещаемость',
      tasks: 'Задания',
      top: 'Топ'
    },
    common: {
      unknown: 'Неизвестно',
      unknownSemester: 'Неизвестный семестр',
      sync: 'Обновить',
      viewAll: 'Все',
      noData: 'Данные не найдены',
      errorGeneric: 'Произошла ошибка'
    },
    login: {
      title: 'TATU Cyber Portal',
      subtitle: 'Вход только через LMS',
      loginLabel: 'LMS Логин',
      passwordLabel: 'Пароль LMS',
      loginPlaceholder: '3131331000...',
      passwordPlaceholder: '••••••••',
      submit: 'Войти через LMS',
      connecting: 'Подключение к LMS...',
      syncing: 'Синхронизация данных студента...',
      loadingHint: 'Получаем актуальные данные из TATU LMS...',
      errorGeneric: 'Ошибка входа.',
      syncError: 'Ошибка синхронизации. Попробуйте еще раз.',
      loginError: 'Ошибка входа. Попробуйте еще раз.',
      loadingHint: 'Получаем актуальные данные из TATU LMS...',
      telegram: 'Telegram'
    },
    dashboard: {
      online: '{name}, система онлайн',
      subtitle: 'TATU cyber-academic panel',
      activeSemester: 'Активный семестр',
      lastSync: 'Последняя синхронизация',
      noSync: 'Синхронизации еще не было',
      gpa: 'GPA',
      average: 'Средний',
      credits: 'Кредиты',
      profile: 'Профиль студента',
      profileDesc: 'Полные данные',
      leaderboard: 'Рейтинг',
      leaderboardDesc: 'Рейтинг студентов',
      grades: 'Оценки',
      gradesDesc: 'Результаты семестра',
      ai: 'AI Чат',
      aiDesc: 'Учебный помощник',
      teachers: 'Преподаватели',
      teachersDesc: 'Оценка и отзывы о преподавателях ТУИТ',
      warning: 'Предупреждение по посещаемости',
      warningDesc: 'В {count} предметах риск по лимиту NB.',
      freelance: 'Услуги',
      freelanceDesc: 'Студенческие услуги (Freelance)',
      nextLesson: 'Следующая пара',
      noNextLesson: 'Ближайших пар нет',
      todayLessons: 'Пары на сегодня',
      noTodayLessons: 'Сегодня пар нет',
      upcomingTasks: 'Ближайшие задания',
      noTasks: 'Заданий не найдено',
      schedule: 'Расписание'
    },
    timetable: {
      title: 'Расписание',
      evenWeek: 'Четная неделя',
      oddWeek: 'Нечетная неделя',
      activeSemester: 'Активный семестр',
      weeklyLessons: 'Пары за неделю',
      lessonsCount: '{count} пар',
      noLessons: 'На этот день пар нет',
      roomMissing: 'Аудитория не указана',
      teacher: 'Преподаватель',
      noDayLessons: 'На этот день пар нет',
      unknownSubject: 'Неизвестный предмет',
      types: {
         "ma'ruza": "Лекция",
         "amaliyot": "Практика",
         "laboratoriya": "Лабораторная",
         "seminar": "Семинар"
      }
    },
    tasks: {
      title: 'Задания',
      subtitle: 'Задания LMS по предметам текущего семестра',
      activeSemester: 'Активный семестр',
      activeTasks: 'Активные задания',
      urgent: 'Срочные',
      deadline: 'Срок сдачи',
      noFiltered: 'По выбранному фильтру задания не найдены',
      openLms: 'Открыть задание в LMS',
      noTime: 'Время неизвестно',
      expired: 'Срок истек',
      leftMinutes: 'Осталось {value} минут',
      leftHours: 'Осталось {h} ч {m} мин',
      leftDays: 'Осталось {d} д {h} ч',
      unknownSubject: 'Неизвестный предмет',
      countTasks: '{count} заданий',
      tgReminder: 'Уведомление',
      tgReminderOn: 'Telegram уведомление акт.',
      tgReminderOff: 'Telegram уведомление выкл.',
      tgReminderMsg: 'включено Telegram уведомление для',
      categories: {
        all: 'Все',
        homework: 'Домашнее задание',
        lab: 'Лабораторная',
        coursework: 'Курсовая работа',
        midterm: 'Рубежный контроль'
      }
    },
    grades: {
      title: 'Успеваемость и посещаемость',
      subtitle: 'Реальные баллы, GPA и пропуски по предметам',
      activeSemester: 'Активный семестр',
      lastLiveSync: 'Последнее live-обновление',
      gpa: 'GPA (4.0)',
      avgScore: 'Средний балл',
      credits: 'Кредиты',
      warning: 'Предупреждение по посещаемости',
      warningDesc: 'В {count} предметах лимит NB выше 75%.',
      semesterOverview: 'Успеваемость по семестру',
      noGrade: 'Оценки нет',
      attendanceRealtime: 'Посещаемость обновляется в реальном времени из LMS',
      noSubjects: 'Данные по предметам не найдены',
      liveOn: 'LIVE ON',
      liveOff: 'LIVE OFF',
      attendance: 'Посещаемость (NB)',
      high: 'Высокий',
      good: 'Хороший',
      low: 'Низкий'
    },
    profile: {
      title: 'Профиль студента',
      subtitle: 'Полные личные и академические данные из LMS',
      lastSync: 'Последняя синхронизация',
      noSync: 'Синхронизации еще не было',
      activeSemester: 'Активный семестр',
      labels: {
        fio: 'Ф.И.О',
        group: 'Группа',
        course: 'Курс',
        direction: 'Направление',
        birthDate: 'Дата рождения',
        gender: 'Пол',
        recordBook: 'Зачетная книжка',
        degree: 'Степень',
        language: 'Язык обучения',
        educationType: 'Тип обучения',
        curator: 'Куратор',
        scholarship: 'Стипендия',
        permanentAddress: 'Постоянный адрес',
        currentAddress: 'Текущий адрес'
      }
    },
    leaderboard: {
      title: 'Рейтинг',
      subtitle: 'Рейтинг студентов TATU по успеваемости и посещаемости',
      yourRank: 'Ваше место',
      rating: 'Рейтинг',
      score: 'Балл',
      attendance: 'Посещаемость',
      gpa: 'GPA',
      empty: 'Рейтинг пока пуст',
      showing: 'Показано: {count} студентов'
    },
    library: {
      title: 'Библиотека',
      subtitle: 'Учебные материалы и быстрые заметки для web app',
      materials: 'Материалы',
      notes: 'Голосовая заметка',
      upload: 'Загрузить новый материал',
      empty: 'Материалов нет',
      recording: 'Идет запись...',
      noteTitle: 'Умная заметка',
      notePlaceholder: 'Включите микрофон или введите текст вручную...',
      stop: 'Остановить',
      start: 'Начать запись',
      save: 'Сохранить'
    },
    ai: {
      title: 'AI Помощник',
      subtitle: 'Отвечаю на вопросы по учебному процессу',
      inputPlaceholder: 'Введите ваш вопрос...',
      loading: 'Готовлю ответ...'
    },
    settings: {
      title: 'Настройки',
      profileInfo: 'Данные профиля',
      regName: 'Зарегистрированное имя:',
      sysId: 'ID в системе (LMS):',
      sysConfig: 'Конфигурация',
      appLang: 'Язык приложения',
      theme: 'Тема оформления',
      themeDark: 'Темная (Dark)',
      themeLight: 'Светлая (Light)',
      clearCache: 'Очистить офлайн-кэш',
      clearCacheDesc: 'Если приложение занимает много памяти',
      clearing: 'Очистка...',
      notifications: 'Уведомления',
      about: 'О приложении',
      version: 'Версия проекта',
      backendStatus: 'Сервер LMS (Backend)',
      online: 'Активен (Online)',
      logout: 'Выйти из аккаунта',
      confirmClear: 'Вы действительно хотите очистить все кэшированные офлайн-данные? (Текущие настройки сохранятся)',
      cleared: 'Данные успешно очищены из памяти!'
    },
    teachers: {
      title: 'Рейтинг Преподавателей',
      search: 'Поиск по имени или кафедре...',
      empty: 'Преподаватели не найдены',
      reviews: 'отзывов',
      reviewEmpty: 'Отзывов пока нет!\nБудьте первым, кто оценит и оставит отзыв.',
      rate: 'ОЦЕНИТЕ:',
      reviewPlaceholder: 'Напишите ваше мнение о преподавателе...',
      submitReview: 'Отправить отзыв',
      avgRating: 'СРЕДНЯЯ ОЦЕНКА',
      totalReviews: 'Всего {count} отзывов'
    },
    freelance: {
      title: 'Студенческие Услуги',
      subtitle: 'Услуги, предоставляемые студентами ТУИТ (Freelance)',
      search: 'Поиск услуг или фрилансера...',
      empty: 'Услуга не найдена',
      reviews: 'отзывов',
      reviewEmpty: 'Отзывов пока нет!\nБудьте первым, кто оценит и оставит отзыв.',
      rate: 'ОЦЕНИТЕ:',
      reviewPlaceholder: 'Напишите ваше мнение об услуге...',
      submitReview: 'Отправить отзыв',
      contact: 'Для связи (Telegram / Тел)',
      myServices: 'Мои услуги',
      price: 'Цена:',
      addService: 'Добавить услугу',
      serviceName: 'Название услуги',
      description: 'Краткое описание',
      priceLabel: 'Цена (сум)',
      save: 'Сохранить',
      contactInfo: 'Для связи (Telegram или Тел)',
      avgRating: 'СРЕДНЯЯ ОЦЕНКА',
      totalReviews: 'Всего {count} отзывов'
    }
  }
};

const getByPath = (source, path) => {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), source);
};

const interpolate = (text, params = {}) => {
  return Object.entries(params).reduce((result, [key, value]) => {
    return result.replaceAll(`{${key}}`, String(value));
  }, text);
};

export const detectLanguageFromProfile = (profile) => {
  if (profile?.interfaceLanguage === 'ru' || profile?.interfaceLanguage === 'uz') {
    return profile.interfaceLanguage;
  }
  const language = String(profile?.language || '').toLowerCase();
  if (/рус|russian|\bru\b|русский/.test(language)) return 'ru';
  return 'uz';
};

export const translate = (lang, key, params = {}) => {
  const safeLang = lang === 'ru' ? 'ru' : 'uz';
  const value = getByPath(messages[safeLang], key) ?? getByPath(messages.uz, key) ?? key;
  if (typeof value !== 'string') return key;
  return interpolate(value, params);
};

export const I18nContext = createContext({
  lang: 'uz',
  t: (key, params) => translate('uz', key, params),
  changeLanguage: () => {},
  theme: 'dark',
  changeTheme: () => {}
});

export const useI18n = () => useContext(I18nContext);
