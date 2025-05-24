import jwt from 'jsonwebtoken';


// Checking if the user is verified
const verify = (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ errorMessage: 'Unauthorized: No token provided' });
  }
  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) {
      return res.status(403).json({ errorMessage: 'Invalid or expired token' });
    }
    // Return user data in the expected format
    res.json({
      status: 'Success',
      message: 'User is authenticated',
      user, // user: { id, email, role }
    });
  });
};

export default verify;