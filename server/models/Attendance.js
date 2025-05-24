// models/Attendance.js
import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  token: { type: String, required: true }, // Renamed from attendanceCode
  courseCode: { type: String, required: true }, // Added for querying by course
  attendancePresent: { type: Boolean, default: false },
  date: { type: Date, required: true },
  submittedAt: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

// Index for efficient querying
attendanceSchema.index({ user: 1, courseCode: 1, date: 1 }, { unique: true }); // Prevent duplicate attendance

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;