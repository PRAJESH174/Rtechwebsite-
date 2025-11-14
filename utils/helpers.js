const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Hash password
async function hashPassword(password) {
  const salt = await bcryptjs.genSalt(10);
  return await bcryptjs.hash(password, salt);
}

// Verify password
async function verifyPassword(password, hash) {
  return await bcryptjs.compare(password, hash);
}

// Generate JWT token
function generateToken(user, secret, expiresIn = '7d') {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    secret,
    { expiresIn }
  );
}

// Verify JWT token
function verifyToken(token, secret) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Validate email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number
function isValidPhone(phone) {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/[^\d]/g, ''));
}

// Sanitize user object (remove sensitive data)
function sanitizeUser(user) {
  const { password, ...sanitized } = user;
  return sanitized;
}

// Paginate array
function paginate(array, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return {
    data: array.slice(skip, skip + limit),
    pagination: {
      page,
      limit,
      total: array.length,
      pages: Math.ceil(array.length / limit)
    }
  };
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  generateId,
  generateOTP,
  isValidEmail,
  isValidPhone,
  sanitizeUser,
  paginate
};
