# RTech Solutions - Production Deployment Guide

## Step 1: Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] Linting checks passed
- [ ] Code coverage > 80%
- [ ] Security audit completed
- [ ] Dependencies updated and audited

### Security
- [ ] Remove all demo credentials
- [ ] Remove all test data
- [ ] Environment variables configured
- [ ] SSL certificate installed
- [ ] CORS properly configured
- [ ] CSRF protection enabled
- [ ] Rate limiting enabled
- [ ] Admin credentials securely stored

### Infrastructure
- [ ] Database backup system in place
- [ ] CDN configured and tested
- [ ] Cache strategy implemented
- [ ] Monitoring and alerting setup
- [ ] Log aggregation configured
- [ ] Backup and recovery tested

### Performance
- [ ] Images optimized and compressed
- [ ] CSS/JS minified
- [ ] Lazy loading implemented
- [ ] Caching headers configured
- [ ] Page speed tested (>90 score)
- [ ] Mobile responsiveness verified
- [ ] Database indexes created

### SEO
- [ ] Meta tags updated
- [ ] Sitemap generated
- [ ] Robots.txt created
- [ ] Structured data validated
- [ ] Open Graph tags added
- [ ] Twitter Card tags added
- [ ] Canonical URLs set

## Step 2: Environment Setup

### Create Production Environment File
```bash
cp .env.example .env
# Edit .env with production values
```

Required variables:
- `NODE_ENV=production`
- `DOMAIN=rTechLearners.com`
- `MONGODB_URI=your_production_db`
- `STRIPE_SECRET_KEY=your_key`
- `GOOGLE_ANALYTICS_ID=GA4_ID`
- All other API keys and secrets

## Step 3: Database Setup

### MongoDB
```bash
# Create production database
mongo
use rtech_solutions
db.createCollection("users")
db.createCollection("posts")
db.createCollection("courses")
db.createCollection("transactions")

# Create indexes for performance
db.users.createIndex({email: 1}, {unique: true})
db.posts.createIndex({slug: 1}, {unique: true})
db.courses.createIndex({slug: 1}, {unique: true})
```

### PostgreSQL Alternative
```bash
# Create production database
createdb rtech_solutions

# Run migrations
npm run migrate:prod
```

## Step 4: Install Dependencies

```bash
# Install production dependencies
npm install --production

# Or with yarn
yarn install --production
```

## Step 5: Build and Optimize

```bash
# Minify CSS and JavaScript
npm run build:prod

# Generate sitemap
npm run generate:sitemap

# Build Docker image
docker build -t rtech-solutions:latest .
```

## Step 6: SSL Certificate Setup

### Using Let's Encrypt with Certbot
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d rTechLearners.com -d www.rTechLearners.com

# Auto-renew
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Configure nginx/Apache
```nginx
listen 443 ssl http2;
ssl_certificate /etc/letsencrypt/live/rTechLearners.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/rTechLearners.com/privkey.pem;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

## Step 7: Deploy Application

### Using Node.js with PM2
```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start app.js --name "rtech-solutions" -i max

# Setup startup script
pm2 startup
pm2 save

# Monitor
pm2 monit
```

### Using Docker
```bash
# Run container
docker run -d \
  --name rtech-solutions \
  -p 443:443 \
  -e NODE_ENV=production \
  -e MONGODB_URI=$MONGODB_URI \
  -v /etc/letsencrypt:/etc/letsencrypt:ro \
  rtech-solutions:latest

# Use Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

## Step 8: CDN Configuration

### AWS S3 + CloudFront
```bash
# Create S3 bucket
aws s3 mb s3://rtech-cdn-assets

# Upload assets
aws s3 sync ./public/assets s3://rtech-cdn-assets/ --acl public-read

# Create CloudFront distribution
# Configure to point to S3 bucket
# Set TTL to 31536000 (1 year)
```

### Image Optimization
```bash
# Install sharp-cli for image optimization
npm install -g sharp-cli

# Optimize images
find ./public/images -type f \( -name "*.jpg" -o -name "*.png" \) | \
while read img; do
  sharp "$img" -w 1920 -w 1280 -w 768 -w 480 -webp > "${img%.jpg}.webp"
done
```

## Step 9: Search Engine Submission

### Google Search Console
1. Visit: https://search.google.com/search-console
2. Add property for rTechLearners.com
3. Verify ownership (HTML file or DNS record)
4. Submit sitemap: https://www.rTechLearners.com/sitemap.xml
5. Request indexing for important pages

### Bing Webmaster Tools
1. Visit: https://www.bing.com/webmasters
2. Add site
3. Verify ownership
4. Submit sitemap

