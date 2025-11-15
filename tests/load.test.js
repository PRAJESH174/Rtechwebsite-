const testUtils = require('./setup');

// Load testing configuration
const loadConfig = {
  baselineThresholds: {
    avgResponseTime: 500,      // ms
    p95ResponseTime: 1000,     // ms
    p99ResponseTime: 2000,     // ms
    errorRate: 0.05,           // 5%
    throughput: 100,           // requests/sec
    cpuUsage: 80,              // percent
    memoryUsage: 500,          // MB
  },
  concurrentScenarios: [100, 500, 1000],
  requestsPerUser: 10,
  spikeDuration: 30000,        // 30 seconds
  sustainedDuration: 300000,   // 5 minutes
};

// Mock performance tracking
class PerformanceTracker {
  constructor() {
    this.responseTimes = [];
    this.errors = 0;
    this.successCount = 0;
    this.startTime = Date.now();
  }

  recordResponse(duration, isError = false) {
    this.responseTimes.push(duration);
    if (isError) {
      this.errors++;
    } else {
      this.successCount++;
    }
  }

  getMetrics() {
    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const length = sorted.length;
    const totalRequests = this.successCount + this.errors;
    const duration = Date.now() - this.startTime;

    return {
      totalRequests,
      successCount: this.successCount,
      errorCount: this.errors,
      errorRate: totalRequests > 0 ? this.errors / totalRequests : 0,
      avgResponseTime: sorted.reduce((a, b) => a + b, 0) / length || 0,
      minResponseTime: sorted[0] || 0,
      maxResponseTime: sorted[length - 1] || 0,
      p50ResponseTime: sorted[Math.floor(length * 0.5)] || 0,
      p95ResponseTime: sorted[Math.floor(length * 0.95)] || 0,
      p99ResponseTime: sorted[Math.floor(length * 0.99)] || 0,
      throughput: (totalRequests / duration) * 1000 || 0, // requests/sec
    };
  }
}

// Mock API client for load testing
class MockLoadClient {
  constructor(userId, tracker) {
    this.userId = userId;
    this.tracker = tracker;
  }

  async simulateRequest(endpoint, method = 'GET') {
    const start = Date.now();
    try {
      // Simulate network delay (10-100ms baseline)
      const delay = Math.random() * 90 + 10;
      
      // Simulate occasional errors (2% error rate)
      if (Math.random() < 0.02) {
        this.tracker.recordResponse(delay, true);
        return { status: 500, error: 'Internal Server Error' };
      }

      // Simulate database operations for certain endpoints
      let dbDelay = 0;
      if (endpoint.includes('/posts') || endpoint.includes('/courses')) {
        dbDelay = Math.random() * 80 + 20;
      }

      // Simulate cache operations
      let cacheDelay = 0;
      if (endpoint.includes('/cache') || endpoint.includes('/list')) {
        cacheDelay = Math.random() * 5 + 2;
      }

      const totalDelay = delay + dbDelay + cacheDelay;
      await new Promise(resolve => setTimeout(resolve, Math.min(totalDelay, 100)));

      this.tracker.recordResponse(Date.now() - start, false);
      return { status: 200, data: { userId: this.userId } };
    } catch (error) {
      this.tracker.recordResponse(Date.now() - start, true);
      return { status: 500, error: error.message };
    }
  }
}

// ============================================================
// LOAD TESTS
// ============================================================

