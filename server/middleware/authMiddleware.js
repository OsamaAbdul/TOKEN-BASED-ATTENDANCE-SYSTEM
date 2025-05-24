import User from "../models/User";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();


// Ensure JWT_SECRET is set
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
};


// Middle to authenticate user

const authMiddleWare =  ( roles = []) => {

    return async (req, res, next) => {
        try {
            // checking for the token in the header

            const token = req.headers.authorization?.split('')[1];

            if(!token) {
                return res.status(401).json({
                    status: 'error',
                    message: "Invalid token provided!"
                })
            }
            // if founf, verify token

            const decodedToken = jwt.verify(token, JWT_SECRET);

            // Find user by ID from token payload (using the ID from the payload)

            const user = await User.findById(decoded.userId).select(-password); // selecting without a password

            // if not user

            if(!user) {
                return res.status(401).json({
                    status: 'error',
                    message: "User not found!"
                })
            };

            // Check if user's role is allowed

            if (roles.length && !roles.includes(user.role)) {
                return res.status(403).json({
                status: "error",
                message: "Access denied: Insufficient permissions",
                });
            };

            // Attach user to request object

            req.user = user;
            next();
        } catch (error) {
            console.log(error.message);
            return res.status(401).json({
                status: 'error',
                message: "Invalid or expired token provided."
            })
        }
    }

};

export default authMiddleWare;