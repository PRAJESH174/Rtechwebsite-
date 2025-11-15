# Phase 3: Infrastructure Setup - Integration Guide

## Overview
Phase 3 establishes production-ready infrastructure components:
- **Database Layer**: MongoDB with Mongoose schemas
- **Caching Layer**: Redis for sessions and API responses
- **Email Service**: Multi-provider email notifications
- **File Storage**: AWS S3 / Google Cloud Storage / Local
- **Security**: SSL/TLS, HTTPS, security headers
- **Monitoring**: Health checks, error tracking, metrics

**Status**: All infrastructure files created and ready for integration

## File Structure
```
/database/
  └── mongodb-config.js (11 KB)
/cache/
  └── redis-config.js (12 KB)
/services/
  ├── email-service.js (11 KB)
  └── storage-service.js (12 KB)
/security/
  └── ssl-config.js (10 KB)
/monitoring/
  └── monitoring-config.js (13 KB)
.env.production.template (3 KB)
```

**Total Phase 3 Code**: ~62 KB (production-ready)

## Integration Steps

### Step 1: Database Integration (server.js)

```javascript
// At top of server.js
const { DatabaseConnection } = require('./database/mongodb-config');
const db = new DatabaseConnection();

// In app initialization (before routes)
async function initializeApp() {
  try {
    // Initialize database
    await db.connect();
    console.log('✓ Database connected');
    
    // Create indexes
    await db.createIndexes();
    console.log('✓ Database indexes created');
    
    // Run migrations if needed
    // await db.migrateData();
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// Replace in-memory storage with MongoDB queries
// Example: Replace localStorage['users'] with:
// const users = await db.User.find();
```

### Step 2: Redis Cache Integration

```javascript
// At top of server.js
const { RedisCache } = require('./cache/redis-config');
const cache = new RedisCache();

// In app initialization
async function initializeApp() {
  // ... database init ...
  
  // Initialize cache
  await cache.connect();
  console.log('✓ Redis cache connected');
  
  // Add caching middleware
  app.use(cache.cacheMiddleware.bind(cache));
  console.log('✓ Cache middleware applied');
}
```

### Step 3: Email Service Integration

```javascript
// At top of server.js
const { EmailService } = require('./services/email-service');
const emailService = new EmailService();

// In app initialization
async function initializeApp() {
  // ... database and cache init ...
  
  // Initialize email service
  await emailService.initialize();
  console.log('✓ Email service initialized');
  
  // Make available globally
  global.emailService = emailService;
}

// Use in endpoints
app.post('/api/auth/signup', async (req, res) => {
  // Create user...
  
  // Send welcome email
  await emailService.sendWelcome(user.email, user.name);
  
  res.json({ user, message: 'Welcome email sent' });
});

// Send OTP
app.post('/api/auth/send-otp', async (req, res) => {
  const otp = generateOTP();
  await emailService.sendOTP(req.body.email, user.name, otp);
  res.json({ message: 'OTP sent' });
});
```

### Step 4: File Storage Integration

```javascript
// At top of server.js
const { StorageService } = require('./services/storage-service');
const storage = new StorageService();

// In app initialization
async function initializeApp() {
  // ... previous init ...
  
  // Initialize storage
  await storage.initialize();
  console.log('✓ File storage initialized');
  
  global.storage = storage;
}

// Add file upload endpoint
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/videos/upload', upload.single('video'), async (req, res) => {
  try {
    // Validate file
    const validation = storage.validateFile(req.file, 'VIDEO');
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    
    // Upload to storage
    const result = await storage.upload(req.file, 'videos', {
      metadata: { userId: req.user.id }
    });
    
    res.json({ 
      url: result.url,
      message: 'Video uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Step 5: Security Integration

```javascript
// At top of server.js
const { 
  SSLConfig, 
  applySecurityHeaders, 
  httpsRedirect, 
  getCorsConfig 
} = require('./security/ssl-config');

// Apply security headers
applySecurityHeaders(app);
console.log('✓ Security headers applied');

// Apply HTTPS redirect
app.use(httpsRedirect());

// Configure CORS
const cors = require('cors');
app.use(cors(getCorsConfig()));

