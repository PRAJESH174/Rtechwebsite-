/**
 * Redis Caching Configuration
 * Handles session storage, API response caching, and real-time updates
 * 
 * Environment Variables:
 * - REDIS_HOST: Redis server host (default: localhost)
 * - REDIS_PORT: Redis server port (default: 6379)
 * - REDIS_PASSWORD: Redis password (optional)
 * - REDIS_DB: Redis database number (default: 0)
 * - CACHE_TTL: Cache time-to-live in seconds (default: 3600)
 */

const redis = require('redis');

// Configuration
const config = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB) || 0,
  cacheTTL: parseInt(process.env.CACHE_TTL) || 3600, // 1 hour default
};

// Cache key prefixes
const CACHE_KEYS = {
  USERS: 'users:',
  POSTS: 'posts:',
  VIDEOS: 'videos:',
  COURSES: 'courses:',
  SESSIONS: 'sessions:',
  API_RESPONSES: 'api:',
  ANALYTICS: 'analytics:',
};

// ===== REDIS CLIENT =====

class RedisCache {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscribe = null;
  }

  /**
   * Connect to Redis
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      console.log('🔄 Connecting to Redis...');
      console.log(`📍 Host: ${config.host}:${config.port}`);

      // Create client with redis v4+ API
      this.client = redis.createClient({
        socket: {
          host: config.host,
          port: config.port,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              return new Error('❌ Redis connection retry timeout');
            }
            return Math.min(retries * 100, 3000);
          },
        },
        database: config.db,
        password: config.password || undefined,
      });

      // Event handlers
      this.client.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.connected = true;
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis error:', err.message);
        this.connected = false;
      });

      this.client.on('ready', () => {
        console.log('✅ Redis ready for commands');
      });

      // Connect using async API
      await this.client.connect();
      console.log('✅ Redis connected successfully');
      this.connected = true;
    } catch (error) {
      console.error('❌ Redis connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
      this.connected = false;
      console.log('✅ Redis disconnected');
    }
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>}
   */
  async get(key) {
    try {
      const data = await this.client.get(key);
      if (data) {
        try {
          return JSON.parse(data);
        } catch {
          return data;
        }
      }
      return null;
    } catch (error) {
      console.error('Cache get error:', error.message);
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (optional)
   * @returns {Promise<void>}
   */
  async set(key, value, ttl = config.cacheTTL) {
    try {
      const data = typeof value === 'string' ? value : JSON.stringify(value);
      await this.client.setEx(key, ttl, data);
    } catch (error) {
      console.error('Cache set error:', error.message);
    }
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   * @returns {Promise<void>}
   */
  async delete(key) {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Cache delete error:', error.message);
    }
  }

  /**
   * Delete multiple keys
   * @param {Array<string>} keys - Array of cache keys
   * @returns {Promise<void>}
   */
  async deleteMultiple(keys) {
    try {
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error('Cache deleteMultiple error:', error.message);
    }
  }

  /**
   * Clear cache by pattern
   * @param {string} pattern - Key pattern (e.g., "posts:*")
   * @returns {Promise<number>}
   */
  async clearPattern(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      const count = await this.client.del(keys);
      return count;
    } catch (error) {
      console.error('Cache clearPattern error:', error.message);
      return 0;
    }
  }

  /**
   * Increment counter
   * @param {string} key - Cache key
   * @param {number} increment - Value to increment (default: 1)
   * @returns {Promise<number>}
   */
  async increment(key, increment = 1) {
    try {
      const count = await this.client.incrBy(key, increment);
      return count;
    } catch (error) {
      console.error('Cache increment error:', error.message);
      return 0;
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>}
   */
  async getStats() {
    try {
      const info = await this.client.info('stats');
      return info;
    } catch (error) {
      console.error('Cache getStats error:', error.message);
      return {};
    }
  }

  /**
   * Check Redis health
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      const reply = await this.client.ping();
      return reply === 'PONG';
    } catch (error) {
      console.error('Cache healthCheck error:', error.message);
      return false;
    }
  }
}

// ===== SESSION STORE =====

class SessionStore {
  constructor(redisCache) {
    this.cache = redisCache;
  }

  /**
   * Create session
   * @param {string} sessionId - Session ID
   * @param {Object} sessionData - Session data
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<void>}
   */
  async createSession(sessionId, sessionData, ttl = 86400) {
    // 24 hours default
    await this.cache.set(`${CACHE_KEYS.SESSIONS}${sessionId}`, sessionData, ttl);
  }

  /**
   * Get session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object|null>}
   */
  async getSession(sessionId) {
    return this.cache.get(`${CACHE_KEYS.SESSIONS}${sessionId}`);
  }

  /**
   * Update session
   * @param {string} sessionId - Session ID
   * @param {Object} sessionData - Updated session data
   * @returns {Promise<void>}
   */
  async updateSession(sessionId, sessionData) {
    await this.cache.set(`${CACHE_KEYS.SESSIONS}${sessionId}`, sessionData, 86400);
  }

  /**
   * Destroy session
   * @param {string} sessionId - Session ID
   * @returns {Promise<void>}
   */
  async destroySession(sessionId) {
    await this.cache.delete(`${CACHE_KEYS.SESSIONS}${sessionId}`);
  }
}

// ===== CACHE HELPERS =====

/**
 * Cache decorator for functions
 * @param {string} keyPrefix - Cache key prefix
 * @param {number} ttl - Time to live
 * @returns {Function}
 */
function cacheDecorator(cache, keyPrefix, ttl = config.cacheTTL) {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`;

      // Try to get from cache
      const cached = await cache.get(cacheKey);
      if (cached !== null) {
        console.log(`✅ Cache hit: ${cacheKey}`);
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Store in cache
      await cache.set(cacheKey, result, ttl);
      console.log(`✅ Cached: ${cacheKey}`);

      return result;
    };

    return descriptor;
  };
}

/**
 * Middleware for caching API responses
 * @param {RedisCache} cache - Redis cache instance
 * @param {number} ttl - Time to live
 * @returns {Function}
 */
function cacheMiddleware(cache, ttl = config.cacheTTL) {
  return async (req, res, next) => {
    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `${CACHE_KEYS.API_RESPONSES}${req.originalUrl || req.url}`;

    try {
      // Check cache
      const cached = await cache.get(cacheKey);
      if (cached) {
        console.log(`✅ API cache hit: ${req.url}`);
        return res.json(cached);
      }
    } catch (error) {
      console.warn('Cache retrieval error:', error.message);
    }

    // Store original res.json
    const originalJson = res.json.bind(res);

    // Override res.json to cache response
    res.json = (data) => {
      try {
        cache.set(cacheKey, data, ttl).catch((err) => {
          console.warn('Cache write error:', err.message);
        });
      } catch (error) {
        console.warn('Error caching response:', error.message);
      }

      return originalJson(data);
    };

    next();
  };
}

// ===== EXPORTS =====

module.exports = {
  RedisCache,
  SessionStore,
  cacheDecorator,
  cacheMiddleware,
  CACHE_KEYS,
  config,
};
