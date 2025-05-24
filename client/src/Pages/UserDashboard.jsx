import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../Context/AuthContext';
import { FaUser, FaClipboardCheck, FaSignOutAlt } from 'react-icons/fa';
import axios from 'axios';
import StudentProfileCard from './StudentProfileCard';
import AttendanceStatusCard from './AttendanceStatusCard';

const StudentDashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attendanceForm, setAttendanceForm] = useState({
    token: '',
    courseCode: '',
    date: '',
  });

  useEffect(() => {
    if (!user || !token) {
      toast.error('Please login to continue', { position: 'top-center' });
      navigate('/student/login');
      return;
    }
    if (user.role !== 'student') {
      toast.error('Only students can access this dashboard', { position: 'top-center' });
      navigate('/student/login');
      return;
    }

    const fetchStudentData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch student profile
        const profileResponse = await axios.get(`https://token-based-attendance-system.onrender.com/student/${user.userId}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        });

        // Fetch attendance status (allow 404 to return empty attendance)
        let attendance = [];
        try {
          const attendanceResponse = await axios.get(
            `https://token-based-attendance-system.onrender.com/student/attendance-status/${user.userId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000,
            }
          );
          if (attendanceResponse.data.status === 'success') {
            attendance = attendanceResponse.data.data.attendance;
          }
        } catch (err) {
          if (err.response?.status === 404) {
            console.log('No attendance records found for this student');
            // Continue with empty attendance array
          } else {
            throw err; // Rethrow other errors
          }
        }

        // Combine data
        const combinedData = {
          ...profileResponse.data.data, // id, email, role, matric, department, fullname
          attendance,
        };

        setStudentData(combinedData);
        console.log('Fetched combined student data:', combinedData);
      } catch (err) {
        console.error('Error fetching data:', err);
        const status = err.response?.status;
        let errorMessage;
        if (status === 404) {
          errorMessage = 'Student profile not found. Please check your user ID.';
        } else if (status === 401) {
          errorMessage = 'Session expired. Please log in again.';
          toast.error(errorMessage, { position: 'top-center' });
          navigate('/student/login');
          return;
        } else {
          errorMessage = 'Failed to fetch student data. Try reloading the page.';
        }
        setError(errorMessage);
        setStudentData(null);
        toast.warn(errorMessage, { position: 'top-center' });
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [user, token, navigate]);

  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        'https://token-based-attendance-system.onrender.com/student/submit-attendance',
        {
          user: user?.userId, // Match Attendance schema
          token: attendanceForm.token,
          courseCode: attendanceForm.courseCode,
          date: attendanceForm.date,
          attendancePresent: true,
        },
        {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          timeout: 5000,
        }
      );
      toast.success(response.data.message, { position: 'top-center' });
      setAttendanceForm({ token: '', courseCode: '', date: '' });

      // Refresh attendance data
      try {
        const attendanceResponse = await axios.get(
          `https://token-based-attendance-system.onrender.com/student/attendance-status/${user.userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
          }
        );
        setStudentData((prev) => ({
          ...prev,
          attendance: attendanceResponse.data.status === 'success' ? attendanceResponse.data.data.attendance : [],
        }));
      } catch (err) {
        console.log('Failed to refresh attendance:', err);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit attendance', {
        position: 'top-center',
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAttendanceForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogout = () => {
    logout();
    toast.info('Logging out...', { position: 'top-center' });
    setTimeout(() => navigate('/student/login'), 1000);
    if (isSidebarOpen) setIsSidebarOpen(false);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white/80 p-6 rounded-2xl shadow-md animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      );
    }
    if (error) {
      return <div className="text-red-500 text-center">{error}</div>;
    }

    switch (activeSection) {
      case 'profile':
        return (
          <div className="flex flex-col sm:flex-row gap-6">
            <StudentProfileCard studentData={studentData} />
            <AttendanceStatusCard studentData={studentData} />
          </div>
        );
      case 'attendance':
        return (
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <h3 className="text-xl font-bold text-black mb-4">Submit Attendance</h3>
            <form onSubmit={handleAttendanceSubmit} className="space-y-4">
              <div>
                <label htmlFor="token" className="block text-sm font-medium text-gray-700">
                  Token
                </label>
                <input
                  id="token"
                  name="token"
                  type="text"
                  placeholder="e.g., CSC1XY12"
                  value={attendanceForm.token}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div>
                <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700">
                  Course Code
                </label>
                <input
                  id="courseCode"
                  name="courseCode"
                  type="text"
                  placeholder="e.g., CSC101"
                  value={attendanceForm.courseCode}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  value={attendanceForm.date}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <button
                type="submit"
                className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition"
              >
                Mark Attendance
              </button>
            </form>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} theme="colored" />
      <div className="flex">
        {/* Sidebar */}
        <div
          className={`text-white h-screen fixed left-0 top-0 bottom-0 space-y-2 transition-all duration-300 z-20 ${
            isSidebarOpen ? 'w-64' : 'w-0 -left-64'
          } overflow-hidden lg:w-64 lg:left-0`}
          style={{ backgroundColor: '#00a774' }}
        >
          <div className="h-12 flex items-center justify-around px-10" style={{ backgroundColor: '#00a774' }}>
            <img
              src="https://myexamcode.net/wp-content/uploads/2022/09/NSUK-1024x1024.jpg"
              alt="NSUK Logo"
              className="h-10 w-10 object-contain rounded-full"
            />
            <h3 className="text-2xl font-Roboto text-white">NSUK</h3>
          </div>
          <hr />
          <div className="px-4">
            <button
              onClick={() => {
                setActiveSection('profile');
                if (isSidebarOpen) setIsSidebarOpen(false);
              }}
              className={`${
                activeSection === 'profile' ? 'bg-teal-500 text-white' : 'text-gray-200'
              } flex items-center space-x-4 block py-2.5 px-4 rounded hover:bg-teal-600 hover:text-white w-full text-left`}
            >
              <FaUser />
              <span>Profile</span>
            </button>
            <button
              onClick={() => {
                setActiveSection('attendance');
                if (isSidebarOpen) setIsSidebarOpen(false);
              }}
              className={`${
                activeSection === 'attendance' ? 'bg-teal-500 text-white' : 'text-gray-200'
              } flex items-center space-x-4 block py-2.5 px-4 rounded hover:bg-teal-600 hover:text-white w-full text-left`}
            >
              <FaClipboardCheck />
              <span>Submit Attendance</span>
            </button>
            <button
              onClick={handleLogout}
              className="text-gray-200 flex items-center space-x-4 block py-2.5 px-4 rounded hover:bg-teal-600 hover:text-white w-full text-left"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </div>
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
            onClick={toggleSidebar}
          />
        )}
        <div className="flex-1 p-6 md:p-8 lg:ml-64">
          <button className="lg:hidden text-2xl mb-4" onClick={toggleSidebar}>
            ☰
          </button>
          <header className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-black text-center tracking-tight">
              Student Dashboard
            </h2>
          </header>
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;