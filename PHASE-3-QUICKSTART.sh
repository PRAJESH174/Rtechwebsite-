#!/bin/bash

# Phase 3 Quick Start - Integration Helper Script
# This script helps integrate all Phase 3 infrastructure components

set -e

echo "🚀 Phase 3 Infrastructure Integration Quick Start"
echo "=================================================="
echo ""

# Check if .env.production exists
if [ ! -f .env.production ]; then
  echo "📝 Creating .env.production from template..."
  cp .env.production.template .env.production
  echo "✓ .env.production created - please configure your settings"
  echo ""
fi

# Create certificate directory
if [ ! -d ./certs ]; then
  echo "📂 Creating certificates directory..."
  mkdir -p ./certs
  echo "✓ ./certs directory created"
fi

# Create upload directory
if [ ! -d ./uploads ]; then
  echo "📂 Creating uploads directory..."
  mkdir -p ./uploads
  echo "✓ ./uploads directory created"
fi

# Create logs directory
if [ ! -d ./logs ]; then
  echo "📂 Creating logs directory..."
  mkdir -p ./logs
  echo "✓ ./logs directory created"
fi

# Create backups directory
if [ ! -d ./backups ]; then
  echo "📂 Creating backups directory..."
  mkdir -p ./backups
  echo "✓ ./backups directory created"
fi

echo ""
echo "📦 Required Dependencies:"
echo "├─ mongoose (MongoDB ODM)"
echo "├─ redis (Redis client)"
echo "├─ @sendgrid/mail (Email service)"
echo "├─ aws-sdk (AWS services)"
echo "├─ @google-cloud/storage (GCS support)"
echo "├─ @sentry/node (Error tracking)"
echo "└─ helmet (Security headers)"
echo ""

echo "✅ Quick Integration Checklist:"
echo ""
echo "1. INSTALL DEPENDENCIES"
echo "   npm install mongoose redis @sendgrid/mail aws-sdk @google-cloud/storage @sentry/node"
echo ""

echo "2. CONFIGURE ENVIRONMENT"
echo "   Edit .env.production with your settings:"
echo "   - MongoDB URI"
echo "   - Redis connection"
echo "   - Email service credentials"
echo "   - AWS/GCS credentials"
echo "   - SSL certificate paths"
echo ""

echo "3. GENERATE SSL CERTIFICATES (Development)"
echo "   node -e \"require('./security/ssl-config').generateSelfSignedCert('./certs')\""
echo ""

echo "4. SETUP DATABASE"
echo "   - Install MongoDB locally or use Atlas"
echo "   - Update MONGODB_URI in .env.production"
echo "   - Mongoose will auto-create collections"
echo ""

echo "5. SETUP REDIS"
echo "   - Install Redis locally or use managed service"
echo "   - Update REDIS_HOST and REDIS_PORT in .env.production"
echo ""

echo "6. SETUP EMAIL SERVICE"
echo "   - Create SendGrid account and get API key"
echo "   - OR setup AWS SES with credentials"
echo "   - OR configure SMTP"
echo "   - Update EMAIL_PROVIDER and credentials in .env.production"
echo ""

echo "7. SETUP FILE STORAGE"
echo "   - Create AWS S3 bucket"
echo "   - OR create GCS bucket"
echo "   - Update credentials in .env.production"
echo ""

echo "8. SETUP SSL/TLS (Production)"
echo "   - Obtain certificate from Let's Encrypt or CA"
echo "   - Update SSL_CERT_PATH and SSL_KEY_PATH in .env.production"
echo ""

echo "9. UPDATE server.js"
echo "   See PHASE-3-INTEGRATION-GUIDE.md for code examples"
echo ""

echo "10. TEST ENDPOINTS"
echo "    npm start"
echo "    curl http://localhost:3000/api/health"
echo ""

echo "📊 Verify Integration:"
echo "├─ GET /api/health - Check all services"
echo "├─ GET /api/metrics - View performance metrics"
echo "├─ POST /api/auth/send-otp - Test email service"
echo "└─ POST /api/videos/upload - Test file storage"
echo ""

echo "=================================================="
echo "✅ Phase 3 Quick Start Setup Complete!"
echo "Next: Run 'npm install' and update server.js"
echo "=================================================="