// Create HTTPS server (in server startup)
const sslConfig = new SSLConfig();
if (sslConfig.enabled && process.env.NODE_ENV === 'production') {
  const https = require('https');
  const httpServer = sslConfig.createHttpsServer(app);
  httpServer.listen(sslConfig.httpsPort, () => {
    console.log(`✓ HTTPS server listening on port ${sslConfig.httpsPort}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`✓ HTTP server listening on port ${PORT}`);
  });
}
```

### Step 6: Monitoring Integration

```javascript
// At top of server.js
const { 
  Logger, 
  HealthChecker, 
  MetricsCollector, 
  ErrorTracker,
  createMonitoringMiddleware 
} = require('./monitoring/monitoring-config');

// Initialize monitoring
const logger = new Logger();
const metrics = new MetricsCollector(logger);
const healthChecker = new HealthChecker(logger);
const errorTracker = new ErrorTracker(logger);

// In app initialization
async function initializeApp() {
  // ... other init ...
  
  // Initialize error tracking
  await errorTracker.initialize();
  
  // Apply monitoring middleware
  app.use(createMonitoringMiddleware(logger, metrics));
  
  // Register health checks
  healthChecker.registerCheck('database', async () => {
    return await db.healthCheck();
  });
  
  healthChecker.registerCheck('cache', async () => {
    return await cache.healthCheck();
  });
  
  healthChecker.registerCheck('email', async () => {
    return await emailService.healthCheck();
  });
  
  // Start periodic health checks
  healthChecker.startPeriodicChecks();
  
  console.log('✓ Monitoring initialized');
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const healthStatus = await healthChecker.performChecks();
  const metrics = metrics.getMetrics();
  
  res.json({
    health: healthStatus,
    metrics,
    timestamp: new Date().toISOString()
  });
});

// Metrics endpoint
app.get('/api/metrics', (req, res) => {
  res.json(metrics.getMetrics());
});
```

## Environment Setup

### 1. Copy Production Template
```bash
cp .env.production.template .env.production
```

### 2. Configure Environment Variables
```bash
# Edit .env.production with your values:
# - MongoDB URI
# - Redis connection details
# - Email provider credentials
# - AWS S3 credentials
# - SSL certificate paths
# - Sentry DSN
```

### 3. Install Dependencies
```bash
npm install mongoose redis @sendgrid/mail aws-sdk @google-cloud/storage
npm install --save-dev openssl  # For certificate generation
```

### 4. Generate SSL Certificates
```bash
# Development (self-signed)
node -e "require('./security/ssl-config').generateSelfSignedCert('./certs')"

# Production (Let's Encrypt)
# Use certbot or your CA provider
```

## Verification Checklist

- [ ] MongoDB connection successful
- [ ] Redis session storage working
- [ ] Email templates sending correctly
- [ ] File uploads to storage working
- [ ] Security headers applied
- [ ] Health check endpoint responding
- [ ] Error tracking capturing errors
- [ ] HTTPS redirect working
- [ ] Metrics collection running
- [ ] All environment variables configured

## Testing Commands

```bash
# Test database
curl http://localhost:3000/api/health

# Test email
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Test file upload
curl -X POST http://localhost:3000/api/videos/upload \
  -F "video=@test.mp4"

# View metrics
curl http://localhost:3000/api/metrics

# View detailed health
curl http://localhost:3000/api/health
```

## Performance Optimization Tips

1. **Database**: Enable connection pooling, create proper indexes
2. **Cache**: Set appropriate TTLs, invalidate on writes
3. **Storage**: Use CDN for file serving
4. **Security**: Enable GZIP compression, optimize SSL/TLS
5. **Monitoring**: Collect metrics, set alerts, rotate logs

## Production Deployment

1. Set NODE_ENV=production
2. Enable SSL/TLS (FORCE_HTTPS=true)
3. Configure Sentry for error tracking
4. Enable database backups
5. Setup log rotation
6. Configure monitoring alerts
7. Use PM2 for process management

## Troubleshooting

**Database Connection Failed**
- Check MONGODB_URI format
- Verify network access to MongoDB
- Check authentication credentials

**Redis Connection Failed**
- Verify Redis is running
- Check REDIS_HOST and REDIS_PORT
- Verify REDIS_PASSWORD if set

**Email Not Sending**
- Check EMAIL_PROVIDER setting
- Verify API keys/credentials
- Check email logs

**SSL Certificate Error**
- Verify certificate paths
- Check certificate expiry
- Regenerate if needed

## Next Phase

After Phase 3 is complete and verified:
- Phase 4: Testing & Optimization (unit tests, integration tests, performance tuning)
- Phase 5: Deployment (containerization, CI/CD, production setup)

---

**Phase 3 Status**: Infrastructure foundation complete and ready for integration ✓
