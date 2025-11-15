/**
 * Monitoring Configuration - Health Checks, Error Tracking, Alerting
 * 
 * Environment Variables:
 * - MONITORING_ENABLED: true | false (default: true)
 * - SENTRY_DSN: Sentry error tracking DSN (optional)
 * - SENTRY_ENVIRONMENT: Environment name (default: development)
 * - SENTRY_TRACES_SAMPLE_RATE: Traces sampling rate (default: 0.1)
 * - LOG_LEVEL: debug | info | warn | error (default: info)
 * - LOG_FILE: Path to log file (optional)
 * - HEALTH_CHECK_INTERVAL: Health check interval in ms (default: 60000)
 */

const fs = require('fs');
const path = require('path');

// ===== LOGGER CLASS =====

class Logger {
  constructor(logFile = process.env.LOG_FILE) {
    this.logFile = logFile;
    this.level = process.env.LOG_LEVEL || 'info';
    this.levels = { debug: 0, info: 1, warn: 2, error: 3 };

    if (logFile) {
      const logDir = path.dirname(logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }
  }

  /**
   * Log message
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} metadata - Optional metadata
   */
  log(level, message, metadata = {}) {
    if (this.levels[level] < this.levels[this.level]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...metadata,
    };

    const logString = JSON.stringify(logEntry);

    // Console output
    console[level](logString);

    // File output
    if (this.logFile) {
      fs.appendFileSync(this.logFile, logString + '\n');
    }
  }

  debug(message, metadata) {
    this.log('debug', message, metadata);
  }

  info(message, metadata) {
    this.log('info', message, metadata);
  }

  warn(message, metadata) {
    this.log('warn', message, metadata);
  }

  error(message, metadata) {
    this.log('error', message, metadata);
  }
}

// ===== HEALTH CHECKER CLASS =====

class HealthChecker {
  constructor(logger) {
    this.logger = logger;
    this.checks = new Map();
    this.interval = parseInt(process.env.HEALTH_CHECK_INTERVAL) || 60000;
    this.lastCheck = null;
    this.status = 'unknown';
  }

  /**
   * Register health check
   * @param {string} name - Check name
   * @param {Function} checkFn - Async check function
   */
  registerCheck(name, checkFn) {
    this.checks.set(name, checkFn);
    this.logger.info(`Health check registered: ${name}`);
  }