## Step 10: Analytics Setup

### Google Analytics 4
```bash
# Create property in Google Analytics
# Measurement ID: G-XXXXXXXXXX
# Add to environment variables
export GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

### Google Tag Manager
```bash
# Create GTM account
# Container ID: GTM-XXXXXXX
# Deploy container
```

## Step 11: Email Service Setup

### SendGrid / AWS SES
```bash
# Set environment variables
export EMAIL_SERVICE=sendgrid
export SENDGRID_API_KEY=your_key

# Or for AWS SES
export EMAIL_SERVICE=ses
export AWS_SES_REGION=us-east-1
```

## Step 12: Payment Gateway Integration

### Stripe Production
```bash
# Set Stripe keys
export STRIPE_PUBLIC_KEY=pk_live_xxxxx
export STRIPE_SECRET_KEY=sk_live_xxxxx

# Setup webhooks
# Visit: https://dashboard.stripe.com/webhooks
# Add endpoint: https://api.rTechLearners.com/webhooks/stripe
```

### Razorpay Production
```bash
# Set Razorpay keys
export RAZORPAY_KEY_ID=xxxxx
export RAZORPAY_SECRET=xxxxx
```

## Step 13: Monitoring and Alerts

### Start Monitoring
```bash
# Start PM2 monitoring
pm2 start ecosystem.config.js --watch

# View logs
pm2 logs
```

### Configure Alerts
- Email alerts for critical errors
- Slack notifications for warnings
- SMS alerts for severe issues
- PagerDuty integration for on-call

## Step 14: Post-Deployment Testing

### Functionality Testing
```bash
# Run test suite
npm test

# E2E tests
npm run test:e2e

# Performance tests
npm run test:performance
```

### Performance Testing
- Lighthouse score > 90
- Page load time < 2 seconds
- API response time < 200ms
- Mobile Core Web Vitals

### Security Testing
```bash
# OWASP security check
npm run security:check

# SSL check
nmap --script ssl-enum-ciphers -p 443 rTechLearners.com

# Headers check
curl -I https://www.rTechLearners.com
```

## Step 15: Backup and Disaster Recovery

### Automated Backups
```bash
# Daily database backup
0 2 * * * /usr/local/bin/backup-db.sh

# Weekly full backup
0 3 * * 0 /usr/local/bin/full-backup.sh

# Monthly archive
0 4 1 * * /usr/local/bin/archive-backup.sh
```

### Test Recovery
```bash
# Test backup restoration
./scripts/restore-backup.sh /path/to/backup.tar.gz
```

## Step 16: Monitoring Dashboard

Access monitoring at:
- PM2 Dashboard: http://localhost:9615
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000
- ELK Stack: http://localhost:5601

## Step 17: Performance Optimization

### Caching Strategy
- Browser caching: 1 year for static assets
- CDN caching: 1 month for images
- Database caching: Redis with 1 hour TTL
- Page caching: 5 minutes for dynamic content

### Database Optimization
```bash
# Create indexes
npm run db:create-indexes

# Analyze query performance
npm run db:analyze-queries
```

## Step 18: Ongoing Maintenance

### Weekly
- Check error logs
- Monitor uptime and performance
- Review user feedback
- Test critical functionality

### Monthly
- Security audit
- Backup integrity check
- Performance analysis
- Update dependencies

### Quarterly
- Full security audit
- Disaster recovery drill
- Architecture review
- Capacity planning

## Rollback Procedure

If issues arise after deployment:

```bash
# Revert to previous version
git checkout <previous-version>
npm install
npm run build:prod
pm2 restart rtech-solutions

# Restore database from backup
./scripts/restore-backup.sh /backups/latest.tar.gz

# Clear caches
redis-cli FLUSHALL
```

## Support and Troubleshooting

For issues:
1. Check error logs: `pm2 logs`
2. Check monitoring dashboard
3. Review recent changes
4. Consult documentation
5. Contact support team

## Useful Commands

```bash
# View application status
pm2 status

# Restart application
pm2 restart rtech-solutions

# Stop application
pm2 stop rtech-solutions

# View detailed logs
pm2 logs rtech-solutions --lines 100

# Check SSL certificate expiry
openssl x509 -enddate -noout -in /etc/letsencrypt/live/rTechLearners.com/fullchain.pem

# Test API endpoint
curl -H "Authorization: Bearer $TOKEN" https://api.rTechLearners.com/api/v1/health
```

---
**Last Updated**: January 14, 2025
**Deployment Status**: Production Ready
