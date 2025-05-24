import User from "../models/User.js";
import Code from "../models/Token.js";
import { Admin } from "../models/Admin.js";
import Attendance from '../models/Attendance.js'
import mongoose from 'mongoose';

const submitAttendance = async (req, res) => {
  try {
    const { token, courseCode, date } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!token || !courseCode || !date) {
      return res.status(400).json({ message: 'Token, course code, and date are required' });
    }

    // Validate date
    const attendanceDate = new Date(date);
    if (isNaN(attendanceDate)) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user || user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can submit attendance' });
    }

    // Check token
    const code = await Code.findOne({ token, isUsed: false });
    if (!code) {
      return res.status(400).json({ message: 'Invalid or already used token' });
    }

    // Verify course code
    if (code.courseCode !== courseCode) {
      return res.status(400).json({ message: 'Token does not match the course' });
    }

    // Check token expiry
    if (code.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Token has expired' });
    }

    // Check for existing attendance
    const existingAttendance = await Attendance.findOne({
      user: userId,
      courseCode,
      date: attendanceDate,
    });
    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already submitted for this course and date' });
    }

    // Record attendance in User model
    user.attendance.push({
      token,
      courseCode,
      date: attendanceDate,
      submittedAt: new Date(),
    });

    // Save attendance in Attendance model
    const attendanceRecord = new Attendance({
      token,
      courseCode,
      attendancePresent: true,
      date: attendanceDate,
      user: userId,
    });

    // Mark token as used
    code.isUsed = true;
    code.usedBy = userId;
    code.usedAt = new Date();

    // Save all changes without a transaction
    await user.save();
    await code.save();
    await attendanceRecord.save();

    return res.status(200).json({ message: 'Attendance submitted successfully' });
  } catch (error) {
    console.error('Error submitting attendance:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Attendance already submitted for this course and date' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};


// GENERATE ATTENDANCE

const generateTokens = async (req, res) => {
  try {
    const { courseCode, expiresAt, numberOfStudents } = req.body;
    const userId = req.user.id; 

    // Validate admin role
    const user = await Admin.findById(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can generate tokens" });
    }

    // Validate input
    if (!courseCode || !expiresAt || !numberOfStudents) {
      return res.status(400).json({ message: "Course code, expiry date, and number of students are required" });
    }

    // Validate course code
    if (courseCode.length < 4) {
      return res.status(400).json({ message: "Course code must be at least 4 characters" });
    }

    // Validate number of students
    const numStudents = parseInt(numberOfStudents, 10);
    if (isNaN(numStudents) || numStudents < 1 || numStudents > 1000) {
      return res.status(400).json({ message: "Number of students must be between 1 and 1000" });
    }

    // Validate expiry date
    const expiryDate = new Date(expiresAt);
    if (isNaN(expiryDate) || expiryDate <= new Date()) {
      return res.status(400).json({ message: "Invalid or past expiry date" });
    }

    // Check for unused tokens for this course
    const unusedTokens = await Code.findOne({ courseCode, isUsed: false });
    if (unusedTokens) {
      return res.status(400).json({ message: "Unused tokens exist for this course. Use or expire them before generating new ones." });
    }

    // Generate 8-digit tokens
    const generateUniqueToken = async () => {
      let token;
      let isUnique = false;
      const maxAttempts = 10;
      let attempts = 0;

      while (!isUnique && attempts < maxAttempts) {
        const coursePrefix = courseCode.slice(0, 4).toUpperCase();
        const randomChars = Math.random().toString(36).slice(2, 6).toUpperCase();
        token = `${coursePrefix}${randomChars}`.slice(0, 8);

        const existingToken = await Code.findOne({ token });
        if (!existingToken) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error("Failed to generate a unique token");
      }
      return token;
    };

    // Generate tokens
    const tokens = [];
    for (let i = 0; i < numStudents; i++) {
      const token = await generateUniqueToken();
      const newCode = new Code({
        token,
        courseCode,
        expiresAt: expiryDate,
      });
      await newCode.save();
      tokens.push(token);
    }

    return res.status(201).json({
      message: `Generated ${tokens.length} token(s) successfully`,
      tokens,
    });
  } catch (error) {
    console.error("Error generating tokens:", error);
    if (error.message.includes("unique token")) {
      return res.status(500).json({ message: "Unable to generate unique tokens" });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: "Token already exists" });
    }
    return res.status(500).json({ message: "Server error" });
  }
};


// GET ATTENDANCE RECORDS

const getAttendance = async (req, res) => {
  try {
    const userId = req.user.id;

    // Validate admin role
    const user = await Admin.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view attendance' });
    }

    // Query attendance records
    const { courseCode, date } = req.query;
    const query = {};
    if (courseCode) query.courseCode = courseCode;
    if (date) {
      const queryDate = new Date(date);
      if (isNaN(queryDate)) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
      query.date = {
        $gte: new Date(queryDate.setHours(0, 0, 0, 0)),
        $lte: new Date(queryDate.setHours(23, 59, 59, 999)),
      };
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('user', 'matric') // Get matric from User
      .sort({ date: -1 });

      // get attendance records length
      const totalAttendance = attendanceRecords.length
      
    return res.status(200).json({
      message: 'Attendance records retrieved successfully',
      records: attendanceRecords,
      attendanceRate: totalAttendance,
    });

   
  } catch (error) {
    console.error('Error retrieving attendance:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};


// GET TOKEN LIST

const tokenList = async (req, res) => {
  try {
    const userId = req.user.id;

    // Validate admin role
    const user = await Admin.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only Admin can perform this operation',
        tokens: []
      });
    }

    // Build query based on filters
    const { courseCode, isUsed, expiresAt } = req.query;
    const query = {};
    if (courseCode) query.courseCode = courseCode;
    if (isUsed !== undefined) query.isUsed = isUsed === 'true';
    if (expiresAt) {
      const expiryDate = new Date(expiresAt);
      if (isNaN(expiryDate)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid expiry date format',
          tokens: []
        });
      }
      query.expiresAt = { $gte: expiryDate };
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Fetch tokens
    const tokenRecords = await Code.find(query)
      .populate('usedBy', 'matric name')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Sort by creation date, newest first

    const totalRecords = await Code.countDocuments(query);

    return res.status(200).json({
      status: 'success',
      message: 'Token list retrieved successfully',
      tokens: tokenRecords,
      totalRecords,
      page,
      totalPages: Math.ceil(totalRecords / limit)
    });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error fetching tokens. Server error',
      tokens: []
    });
  }
};

//DELETE ALL TOKENS

const deleteAllTokens = async (req, res) => {
  try {
    const userId = req.user.id;

    // Validate admin role
    const user = await Admin.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only Admin can perform this operation',
      });
    }

    // Delete all tokens
    const result = await Code.deleteMany({});
    console.log(`Deleted ${result.deletedCount} tokens`); // Debug log

    if (result.deletedCount === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No tokens found to delete',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'All tokens deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting all tokens:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete all tokens',
    });
  }
};


// exports

export {
    submitAttendance,
    generateTokens,
    getAttendance,
    tokenList,
    deleteAllTokens
}