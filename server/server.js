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

const allowedOrigins = [
  'https://token-based-classroom-attendance.netlify.app',
  'http://localhost:5173', // For local development
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));


// ROUTES
app.use('/', studentRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`App running on port: ${PORT}`);
});