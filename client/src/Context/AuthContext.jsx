import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:3000';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Verify user on mount or token change
  const verifyUser = useCallback(async () => {
    if (!token) {
      console.log('No token found, clearing user');
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      });

 
      // Handle different response structures
      const userData = response.data.user || response.data.userData || response.data;
      if (!userData || !userData.role) {
        throw new Error('Invalid user data in response');
      }
      setUser(userData);
    } catch (error) {
      
      const redirectPath = user?.role === 'admin' ? '/admin/login' : '/student/login';
      setUser(null);
      setToken('');
      localStorage.removeItem('token');
      toast.error(error.response?.data?.errorMessage || 'Session expired. Please log in again.');
      navigate(redirectPath);
    } finally {
      setLoading(false);
    }
  }, [token, user?.role]);

  useEffect(() => {
    
    verifyUser();
  }, [verifyUser]);

  // Set Authorization header on token change
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Student Login
  const studentLogin = async (matric, password) => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE_URL}/student/login`, { matric, password });

      const { token, user: userData } = res.data;
      if (!userData || !userData.role) {
        throw new Error('Invalid user data in login response');
      }
      setToken(token);
      setUser(userData);
      localStorage.setItem('token', token);
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

  // Admin Login
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

  // Logout
  const logout = useCallback(() => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    toast.info('Logged out successfully');
    navigate('/student/login');
  }, [navigate]);

  // Check if user is admin
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