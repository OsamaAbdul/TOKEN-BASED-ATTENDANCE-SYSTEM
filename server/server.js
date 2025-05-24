// Import necessary modules
import dotenv from 'dotenv';
dotenv.config();

import cookieParser from 'cookie-parser';
import express from 'express';
import _ from 'lodash'; 
import cors from 'cors';
import connectDB from './config/db.js'; 
import studentRouter from './Routes/authRoutes.js';

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'https://token-based-attendance-system.netlify.app', // Allow your Netlify frontend
  credentials: true, // Allow cookies and other credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Specify allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
}));

// ROUTES
app.use('/', studentRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`App running on port: ${PORT}`);
});