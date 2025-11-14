/**
 * API Routes for RTech Solutions
 * Replace localStorage with server-side API endpoints
 */

// Base API endpoints
const API_ROUTES = {
  // Authentication
  auth: {
    login: '/api/v1/auth/login',
    signup: '/api/v1/auth/signup',
    logout: '/api/v1/auth/logout',
    refresh: '/api/v1/auth/refresh',
    verifyOTP: '/api/v1/auth/verify-otp',
    adminLogin: '/api/v1/auth/admin-login'
  },

  // Users
  users: {
    getProfile: '/api/v1/users/profile',
    updateProfile: '/api/v1/users/profile',
    getUserById: '/api/v1/users/:id',
    getAllUsers: '/api/v1/users',
    deleteUser: '/api/v1/users/:id'
  },

  // Posts
  posts: {
    getAll: '/api/v1/posts',
    getById: '/api/v1/posts/:id',
    create: '/api/v1/posts',
    update: '/api/v1/posts/:id',
    delete: '/api/v1/posts/:id',
    publish: '/api/v1/posts/:id/publish'
  },

  // Videos
  videos: {
    getAll: '/api/v1/videos',
    getById: '/api/v1/videos/:id',
    upload: '/api/v1/videos/upload',
    update: '/api/v1/videos/:id',
    delete: '/api/v1/videos/:id',
    getByCategory: '/api/v1/videos/category/:category'
  },

  // Courses
  courses: {
    getAll: '/api/v1/courses',
    getById: '/api/v1/courses/:id',
    create: '/api/v1/courses',
    update: '/api/v1/courses/:id',
    delete: '/api/v1/courses/:id',
    enroll: '/api/v1/courses/:id/enroll'
  },

  // Transactions
  transactions: {
    getAll: '/api/v1/transactions',
    getById: '/api/v1/transactions/:id',
    create: '/api/v1/transactions',
    updateStatus: '/api/v1/transactions/:id/status'
  },

  // SEO
  seo: {
    getSettings: '/api/v1/seo/settings',
    updateSettings: '/api/v1/seo/settings',
    generateSitemap: '/api/v1/seo/sitemap',
    checkRanking: '/api/v1/seo/ranking'
  },

  // Content Management
  content: {
    getPage: '/api/v1/content/pages/:slug',
    updatePage: '/api/v1/content/pages/:slug',
    uploadMedia: '/api/v1/content/media/upload',
    getMediaList: '/api/v1/content/media'
  },

  // Admin
  admin: {
    dashboard: '/api/v1/admin/dashboard',
    stats: '/api/v1/admin/stats',
    settings: '/api/v1/admin/settings',
    updateSettings: '/api/v1/admin/settings',
    sendEmail: '/api/v1/admin/send-email'
  },

  // Payments
  payments: {
    processPayment: '/api/v1/payments/process',
    verifyPayment: '/api/v1/payments/verify',
    getInvoice: '/api/v1/payments/invoice/:id',
    refund: '/api/v1/payments/refund/:id'
  },

  // Support
  support: {
    submitTicket: '/api/v1/support/tickets',
    getTickets: '/api/v1/support/tickets',
    updateTicket: '/api/v1/support/tickets/:id'
  }
};

module.exports = API_ROUTES;
