# Backend Implementation - Phase 1

## Overview

This is the complete backend implementation for RTech Solutions using Node.js/Express.js. The server provides a comprehensive REST API with authentication, authorization, and full CRUD operations for courses, posts, videos, and more.

## Installation

### Prerequisites
- Node.js (v14+)
- npm or yarn
- Git

### Setup Steps

```bash
# 1. Install dependencies
npm install

# 2. Create .env file from template
cp .env.example .env

# 3. Update .env with your configuration
# Edit .env and add:
# - Database credentials
# - JWT secret
# - API keys for payment gateways, email services, etc.

# 4. Start the server
npm start

# For development with hot-reload:
npm run dev

# For production:
npm run build:prod
```

## Project Structure

```
├── server.js                 # Main Express server entry point
├── middleware/
│   ├── auth.js              # Authentication & authorization middleware
│   ├── rateLimiter.js       # Rate limiting middleware
│   └── errorHandler.js      # Error handling middleware
├── utils/
│   └── helpers.js           # Utility functions (JWT, password hashing, etc.)
├── config/
│   ├── production.config.js # Production environment config
│   └── development.config.js # Development environment config
├── api/
│   ├── routes.js            # API endpoint specifications
│   ├── client.js            # Frontend API client library
│   └── database-schema.js   # Database models and schemas
├── docs/
│   ├── DEPLOYMENT-GUIDE.md  # Deployment procedures
│   ├── SEO-SETUP.md         # SEO optimization guide
│   ├── PRODUCTION-CHECKLIST.md # Pre-launch checklist
│   └── README-PRODUCTION.md # Production setup reference
└── public/                   # Static files (sitemap, robots.txt, manifest.json)
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/admin-login` - Admin login
- `POST /api/auth/send-otp` - Send OTP for verification
- `POST /api/auth/verify-otp` - Verify OTP

### Users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user profile
- `GET /api/users` - Get all users (admin only)

### Posts
- `POST /api/posts` - Create new post
- `GET /api/posts` - Get all posts (paginated)
- `GET /api/posts/:id` - Get single post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like post
- `POST /api/posts/:id/comments` - Add comment to post

### Videos
- `POST /api/videos` - Upload video
- `GET /api/videos` - Get all videos (paginated)
- `GET /api/videos/:id` - Get single video
- `PUT /api/videos/:id` - Update video
- `DELETE /api/videos/:id` - Delete video

### Courses
- `POST /api/courses` - Create course (admin only)
- `GET /api/courses` - Get all courses (paginated)
- `GET /api/courses/:id` - Get single course
- `PUT /api/courses/:id` - Update course (admin only)
- `DELETE /api/courses/:id` - Delete course (admin only)
- `POST /api/courses/:id/enroll` - Enroll in course

### Payments
- `POST /api/payments/process` - Process payment
- `GET /api/payments` - Get all transactions (admin only)

### Admin
- `GET /api/admin/dashboard` - Get dashboard statistics
- `PUT /api/admin/seo-settings` - Update SEO settings (admin only)
- `GET /api/admin/seo-settings` - Get SEO settings

### Analytics
- `POST /api/analytics/track` - Track analytics event
- `GET /api/analytics` - Get analytics data (admin only)

### Health
- `GET /api/health` - Server health check

## Authentication

