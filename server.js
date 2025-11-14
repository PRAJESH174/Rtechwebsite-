const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Import configuration
const config = process.env.NODE_ENV === 'production' 
  ? require('./config/production.config.js')
  : require('./config/development.config.js');

// ===== MIDDLEWARE SETUP =====

// Security Middleware
app.use(helmet(config.security.helmet));
app.use(compression());

// CORS Configuration
app.use(cors(config.cors));

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: config.rateLimiting.windowMs,
  max: config.rateLimiting.max,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Static Files
app.use(express.static('public'));

// ===== IN-MEMORY DATA STORAGE (For Demo) =====
let users = [];
let posts = [];
let videos = [];
let courses = [];
let transactions = [];
let enrollments = [];
let seoSettings = {};
let adminSettings = {};
let analyticsEvents = [];

// ===== UTILITY FUNCTIONS =====

// Generate JWT Token
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Hash password
async function hashPassword(password) {
  const salt = await bcryptjs.genSalt(10);
  return await bcryptjs.hash(password, salt);
}

// Verify password
async function verifyPassword(password, hash) {
  return await bcryptjs.compare(password, hash);
}

// ===== AUTHENTICATION MIDDLEWARE =====

// Verify JWT Token
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'No token provided' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
}

// Verify Admin Role
function verifyAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }
}

// ===== ERROR HANDLING MIDDLEWARE =====

// Validation Error Handler
function validateRequest(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    req.validatedData = value;
    next();
  };
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ===== AUTHENTICATION ROUTES =====

// POST /api/auth/signup - Register new user
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;
    
    // Validation
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, mobile, and password are required'
      });
    }
    
    // Check if user exists
    if (users.find(u => u.email === email)) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const newUser = {
      id: generateId(),
      name,
      email,
      mobile,
      password: hashedPassword,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    users.push(newUser);
    
    // Generate token
    const token = generateToken(newUser);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      },
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/auth/login - Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Generate token
    const token = generateToken(user);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/auth/admin-login - Admin login
