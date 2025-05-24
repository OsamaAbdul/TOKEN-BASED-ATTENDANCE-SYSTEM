import React, { useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../Context/AuthContext.jsx';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { adminLogin, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      toast.error('Email is required');
      return;
    }
    if (!trimmedPassword) {
      toast.error('Password is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error('Invalid email format');
      return;
    }
    if (trimmedPassword.length < 4) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      await adminLogin(trimmedEmail, trimmedPassword);
    } catch (error) {
      // Error handled in AuthContext
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
             <img
            src="data:image/png;base64,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"
            alt="Logo"
            
          />
        <h1 className="title">
          Welcome back, <span>Admin!</span>
        </h1>
        <form className="form" onSubmit={handleSubmit} noValidate>
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
          <button
            type="submit"
            className="form-btn"
            disabled={loading}
            aria-label={loading ? 'Logging in' : 'Log in'}
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
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
    text-align: center;
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

export default AdminLogin;