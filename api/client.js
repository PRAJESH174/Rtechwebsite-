/**
 * API Service Client for RTech Solutions
 * Handles all API communication with the backend
 */

class APIClient {
  constructor(baseURL = 'https://api.rTechLearners.com') {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('rtech_token');
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  /**
   * Set authentication token
   */
  setToken(token) {
    this.token = token;
    this.headers['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('rtech_token', token);
  }

  /**
   * Get authentication token
   */
  getToken() {
    return this.token;
  }

  /**
   * Clear authentication token
   */
  clearToken() {
    this.token = null;
    delete this.headers['Authorization'];
    localStorage.removeItem('rtech_token');
  }

  /**
   * Generic fetch method
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  /**
   * Upload file
   */
  async uploadFile(endpoint, file) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request(endpoint, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${this.token}`
        // Don't set Content-Type for FormData
      }
    });
  }

  // ===== Authentication Methods =====

  async login(email, password) {
    const data = await this.post('/auth/login', { email, password });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async signup(userData) {
    return this.post('/auth/signup', userData);
  }

  async logout() {
    this.clearToken();
    return this.post('/auth/logout', {});
  }

  async verifyOTP(email, otp) {
    const data = await this.post('/auth/verify-otp', { email, otp });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async adminLogin(username, password) {
    const data = await this.post('/auth/admin-login', { username, password });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  // ===== User Methods =====

  async getProfile() {
    return this.get('/users/profile');
  }

  async updateProfile(userData) {
    return this.put('/users/profile', userData);
  }

  async getUser(userId) {
    return this.get(`/users/${userId}`);
  }

  async getAllUsers() {
    return this.get('/users');
  }

  async deleteUser(userId) {
    return this.delete(`/users/${userId}`);
  }

  // ===== Post Methods =====

  async getPosts() {
    return this.get('/posts');
  }

  async getPost(postId) {
    return this.get(`/posts/${postId}`);
  }

  async createPost(postData) {
    return this.post('/posts', postData);
  }

  async updatePost(postId, postData) {
    return this.put(`/posts/${postId}`, postData);
  }

  async deletePost(postId) {
    return this.delete(`/posts/${postId}`);
  }

  async publishPost(postId) {
    return this.post(`/posts/${postId}/publish`, {});
  }

  // ===== Video Methods =====

  async getVideos() {
    return this.get('/videos');
  }

  async getVideo(videoId) {
    return this.get(`/videos/${videoId}`);
  }

  async uploadVideo(videoData) {
    return this.uploadFile('/videos/upload', videoData);
  }

  async updateVideo(videoId, videoData) {
    return this.put(`/videos/${videoId}`, videoData);
  }

  async deleteVideo(videoId) {
    return this.delete(`/videos/${videoId}`);
  }

  // ===== Course Methods =====

  async getCourses() {
    return this.get('/courses');
  }

  async getCourse(courseId) {
    return this.get(`/courses/${courseId}`);
  }

  async enrollCourse(courseId) {
    return this.post(`/courses/${courseId}/enroll`, {});
  }

  // ===== Transaction Methods =====

  async getTransactions() {
    return this.get('/transactions');
  }

  async createTransaction(transactionData) {
    return this.post('/transactions', transactionData);
  }

  async verifyPayment(transactionId, verificationData) {
    return this.post(`/transactions/${transactionId}/verify`, verificationData);
  }

  // ===== SEO Methods =====

  async getSEOSettings() {
    return this.get('/seo/settings');
  }

  async updateSEOSettings(seoData) {
    return this.put('/seo/settings', seoData);
  }

  async generateSitemap() {
    return this.post('/seo/sitemap', {});
  }

  // ===== Admin Methods =====

  async getAdminDashboard() {
    return this.get('/admin/dashboard');
  }

  async getAdminStats() {
    return this.get('/admin/stats');
  }

  async getAdminSettings() {
    return this.get('/admin/settings');
  }

  async updateAdminSettings(settings) {
    return this.put('/admin/settings', settings);
  }

  // ===== Content Methods =====

  async uploadMedia(file) {
    return this.uploadFile('/content/media/upload', file);
  }

  async getMediaList() {
    return this.get('/content/media');
  }

  async getPage(slug) {
    return this.get(`/content/pages/${slug}`);
  }

  async updatePage(slug, pageData) {
    return this.put(`/content/pages/${slug}`, pageData);
  }
}

// Create singleton instance
const apiClient = new APIClient(process.env.API_BASE_URL || 'https://api.rTechLearners.com');

module.exports = apiClient;
