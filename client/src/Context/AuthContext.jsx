// AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const API_BASE_URL = 'https://token-based-attendance-system.onrender.com';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const verifyUser = useCallback(async () => {
    if (!token) {
      console.log('No token found, clearing user');
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userData = response.data.user || response.data.userData || response.data;
      if (!userData || !userData.role) {
        throw new Error('Invalid user data in response');
      }

      let studentData = null;
      if (userData.role === 'student') {
        // Fetch student profile
        const profileRes = await axios.get(`${API_BASE_URL}/student/${userData.userId}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        });
        console.log("user id is :", userData.userId)
        // Fetch attendance
        let attendance = [];
        try {
          const attendanceRes = await axios.get(
            `${API_BASE_URL}/student/attendance-status/${userData.userId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000,
            }
          );
          if (attendanceRes.data.status === 'success') {
            attendance = attendanceRes.data.data.attendance;
          }
        } catch (err) {
          if (err.response?.status !== 404) throw err;
        }

        studentData = { ...profileRes.data.data, attendance };
      }

      setUser({ ...userData, studentData });
      localStorage.setItem('user', JSON.stringify({ ...userData, studentData }));
    } catch (error) {
      console.error('Verify user error:', error);
      const redirectPath = user?.role === 'admin' ? '/admin/login' : '/student/login';
      setUser(null);
      setToken('');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.error(error.response?.data?.errorMessage || 'Session expired. Please log in again.');
      navigate(redirectPath);
    } finally {
      setLoading(false);
    }
  }, [token, user?.role]);

  useEffect(() => {
    // Try to load user from localStorage first for faster initial render
    const storedUser = localStorage.getItem('user');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      setLoading(false); // Allow rendering with cached data
    }
    verifyUser();
  }, [verifyUser, token]);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const studentLogin = async (matric, password) => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE_URL}/student/login`, { matric, password });
      const { token, user: userData } = res.data;
      if (!userData || !userData.role) {
        throw new Error('Invalid user data in login response');
      };

      const id = userData.userId;
      console.log(id);
      // Fetch student data after login
      const profileRes = await axios.get(`${API_BASE_URL}/student/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });

      let attendance = [];
      try {
        const attendanceRes = await axios.get(
          `${API_BASE_URL}/student/attendance-status/${userData.userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
          }
        );
        if (attendanceRes.data.status === 'success') {
          attendance = attendanceRes.data.data.attendance;
        }
      } catch (err) {
        if (err.response?.status !== 404) throw err;
      }

      const studentData = { ...profileRes.data.data, attendance };
      setToken(token);
      setUser({ ...userData, studentData });
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ ...userData, studentData }));
      toast.success('Login successful!');
      navigate('/student/dashboard');
    } catch (error) {
      const message = error.response?.data?.errorMessage || 'Invalid matric or password';
      console.error('Student login error:', error.response?.status, message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (email, password) => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE_URL}/auth/admin/login`, { email, password });
      const { token, user: userData } = res.data;
      if (!userData || !userData.role) {
        throw new Error('Invalid user data in login response');
      }
      setToken(token);
      setUser(userData);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      toast.success('Login successful!');
      navigate('/admin/dashboard');
    } catch (error) {
      const message = error.response?.data?.errorMessage || 'Invalid email or password';
      console.error('Admin login error:', error.response?.status, message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    toast.info('Logged out successfully');
    navigate('/student/login');
  }, [navigate]);

  const isAdmin = useCallback(() => {
    const admin = user?.role === 'admin';
    console.log('isAdmin check:', admin, 'User:', user);
    return admin;
  }, [user]);

  return (
    <AuthContext.Provider
      value={{ user, token, studentLogin, adminLogin, logout, isAdmin, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};