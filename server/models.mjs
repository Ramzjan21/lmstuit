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
