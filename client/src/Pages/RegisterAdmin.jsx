import React, { useState } from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../Context/AuthContext.jsx';
import axios from 'axios';

const AdminRegister = () => {
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // Redirect if not an admin
  if (!user || user.role !== 'admin') {
    navigate('/admin/login');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedFullname = fullname.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedDepartment = department.trim().toUpperCase();

    if (!trimmedFullname || !trimmedEmail || !trimmedPassword || !trimmedDepartment) {
      toast.error('All fields are required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error('Invalid email format');
      return;
    }
    if (trimmedPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        '/api/register/admin',
        {
          fullname: trimmedFullname,
          email: trimmedEmail,
          password: trimmedPassword,
          department: trimmedDepartment,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Admin registered successfully!');
      navigate('/admin/dashboard');
    } catch (error) {
      const message = error.response?.data?.errorMessage || 'Registration failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledWrapper>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        theme="light"
      />
      <div className="flex justify-center items-center min-h-screen">
      <div className="form-container">
        <h1 className="title">
          Register as <span>Admin</span>
        </h1>
        <form className="form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="fullname" className="sr-only">
            Full Name
          </label>
          <input
            id="fullname"
            type="text"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
            className="input"
            placeholder="e.g., Jane Admin"
            required
            disabled={loading}
            aria-label="Full Name"
          />
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="e.g., admin@example.com"
            required
            disabled={loading}
            aria-label="Email"
          />
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="*******"
            required
            disabled={loading}
            aria-label="Password"
          />
          <label htmlFor="department" className="sr-only">
            Department
          </label>
          <input
            id="department"
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="input"
            placeholder="e.g., Administration"
            required
            disabled={loading}
            aria-label="Department"
          />
          <button
            type="submit"
            className="form-btn"
            disabled={loading}
            aria-label={loading ? 'Registering' : 'Register'}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="sign-up-label">
          Back to{' '}
          <Link to="/admin/dashboard" className="sign-up-link">
            Dashboard
          </Link>
        </p>
      </div>
      </div>
    </StyledWrapper>
  );
};

const FONT_FAMILY = "'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif";

const StyledWrapper = styled.div`
  .form-container {
    width: 350px;
    height: auto;
    background-color: #fff;
    box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
    border-radius: 10px;
    box-sizing: border-box;
    padding: 20px 30px;
  }

  .title {
    leapt-align: center;
    font-family: ${FONT_FAMILY};
    margin: 10px 0 30px 0;
    font-size: 28px;
    font-weight: 800;
  }

  .title span {
    color: teal;
  }

  .form {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 18px;
    margin-bottom: 15px;
  }

  .input {
    border-radius: 20px;
    border: 1px solid #c0c0c0;
    outline: 0 !important;
    box-sizing: border-box;
    padding: 12px 15px;
    transition: border-color 0.2s;
  }

  .input:focus {
    border-color: teal;
  }

  .input:disabled {
    background-color: #f0f0f0;
    cursor: not-allowed;
  }

  .form-btn {
    padding: 10px 15px;
    font-family: ${FONT_FAMILY};
    border-radius: 20px;
    border: 0 !important;
    outline: 0 !important;
    background: teal;
    color: white;
    cursor: pointer;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    transition: background 0.2s;
  }

  .form-btn:hover:not(:disabled) {
    background: #007a7a;
  }

  .form-btn:disabled {
    background: #b0b0b0;
    cursor: not-allowed;
  }

  .form-btn:active {
    box-shadow: none;
  }

  .sign-up-label {
    margin: 0;
    font-size: 10px;
    color: #747474;
    font-family: ${FONT_FAMILY};
  }

  .sign-up-link {
    margin-left: 1px;
    font-size: 11px;
    text-decoration: underline;
    text-decoration-color: teal;
    color: teal;
    cursor: pointer;
    font-weight: 800;
    font-family: ${FONT_FAMILY};
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }
`;

export default AdminRegister;