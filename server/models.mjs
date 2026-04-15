import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  title: { type: String, default: 'O`qituvchi' },
  department: { type: String, default: 'TATU' }
});

const reviewSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  teacherId: { type: String, required: true },
  author: { type: String, required: true },
  text: { type: String, required: true },
  rating: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

const leaderboardUserSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  group: { type: String },
  course: { type: Number },
  direction: { type: String },
  subjectCount: { type: Number },
  avgScore: { type: Number },
  attendanceScore: { type: Number },
  gpa: { type: Number },
  rating: { type: Number },
  updatedAt: { type: Date, default: Date.now }
});

export const Teacher = mongoose.models.Teacher || mongoose.model('Teacher', teacherSchema);
export const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);
export const LeaderboardUser = mongoose.models.LeaderboardUser || mongoose.model('LeaderboardUser', leaderboardUserSchema);

const freelancerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Typically email
  name: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: String, required: true },
  contact: { type: String, required: true },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const freelanceReviewSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  freelancerId: { type: String, required: true },
  authorEmail: { type: String, required: true },
  authorName: { type: String, required: true },
  text: { type: String, required: true },
  rating: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

export const Freelancer = mongoose.models.Freelancer || mongoose.model('Freelancer', freelancerSchema);
export const FreelanceReview = mongoose.models.FreelanceReview || mongoose.model('FreelanceReview', freelanceReviewSchema);

// Telegram bot integration
const telegramUserSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, unique: true },
  lmsPassword: { type: String }, // Used ONLY for background autologin syncing
  chatId: { type: String, required: true },
  lang: { type: String, default: 'uz' },
  notifyNb: { type: Boolean, default: true },
  notifyTasks: { type: Boolean, default: true },
  taskHoursBefore: { type: Number, default: 24 }, // notify when deadline < N hours
  autoSubmitEnabled: { type: Boolean, default: false }, // Auto-submit empty docx before deadline
  linkedAt: { type: Date, default: Date.now }
});

export const TelegramUser = mongoose.models.TelegramUser || mongoose.model('TelegramUser', telegramUserSchema);

// Web app user (for preventing duplicates across devices)
const userSchema = new mongoose.Schema({
  lmsLogin: { type: String, required: true, unique: true }, // LMS login (unique identifier)
  name: { type: String, required: true },
  lastLoginAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
