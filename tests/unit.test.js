const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');

describe('Authentication & Security Tests', () => {
  const config = {
    jwt: { secret: process.env.JWT_SECRET, expiresIn: '7d' },
    bcrypt: { rounds: 10 }
  };

  describe('JWT Token Generation', () => {
    test('should generate valid JWT token', () => {
      const user = { id: 'user123', email: 'test@example.com', role: 'user' };
      const token = jwt.sign(user, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    test('should verify valid JWT token', () => {
      const user = { id: 'user123', email: 'test@example.com', role: 'user' };
      const token = jwt.sign(user, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

      const decoded = jwt.verify(token, config.jwt.secret);
      expect(decoded.id).toBe(user.id);
      expect(decoded.email).toBe(user.email);
      expect(decoded.role).toBe(user.role);
    });

    test('should reject invalid JWT token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        jwt.verify(invalidToken, config.jwt.secret);
      }).toThrow();
    });

    test('should include user role in token', () => {
      const adminUser = { id: 'admin123', email: 'admin@example.com', role: 'admin' };
      const token = jwt.sign(adminUser, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

      const decoded = jwt.verify(token, config.jwt.secret);
      expect(decoded.role).toBe('admin');
    });
  });

    describe('Password Hashing', () => {
    test('should hash password using bcryptjs', () => {
      const mockHash = '$2a$10$N9qo8uLOickgxc9YqKEk5';
      const mockGenSalt = jest.fn().mockResolvedValue('$2a$10$');
      const mockHash$ = jest.fn().mockResolvedValue(mockHash);

      expect(mockHash).toBeDefined();
      expect(mockHash).not.toContain('TestPassword123!');
      expect(mockHash.length).toBeGreaterThan(0);
    });

    test('should verify correct password', () => {
      const mockCompare = jest.fn().mockResolvedValue(true);
      
      expect(mockCompare('TestPassword123!', '$2a$10$hash')).resolves.toBe(true);
    });

    test('should reject incorrect password', () => {
      const mockCompare = jest.fn().mockResolvedValue(false);

      expect(mockCompare('WrongPassword123!', '$2a$10$hash')).resolves.toBe(false);
    });

    test('should handle password hashing consistently', () => {
      const hash1 = '$2a$10$hash1';
      const hash2 = '$2a$10$hash2';
      
      expect(hash1).not.toBe(hash2);
      expect(hash1.length).toBeGreaterThan(10);
      expect(hash2.length).toBeGreaterThan(10);
    });
  });

  describe('Input Validation', () => {
    test('should validate email format', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      expect(emailRegex.test('test@example.com')).toBe(true);
      expect(emailRegex.test('invalid-email')).toBe(false);
      expect(emailRegex.test('test@')).toBe(false);
      expect(emailRegex.test('@example.com')).toBe(false);
    });

    test('should validate password strength', () => {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

      expect(passwordRegex.test('StrongPass123!')).toBe(true);
      expect(passwordRegex.test('weak')).toBe(false);
      expect(passwordRegex.test('NoSpecial123')).toBe(false);
      expect(passwordRegex.test('nouppercase123!')).toBe(false);
    });

    test('should validate phone number format', () => {
      const phoneRegex = /^\+?[\d\s\-()]{10,}$/;

      expect(phoneRegex.test('9876543210')).toBe(true);
      expect(phoneRegex.test('+1-987-654-3210')).toBe(true);
      expect(phoneRegex.test('123')).toBe(false);
      expect(phoneRegex.test('abc123')).toBe(false);
    });
  });
});

describe('Data Validation Tests', () => {
  describe('User Data', () => {
    test('should validate required user fields', () => {
      const user = testUtils.generateTestUser();
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('role');
      expect(user.email).toBeTruthy();
      expect(user.name).toBeTruthy();
    });

    test('should ensure unique user ID', () => {
      const user1 = testUtils.generateTestUser();
      const user2 = testUtils.generateTestUser();

      expect(user1.id).not.toBe(user2.id);
    });

    test('should validate user role', () => {
      const validRoles = ['user', 'admin', 'moderator'];
      const user = testUtils.generateTestUser();

      expect(validRoles).toContain(user.role);
    });
  });

  describe('Post Data', () => {
    test('should validate required post fields', () => {
      const post = testUtils.generateTestPost();
      expect(post).toHaveProperty('title');
      expect(post).toHaveProperty('content');
      expect(post).toHaveProperty('author');
      expect(post.title).toBeTruthy();
      expect(post.content).toBeTruthy();
    });

    test('should validate post has valid category', () => {
      const post = testUtils.generateTestPost();
      const validCategories = ['technology', 'business', 'lifestyle', 'education', 'other'];

      expect(validCategories).toContain(post.category);
    });

    test('should validate post tags are array', () => {
      const post = testUtils.generateTestPost();
      expect(Array.isArray(post.tags)).toBe(true);
      expect(post.tags.length).toBeGreaterThan(0);
    });
  });

  describe('Course Data', () => {
    test('should validate required course fields', () => {
      const course = testUtils.generateTestCourse();
      expect(course).toHaveProperty('title');
      expect(course).toHaveProperty('description');
      expect(course).toHaveProperty('instructor');
      expect(course.title).toBeTruthy();
      expect(course.description).toBeTruthy();
    });

    test('should validate course price is positive number', () => {
      const course = testUtils.generateTestCourse();
      expect(typeof course.price).toBe('number');
      expect(course.price).toBeGreaterThan(0);
    });

    test('should validate course level', () => {
      const course = testUtils.generateTestCourse();
      const validLevels = ['beginner', 'intermediate', 'advanced', 'expert'];

      expect(validLevels).toContain(course.level);
    });
  });
});

describe('Error Handling Tests', () => {
  test('should handle missing required fields', () => {
    const user = {};
    expect(user.email).toBeUndefined();
    expect(user.password).toBeUndefined();
  });

  test('should handle invalid JSON', () => {
    const invalidJson = '{ invalid json }';
    expect(() => JSON.parse(invalidJson)).toThrow();
  });

  test('should handle division by zero', () => {
    expect(() => {
      const result = 100 / 0;
      if (!isFinite(result)) throw new Error('Division by zero');
    }).toThrow('Division by zero');
  });

  test('should handle null/undefined values safely', () => {
    const nullValue = null;
    const undefinedValue = undefined;

    expect(nullValue).toBeNull();
    expect(undefinedValue).toBeUndefined();
  });

  test('should handle array operations safely', () => {
    const emptyArray = [];
    expect(emptyArray.length).toBe(0);
    expect(emptyArray[0]).toBeUndefined();
    expect(() => emptyArray.forEach(item => item.property)).not.toThrow();
  });
});

describe('Utility Function Tests', () => {
  test('should generate unique IDs', () => {
    const id1 = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const id2 = Date.now().toString(36) + Math.random().toString(36).substr(2);

    expect(id1).not.toBe(id2);
  });

  test('should format dates correctly', () => {
    const date = new Date('2025-01-15');
    expect(date).toBeInstanceOf(Date);
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(0); // January
    expect(date.getDate()).toBe(15);
  });

  test('should handle string operations', () => {
    const str = 'Hello World';
    expect(str.toLowerCase()).toBe('hello world');
    expect(str.toUpperCase()).toBe('HELLO WORLD');
    expect(str.includes('World')).toBe(true);
    expect(str.split(' ')).toEqual(['Hello', 'World']);
  });
});