  /**
   * Perform all health checks
   * @returns {Promise<Object>}
   */
  async performChecks() {
    const results = {};
    let allHealthy = true;

    for (const [name, checkFn] of this.checks) {
      try {
        const startTime = Date.now();
        const result = await checkFn();
        const duration = Date.now() - startTime;

        results[name] = {
          status: result ? 'healthy' : 'unhealthy',
          duration,
          timestamp: new Date().toISOString(),
        };

        if (!result) {
          allHealthy = false;
        }
      } catch (error) {
        allHealthy = false;
        results[name] = {
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString(),
        };
      }
    }

    this.lastCheck = results;
    this.status = allHealthy ? 'healthy' : 'degraded';

    return {
      overall: this.status,
      checks: results,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get current health status
   * @returns {Object}
   */
  getStatus() {
    return {
      status: this.status,
      lastCheck: this.lastCheck,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Start periodic health checks
   */
  startPeriodicChecks() {
    setInterval(async () => {
      const results = await this.performChecks();
      this.logger.info('Health check completed', { status: results.overall });
    }, this.interval);

    this.logger.info(`Periodic health checks started (interval: ${this.interval}ms)`);
  }
}

// ===== METRICS COLLECTOR =====

class MetricsCollector {
  constructor(logger) {
    this.logger = logger;
    this.metrics = {
      requests: { total: 0, byMethod: {}, byStatus: {} },
      errors: { total: 0, byType: {} },
      performance: { avgResponseTime: 0, p95: 0, p99: 0 },
      uptime: process.uptime(),
    };
    this.responseTimes = [];
  }

  /**
   * Record request
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {number} duration - Request duration
   */
  recordRequest(req, res, duration) {
    this.metrics.requests.total++;

    // Track by method
    const method = req.method;
    this.metrics.requests.byMethod[method] = (this.metrics.requests.byMethod[method] || 0) + 1;

    // Track by status
    const status = res.statusCode;
    this.metrics.requests.byStatus[status] = (this.metrics.requests.byStatus[status] || 0) + 1;

    // Track response times
    this.responseTimes.push(duration);
    if (this.responseTimes.length > 10000) {
      this.responseTimes.shift();
    }

    // Calculate percentiles
    this.calculatePercentiles();
  }

  /**
   * Record error
   * @param {string} type - Error type
   * @param {Error} error - Error object
   */
  recordError(type, error) {
    this.metrics.errors.total++;
    this.metrics.errors.byType[type] = (this.metrics.errors.byType[type] || 0) + 1;

    this.logger.error(`Error recorded: ${type}`, {
      error: error.message,
      stack: error.stack,
    });
  }

  /**
   * Calculate response time percentiles
   */
  calculatePercentiles() {
    if (this.responseTimes.length === 0) return;

    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const length = sorted.length;

    this.metrics.performance.avgResponseTime =
      this.responseTimes.reduce((a, b) => a + b) / length;
    this.metrics.performance.p95 = sorted[Math.floor(length * 0.95)];
    this.metrics.performance.p99 = sorted[Math.floor(length * 0.99)];
  }

  /**
   * Get metrics
   * @returns {Object}
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      requests: { total: 0, byMethod: {}, byStatus: {} },
      errors: { total: 0, byType: {} },
      performance: { avgResponseTime: 0, p95: 0, p99: 0 },
      uptime: process.uptime(),
    };
    this.responseTimes = [];
  }
}

// ===== ERROR TRACKING (Sentry Integration) =====

class ErrorTracker {
  constructor(logger) {
    this.logger = logger;
    this.sentry = null;
    this.initialized = false;
  }

  /**
   * Initialize Sentry
   */
  async initialize() {
    try {
      const sentryDsn = process.env.SENTRY_DSN;

      if (!sentryDsn) {
        this.logger.info('Sentry DSN not configured, error tracking disabled');
        return;
      }

      const Sentry = require('@sentry/node');

      Sentry.init({
        dsn: sentryDsn,
        environment: process.env.SENTRY_ENVIRONMENT || 'development',
        tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,
        integrations: [new Sentry.Integrations.Http({ tracing: true })],
      });

      this.sentry = Sentry;
      this.initialized = true;
      this.logger.info('Error tracking initialized (Sentry)');
    } catch (error) {
      this.logger.error('Failed to initialize error tracking', { error: error.message });
    }
  }

  /**
   * Capture exception
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   */
  captureException(error, context = {}) {
    if (this.sentry) {
      this.sentry.captureException(error, { contexts: { custom: context } });
    }

    this.logger.error('Exception captured', { error: error.message, context });
  }

  /**
   * Capture message
   * @param {string} message - Message
   * @param {string} level - Log level
   */
  captureMessage(message, level = 'info') {
    if (this.sentry) {
      this.sentry.captureMessage(message, level);
    }

    this.logger.log(level, `Message captured: ${message}`);
  }

  /**
   * Get Sentry middleware
   * @returns {Function}
   */
  getMiddleware() {
    if (!this.sentry) {
      return (req, res, next) => next();
    }

    return {
      requestHandler: this.sentry.Handlers.requestHandler(),
      errorHandler: this.sentry.Handlers.errorHandler(),
    };
  }
}

// ===== MONITORING MIDDLEWARE =====

/**
 * Create monitoring middleware
 * @param {Logger} logger - Logger instance
 * @param {MetricsCollector} metrics - Metrics collector instance
 * @returns {Function}
 */
function createMonitoringMiddleware(logger, metrics) {
  return (req, res, next) => {
    const startTime = Date.now();

    // Intercept res.json
    const originalJson = res.json;
    res.json = function (body) {
      const duration = Date.now() - startTime;
      metrics.recordRequest(req, res, duration);

      logger.info(`${req.method} ${req.path}`, {
        status: res.statusCode,
        duration,
        path: req.path,
      });

      return originalJson.call(this, body);
    };

    // Handle errors
    res.on('error', (error) => {
      metrics.recordError(error.name || 'Unknown', error);
    });

    next();
  };
}

// ===== EXPORTS =====

module.exports = {
  Logger,
  HealthChecker,
  MetricsCollector,
  ErrorTracker,
  createMonitoringMiddleware,
};
