import express from 'express';
import { registerStudent, studentLogin, adminLogin, getStudent, authMiddleWare, registerAdmin, getAllAdmins, deleteAdmin, getStudentById, getStudentAttendanceById } from '../controllers/userController.js';
import { submitAttendance, generateTokens, getAttendance, tokenList, deleteAllTokens } from '../controllers/attendanceController.js';
import { body, validationResult } from "express-validator";
import verify from '../controllers/authController.js';

const router = express.Router(); // setting up the router


// -------STUDENTS-----

router.post('/student/register', registerStudent);
router.post('/student/login',  studentLogin);
router.get('/student/dashboard', authMiddleWare(['student']), getStudent);
router.get('/student/:id', authMiddleWare(['student']), getStudentById);
router.get('/student/attendance-status/:id', authMiddleWare(['student']), getStudentAttendanceById);


// -------ATTENDANCE-------

router.post('/student/submit-attendance',authMiddleWare(['student']), submitAttendance);


// ------ADMIN---------
router.post('/auth/admin/login', adminLogin);
router.get('/auth/verify', verify); //verify user



const validateTokenGeneration = [
  body("courseCode").trim().notEmpty().isLength({ min: 4 }).withMessage("Course code must be at least 4 characters"),
  body("expiresAt").isISO8601().toDate().withMessage("Valid expiry date is required"),
  body("numberOfStudents")
    .isInt({ min: 1, max: 1000 })
    .withMessage("Number of students must be between 1 and 1000"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    next();
  },
];



router.post('/admin/generate-tokens', authMiddleWare(['admin']), validateTokenGeneration, generateTokens);
router.get('/admin/get-students',  authMiddleWare(['admin']), getStudent);
router.get('/admin/get-attendance',  authMiddleWare(['admin']), getAttendance);
router.get('/admin/get-tokenlist',  authMiddleWare(['admin']), tokenList);
router.post('/admin/register-user', authMiddleWare(['admin']), registerAdmin)
router.delete('/admin/delete-all-tokens',  authMiddleWare(['admin']), deleteAllTokens);
router.get('/admin/get-all-admins', authMiddleWare(['admin']), getAllAdmins);
router.delete('/admin/delete/:id', authMiddleWare(['admin']), deleteAdmin);
// router.post("/admin/register-user", authMiddleWare(["admin"]), registerAdmin);

export default router;