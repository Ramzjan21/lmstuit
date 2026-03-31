import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Teacher, Review } from './server/models.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '.env.local') });

if (!process.env.MONGODB_URI) {
  console.error("XATOLIK: MONGODB_URI `.env` yoki `.env.local` qatorida topilmadi.");
  console.error("Iltimos, avval Atlas URI manzilini qo'shing.");
  process.exit(1);
}

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB tarmog'iga ulandi. Baza o'tkazish jarayoni boshlanmoqda...");

    const dataDir = path.join(__dirname, 'server', 'data');
    
    // 1. Ustozlarni bazaga quyish
    let teachers = [];
    try {
      teachers = JSON.parse(fs.readFileSync(path.join(dataDir, 'teachers.json'), 'utf8'));
    } catch {
      console.log("teachers.json bazasi topilmadi.");
    }

    if (teachers.length > 0) {
      await Teacher.deleteMany({}); // Eski malumotlarni o'chirish
      await Teacher.insertMany(teachers);
      console.log(`✅ ${teachers.length} nafar Mongoose (MongoDB) ustozlar jadvaliga qo'shildi.`);
    }

    // 2. Sharhlarni MongoDB'ga o'tkazish
    let reviewsObj = {};
    try {
      reviewsObj = JSON.parse(fs.readFileSync(path.join(dataDir, 'reviews.json'), 'utf8'));
    } catch {
      console.log("reviews.json bazasi topilmadi.");
    }

    const reviewsToInsert = [];
    for (const [teacherId, teacherReviews] of Object.entries(reviewsObj)) {
      teacherReviews.forEach(r => {
        reviewsToInsert.push({
          id: r.id,
          teacherId,
          author: r.author,
          text: r.text,
          rating: r.rating,
          date: r.date
        });
      });
    }

    if (reviewsToInsert.length > 0) {
      await Review.deleteMany({});
      await Review.insertMany(reviewsToInsert);
      console.log(`✅ ${reviewsToInsert.length} ta sharh / baholashlar MongoDB'ga muvaffaqiyatli saqlandi!`);
    }

    console.log("✨ Barcha mahalliy JSON yozuvlar bexato MongoDB ga kochirildi!");
    process.exit(0);
  } catch (error) {
    console.error("Xatolik yuz berdi:", error);
    process.exit(1);
  }
};

migrate();
