/**
 * Security Configuration - SSL/TLS, HTTPS, Security Headers
 * 
 * Environment Variables:
 * - SSL_ENABLED: true | false (default: false)
 * - SSL_CERT_PATH: Path to SSL certificate file
 * - SSL_KEY_PATH: Path to SSL key file
 * - SSL_CA_PATH: Path to CA certificate bundle (optional)
 * - HTTPS_PORT: HTTPS port (default: 443)
 * - HSTS_MAX_AGE: HSTS max age in seconds (default: 31536000 = 1 year)
 * - FORCE_HTTPS: Redirect HTTP to HTTPS (default: true)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const helmet = require('helmet');

// ===== SSL/TLS CONFIGURATION =====

class SSLConfig {
  constructor() {
    this.enabled = process.env.SSL_ENABLED === 'true';
    this.httpsPort = parseInt(process.env.HTTPS_PORT) || 443;
    this.forceHttps = process.env.FORCE_HTTPS !== 'false';
  }

  /**
   * Load SSL certificates
   * @returns {Object} - { key, cert, ca }
   */
  loadCertificates() {
    if (!this.enabled) {
      console.log('SSL/TLS disabled');
      return null;
    }

    try {
      const certPath = process.env.SSL_CERT_PATH;
      const keyPath = process.env.SSL_KEY_PATH;
      const caPath = process.env.SSL_CA_PATH;

      if (!certPath || !keyPath) {
        throw new Error('SSL_CERT_PATH and SSL_KEY_PATH must be set');
      }

      if (!fs.existsSync(certPath)) {
        throw new Error(`Certificate not found: ${certPath}`);
      }

      if (!fs.existsSync(keyPath)) {
        throw new Error(`Private key not found: ${keyPath}`);
      }

      const certificates = {
        key: fs.readFileSync(keyPath, 'utf8'),
        cert: fs.readFileSync(certPath, 'utf8'),
      };

      if (caPath && fs.existsSync(caPath)) {
        certificates.ca = fs.readFileSync(caPath, 'utf8');
      }

      console.log('SSL/TLS certificates loaded successfully');
      return certificates;
    } catch (error) {
      console.error(`SSL certificate loading failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create HTTPS server
   * @param {Object} app - Express app
   * @param {number} port - Port number
   * @returns {Object} - HTTPS server
   */
  createHttpsServer(app, port = this.httpsPort) {
    try {
      const certificates = this.loadCertificates();

      if (!certificates) {
        throw new Error('SSL certificates not loaded');
      }

      const server = https.createServer(certificates, app);
      console.log(`HTTPS server created on port ${port}`);
      return server;
    } catch (error) {
      console.error(`Failed to create HTTPS server: ${error.message}`);
      throw error;
    }
  }
}

// ===== SECURITY HEADERS MIDDLEWARE =====

/**
 * Apply security headers middleware
 * @param {Object} app - Express app
 */
function applySecurityHeaders(app) {
  // Helmet with custom configuration
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.quilljs.com'],
          styleSrc: ["'self'", "'unsafe-inline'", 'cdn.quilljs.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https:'],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: parseInt(process.env.HSTS_MAX_AGE) || 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      frameguard: {
        action: 'deny',
      },
      noSniff: true,
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
      permittedCrossDomainPolicies: false,
    })
  );

  // Additional security headers
  app.use((req, res, next) => {
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Feature policy / Permissions policy
    res.setHeader(
      'Permissions-Policy',
      'accelerometer=(), camera=(), microphone=(), geolocation=(), payment=()'
    );

    // Remove powered by header
    res.removeHeader('X-Powered-By');

    next();
  });

  console.log('Security headers applied');
}

// ===== HTTPS REDIRECT MIDDLEWARE =====

/**
 * Redirect HTTP to HTTPS
 * @returns {Function} Express middleware
 */
function httpsRedirect() {
  return (req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  };
}

// ===== CORS SECURITY =====

/**
 * Get CORS configuration
 * @returns {Object} CORS options
 */
function getCorsConfig() {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');

  return {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400, // 24 hours
  };
}

// ===== CERTIFICATE GENERATION (Development Only) =====

/**
 * Generate self-signed certificate for development
 * @param {string} outputDir - Output directory for certificate files
 */
function generateSelfSignedCert(outputDir = './certs') {
  const { execSync } = require('child_process');

  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const certPath = path.join(outputDir, 'server.crt');
    const keyPath = path.join(outputDir, 'server.key');

    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      console.log('Self-signed certificates already exist');
      return { certPath, keyPath };
    }

    console.log('Generating self-signed certificate...');

    // Generate self-signed certificate valid for 365 days
    const command = `openssl req -x509 -newkey rsa:4096 -keyout ${keyPath} -out ${certPath} -days 365 -nodes -subj "/CN=localhost"`;

    execSync(command);

    console.log('Self-signed certificate generated successfully');
    return { certPath, keyPath };
  } catch (error) {
    console.error(`Certificate generation failed: ${error.message}`);
    throw error;
  }
}

// ===== CERTIFICATE VALIDATION =====

/**
 * Validate certificate expiry
 * @param {string} certPath - Path to certificate file
 * @returns {Object} - { valid, expiresIn, expiryDate }
 */
function validateCertificateExpiry(certPath) {
  try {
    const { execSync } = require('child_process');

    const output = execSync(`openssl x509 -in ${certPath} -noout -dates`).toString();

    const lines = output.split('\n');
    const notAfterLine = lines.find((line) => line.startsWith('notAfter='));

    if (!notAfterLine) {
      return { valid: false, error: 'Could not parse certificate dates' };
    }

    const expiryDate = new Date(notAfterLine.replace('notAfter=', ''));
    const now = new Date();
    const expiresIn = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));

    const valid = expiresIn > 0;
    const warning = expiresIn < 30;

    if (warning) {
      console.warn(`Certificate expires in ${expiresIn} days`);
    }

    return { valid, expiresIn, expiryDate };
  } catch (error) {
    console.error(`Certificate validation failed: ${error.message}`);
    return { valid: false, error: error.message };
  }
}

// ===== EXPORTS =====

module.exports = {
  SSLConfig,
  applySecurityHeaders,
  httpsRedirect,
  getCorsConfig,
  generateSelfSignedCert,
  validateCertificateExpiry,
};
