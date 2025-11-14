/**
 * Development Configuration for RTech Solutions
 * This file contains development-specific settings
 */

module.exports = {
  // Environment
  environment: 'development',
  debug: true,
  
  // Server Configuration
  server: {
    host: 'localhost',
    port: 3000,
    https: {
      enabled: false
    }
  },

  // Domain Configuration
  domain: {
    primary: 'http://localhost:3000',
    alternative: 'http://127.0.0.1:3000',
    cdn: 'http://localhost:3000'
  },

  // Database Configuration
  database: {
    type: 'mongodb',
    connection: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rtech_solutions_dev',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    }
  },

  // API Configuration
  api: {
    version: 'v1',
    prefix: '/api',
    timeout: 30000,
    rateLimiting: {
      enabled: false // Disabled for development
    }
  },

  // Security Configuration
  security: {
    cors: {
      enabled: true,
      origin: '*',
      credentials: true
    },
    csrf: {
      enabled: false
    },
    helmet: {
      enabled: false
    }
  },

  // Authentication
  auth: {
    jwtSecret: 'dev-secret-key',
    tokenExpiry: '7d',
    refreshTokenExpiry: '30d'
  },

  // Cache Configuration
  cache: {
    enabled: false
  },

  // Logging Configuration
  logging: {
    level: 'debug',
    format: 'simple'
  }
};
