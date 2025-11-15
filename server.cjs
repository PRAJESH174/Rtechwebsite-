const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const multer = require('multer');

// Load environment variables
dotenv.config();

// ===== PHASE 3: INFRASTRUCTURE IMPORTS =====
const { DatabaseConnection } = require('./database/mongodb-config');
const { RedisCache, SessionStore } = require('./cache/redis-config');
const { EmailService } = require('./services/email-service');
const { StorageService } = require('./services/storage-service');
const { 
  applySecurityHeaders, 
  httpsRedirect, 
  getCorsConfig,
  SSLConfig 
} = require('./security/ssl-config');
const { 
  Logger, 
  HealthChecker, 
  MetricsCollector, 
  ErrorTracker,
  createMonitoringMiddleware 
} = require('./monitoring/monitoring-config');

// ===== PHASE 3: INFRASTRUCTURE INITIALIZATION =====
const db = new DatabaseConnection();
const cache = new RedisCache();
const emailService = new EmailService();
const storage = new StorageService();
const logger = new Logger();
const metrics = new MetricsCollector(logger);
const healthChecker = new HealthChecker(logger);
const errorTracker = new ErrorTracker(logger);

// Global exports for easy access
global.db = db;
global.cache = cache;
global.emailService = emailService;
global.storage = storage;
global.logger = logger;

// Initialize Express app
const app = express();

// Import configuration
const config = process.env.NODE_ENV === 'production' 
  ? require('./config/production.config.js')
  : require('./config/development.config.js');

// ===== PHASE 3: INFRASTRUCTURE INITIALIZATION FUNCTION =====

async function initializeInfrastructure() {
  try {
    console.log('\n🚀 Initializing Phase 3 Infrastructure...\n');

    // Initialize Database
    try {
      await db.connect();
      console.log('✅ Database connected (MongoDB)');
      await db.createIndexes();
      console.log('✅ Database indexes created');
    } catch (error) {
      logger.warn('Database initialization skipped', { error: error.message });
      console.log('⚠️  Database unavailable - using in-memory fallback');
    }

    // Initialize Cache
    try {
      await cache.connect();
      console.log('✅ Cache connected (Redis)');
    } catch (error) {
      logger.warn('Cache initialization skipped', { error: error.message });
      console.log('⚠️  Cache unavailable - skipping caching layer');
    }

    // Initialize Email Service
    try {
      await emailService.initialize();
      console.log('✅ Email service initialized');
    } catch (error) {
      logger.warn('Email service initialization skipped', { error: error.message });
      console.log('⚠️  Email service unavailable');
    }

    // Initialize Storage Service
    try {
      await storage.initialize();
      console.log('✅ File storage initialized');
    } catch (error) {
      logger.warn('Storage service initialization skipped', { error: error.message });
      console.log('⚠️  File storage unavailable');
    }

    // Initialize Error Tracking
    try {
      await errorTracker.initialize();
      console.log('✅ Error tracking initialized');
    } catch (error) {
      logger.warn('Error tracking initialization skipped', { error: error.message });
    }

    // Register Health Checks
    healthChecker.registerCheck('database', async () => {
      try {
        return await db.healthCheck();
      } catch {
        return false;
      }
    });

    healthChecker.registerCheck('cache', async () => {
      try {
        return await cache.healthCheck();
      } catch {
        return false;
      }
    });

    healthChecker.registerCheck('email', async () => {
      try {
        return await emailService.healthCheck();
      } catch {
        return false;
      }
    });

    // Start periodic health checks
    healthChecker.startPeriodicChecks();
    console.log('✅ Health checks configured');

    console.log('\n✅ Infrastructure initialization complete!\n');

  } catch (error) {
    logger.error('Infrastructure initialization failed', { error: error.message });
    console.error('❌ Infrastructure initialization failed:', error.message);
    // Don't exit - continue with in-memory fallback
  }
}

// ===== MIDDLEWARE SETUP =====

// Apply Phase 3 Security Headers
applySecurityHeaders(app);

// Apply HTTPS Redirect
app.use(httpsRedirect());

// Apply Phase 3 Monitoring Middleware
app.use(createMonitoringMiddleware(logger, metrics));

// Security Middleware
app.use(helmet(config.security.helmet));
app.use(compression());

// CORS Configuration
app.use(cors(getCorsConfig()));

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

// File Upload Middleware
const upload = multer({ storage: multer.memoryStorage() });

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

// (routes continue...)

// ===== START SERVER =====

const PORT = process.env.PORT || config.server.port;

async function startServer() {
  // Initialize Phase 3 infrastructure
  await initializeInfrastructure();

  // Start HTTP/HTTPS server
  if (process.env.SSL_ENABLED === 'true' && process.env.NODE_ENV === 'production') {
    try {
      const sslConfig = new SSLConfig();
      const httpsServer = sslConfig.createHttpsServer(app);
      httpsServer.listen(sslConfig.httpsPort, () => {
        console.log(`HTTPS Server running on: https://localhost:${sslConfig.httpsPort}`);
      });
    } catch (error) {
      console.error('HTTPS server creation failed, falling back to HTTP:', error.message);
      startHttpServer();
    }
  } else {
    startHttpServer();
  }
}

function startHttpServer() {
  app.listen(PORT, () => {
    console.log(`HTTP Server running on: http://localhost:${PORT}`);
  });
}

// Start server
startServer().catch(error => {
  logger.error('Server startup failed', { error: error.message });
  console.error('❌ Server startup failed:', error.message);
  process.exit(1);
});

module.exports = app;