### JWT Token
The API uses JWT (JSON Web Token) for authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer <token>
```

### User Roles
- **user**: Regular user (default)
- **admin**: Administrator with elevated privileges

### Admin Credentials (Demo)
```
Username: admin
Password: admin123
```

## Data Models

### User
```javascript
{
  id: String,
  name: String,
  email: String,
  mobile: String,
  password: String (hashed),
  role: String ('user' or 'admin'),
  bio: String (optional),
  createdAt: Date,
  updatedAt: Date
}
```

### Post
```javascript
{
  id: String,
  title: String,
  content: String (HTML),
  category: String,
  tags: Array,
  authorId: String,
  authorName: String,
  likes: Number,
  comments: Array,
  createdAt: Date,
  updatedAt: Date
}
```

### Video
```javascript
{
  id: String,
  title: String,
  description: String,
  url: String,
  category: String,
  thumbnail: String (URL),
  uploadedBy: String (userId),
  uploaderName: String,
  views: Number,
  likes: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Course
```javascript
{
  id: String,
  title: String,
  description: String,
  price: Number,
  duration: String,
  level: String,
  category: String,
  instructor: String,
  enrollments: Number,
  rating: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features

✅ **Encryption**
- Passwords hashed with bcryptjs (10 salt rounds)
- JWT for token-based authentication
- HTTPS/TLS for production

✅ **Validation**
- Input sanitization
- Email and phone validation
- Password strength requirements

✅ **Authorization**
- Role-based access control (RBAC)
- Resource ownership verification
- Admin-only endpoints

✅ **Rate Limiting**
- General API: 100 requests per 15 minutes
- Auth endpoints: 5 attempts per 15 minutes
- Payment: 10 attempts per hour

✅ **Headers**
- Helmet.js for security headers
- CORS configuration
- XSS protection
- SQL injection prevention (using parameterized queries)

## Development

### Run in Development Mode
```bash
npm run dev
```

### Run Tests
```bash
npm test
npm run test:e2e
npm run test:performance
```

### Check Security
```bash
npm run security:check
```

### Lint Code
```bash
npm run lint
```

## Environment Variables

Key environment variables to configure in `.env`:

```
# Server
NODE_ENV=development
PORT=5000
API_BASE_URL=http://localhost:5000

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Database
MONGODB_URI=mongodb://localhost:27017/rtech
POSTGRESQL_URL=postgresql://user:password@localhost:5432/rtech

# Payment Gateways
STRIPE_SECRET_KEY=your_stripe_secret_key
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Email Service
SENDGRID_API_KEY=your_sendgrid_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password

# Storage
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
S3_BUCKET=your_bucket_name

# Analytics
GOOGLE_ANALYTICS_ID=your_ga_id
SENTRY_DSN=your_sentry_dsn

# Redis
REDIS_URL=redis://localhost:6379

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

## Deployment

### Production Deployment Checklist

Before deploying to production:

1. ✅ Update `.env` with production credentials
2. ✅ Set `NODE_ENV=production`
3. ✅ Configure SSL/TLS certificates
4. ✅ Setup database (MongoDB/PostgreSQL)
5. ✅ Configure CDN and static file serving
6. ✅ Setup email service credentials
7. ✅ Configure payment gateway credentials
8. ✅ Setup monitoring and error tracking
9. ✅ Configure backup procedures
10. ✅ Run security audit

See `docs/DEPLOYMENT-GUIDE.md` for detailed deployment steps.

## Monitoring & Logging

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Analytics
```bash
# Track event
curl -X POST http://localhost:5000/api/analytics/track \
  -H "Content-Type: application/json" \
  -d '{"event":"page_view","userId":"user123","data":{}}'

# Get analytics data (admin only)
curl http://localhost:5000/api/analytics \
  -H "Authorization: Bearer <admin_token>"
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

### Database Connection Issues
- Verify database is running
- Check connection string in `.env`
- Verify database credentials
- Check firewall rules

### Authentication Errors
- Verify JWT secret matches
- Check token expiration
- Verify user role permissions
- Check token format in Authorization header

### Rate Limiting
- Check X-RateLimit-Remaining header
- Wait for rate limit window to reset
- For admin: adjust rate limits in config

## Performance Optimization

- ✅ Compression enabled (gzip)
- ✅ Database indexing configured
- ✅ Query optimization implemented
- ✅ Caching with Redis enabled
- ✅ CDN integration for static files
- ✅ Pagination for large datasets

## Support & Documentation

- **API Docs**: See endpoints above
- **Deployment**: See `docs/DEPLOYMENT-GUIDE.md`
- **SEO**: See `docs/SEO-SETUP.md`
- **Pre-Launch**: See `docs/PRODUCTION-CHECKLIST.md`

## Next Steps

### Phase 2: Frontend Integration
- Refactor Index.htm into components
- Integrate API client (api/client.js)
- Replace localStorage with API calls
- Add SEO metadata to pages

### Phase 3: Infrastructure Setup
- Configure production database
- Setup Redis cache
- Configure CDN (AWS S3/CloudFront)
- Setup email service

### Phase 4: Testing & Optimization
- Run unit tests
- Run E2E tests
- Performance testing
- Security audit

### Phase 5: Production Deployment
- Follow deployment guide
- Complete pre-launch checklist
- Submit sitemaps to search engines
- Monitor production system

## License

RTech Solutions © 2025
