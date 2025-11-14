/**
 * Frontend API Integration
 * Replaces localStorage with backend API calls
 * Integrated with Express.js backend on http://localhost:5000
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const API_TIMEOUT = 10000; // 10 seconds

// ===== API CLIENT =====

class APIClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  // Set auth token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  // Get auth token
  getToken() {
    return this.token;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token;
  }

  // Make HTTP request with timeout
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Add token if authenticated
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          message: data.message || 'API request failed',
          data: data,
        };
      }

      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  // ===== AUTHENTICATION =====

  async signup(name, email, mobile, password) {
    const data = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, mobile, password }),
    });

    if (data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  async adminLogin(username, password) {
    const data = await this.request('/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  async sendOTP(email, mobile) {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email, mobile }),
    });
  }

  async verifyOTP(otp) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ otp }),
    });
  }

  // ===== USERS =====

  async getUser(userId) {
    return this.request(`/users/${userId}`);
  }

  async updateUser(userId, data) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getAllUsers() {
    return this.request('/users');
  }

  // ===== POSTS =====

  async createPost(title, content, category, tags) {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify({ title, content, category, tags }),
    });
  }

  async getPosts(page = 1, limit = 10) {
    return this.request(`/posts?page=${page}&limit=${limit}`);
  }

  async getPost(postId) {
    return this.request(`/posts/${postId}`);
  }

  async updatePost(postId, data) {
    return this.request(`/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePost(postId) {
    return this.request(`/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  async likePost(postId) {
    return this.request(`/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  async addComment(postId, text) {
    return this.request(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  // ===== VIDEOS =====

  async uploadVideo(title, description, url, category, thumbnail) {
    return this.request('/videos', {
      method: 'POST',
      body: JSON.stringify({ title, description, url, category, thumbnail }),
    });
  }

  async getVideos(page = 1, limit = 10) {
    return this.request(`/videos?page=${page}&limit=${limit}`);
  }

  async getVideo(videoId) {
    return this.request(`/videos/${videoId}`);
  }

  async updateVideo(videoId, data) {
    return this.request(`/videos/${videoId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVideo(videoId) {
    return this.request(`/videos/${videoId}`, {
      method: 'DELETE',
    });
  }

  // ===== COURSES =====

  async createCourse(title, description, price, duration, level, category) {
    return this.request('/courses', {
      method: 'POST',
      body: JSON.stringify({ title, description, price, duration, level, category }),
    });
  }

  async getCourses(page = 1, limit = 10) {
    return this.request(`/courses?page=${page}&limit=${limit}`);
  }

  async getCourse(courseId) {
    return this.request(`/courses/${courseId}`);
  }

  async updateCourse(courseId, data) {
    return this.request(`/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCourse(courseId) {
    return this.request(`/courses/${courseId}`, {
      method: 'DELETE',
    });
  }

  async enrollCourse(courseId) {
    return this.request(`/courses/${courseId}/enroll`, {
      method: 'POST',
    });
  }

  // ===== PAYMENTS =====

  async processPayment(courseId, amount, method, paymentDetails) {
    return this.request('/payments/process', {
      method: 'POST',
      body: JSON.stringify({ courseId, amount, method, paymentDetails }),
    });
  }

  async getTransactions() {
    return this.request('/payments');
  }

  // ===== ADMIN =====

  async getAdminDashboard() {
    return this.request('/admin/dashboard');
  }

  async updateSEOSettings(title, description, keywords, ogImage) {
    return this.request('/admin/seo-settings', {
      method: 'PUT',
      body: JSON.stringify({ title, description, keywords, ogImage }),
    });
  }

  async getSEOSettings() {
    return this.request('/admin/seo-settings');
  }

  // ===== ANALYTICS =====

  async trackEvent(event, userId, data) {
    return this.request('/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ event, userId, data }),
    });
  }

  async getAnalytics() {
    return this.request('/analytics');
  }

  // ===== HEALTH =====

  async checkHealth() {
    return this.request('/health');
  }
}

// Create global API client instance
const apiClient = new APIClient();

// ===== ERROR HANDLING =====

function showError(message, duration = 5000) {
  console.error('Error:', message);
  
  const alertEl = document.createElement('div');
  alertEl.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #dc3545;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    max-width: 300px;
    word-wrap: break-word;
  `;
  alertEl.textContent = message;
  document.body.appendChild(alertEl);

  setTimeout(() => alertEl.remove(), duration);
}

function showSuccess(message, duration = 3000) {
  console.log('Success:', message);
  
  const alertEl = document.createElement('div');
  alertEl.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #28a745;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    max-width: 300px;
    word-wrap: break-word;
  `;
  alertEl.textContent = message;
  document.body.appendChild(alertEl);

  setTimeout(() => alertEl.remove(), duration);
}

function showLoading(message = 'Loading...') {
  const loadingEl = document.createElement('div');
  loadingEl.id = 'api-loading';
  loadingEl.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #0056b3;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 10px;
  `;
  loadingEl.innerHTML = `
    <span style="animation: spin 1s linear infinite;">⏳</span>
    <span>${message}</span>
  `;
  document.body.appendChild(loadingEl);

  // Add animation
  if (!document.querySelector('style[data-api-loading]')) {
    const style = document.createElement('style');
    style.setAttribute('data-api-loading', 'true');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  return loadingEl;
}

function hideLoading() {
  const loadingEl = document.getElementById('api-loading');
  if (loadingEl) {
    loadingEl.remove();
  }
}

// ===== SYNC HELPERS =====

async function syncUserData() {
  try {
    if (!apiClient.isAuthenticated()) {
      return null;
    }

    const response = await apiClient.request('/users/me', {
      method: 'GET',
    });

    if (response.data) {
      localStorage.setItem('currentUser', JSON.stringify(response.data));
      return response.data;
    }
  } catch (error) {
    console.error('Failed to sync user data:', error);
  }
  return null;
}

async function syncPostsData() {
  try {
    const response = await apiClient.getPosts(1, 20);
    if (response.data) {
      localStorage.setItem('rtech-posts', JSON.stringify(response.data));
      return response.data;
    }
  } catch (error) {
    console.error('Failed to sync posts:', error);
  }
  return null;
}

async function syncVideosData() {
  try {
    const response = await apiClient.getVideos(1, 20);
    if (response.data) {
      localStorage.setItem('rtech-videos', JSON.stringify(response.data));
      return response.data;
    }
  } catch (error) {
    console.error('Failed to sync videos:', error);
  }
  return null;
}

// Export for use in HTML
window.APIClient = APIClient;
window.apiClient = apiClient;
window.showError = showError;
window.showSuccess = showSuccess;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.syncUserData = syncUserData;
window.syncPostsData = syncPostsData;
window.syncVideosData = syncVideosData;
