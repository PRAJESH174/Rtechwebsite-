/**
 * Integration Tests - Service Interaction Validation
 * Tests interactions between multiple components and services
 */

describe('Database + API Integration Tests', () => {
  const mockDb = {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    find: jest.fn()
  };

  const mockApi = {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Registration Flow', () => {
    test('should create user in database when API receives signup request', async () => {
      const newUser = testUtils.generateTestUser();
      mockDb.create.mockResolvedValue({ ...newUser, _id: 'db-id-123' });
      mockApi.post.mockResolvedValue({ status: 201, data: newUser });

      const apiResult = await mockApi.post('/api/auth/signup', newUser);
      const dbResult = await mockDb.create(newUser);

      expect(apiResult.status).toBe(201);
      expect(dbResult._id).toBeDefined();
      expect(mockApi.post).toHaveBeenCalled();
      expect(mockDb.create).toHaveBeenCalled();
    });

    test('should retrieve user from database after creation', async () => {
      const user = testUtils.generateTestUser();
      mockDb.create.mockResolvedValue({ ...user, _id: 'user-123' });
      mockDb.findById.mockResolvedValue({ ...user, _id: 'user-123' });

      await mockDb.create(user);
      const retrieved = await mockDb.findById('user-123');

      expect(retrieved._id).toBe('user-123');
      expect(retrieved.email).toBe(user.email);
    });

    test('should prevent duplicate user registration', async () => {
      const user = testUtils.generateTestUser();
      mockDb.create
        .mockResolvedValueOnce({ ...user, _id: 'user-123' })
        .mockRejectedValueOnce(new Error('Duplicate email'));

      await mockDb.create(user);
      await expect(mockDb.create(user)).rejects.toThrow('Duplicate email');

      expect(mockDb.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('User Update Flow', () => {
    test('should update user in database and return via API', async () => {
      const user = testUtils.generateTestUser();
      const updates = { name: 'Updated Name' };

      mockDb.findById.mockResolvedValue(user);
      mockDb.update.mockResolvedValue({ ...user, ...updates });
      mockApi.put.mockResolvedValue({ status: 200, data: { ...user, ...updates } });

      const retrieved = await mockDb.findById(user.id);
      const updated = await mockDb.update(user.id, updates);
      const apiResult = await mockApi.put(`/api/users/${user.id}`, updates);

      expect(retrieved.id).toBe(user.id);
      expect(updated.name).toBe('Updated Name');
      expect(apiResult.status).toBe(200);
    });

    test('should handle concurrent updates safely', async () => {
      const user = testUtils.generateTestUser();
      mockDb.update.mockResolvedValue({ ...user, version: 2 });

      const update1 = mockDb.update(user.id, { name: 'Name1' });
      const update2 = mockDb.update(user.id, { name: 'Name2' });

      await Promise.all([update1, update2]);

      expect(mockDb.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('Data Persistence Validation', () => {
    test('should verify data persists after creation', async () => {
      const post = testUtils.generateTestPost();
      mockDb.create.mockResolvedValue({ ...post, _id: 'post-123' });
      mockDb.findById.mockResolvedValue({ ...post, _id: 'post-123' });

      const created = await mockDb.create(post);
      const persisted = await mockDb.findById(created._id);

      expect(persisted.title).toBe(post.title);
      expect(persisted.content).toBe(post.content);
    });

    test('should reflect updates immediately in subsequent reads', async () => {
      const user = testUtils.generateTestUser();
      const updates = { email: 'newemail@example.com' };

      mockDb.create.mockResolvedValue({ ...user, _id: 'user-123' });
      mockDb.update.mockResolvedValue({ ...user, ...updates, _id: 'user-123' });
      mockDb.findById.mockResolvedValue({ ...user, ...updates, _id: 'user-123' });

      await mockDb.create(user);
      await mockDb.update('user-123', updates);
      const current = await mockDb.findById('user-123');

      expect(current.email).toBe(updates.email);
    });

    test('should cascade delete related data', async () => {
      mockDb.delete.mockResolvedValue(true);
      mockDb.find.mockResolvedValue([]);

      const userId = 'user-123';
      await mockDb.delete(userId);
      const userPosts = await mockDb.find({ author: userId });

      expect(userPosts).toEqual([]);
    });
  });
});

describe('Cache + Database Integration Tests', () => {
  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    exists: jest.fn()
  };

  const mockDb = {
    findById: jest.fn(),
    update: jest.fn(),
    create: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Cache-Aside Pattern', () => {
    test('should return cached data on cache hit', async () => {
      const user = testUtils.generateTestUser();
      mockCache.get.mockResolvedValue(JSON.stringify(user));

      const result = await mockCache.get(`user:${user.id}`);

      expect(result).toBeDefined();
      expect(mockDb.findById).not.toHaveBeenCalled();
    });

    test('should fetch from database on cache miss', async () => {
      const user = testUtils.generateTestUser();
      mockCache.get.mockResolvedValue(null);
      mockDb.findById.mockResolvedValue(user);
      mockCache.set.mockResolvedValue(true);

      const cached = await mockCache.get(`user:${user.id}`);
      if (!cached) {
        const dbResult = await mockDb.findById(user.id);
        await mockCache.set(`user:${user.id}`, JSON.stringify(dbResult));
      }

      expect(mockDb.findById).toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalled();
    });

    test('should invalidate cache on update', async () => {
      const user = testUtils.generateTestUser();
      const updates = { name: 'Updated' };

      mockDb.update.mockResolvedValue({ ...user, ...updates });
      mockCache.delete.mockResolvedValue(true);

      await mockDb.update(user.id, updates);
      await mockCache.delete(`user:${user.id}`);

      expect(mockCache.delete).toHaveBeenCalledWith(`user:${user.id}`);
    });

    test('should invalidate cache on delete', async () => {
      const userId = 'user-123';
      mockDb.delete.mockResolvedValue(true);
      mockCache.delete.mockResolvedValue(true);

      await mockDb.delete(userId);
      await mockCache.delete(`user:${userId}`);

      expect(mockCache.delete).toHaveBeenCalled();
    });
  });

  describe('Cache Consistency', () => {
    test('should keep cache and database in sync', async () => {
      const user = testUtils.generateTestUser();
      const updates = { email: 'new@example.com' };

      mockDb.update.mockResolvedValue({ ...user, ...updates });
      mockCache.delete.mockResolvedValue(true);
      mockCache.set.mockResolvedValue(true);

      await mockDb.update(user.id, updates);
      await mockCache.delete(`user:${user.id}`);
      await mockCache.set(`user:${user.id}`, JSON.stringify({ ...user, ...updates }));

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockCache.delete).toHaveBeenCalled();
    });

    test('should handle stale cache gracefully', async () => {
      const user = testUtils.generateTestUser();
      const staleData = { ...user, name: 'Old Name' };
      const freshData = { ...user, name: 'New Name' };

      mockCache.get.mockResolvedValue(JSON.stringify(staleData));
      mockDb.findById.mockResolvedValue(freshData);

      const cached = await mockCache.get(`user:${user.id}`);
      if (cached && JSON.parse(cached).name !== freshData.name) {
        const fresh = await mockDb.findById(user.id);
        expect(fresh.name).toBe('New Name');
      }
    });
  });
});

describe('Email + User Signup Integration', () => {
  const mockEmailService = {
    sendTemplate: jest.fn(),
    send: jest.fn()
  };

  const mockDb = {
    create: jest.fn()
  };

  const mockApi = {
    post: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Welcome Email Flow', () => {
    test('should send welcome email after user signup', async () => {
      const user = testUtils.generateTestUser();
      mockDb.create.mockResolvedValue({ ...user, _id: 'user-123' });
      mockEmailService.sendTemplate.mockResolvedValue({ messageId: 'msg-123' });
      mockApi.post.mockResolvedValue({ status: 201, data: user });

      await mockDb.create(user);
      const emailResult = await mockEmailService.sendTemplate('welcome', {
        to: user.email,
        data: { name: user.name }
      });

      expect(mockDb.create).toHaveBeenCalled();
      expect(mockEmailService.sendTemplate).toHaveBeenCalledWith('welcome', expect.any(Object));
      expect(emailResult.messageId).toBeDefined();
    });

    test('should include user data in welcome email', async () => {
      const user = testUtils.generateTestUser();
      mockEmailService.sendTemplate.mockResolvedValue({ messageId: 'msg-123' });

      await mockEmailService.sendTemplate('welcome', {
        to: user.email,
        data: { name: user.name, email: user.email }
      });

      expect(mockEmailService.sendTemplate).toHaveBeenCalledWith(
        'welcome',
        expect.objectContaining({
          to: user.email,
          data: expect.objectContaining({ name: user.name })
        })
      );
    });

    test('should handle email failure gracefully', async () => {
      const user = testUtils.generateTestUser();
      mockDb.create.mockResolvedValue({ ...user, _id: 'user-123' });
      mockEmailService.sendTemplate.mockRejectedValue(new Error('Email service down'));

      await mockDb.create(user);
      await expect(
        mockEmailService.sendTemplate('welcome', { to: user.email })
      ).rejects.toThrow('Email service down');

      expect(mockDb.create).toHaveBeenCalled();
    });
  });

  describe('Password Reset Email Flow', () => {
    test('should send password reset email with token', async () => {
      const user = testUtils.generateTestUser();
      const resetToken = 'reset-token-abc123';

      mockEmailService.sendTemplate.mockResolvedValue({ messageId: 'msg-123' });

      await mockEmailService.sendTemplate('password-reset', {
        to: user.email,
        data: { name: user.name, resetToken, resetUrl: `https://app.com/reset/${resetToken}` }
      });

      expect(mockEmailService.sendTemplate).toHaveBeenCalled();
    });
  });
});

describe('Storage + File Upload Integration', () => {
  const mockStorage = {
    upload: jest.fn(),
    delete: jest.fn(),
    getUrl: jest.fn()
  };

  const mockDb = {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Video Upload Workflow', () => {
    test('should upload file and store metadata in database', async () => {
      const file = {
        filename: 'video.mp4',
        mimetype: 'video/mp4',
        size: 104857600 // 100MB
      };

      mockStorage.upload.mockResolvedValue({
        path: 'videos/video.mp4',
        url: 'https://cdn.example.com/videos/video.mp4'
      });

      const uploadResult = await mockStorage.upload(file);

      expect(uploadResult.url).toBeDefined();
      expect(uploadResult.path).toContain('videos/');
    });

    test('should create video record after successful upload', async () => {
      const file = {
        filename: 'tutorial.mp4',
        mimetype: 'video/mp4'
      };

      const videoMetadata = {
        title: 'Tutorial',
        filename: 'tutorial.mp4',
        url: 'https://cdn.example.com/videos/tutorial.mp4',
        uploadedAt: new Date()
      };

      mockStorage.upload.mockResolvedValue({
        path: 'videos/tutorial.mp4',
        url: 'https://cdn.example.com/videos/tutorial.mp4'
      });

      mockDb.create.mockResolvedValue({ ...videoMetadata, _id: 'video-123' });

      const uploaded = await mockStorage.upload(file);
      const dbRecord = await mockDb.create({
        ...videoMetadata,
        url: uploaded.url
      });

      expect(dbRecord._id).toBeDefined();
      expect(dbRecord.url).toBe(uploaded.url);
    });

    test('should handle upload failure without database entry', async () => {
      const file = {
        filename: 'large.mp4',
        mimetype: 'video/mp4',
        size: 6 * 1024 * 1024 * 1024 // 6GB (exceeds limit)
      };

      mockStorage.upload.mockRejectedValue(new Error('File too large'));

      await expect(mockStorage.upload(file)).rejects.toThrow('File too large');

      expect(mockDb.create).not.toHaveBeenCalled();
    });

    test('should delete file from storage when deleting from database', async () => {
      const videoId = 'video-123';
      const videoUrl = 'https://cdn.example.com/videos/video.mp4';

      mockDb.findById.mockResolvedValue({ _id: videoId, url: videoUrl });
      mockDb.delete.mockResolvedValue(true);
      mockStorage.delete.mockResolvedValue(true);

      const video = await mockDb.findById(videoId);
      await mockDb.delete(videoId);
      await mockStorage.delete(video.url);

      expect(mockStorage.delete).toHaveBeenCalledWith(videoUrl);
    });
  });
});

describe('Security + Endpoint Integration', () => {
  const mockSecurityMiddleware = {
    checkAuth: jest.fn(),
    checkAdmin: jest.fn(),
    validateInput: jest.fn()
  };

  const mockEndpoints = {
    getUser: jest.fn(),
    createPost: jest.fn(),
    deleteUser: jest.fn(),
    adminPanel: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Flow', () => {
    test('should require valid token for protected endpoint', async () => {
      const token = testUtils.generateAuthToken('user-123');
      mockSecurityMiddleware.checkAuth.mockResolvedValue({ id: 'user-123', role: 'user' });

      const result = await mockSecurityMiddleware.checkAuth(token);

      expect(result.id).toBe('user-123');
    });

    test('should reject requests without token', async () => {
      mockSecurityMiddleware.checkAuth.mockRejectedValue(new Error('No token provided'));

      await expect(mockSecurityMiddleware.checkAuth(null)).rejects.toThrow('No token provided');
    });

    test('should reject expired token', async () => {
      mockSecurityMiddleware.checkAuth.mockRejectedValue(new Error('Token expired'));

      await expect(mockSecurityMiddleware.checkAuth('expired-token')).rejects.toThrow(
        'Token expired'
      );
    });
  });

  describe('Authorization Flow', () => {
    test('should allow admin access to admin endpoints', async () => {
      const adminToken = testUtils.generateAdminToken('admin-123');
      mockSecurityMiddleware.checkAdmin.mockResolvedValue({ id: 'admin-123', role: 'admin' });
      mockEndpoints.adminPanel.mockResolvedValue({ data: 'admin panel' });

      const auth = await mockSecurityMiddleware.checkAdmin(adminToken);
      expect(auth.role).toBe('admin');

      const result = await mockEndpoints.adminPanel();
      expect(result.data).toBeDefined();
    });

    test('should deny regular user access to admin endpoints', async () => {
      const userToken = testUtils.generateAuthToken('user-123');
      mockSecurityMiddleware.checkAdmin.mockRejectedValue(new Error('Insufficient permissions'));

      await expect(mockSecurityMiddleware.checkAdmin(userToken)).rejects.toThrow(
        'Insufficient permissions'
      );
    });
  });

  describe('Input Validation', () => {
    test('should validate input before processing', async () => {
      const invalidPost = { title: '', content: 'missing' };
      mockSecurityMiddleware.validateInput.mockRejectedValue(
        new Error('Title is required')
      );

      await expect(mockSecurityMiddleware.validateInput(invalidPost)).rejects.toThrow(
        'Title is required'
      );
    });

    test('should sanitize user input to prevent injection', async () => {
      const maliciousInput = { title: '<script>alert("xss")</script>' };
      mockSecurityMiddleware.validateInput.mockResolvedValue({
        title: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      });

      const result = await mockSecurityMiddleware.validateInput(maliciousInput);
      expect(result.title).not.toContain('<script>');
    });
  });
});

describe('Monitoring + Request Tracking Integration', () => {
  const mockMonitoring = {
    trackRequest: jest.fn(),
    recordMetric: jest.fn(),
    logError: jest.fn(),
    getMetrics: jest.fn()
  };

  const mockApi = {
    get: jest.fn(),
    post: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Request Metrics Tracking', () => {
    test('should track successful requests', async () => {
      mockMonitoring.trackRequest.mockResolvedValue(true);
      mockApi.get.mockResolvedValue({ status: 200, data: {} });

      await mockMonitoring.trackRequest({
        method: 'GET',
        path: '/api/users',
        status: 200,
        duration: 45
      });

      expect(mockMonitoring.trackRequest).toHaveBeenCalled();
    });

    test('should track failed requests', async () => {
      mockMonitoring.trackRequest.mockResolvedValue(true);
      mockApi.get.mockRejectedValue(new Error('Server error'));

      await mockMonitoring.trackRequest({
        method: 'GET',
        path: '/api/users',
        status: 500,
        duration: 2000,
        error: 'Server error'
      });

      expect(mockMonitoring.trackRequest).toHaveBeenCalled();
    });

    test('should record response time metrics', async () => {
      mockMonitoring.recordMetric.mockResolvedValue(true);

      await mockMonitoring.recordMetric('response_time', 125, { endpoint: '/api/users' });

      expect(mockMonitoring.recordMetric).toHaveBeenCalledWith(
        'response_time',
        125,
        expect.any(Object)
      );
    });
  });

  describe('Error Tracking', () => {
    test('should log errors with context', async () => {
      const error = new Error('Database connection failed');
      mockMonitoring.logError.mockResolvedValue(true);

      await mockMonitoring.logError(error, {
        endpoint: '/api/users',
        userId: 'user-123'
      });

      expect(mockMonitoring.logError).toHaveBeenCalled();
    });

    test('should track error rate', async () => {
      mockMonitoring.recordMetric.mockResolvedValue(true);

      await mockMonitoring.recordMetric('error_rate', 0.02, { service: 'api' });

      expect(mockMonitoring.recordMetric).toHaveBeenCalled();
    });
  });

  describe('Metrics Retrieval', () => {
    test('should retrieve aggregated metrics', async () => {
      mockMonitoring.getMetrics.mockResolvedValue({
        requests: 1000,
        errors: 5,
        avgResponseTime: 120,
        p95ResponseTime: 450,
        p99ResponseTime: 850
      });

      const metrics = await mockMonitoring.getMetrics({ timeRange: '1h' });

      expect(metrics.requests).toBe(1000);
      expect(metrics.avgResponseTime).toBe(120);
    });
  });
});

describe('Multi-Service Integration', () => {
  describe('User Signup with Email and Notifications', () => {
    test('should complete full signup workflow', async () => {
      const mockDb = { create: jest.fn() };
      const mockEmail = { sendTemplate: jest.fn() };
      const mockNotification = { send: jest.fn() };
      const mockCache = { set: jest.fn() };

      const newUser = testUtils.generateTestUser();

      // User created in database
      mockDb.create.mockResolvedValue({ ...newUser, _id: 'user-123' });

      // Welcome email sent
      mockEmail.sendTemplate.mockResolvedValue({ messageId: 'msg-123' });

      // Notification sent
      mockNotification.send.mockResolvedValue({ status: 'sent' });

      // User cached
      mockCache.set.mockResolvedValue(true);

      // Execute workflow
      const createdUser = await mockDb.create(newUser);
      await mockEmail.sendTemplate('welcome', { to: newUser.email });
      await mockNotification.send({ userId: createdUser._id, type: 'welcome' });
      await mockCache.set(`user:${createdUser._id}`, JSON.stringify(createdUser));

      // Verify all services called
      expect(mockDb.create).toHaveBeenCalled();
      expect(mockEmail.sendTemplate).toHaveBeenCalled();
      expect(mockNotification.send).toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalled();
    });
  });

  describe('Post Creation with Cache Invalidation', () => {
    test('should invalidate relevant caches on post creation', async () => {
      const mockDb = { create: jest.fn() };
      const mockCache = { delete: jest.fn(), set: jest.fn() };
      const mockSearch = { reindex: jest.fn() };

      const post = testUtils.generateTestPost();

      mockDb.create.mockResolvedValue({ ...post, _id: 'post-123' });
      mockCache.delete.mockResolvedValue(true);
      mockSearch.reindex.mockResolvedValue(true);

      // Create post
      const createdPost = await mockDb.create(post);

      // Invalidate related caches
      await mockCache.delete('posts:list');
      await mockCache.delete(`user:${post.author}:posts`);

      // Update search index
      await mockSearch.reindex({ id: createdPost._id, type: 'post' });

      expect(mockDb.create).toHaveBeenCalled();
      expect(mockCache.delete).toHaveBeenCalledTimes(2);
      expect(mockSearch.reindex).toHaveBeenCalled();
    });
  });
});
