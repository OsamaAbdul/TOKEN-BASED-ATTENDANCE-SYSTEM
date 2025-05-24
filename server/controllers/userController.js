import User  from '../models/User.js';
import bcrypt from 'bcrypt';
import validator from 'validator';
import jwt from 'jsonwebtoken';
import _ from 'lodash';
import { Admin } from '../models/Admin.js';
import Attendance from '../models/Attendance.js';

// Ensure JWT_SECRET is set
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
};


// Middle to authenticate user

const authMiddleWare = (roles = []) => {
  return async (req, res, next) => {
    try {
      // Check for token in the header
      const token = req.get("Authorization")?.split(" ")[1];
      if (!token) {
        return res.status(401).json({
          status: "error",
          message: "No token provided!",
        });
      }

      // Verify token
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      let user;

      // Query the appropriate collection based on role
      if (decodedToken.role === "admin") {
        user = await Admin.findById(decodedToken.userId).select("-password");
      } else if (decodedToken.role === "student") {
        user = await User.findById(decodedToken.userId).select("-password");
      }

      if (!user) {
        return res.status(401).json({
          status: "error",
          message: "User not found!",
        });
      }

      // Check if user's role is allowed
      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({
          status: "error",
          message: "Access denied: Insufficient permissions",
        });
      }

      // Attach user to request object
      req.user = user;
      next();
    } catch (error) {
      console.error("Authentication error:", error.message);
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired token provided.",
      });
    }
  };
};

// -------REGISTER STUDENT-------

const registerStudent = async (req, res) => {
  try {
    let { fullname, matric, email, password, department } = req.body;

    // Normalize inputs
    fullname = _.startCase(_.toLower(_.trim(fullname)));
    matric = _.trim(matric).toUpperCase();
    email = _.toLower(_.trim(email));
    department = _.toUpper(_.trim(department));

    // Validate inputs
    if (!fullname || !matric || !email || !password || !department) {
      return res.status(400).json({
        status: "error",
        errorMessage: "All fields are required.",
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        status: "error",
        errorMessage: "Invalid email format.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        status: "error",
        errorMessage: "Password must be at least 8 characters long.",
      });
    }

    // Check for existing user
    const existingUser = await User.findOne({ $or: [{ matric }, { email }] });
    if (existingUser) {
      return res.status(400).json({
        status: "error",
        errorMessage:
          existingUser.email === email
            ? "Email already exists."
            : "Matric number already exists.",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create and save student
    const newUser = new User({
      fullname,
      matric,
      email,
      password: hashedPassword,
      department,
      role: "student",
    });
    await newUser.save();

    return res.status(201).json({
      status: "success",
      successMessage: "Student registered successfully.",
    });
  } catch (error) {
    console.error("Error registering student:", error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        status: "error",
        errorMessage: `This ${field} is already registered. Please use a different one.`,
      });
    }
    return res.status(500).json({
      status: "error",
      errorMessage: "An error occurred during registration. Please try again.",
    });
  }
};



// ----- STUDENT LOGIN --------
const studentLogin = async (req, res) => {
  try {
    const { matric, password } = req.body;

    // Validate inputs
    if (!matric || !password) {
      return res.status(400).json({
        status: "error",
        errorMessage: "Matric and password are required.",
      });
    }

    // Find student by matric
    const user = await User.findOne({ matric, role: "student" });
    if (!user) {
      return res.status(401).json({
        status: "error",
        errorMessage: "Invalid matric or password.",
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: "error",
        message: "Invalid matric or password.",
      });
    }

    // Create JWT payload
    const payload = {
      userId: user._id,
      role: user.role,
    };

    // Sign token
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    return res.status(200).json({
      status: "success",
      token,
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        department: user.department,
        matric: user.matric,
      },
    });
  } catch (error) {
    console.error("Error during student login:", error);
    return res.status(500).json({
      status: "error",
      message: "Something went wrong!",
    });
  }
};

// ----------ADMIN LOGIN--------

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        errorMessage: "Email and password are required.",
      });
    }

    // Find admin by email
    const user = await Admin.findOne({ email, role: "admin" });
    if (!user) {
      return res.status(401).json({
        status: "error",
        errorMessage: "Invalid email or password.",
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: "error",
        errorMessage: "Invalid email or password.",
      });
    }

    // Create JWT payload
    const payload = {
      userId: user._id,
      role: user.role,
    };

    // Sign token
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    return res.status(200).json({
      status: "success",
      token,
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error during admin login:", error);
    return res.status(500).json({
      status: "error",
      errorMessage: "Something went wrong!",
    });
  }
};

// -----REGISTER ADMIN-----

const createFirstAdmin = async () => {
  const admin = new User({
    fullname: "Super Admin",
    email: "superadmin@example.com",
    password: await bcrypt.hash("securepassword123", 10),
    department: "ADMINISTRATION",
    role: "admin",
  });
  await admin.save();
};


// ADD NEW ADMIN