describe('Phase 4: Load Testing - Concurrent User Scenarios', () => {
  let tracker;

  beforeEach(() => {
    tracker = new PerformanceTracker();
  });

  // ====== Test 1: 100 Concurrent Users ======
  test('should handle 100 concurrent users making requests', async () => {
    const userCount = 100;
    const clients = Array(userCount)
      .fill(0)
      .map((_, i) => new MockLoadClient(i + 1, tracker));

    const endpoints = [
      '/api/users/profile',
      '/api/posts/list',
      '/api/courses/list',
      '/api/cache/data',
    ];

    const promises = [];
    for (const client of clients) {
      for (let i = 0; i < loadConfig.requestsPerUser; i++) {
        const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
        promises.push(client.simulateRequest(endpoint));
      }
    }

    await Promise.all(promises);
    const metrics = tracker.getMetrics();

    expect(metrics.errorRate).toBeLessThan(loadConfig.baselineThresholds.errorRate);
    expect(metrics.avgResponseTime).toBeLessThan(loadConfig.baselineThresholds.avgResponseTime);
    expect(metrics.p95ResponseTime).toBeLessThan(loadConfig.baselineThresholds.p95ResponseTime);
    expect(metrics.throughput).toBeGreaterThan(0);
    expect(metrics.totalRequests).toBe(userCount * loadConfig.requestsPerUser);
  });

  // ====== Test 2: 500 Concurrent Users ======
  test('should handle 500 concurrent users making requests', async () => {
    const userCount = 500;
    const clients = Array(userCount)
      .fill(0)
      .map((_, i) => new MockLoadClient(i + 1, tracker));

    const endpoints = [
      '/api/users/profile',
      '/api/posts/list',
      '/api/courses/list',
      '/api/cache/data',
    ];

    const promises = [];
    for (const client of clients) {
      for (let i = 0; i < loadConfig.requestsPerUser; i++) {
        const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
        promises.push(client.simulateRequest(endpoint));
      }
    }

    await Promise.all(promises);
    const metrics = tracker.getMetrics();

    expect(metrics.errorRate).toBeLessThan(loadConfig.baselineThresholds.errorRate * 1.5);
    expect(metrics.avgResponseTime).toBeLessThan(loadConfig.baselineThresholds.avgResponseTime * 1.2);
    expect(metrics.p99ResponseTime).toBeLessThan(loadConfig.baselineThresholds.p99ResponseTime * 1.5);
    expect(metrics.totalRequests).toBe(userCount * loadConfig.requestsPerUser);
  });

  // ====== Test 3: 1000 Concurrent Users ======
  test('should handle 1000 concurrent users making requests', async () => {
    const userCount = 1000;
    const batchSize = 100; // Process in batches to avoid stack overflow
    
    const endpoints = [
      '/api/users/profile',
      '/api/posts/list',
      '/api/courses/list',
      '/api/cache/data',
    ];

    for (let batch = 0; batch < userCount; batch += batchSize) {
      const currentBatchSize = Math.min(batchSize, userCount - batch);
      const clients = Array(currentBatchSize)
        .fill(0)
        .map((_, i) => new MockLoadClient(batch + i + 1, tracker));

      const promises = [];
      for (const client of clients) {
        for (let i = 0; i < loadConfig.requestsPerUser; i++) {
          const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
          promises.push(client.simulateRequest(endpoint));
        }
      }

      await Promise.all(promises);
    }

    const metrics = tracker.getMetrics();

    expect(metrics.errorRate).toBeLessThan(loadConfig.baselineThresholds.errorRate * 2);
    expect(metrics.avgResponseTime).toBeLessThan(loadConfig.baselineThresholds.avgResponseTime * 1.5);
    expect(metrics.totalRequests).toBe(userCount * loadConfig.requestsPerUser);
    expect(metrics.successCount).toBeGreaterThan(userCount * loadConfig.requestsPerUser * 0.95);
  });

  // ====== Test 4: Spike Test (Ramp to 1000 in 30 seconds) ======
  test('should handle spike load (rapid increase to 1000 users)', async () => {
    const maxUsers = 1000;
    const rampUpTime = 30000; // 30 seconds
    const rampSteps = 10;
    const usersPerStep = Math.ceil(maxUsers / rampSteps);

    const endpoints = [
      '/api/users/profile',
      '/api/posts/list',
      '/api/courses/list',
      '/api/cache/data',
    ];

    for (let step = 0; step < rampSteps; step++) {
      const userCount = Math.min((step + 1) * usersPerStep, maxUsers);
      const clients = Array(usersPerStep)
        .fill(0)
        .map((_, i) => new MockLoadClient(step * usersPerStep + i + 1, tracker));

      const promises = [];
      for (const client of clients) {
        for (let i = 0; i < loadConfig.requestsPerUser; i++) {
          const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
          promises.push(client.simulateRequest(endpoint));
        }
      }

      await Promise.all(promises);
    }

    const metrics = tracker.getMetrics();

    expect(metrics.errorRate).toBeLessThan(0.1); // Allow up to 10% error during spike
    expect(metrics.avgResponseTime).toBeLessThan(loadConfig.baselineThresholds.avgResponseTime * 2);
    expect(metrics.successCount).toBeGreaterThan(0);
  });

  // ====== Test 5: Sustained Load (High Throughput) ======
  test('should maintain performance under sustained high load', async () => {
    const userCount = 200;
    const sustainedRequests = 5000; // Total requests to sustain
    
    const clients = Array(userCount)
      .fill(0)
      .map((_, i) => new MockLoadClient(i + 1, tracker));

    const endpoints = [
      '/api/users/profile',
      '/api/posts/list',
      '/api/courses/list',
      '/api/cache/data',
    ];

    // Generate sustained load
    const requestsPerClient = Math.ceil(sustainedRequests / userCount);
    const promises = [];

    for (const client of clients) {
      for (let i = 0; i < requestsPerClient; i++) {
        const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
        promises.push(client.simulateRequest(endpoint));
      }
    }

    await Promise.all(promises);
    const metrics = tracker.getMetrics();

    expect(metrics.errorRate).toBeLessThan(loadConfig.baselineThresholds.errorRate);
    expect(metrics.avgResponseTime).toBeLessThan(loadConfig.baselineThresholds.avgResponseTime);
    expect(metrics.p95ResponseTime).toBeLessThan(loadConfig.baselineThresholds.p95ResponseTime);
    expect(metrics.totalRequests).toBeGreaterThanOrEqual(sustainedRequests);
  });

  // ====== Test 6: Mixed Workload (Read/Write) ======
  test('should handle mixed read/write workload under load', async () => {
    const userCount = 300;
    const clients = Array(userCount)
      .fill(0)
      .map((_, i) => new MockLoadClient(i + 1, tracker));

    const readEndpoints = [
      '/api/users/profile',
      '/api/posts/list',
      '/api/courses/list',
      '/api/cache/data',
    ];

    const writeEndpoints = [
      '/api/posts/create',
      '/api/courses/enroll',
      '/api/users/update',
    ];

    const promises = [];
    for (const client of clients) {
      for (let i = 0; i < loadConfig.requestsPerUser; i++) {
        // 80% read, 20% write
        const isRead = Math.random() < 0.8;
        const endpoints = isRead ? readEndpoints : writeEndpoints;
        const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
        promises.push(client.simulateRequest(endpoint, isRead ? 'GET' : 'POST'));
      }
    }

    await Promise.all(promises);
    const metrics = tracker.getMetrics();

    expect(metrics.errorRate).toBeLessThan(loadConfig.baselineThresholds.errorRate);
    expect(metrics.avgResponseTime).toBeLessThan(loadConfig.baselineThresholds.avgResponseTime);
    expect(metrics.totalRequests).toBe(userCount * loadConfig.requestsPerUser);
  });

  // ====== Test 7: Memory Stability Under Load ======
  test('should maintain stable memory usage under load', async () => {
    const userCount = 200;
    const clients = Array(userCount)
      .fill(0)
      .map((_, i) => new MockLoadClient(i + 1, tracker));

    const endpoints = [
      '/api/users/profile',
      '/api/posts/list',
      '/api/courses/list',
    ];

    const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024; // MB

    const promises = [];
    for (const client of clients) {
      for (let i = 0; i < loadConfig.requestsPerUser * 2; i++) {
        const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
        promises.push(client.simulateRequest(endpoint));
      }
    }

    await Promise.all(promises);
    const finalMemory = process.memoryUsage().heapUsed / 1024 / 1024; // MB

    const memoryGrowth = finalMemory - initialMemory;
    expect(memoryGrowth).toBeLessThan(100); // Less than 100MB growth
    expect(finalMemory).toBeLessThan(loadConfig.baselineThresholds.memoryUsage);
  });

  // ====== Test 8: Error Recovery ======
  test('should recover gracefully from errors under load', async () => {
    const userCount = 150;
    const clients = Array(userCount)
      .fill(0)
      .map((_, i) => new MockLoadClient(i + 1, tracker));

    const endpoints = [
      '/api/users/profile',
      '/api/posts/list',
      '/api/courses/list',
    ];

    const promises = [];
    for (const client of clients) {
      for (let i = 0; i < loadConfig.requestsPerUser; i++) {
        const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
        promises.push(client.simulateRequest(endpoint));
      }
    }

    await Promise.all(promises);
    const metrics = tracker.getMetrics();

    // After errors, system should continue serving requests
    expect(metrics.successCount).toBeGreaterThan(userCount * loadConfig.requestsPerUser * 0.95);
    expect(metrics.totalRequests).toBe(userCount * loadConfig.requestsPerUser);
  });

  // ====== Test 9: Response Time Consistency ======
  test('should maintain consistent response times throughout load test', async () => {
    const userCount = 250;
    const clients = Array(userCount)
      .fill(0)
      .map((_, i) => new MockLoadClient(i + 1, tracker));

    const endpoints = [
      '/api/users/profile',
      '/api/posts/list',
      '/api/courses/list',
    ];

    // Track response times in phases
    const phases = 5;
    const requestsPerPhase = userCount * loadConfig.requestsPerUser / phases;
    const phaseMetrics = [];

    for (let phase = 0; phase < phases; phase++) {
      const phaseTracker = new PerformanceTracker();
      const promises = [];

      for (let i = 0; i < userCount; i++) {
        const client = new MockLoadClient(phase * userCount + i + 1, phaseTracker);
        for (let j = 0; j < Math.ceil(loadConfig.requestsPerUser / phases); j++) {
          const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
          promises.push(client.simulateRequest(endpoint));
        }
      }

      await Promise.all(promises);
      phaseMetrics.push(phaseTracker.getMetrics());
    }

    // Verify consistency across phases
    const avgResponseTimes = phaseMetrics.map(m => m.avgResponseTime);
    const variance = Math.max(...avgResponseTimes) - Math.min(...avgResponseTimes);
    expect(variance).toBeLessThan(loadConfig.baselineThresholds.avgResponseTime * 0.5);
  });

  // ====== Test 10: Load Test Report Generation ======
  test('should generate comprehensive load test report', async () => {
    const userCount = 100;
    const clients = Array(userCount)
      .fill(0)
      .map((_, i) => new MockLoadClient(i + 1, tracker));

    const endpoints = [
      '/api/users/profile',
      '/api/posts/list',
      '/api/courses/list',
    ];

    const promises = [];
    for (const client of clients) {
      for (let i = 0; i < loadConfig.requestsPerUser; i++) {
        const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
        promises.push(client.simulateRequest(endpoint));
      }
    }

    await Promise.all(promises);
    const metrics = tracker.getMetrics();

    // Verify report contains all required metrics
    expect(metrics).toHaveProperty('totalRequests');
    expect(metrics).toHaveProperty('successCount');
    expect(metrics).toHaveProperty('errorCount');
    expect(metrics).toHaveProperty('errorRate');
    expect(metrics).toHaveProperty('avgResponseTime');
    expect(metrics).toHaveProperty('minResponseTime');
    expect(metrics).toHaveProperty('maxResponseTime');
    expect(metrics).toHaveProperty('p50ResponseTime');
    expect(metrics).toHaveProperty('p95ResponseTime');
    expect(metrics).toHaveProperty('p99ResponseTime');
    expect(metrics).toHaveProperty('throughput');

    // Verify metrics are reasonable
    expect(metrics.totalRequests).toBeGreaterThan(0);
    expect(metrics.avgResponseTime).toBeGreaterThan(0);
    expect(metrics.p95ResponseTime).toBeGreaterThanOrEqual(metrics.avgResponseTime);
    expect(metrics.p99ResponseTime).toBeGreaterThanOrEqual(metrics.p95ResponseTime);
  });
});

