import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'scuric-dashboard-secret-key';

// Middleware to authenticate token
export const auth = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // In development mode or if this is a development endpoint, allow without token
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEV_MODE === 'true') {
    console.log('Development mode: Skipping authentication check');
    req.user = { id: '64a12b3c5f7d2e1a3c9b8e7f', role: 'admin' }; // Default test user
    return next();
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'Kein Token, Zugriff verweigert' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Set user data in request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Token ist ungültig' });
  }
};

// Middleware to check if user is admin
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Zugriff verweigert - Nur für Administratoren' });
  }
};