const registerAdmin = async (req, res) => {
  try {
    const { adminType, role, email, password } = req.body;

    // Validate input
    if (!adminType?.trim() || !role?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'All fields (adminType, role, email, password) are required',
      });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid email format',
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters',
      });
    }

    // Verify admin role
    const userId = req.user.id; // Set by auth middleware
    const user = await Admin.findById(userId).select('role').lean();
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can perform this operation',
      });
    }

    // Check for existing admin
    const existingAdmin = await Admin.findOne({ email: email.trim() }).lean();
    if (existingAdmin) {
      return res.status(400).json({
        status: 'error',
        message: 'Admin with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    const newAdmin = new Admin({
      adminType: adminType.trim(),
      role: role.trim(),
      email: email.trim(),
      password: hashedPassword,
      createdAt: new Date(),
    });

    await newAdmin.save();

    return res.status(201).json({
      status: 'success',
      message: 'Admin registered successfully',
    });
  } catch (error) {
    console.error(`Error registering admin by user ${req.user.id}:`, error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error while registering admin',
    });
  }
};
// --------GET STUDENT------

const getStudent = async (req, res) => {
  try {
    const students = await User.find({ role: new RegExp('^student$', 'i') }); // Case-insensitive query
    if (students.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No students found',
      });
    };

    // getting total students
    const totalStudents = students.length;
    res.json({
      status: 'success',
      data: { 
        students 
      },
      totalStudents,
    });
  } catch (err) {
    console.error('Error fetching students:', err); // Log for debugging
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};


// GET ADMIN LIST

const getAllAdmins = async (req, res) => {
  try {
    // Verify admin role
    const userId = req.user.id; // Set by authentication middleware
    const user = await Admin.findById(userId).select('role').lean();
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only admins can perform this operation',
      });
    }

    // Sanitize query parameters
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const email = req.query.email || '';

    // Ensure reasonable values
    page = page >= 1 ? page : 1;
    limit = limit >= 1 && limit <= 100 ? limit : 10;

    // Build query
    const query = email.length >= 3 ? { email: { $regex: email, $options: 'i' } } : {};

    // Fetch admins with pagination and filtering
    const admins = await Admin.find(query)
      .select('-password') // Exclude password
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Admin.countDocuments(query);
 
    return res.status(200).json({
      status: 'success',
      message: 'Admins fetched successfully',
      data: {
        admins,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          itemsPerPage: limit,
        },
      },
      totalUsers: total,
    });


  } catch (error) {
    console.error(`Error fetching admins for user ${req.user.id}:`, error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error while fetching admins',
    });
  }
};



// DELETE ADMIN

const deleteAdmin = async(req, res) => {
  try {

    // collect admin ID from the url
    const { id } = req.params;

    // check if its admin
    const userId = req.user.id;

    const user = await Admin.findById(userId);

    if(!user || user.role !== 'admin') {
      return res.status(403).json({
        status: "error",
        message: "Only admin can perform this operation"
      })
    };

    // prevent admin from deleting itself

    if(id === userId ) {
      return res.status(400).json({
        status: "error",
        message: "You cannot delete yourself...Oga!"
      })
    };

    // find admin and delete with the id

    const admin = await Admin.findByIdAndDelete(id);

    // if the user to delete is not an admin
    if(!admin) {
      return res.status(404).json({
        status: "error",
        message: "User to delete is not an admin"
      });
    };


    // if the user is an admin
    return res.status(200).json({
      status: "success",
      message: "Admin deleted successfully!"
    });

  } catch (error) {
    console.log("Something went wrong in the server. Error occur deleting admin", error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error while deleting admin',
    });
  }
};

// GET STUDENT BY ID
const getStudentById = async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: new RegExp('^student$', 'i') });
    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found',
      });
    }
    res.json({
      status: 'success',
      data: {
        id: student._id,
        email: student.email,
        role: student.role,
        matric: student.matric,
        department: student.department,
        fullname: student.fullname,
        // Add other student fields as needed
      },
    });
  } catch (err) {
    console.error('Error fetching student:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

// GET STUDENT ATTENDANCE BY ID
const getStudentAttendanceById = async (req, res) => {
  try {
    // Verify the student exists and has the role 'student'
    const student = await User.findOne({ _id: req.params.id, role: new RegExp('^student$', 'i') });
    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found',
      });
    }

    // Fetch attendance records for the student
    const attendanceRecords = await Attendance.find({ user: req.params.id })
      .select('token courseCode attendancePresent date submittedAt -_id')
      .sort({ date: -1 }); // Sort by date descending (most recent first)

    // Check if attendance records exist
    if (!attendanceRecords || attendanceRecords.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No attendance records found for this student',
      });
    }

    // Format the response
    res.json({
      status: 'success',
      data: {
        studentId: student._id,
        fullname: student.fullname,
        matric: student.matric,
        department: student.department,
        attendance: attendanceRecords.map(record => ({
          token: record.token,
          courseCode: record.courseCode,
          status: record.attendancePresent ? 'present' : 'absent', // Convert boolean to string for frontend
          date: record.date.toISOString(),
          submittedAt: record.submittedAt.toISOString(),
        })),
      },
    });
  } catch (err) {
    console.error('Error fetching student attendance:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

// exporting all the controllers


export {
  registerStudent,
  studentLogin,
  adminLogin,
  createFirstAdmin,
  getStudent,
  authMiddleWare,
  registerAdmin,
  getAllAdmins,
  deleteAdmin,
  getStudentById,
  getStudentAttendanceById
};