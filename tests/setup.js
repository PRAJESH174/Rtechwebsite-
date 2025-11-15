// Test setup file for Jest
// This runs before all tests

const jwt = require('jsonwebtoken');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = 3001;
process.env.JWT_SECRET = 'test-secret-key';
process.env.BCRYPT_ROUNDS = 10;
process.env.LOG_LEVEL = 'error'; // Suppress logs in tests

// Mock timers if needed
jest.useFakeTimers({ doNotFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] });

// Global test utilities
global.testUtils = {
  generateTestUser: () => ({
    id: 'test-user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    email: 'test' + Math.random() + '@example.com',
    password: 'TestPassword123!',
    name: 'Test User',
    role: 'user',
    createdAt: new Date()
  }),

  generateTestPost: () => ({
    id: 'test-post-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    title: 'Test Post',
    content: 'This is a test post',
    author: 'test-author-id',
    category: 'technology',
    tags: ['test', 'demo'],
    published: true,
    createdAt: new Date()
  }),

  generateTestCourse: () => ({
    id: 'test-course-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    title: 'Test Course',
    description: 'A test course',
    instructor: 'test-instructor-id',
    price: 99.99,
    level: 'beginner',
    enrolledStudents: [],
    createdAt: new Date()
  }),

  generateAuthToken: (userId = 'test-user-id') => {
    return jwt.sign(
      { id: userId, email: 'test@example.com', role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  },

  generateAdminToken: (userId = 'test-admin-id') => {
    return jwt.sign(
      { id: userId, email: 'admin@example.com', role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }
};

// Suppress console output during tests (optional)
if (process.env.SUPPRESS_LOGS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  };
}

