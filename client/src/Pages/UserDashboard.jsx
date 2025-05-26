// StudentDashboard.js
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
  const { user, token, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [attendanceForm, setAttendanceForm] = useState({
    token: '',
    courseCode: '',
    date: '',
  });

  useEffect(() => {
    if (!loading && (!user || !token)) {
      toast.error('Please login to continue', { position: 'top-center' });
      navigate('/student/login');
      return;
    }
    if (!loading && user?.role !== 'student') {
      toast.error('Only students can access this dashboard', { position: 'top-center' });
      navigate('/student/login');
      return;
    }
  }, [user, token, loading, navigate]);

  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        'https://token-based-attendance-system.onrender.com/student/submit-attendance',
        {
          user: user?.userId,
          token: attendanceForm.token,
          courseCode: attendanceForm.courseCode,
          date: attendanceForm.date,
          attendancePresent: true,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(response.data.message, { position: 'top-center' });
      setAttendanceForm({ token: '', courseCode: '', date: '' });

      // Refresh attendance
      const res = await axios.get(
        `https://token-based-attendance-system.onrender.com/student/attendance-status/${user.userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser((prev) => ({
        ...prev,
        studentData: {
          ...prev.studentData,
          attendance: res.data.status === 'success' ? res.data.data.attendance : [],
        },
      }));
      localStorage.setItem(
        'user',
        JSON.stringify({
          ...user,
          studentData: {
            ...user.studentData,
            attendance: res.data.status === 'success' ? res.data.data.attendance : [],
          },
        })
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit attendance', {
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

    if (!user?.studentData) {
      return <div className="text-red-500 text-center">Failed to load student data.</div>;
    }

    if (activeSection === 'profile') {
      return (
        <div className="flex flex-col sm:flex-row gap-6">
          <StudentProfileCard studentData={user.studentData} />
          <AttendanceStatusCard studentData={user.studentData} />
        </div>
      );
    }

    if (activeSection === 'attendance') {
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
                value={attendanceForm.token}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-lg p-2"
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
                value={attendanceForm.courseCode}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-lg p-2"
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
                className="mt-1 block w-full border border-gray-300 rounded-lg p-2"
              />
            </div>
            <button type="submit" className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600">
              Mark Attendance
            </button>
          </form>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <ToastContainer position="top-center" autoClose={3000} theme="colored" />
      <div className="flex">
        <div
          className={`text-white h-screen fixed top-0 left-0 bottom-0 transition-all duration-300 z-20 ${
            isSidebarOpen ? 'w-64' : 'w-0 -left-64'
          } lg:w-64 lg:left-0 overflow-hidden`}
          style={{ backgroundColor: '#00a774' }}
        >
          <div className="h-12 flex items-center justify-around px-10">
            <img
              src="https://myexamcode.net/wp-content/uploads/2022/09/NSUK-1024x1024.jpg"
              alt="NSUK Logo"
              className="h-10 w-10 object-contain rounded-full"
            />
            <h3 className="text-2xl text-white">NSUK</h3>
          </div>
          <hr />
          <div className="px-4 space-y-2 mt-4">
            <button
              onClick={() => {
                setActiveSection('profile');
                setIsSidebarOpen(false);
              }}
              className={`w-full text-left flex items-center px-4 py-2 rounded ${
                activeSection === 'profile' ? 'bg-teal-600' : 'hover:bg-teal-600'
              }`}
            >
              <FaUser className="mr-3" /> Profile
            </button>
            <button
              onClick={() => {
                setActiveSection('attendance');
                setIsSidebarOpen(false);
              }}
              className={`w-full text-left flex items-center px-4 py-2 rounded ${
                activeSection === 'attendance' ? 'bg-teal-600' : 'hover:bg-teal-600'
              }`}
            >
              <FaClipboardCheck className="mr-3" /> Submit Attendance
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left flex items-center px-4 py-2 rounded hover:bg-teal-600"
            >
              <FaSignOutAlt className="mr-3" /> Logout
            </button>
          </div>
        </div>

        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden" onClick={toggleSidebar} />
        )}

        <div className="flex-1 p-6 md:p-8 lg:ml-64">
          <button className="lg:hidden text-2xl mb-4" onClick={toggleSidebar}>
            ☰
          </button>
          <header className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-black text-center">Student Dashboard</h2>
          </header>
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;