/**
 * Production Configuration for RTech Solutions
 * This file contains all production-specific settings
 */

module.exports = {
  // Environment
  environment: 'production',
  debug: false,
  
  // Server Configuration
  server: {
    host: process.env.HOST || '0.0.0.0',
    port: process.env.PORT || 443,
    https: {
      enabled: true,
      certPath: process.env.SSL_CERT_PATH,
      keyPath: process.env.SSL_KEY_PATH
    }
  },

  // Domain Configuration
  domain: {
    primary: 'https://www.rTechLearners.com',
    alternative: 'https://rTechLearners.com',
    cdn: process.env.CDN_URL || 'https://cdn.rTechLearners.com'
  },

  // Database Configuration
  database: {
    type: 'mongodb', // or 'postgresql'
    connection: {
      uri: process.env.MONGODB_URI,
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
      }
    },
    backup: {
      enabled: true,
      schedule: '0 2 * * *', // Every day at 2 AM
      retention: 30 // days
    }
  },

  // API Configuration
  api: {
    version: 'v1',
    prefix: '/api',
    timeout: 30000,
    rateLimiting: {
      enabled: true,
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100
    }
  },

  // Security Configuration
  security: {
    cors: {
      enabled: true,
      origin: ['https://www.rTechLearners.com', 'https://rTechLearners.com'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    csrf: {
      enabled: true,
      tokenLength: 32
    },
    helmet: {
      enabled: true,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://www.googletagmanager.com', 'https://www.google-analytics.com'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
          imgSrc: ["'self'", 'data:', 'https:', 'https://cdn.rTechLearners.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
          connectSrc: ["'self'", 'https://www.google-analytics.com', 'https://www.googletagmanager.com']
        }
      }
    },
    ssl: {
      enabled: true,
      hsts: {
        enabled: true,
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      }
    }
  },

  // Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    tokenExpiry: '7d',
    refreshTokenExpiry: '30d',
    sessionTimeout: 1800000 // 30 minutes in milliseconds
  },

  // Email Configuration
  email: {
    service: process.env.EMAIL_SERVICE,
    from: process.env.EMAIL_FROM,
    smtp: {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    }
  },

  // Payment Gateway Configuration
  payments: {
    stripe: {
      enabled: true,
      publicKey: process.env.STRIPE_PUBLIC_KEY,
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
    },
    razorpay: {
      enabled: true,
      keyId: process.env.RAZORPAY_KEY_ID,
      secret: process.env.RAZORPAY_SECRET
    }
  },

  // Cache Configuration
  cache: {
    enabled: true,
    provider: 'redis',
    redis: {
      url: process.env.REDIS_URL,
      ttl: 3600 // 1 hour
    }
  },

  // CDN Configuration
  cdn: {
    enabled: true,
    provider: 'aws-s3',
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
      bucket: process.env.CDN_BUCKET
    },
    imageOptimization: {
      enabled: true,
      formats: ['webp', 'jpg', 'png'],
      sizes: [480, 768, 1024, 1280, 1920]
    }
  },

  // Analytics Configuration
  analytics: {
    googleAnalytics: {
      enabled: true,
      measurementId: process.env.GOOGLE_ANALYTICS_ID
    },
    googleSearchConsole: {
      enabled: true,
      token: process.env.GOOGLE_SEARCH_CONSOLE_TOKEN
    },
    errorTracking: {
      enabled: true,
      service: 'sentry',
      dsn: process.env.SENTRY_DSN
    }
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    file: process.env.LOG_FILE,
    retention: 30 // days
  },

  // Performance Configuration
  performance: {
    compression: {
      enabled: true,
      level: 6
    },
    imageOptimization: {
      enabled: true,
      quality: 80
    },
    lazyLoading: {
      enabled: true
    },
    minification: {
      enabled: true
    }
  },

  // Monitoring & Alerting
  monitoring: {
    enabled: true,
    healthCheck: {
      enabled: true,
      interval: 60000 // 1 minute
    },
    uptime: {
      enabled: true,
      service: 'pingdom'
    },
    alerts: {
      enabled: true,
      email: process.env.ALERT_EMAIL
    }
  }
};
