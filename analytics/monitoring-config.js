/**
 * Monitoring and Alerts Configuration
 * Setup for error tracking, health checks, and alerting
 */

const monitoringConfig = {
  // Error Tracking (Sentry)
  sentry: {
    enabled: true,
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    tracesSampleRate: 0.1,
    integrations: [
      'OnUncaughtExceptionIntegration',
      'OnUnhandledRejectionIntegration'
    ],
    beforeSend: (event) => {
      // Filter out certain errors
      if (event.exception) {
        const error = event.exception.values[0];
        if (error.type === 'NetworkError') {
          return null; // Don't send network errors
        }
      }
      return event;
    }
  },

  // Uptime Monitoring (Pingdom)
  uptime: {
    enabled: true,
    provider: 'pingdom',
    apiToken: process.env.PINGDOM_API_TOKEN,
    checks: [
      {
        name: 'RTech Solutions Homepage',
        url: 'https://www.rTechLearners.com',
        type: 'http',
        interval: 60,
        timeout: 10
      },
      {
        name: 'RTech Solutions API',
        url: 'https://api.rTechLearners.com/health',
        type: 'http',
        interval: 60,
        timeout: 10
      }
    ]
  },

  // Health Checks
  healthCheck: {
    enabled: true,
    endpoint: '/health',
    interval: 60000, // 1 minute
    timeout: 10000,
    checks: {
      database: true,
      redis: true,
      cdn: true,
      emailService: true,
      paymentGateway: true
    }
  },

  // Performance Monitoring
  performance: {
    enabled: true,
    tracingEnabled: true,
    samplingRate: 0.1,
    thresholds: {
      pageLoadTime: 3000, // milliseconds
      apiResponseTime: 1000, // milliseconds
      databaseQueryTime: 500 // milliseconds
    }
  },

  // Log Aggregation (ELK Stack or similar)
  logging: {
    enabled: true,
    service: 'elasticsearch',
    host: process.env.ELASTICSEARCH_HOST,
    port: 9200,
    index: 'rtech-solutions-logs',
    levels: ['error', 'warn', 'info'],
    retention: 30 // days
  },

  // Alerting Rules
  alerts: {
    enabled: true,
    channels: {
      email: {
        enabled: true,
        recipients: [process.env.ALERT_EMAIL]
      },
      slack: {
        enabled: true,
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channels: ['#alerts', '#errors']
      },
      sms: {
        enabled: false,
        provider: 'twilio',
        recipients: []
      }
    },
    rules: [
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        condition: 'error_rate > 5%',
        severity: 'critical',
        actions: ['email', 'slack']
      },
      {
        id: 'api_downtime',
        name: 'API Downtime',
        condition: 'api_status === offline',
        severity: 'critical',
        actions: ['email', 'slack', 'sms']
      },
      {
        id: 'high_latency',
        name: 'High Latency',
        condition: 'response_time > 5000ms',
        severity: 'warning',
        actions: ['slack']
      },
      {
        id: 'database_connection_error',
        name: 'Database Connection Error',
        condition: 'db_connection_failed',
        severity: 'critical',
        actions: ['email', 'slack']
      },
      {
        id: 'payment_gateway_error',
        name: 'Payment Gateway Error',
        condition: 'payment_service_down',
        severity: 'critical',
        actions: ['email', 'slack']
      },
      {
        id: 'high_cpu_usage',
        name: 'High CPU Usage',
        condition: 'cpu_usage > 80%',
        severity: 'warning',
        actions: ['slack']
      },
      {
        id: 'high_memory_usage',
        name: 'High Memory Usage',
        condition: 'memory_usage > 85%',
        severity: 'warning',
        actions: ['slack']
      },
      {
        id: 'ssl_certificate_expiring',
        name: 'SSL Certificate Expiring Soon',
        condition: 'cert_expiry_days < 30',
        severity: 'warning',
        actions: ['email', 'slack']
      }
    ]
  },

  // Backup Monitoring
  backup: {
    enabled: true,
    schedule: '0 2 * * *', // Daily at 2 AM
    retention: {
      daily: 7,
      weekly: 4,
      monthly: 12
    },
    targets: [
      {
        name: 'Database',
        type: 'mongodb',
        destination: 's3://rtech-backups/database'
      },
      {
        name: 'Files',
        type: 'filesystem',
        destination: 's3://rtech-backups/files'
      }
    ]
  },

  // Incident Management
  incidents: {
    enabled: true,
    provider: 'pagerduty',
    apiKey: process.env.PAGERDUTY_API_KEY,
    escalationPolicy: process.env.PAGERDUTY_ESCALATION_POLICY
  },

  // Metrics Collection
  metrics: {
    enabled: true,
    provider: 'prometheus',
    scrapeInterval: 15,
    retentionTime: '15d',
    exporters: [
      'node_exporter',
      'nginx_exporter',
      'mongodb_exporter',
      'redis_exporter'
    ]
  }
};

module.exports = monitoringConfig;