app.post('/api/auth/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // For demo purposes, check against hardcoded admin credentials
    if (username === 'admin' && password === 'admin123') {
      const adminUser = {
        id: 'admin-001',
        email: 'admin@rtech.com',
        role: 'admin'
      };
      
      const token = generateToken(adminUser);
      
      return res.json({
        success: true,
        message: 'Admin login successful',
        data: adminUser,
        token
      });
    }
    
    res.status(401).json({
      success: false,
      message: 'Invalid admin credentials'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/auth/send-otp - Send OTP
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email, mobile } = req.body;
    
    if (!email && !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Email or mobile is required'
      });
    }
    
    // Generate OTP (for demo: always 123456)
    const otp = Math.floor(100000 + Math.random() * 900000);
    
    // In production, send via email/SMS service
    res.json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        ...(email && { email }),
        ...(mobile && { mobile }),
        // For demo only - remove in production
        demo_otp: '123456'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/auth/verify-otp - Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { otp } = req.body;
    
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required'
      });
    }
    
    // For demo: accept 123456
    if (otp === '123456') {
      res.json({
        success: true,
        message: 'OTP verified successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ===== USER ROUTES =====

// GET /api/users/:id - Get user details
app.get('/api/users/:id', verifyToken, (req, res) => {
  try {
    const user = users.find(u => u.id === req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Don't send password
    const { password, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// PUT /api/users/:id - Update user
app.put('/api/users/:id', verifyToken, async (req, res) => {
  try {
    const { name, mobile, bio } = req.body;
    const userIndex = users.findIndex(u => u.id === req.params.id);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Only allow users to update their own profile
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Update user
    if (name) users[userIndex].name = name;
    if (mobile) users[userIndex].mobile = mobile;
    if (bio) users[userIndex].bio = bio;
    users[userIndex].updatedAt = new Date();
    
    const { password, ...userWithoutPassword } = users[userIndex];
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/users - Get all users (admin only)
app.get('/api/users', verifyToken, verifyAdmin, (req, res) => {
  try {
    const usersWithoutPassword = users.map(u => {
      const { password, ...userWithoutPassword } = u;
      return userWithoutPassword;
    });
    
    res.json({
      success: true,
      data: usersWithoutPassword,
      total: usersWithoutPassword.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ===== POSTS ROUTES =====

// POST /api/posts - Create new post
app.post('/api/posts', verifyToken, (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }
    
    const newPost = {
      id: generateId(),
      title,
      content,
      category: category || 'general',
      tags: tags || [],
      authorId: req.user.id,
      authorName: users.find(u => u.id === req.user.id)?.name,
      likes: 0,
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    posts.unshift(newPost);
    
    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: newPost
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/posts - Get all posts
app.get('/api/posts', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const paginated = posts.slice(skip, skip + limit);
    
    res.json({
      success: true,
      data: paginated,
      pagination: {
        page,
        limit,
        total: posts.length,
        pages: Math.ceil(posts.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/posts/:id - Get single post
app.get('/api/posts/:id', (req, res) => {
  try {
    const post = posts.find(p => p.id === req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// PUT /api/posts/:id - Update post
app.put('/api/posts/:id', verifyToken, (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    const postIndex = posts.findIndex(p => p.id === req.params.id);
    
    if (postIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Only author or admin can update
    if (posts[postIndex].authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (title) posts[postIndex].title = title;
    if (content) posts[postIndex].content = content;
    if (category) posts[postIndex].category = category;
    if (tags) posts[postIndex].tags = tags;
    posts[postIndex].updatedAt = new Date();
    
    res.json({
      success: true,
      message: 'Post updated successfully',
      data: posts[postIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// DELETE /api/posts/:id - Delete post
app.delete('/api/posts/:id', verifyToken, (req, res) => {
  try {
    const postIndex = posts.findIndex(p => p.id === req.params.id);
    
    if (postIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Only author or admin can delete
    if (posts[postIndex].authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    const deletedPost = posts.splice(postIndex, 1);
    
    res.json({
      success: true,
      message: 'Post deleted successfully',
      data: deletedPost[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/posts/:id/like - Like post
app.post('/api/posts/:id/like', verifyToken, (req, res) => {
  try {
    const post = posts.find(p => p.id === req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    post.likes = (post.likes || 0) + 1;
    
    res.json({
      success: true,
      message: 'Post liked',
      data: post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/posts/:id/comments - Add comment
app.post('/api/posts/:id/comments', verifyToken, (req, res) => {
  try {
    const { text } = req.body;
    const post = posts.find(p => p.id === req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    const comment = {
      id: generateId(),
      userId: req.user.id,
      userName: users.find(u => u.id === req.user.id)?.name,
      text,
      createdAt: new Date()
    };
    
    post.comments = post.comments || [];
    post.comments.push(comment);
    
    res.status(201).json({
      success: true,
      message: 'Comment added',
      data: comment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ===== VIDEOS ROUTES =====

// POST /api/videos - Upload video
app.post('/api/videos', verifyToken, (req, res) => {
  try {
    const { title, description, url, category, thumbnail } = req.body;
    
    if (!title || !url) {
      return res.status(400).json({
        success: false,
        message: 'Title and URL are required'
      });
    }
    
    const newVideo = {
      id: generateId(),
      title,
      description: description || '',
      url,
      category: category || 'general',
      thumbnail: thumbnail || `https://via.placeholder.com/300x200?text=${title}`,
      uploadedBy: req.user.id,
      uploaderName: users.find(u => u.id === req.user.id)?.name,
      views: 0,
      likes: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    videos.unshift(newVideo);
    
    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully',
      data: newVideo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/videos - Get all videos
app.get('/api/videos', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const paginated = videos.slice(skip, skip + limit);
    
    res.json({
      success: true,
      data: paginated,
      pagination: {
        page,
        limit,
        total: videos.length,
        pages: Math.ceil(videos.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/videos/:id - Get single video
app.get('/api/videos/:id', (req, res) => {
  try {
    const video = videos.find(v => v.id === req.params.id);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }
    
    // Increment views
    video.views = (video.views || 0) + 1;
    
    res.json({
      success: true,
      data: video
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// PUT /api/videos/:id - Update video
app.put('/api/videos/:id', verifyToken, (req, res) => {
  try {
    const { title, description, category } = req.body;
    const videoIndex = videos.findIndex(v => v.id === req.params.id);
    
    if (videoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }
    
    // Only uploader or admin can update
    if (videos[videoIndex].uploadedBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (title) videos[videoIndex].title = title;
    if (description) videos[videoIndex].description = description;
    if (category) videos[videoIndex].category = category;
    videos[videoIndex].updatedAt = new Date();
    
    res.json({
      success: true,
      message: 'Video updated successfully',
      data: videos[videoIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// DELETE /api/videos/:id - Delete video
app.delete('/api/videos/:id', verifyToken, (req, res) => {
  try {
    const videoIndex = videos.findIndex(v => v.id === req.params.id);
    
    if (videoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }
    
    // Only uploader or admin can delete
    if (videos[videoIndex].uploadedBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    const deletedVideo = videos.splice(videoIndex, 1);
    
    res.json({
      success: true,
      message: 'Video deleted successfully',
      data: deletedVideo[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ===== COURSES ROUTES =====

// POST /api/courses - Create course (admin only)
app.post('/api/courses', verifyToken, verifyAdmin, (req, res) => {
  try {
    const { title, description, price, duration, level, category, instructor } = req.body;
    
    if (!title || !price) {
      return res.status(400).json({
        success: false,
        message: 'Title and price are required'
      });
    }
    
    const newCourse = {
      id: generateId(),
      title,
      description: description || '',
      price,
      duration: duration || '4 weeks',
      level: level || 'Intermediate',
      category: category || 'Technology',
      instructor: instructor || 'RTech Team',
      enrollments: 0,
      rating: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    courses.unshift(newCourse);
    
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: newCourse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/courses - Get all courses
app.get('/api/courses', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const paginated = courses.slice(skip, skip + limit);
    
    res.json({
      success: true,
      data: paginated,
      pagination: {
        page,
        limit,
        total: courses.length,
        pages: Math.ceil(courses.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/courses/:id - Get single course
app.get('/api/courses/:id', (req, res) => {
  try {
    const course = courses.find(c => c.id === req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// PUT /api/courses/:id - Update course (admin only)
app.put('/api/courses/:id', verifyToken, verifyAdmin, (req, res) => {
  try {
    const { title, description, price, duration, level, category } = req.body;
    const courseIndex = courses.findIndex(c => c.id === req.params.id);
    
    if (courseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    if (title) courses[courseIndex].title = title;
    if (description) courses[courseIndex].description = description;
    if (price) courses[courseIndex].price = price;
    if (duration) courses[courseIndex].duration = duration;
    if (level) courses[courseIndex].level = level;
    if (category) courses[courseIndex].category = category;
    courses[courseIndex].updatedAt = new Date();
    
    res.json({
      success: true,
      message: 'Course updated successfully',
      data: courses[courseIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// DELETE /api/courses/:id - Delete course (admin only)
app.delete('/api/courses/:id', verifyToken, verifyAdmin, (req, res) => {
  try {
    const courseIndex = courses.findIndex(c => c.id === req.params.id);
    
    if (courseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    const deletedCourse = courses.splice(courseIndex, 1);
    
    res.json({
      success: true,
      message: 'Course deleted successfully',
      data: deletedCourse[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/courses/:id/enroll - Enroll in course
app.post('/api/courses/:id/enroll', verifyToken, (req, res) => {
  try {
    const course = courses.find(c => c.id === req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    const enrollment = {
      id: generateId(),
      courseId: course.id,
      userId: req.user.id,
      enrolledAt: new Date(),
      progress: 0,
      completed: false
    };
    
    enrollments.push(enrollment);
    course.enrollments = (course.enrollments || 0) + 1;
    
    res.status(201).json({
      success: true,
      message: 'Enrolled successfully',
      data: enrollment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ===== PAYMENT ROUTES =====

// POST /api/payments/process - Process payment
app.post('/api/payments/process', verifyToken, (req, res) => {
  try {
    const { courseId, amount, method, paymentDetails } = req.body;
    
    if (!courseId || !amount || !method) {
      return res.status(400).json({
        success: false,
        message: 'CourseId, amount, and method are required'
      });
    }
    
    // In production, integrate with Stripe/Razorpay here
    const transaction = {
      id: generateId(),
      userId: req.user.id,
      courseId,
      amount,
      method,
      status: 'completed',
      transactionId: 'TXN_' + generateId().substring(0, 8).toUpperCase(),
      createdAt: new Date()
    };
    
    transactions.push(transaction);
    
    res.status(201).json({
      success: true,
      message: 'Payment processed successfully',
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/payments - Get all transactions (admin only)
app.get('/api/payments', verifyToken, verifyAdmin, (req, res) => {
  try {
    res.json({
      success: true,
      data: transactions,
      total: transactions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ===== ADMIN ROUTES =====

// GET /api/admin/dashboard - Admin dashboard stats
app.get('/api/admin/dashboard', verifyToken, verifyAdmin, (req, res) => {
  try {
    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
    
    res.json({
      success: true,
      data: {
        totalUsers: users.length,
        totalPosts: posts.length,
        totalVideos: videos.length,
        totalCourses: courses.length,
        totalEnrollments: enrollments.length,
        totalTransactions: transactions.length,
        totalRevenue,
        avgRevenue: transactions.length > 0 ? totalRevenue / transactions.length : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// PUT /api/admin/seo-settings - Update SEO settings (admin only)
app.put('/api/admin/seo-settings', verifyToken, verifyAdmin, (req, res) => {
  try {
    const { title, description, keywords, ogImage } = req.body;
    
    seoSettings = {
      title: title || seoSettings.title,
      description: description || seoSettings.description,
      keywords: keywords || seoSettings.keywords,
      ogImage: ogImage || seoSettings.ogImage,
      updatedAt: new Date()
    };
    
    res.json({
      success: true,
      message: 'SEO settings updated',
      data: seoSettings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/admin/seo-settings - Get SEO settings
app.get('/api/admin/seo-settings', (req, res) => {
  try {
    res.json({
      success: true,
      data: seoSettings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ===== HEALTH CHECK & ANALYTICS =====

// GET /api/health - Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date()
  });
});

// POST /api/analytics/track - Track analytics event
app.post('/api/analytics/track', (req, res) => {
  try {
    const { event, userId, data } = req.body;
    
    const analyticsEvent = {
      id: generateId(),
      event,
      userId,
      data,
      timestamp: new Date()
    };
    
    analyticsEvents.push(analyticsEvent);
    
    res.json({
      success: true,
      message: 'Event tracked'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/analytics - Get analytics data (admin only)
app.get('/api/analytics', verifyToken, verifyAdmin, (req, res) => {
  try {
    res.json({
      success: true,
      data: analyticsEvents,
      total: analyticsEvents.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ===== 404 HANDLER =====

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// ===== START SERVER =====

const PORT = process.env.PORT || config.server.port;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║              RTech Solutions - Backend Server                   ║
╠════════════════════════════════════════════════════════════════╣
║                                                                 ║
║  ✅ Server running on: http://localhost:${PORT}                  ║
║  ✅ Environment: ${process.env.NODE_ENV || 'development'}                        ║
║  ✅ Database: In-Memory (Demo Mode)                            ║
║                                                                 ║
║  API Documentation:                                             ║
║  • Authentication: /api/auth/*                                 ║
║  • Users: /api/users/*                                         ║
║  • Posts: /api/posts/*                                         ║
║  • Videos: /api/videos/*                                       ║
║  • Courses: /api/courses/*                                     ║
║  • Payments: /api/payments/*                                   ║
║  • Admin: /api/admin/*                                         ║
║  • Analytics: /api/analytics/*                                 ║
║  • Health: /api/health                                         ║
║                                                                 ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