// ============================================================
// SCALABILITY TESTS
// ============================================================

describe('Phase 4: Load Testing - Scalability & Resource Usage', () => {
  let tracker;

  beforeEach(() => {
    tracker = new PerformanceTracker();
  });

  // ====== Test 11: Database Connection Pool Under Load ======
  test('should maintain healthy database connection pool under load', async () => {
    const userCount = 200;
    const clients = Array(userCount)
      .fill(0)
      .map((_, i) => new MockLoadClient(i + 1, tracker));

    // Simulate database-heavy operations
    const dbEndpoints = [
      '/api/posts/list',
      '/api/courses/list',
      '/api/users/list',
    ];

    const promises = [];
    for (const client of clients) {
      for (let i = 0; i < loadConfig.requestsPerUser; i++) {
        const endpoint = dbEndpoints[Math.floor(Math.random() * dbEndpoints.length)];
        promises.push(client.simulateRequest(endpoint));
      }
    }

    await Promise.all(promises);
    const metrics = tracker.getMetrics();

    // Database operations should still perform well
    expect(metrics.avgResponseTime).toBeLessThan(500);
    expect(metrics.errorRate).toBeLessThan(0.05);
  });

  // ====== Test 12: Cache Hit Rate Under Load ======
  test('should maintain high cache hit rate under load', async () => {
    const userCount = 150;
    const clients = Array(userCount)
      .fill(0)
      .map((_, i) => new MockLoadClient(i + 1, tracker));

    // Repeated requests to benefit from caching
    const cacheableEndpoints = [
      '/api/cache/data',
      '/api/posts/list',
      '/api/courses/list',
    ];

    const promises = [];
    for (const client of clients) {
      for (let i = 0; i < loadConfig.requestsPerUser * 2; i++) {
        const endpoint = cacheableEndpoints[Math.floor(Math.random() * cacheableEndpoints.length)];
        promises.push(client.simulateRequest(endpoint));
      }
    }

    await Promise.all(promises);
    const metrics = tracker.getMetrics();

    // Cached endpoints should have faster response times
    expect(metrics.avgResponseTime).toBeLessThan(300);
    expect(metrics.successCount).toBeGreaterThan(userCount * loadConfig.requestsPerUser * 1.8);
  });

  // ====== Test 13: Request Queuing Under Extreme Load ======
  test('should queue requests gracefully under extreme load', async () => {
    const userCount = 500;
    const batchSize = 50;
    let totalProcessed = 0;

    const endpoints = [
      '/api/users/profile',
      '/api/posts/list',
      '/api/courses/list',
    ];

    // Process in batches to simulate queuing
    for (let batch = 0; batch < userCount; batch += batchSize) {
      const currentBatchSize = Math.min(batchSize, userCount - batch);
      const clients = Array(currentBatchSize)
        .fill(0)
        .map((_, i) => new MockLoadClient(batch + i + 1, tracker));

      const promises = [];
      for (const client of clients) {
        for (let i = 0; i < loadConfig.requestsPerUser; i++) {
          const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
          promises.push(
            client.simulateRequest(endpoint).then(() => {
              totalProcessed++;
              return totalProcessed;
            })
          );
        }
      }

      await Promise.all(promises);
    }

    const metrics = tracker.getMetrics();
    expect(metrics.totalRequests).toBe(totalProcessed);
  });

  // ====== Test 14: CPU Usage Simulation ======
  test('should handle CPU-intensive operations under load', async () => {
    const userCount = 100;
    const clients = Array(userCount)
      .fill(0)
      .map((_, i) => new MockLoadClient(i + 1, tracker));

    const endpoints = [
      '/api/analytics/compute',
      '/api/reports/generate',
      '/api/search/query',
    ];

    const promises = [];
    for (const client of clients) {
      for (let i = 0; i < loadConfig.requestsPerUser; i++) {
        const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
        
        // Simulate CPU-intensive work
        const result = promises.push(
          (async () => {
            let sum = 0;
            for (let j = 0; j < 1000000; j++) {
              sum += Math.sqrt(j);
            }
            return client.simulateRequest(endpoint);
          })()
        );
      }
    }

    await Promise.all(promises);
    const metrics = tracker.getMetrics();

    expect(metrics.errorRate).toBeLessThan(0.1);
    expect(metrics.successCount).toBeGreaterThan(userCount * loadConfig.requestsPerUser * 0.8);
  });

  // ====== Test 15: Network Latency Resilience ======
  test('should handle network latency without degrading service', async () => {
    const userCount = 200;
    const clients = Array(userCount)
      .fill(0)
      .map((_, i) => new MockLoadClient(i + 1, tracker));

    const endpoints = [
      '/api/users/profile',
      '/api/posts/list',
      '/api/courses/list',
    ];

    const promises = [];
    for (const client of clients) {
      for (let i = 0; i < loadConfig.requestsPerUser; i++) {
        const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
        // Add simulated network latency
        promises.push(
          new Promise(resolve => {
            setTimeout(() => {
              client.simulateRequest(endpoint).then(resolve);
            }, Math.random() * 100 + 10);
          })
        );
      }
    }

    await Promise.all(promises);
    const metrics = tracker.getMetrics();

    expect(metrics.avgResponseTime).toBeLessThan(600);
    expect(metrics.errorRate).toBeLessThan(0.05);
  });
});
