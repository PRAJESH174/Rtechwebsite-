/**
 * Database Schema for RTech Solutions
 * MongoDB/PostgreSQL models and structure
 */

// User Model
const userSchema = {
  _id: 'ObjectId',
  name: 'String (required)',
  email: 'String (required, unique)',
  mobile: 'String',
  password: 'String (hashed, required)',
  avatar: 'String (URL)',
  bio: 'String',
  isAdmin: 'Boolean (default: false)',
  role: 'String (user, admin, instructor)',
  enrolledCourses: '[CourseId]',
  purchasedCourses: '[CourseId]',
  preferences: {
    newsletter: 'Boolean',
    notifications: 'Boolean',
    darkMode: 'Boolean'
  },
  createdAt: 'Date',
  updatedAt: 'Date',
  deletedAt: 'Date (soft delete)'
};

// Post Model
const postSchema = {
  _id: 'ObjectId',
  title: 'String (required)',
  slug: 'String (required, unique)',
  content: 'String (HTML, required)',
  excerpt: 'String',
  featuredImage: 'String (URL)',
  author: 'UserId (required)',
  category: 'String',
  tags: '[String]',
  status: 'String (draft, published, archived)',
  views: 'Number (default: 0)',
  likes: '[UserId]',
  comments: [{
    userId: 'UserId',
    text: 'String',
    createdAt: 'Date'
  }],
  seoTitle: 'String',
  seoDescription: 'String',
  seoKeywords: 'String',
  createdAt: 'Date',
  updatedAt: 'Date',
  publishedAt: 'Date'
};

// Video Model
const videoSchema = {
  _id: 'ObjectId',
  title: 'String (required)',
  slug: 'String (required, unique)',
  description: 'String',
  videoUrl: 'String (URL, required)',
  thumbnail: 'String (URL)',
  duration: 'Number (seconds)',
  category: 'String',
  instructor: 'UserId',
  course: 'CourseId',
  views: 'Number (default: 0)',
  likes: '[UserId]',
  rating: 'Number (0-5)',
  tags: '[String]',
  transcript: 'String',
  quality: {
    '720p': 'String (URL)',
    '1080p': 'String (URL)',
    '480p': 'String (URL)'
  },
  createdAt: 'Date',
  updatedAt: 'Date'
};

// Course Model
const courseSchema = {
  _id: 'ObjectId',
  title: 'String (required)',
  slug: 'String (required, unique)',
  description: 'String',
  fullDescription: 'String (HTML)',
  instructor: 'UserId',
  category: 'String',
  subcategory: 'String',
  level: 'String (beginner, intermediate, advanced)',
  price: 'Number',
  discountPrice: 'Number',
  currency: 'String (default: INR)',
  image: 'String (URL)',
  duration: 'Number (hours)',
  lessons: 'Number',
  students: 'Number',
  rating: 'Number (0-5)',
  reviews: 'Number',
  videos: '[VideoId]',
  resources: '[String]',
  objectives: '[String]',
  prerequisites: '[String]',
  certificate: 'Boolean',
  status: 'String (draft, published, archived)',
  tags: '[String]',
  seoTitle: 'String',
  seoDescription: 'String',
  createdAt: 'Date',
  updatedAt: 'Date'
};

// Transaction Model
const transactionSchema = {
  _id: 'ObjectId',
  user: 'UserId (required)',
  course: 'CourseId',
  amount: 'Number (required)',
  currency: 'String (default: INR)',
  tax: 'Number',
  total: 'Number',
  paymentMethod: 'String (card, upi, wallet, netbanking)',
  paymentGateway: 'String (stripe, razorpay)',
  transactionId: 'String (external)',
  status: 'String (pending, completed, failed, refunded)',
  invoiceNumber: 'String',
  invoiceUrl: 'String (URL)',
  refundAmount: 'Number',
  refundReason: 'String',
  metadata: {
    orderId: 'String',
    cartId: 'String',
    source: 'String'
  },
  createdAt: 'Date',
  updatedAt: 'Date',
  completedAt: 'Date'
};

// SEO Settings Model
const seoSettingsSchema = {
  _id: 'ObjectId',
  pageKey: 'String (unique)',
  title: 'String',
  description: 'String',
  keywords: '[String]',
  ogImage: 'String (URL)',
  twitterHandle: 'String',
  canonicalUrl: 'String',
  hreflang: {
    'en_US': 'String (URL)',
    'en_IN': 'String (URL)',
    'hi_IN': 'String (URL)'
  },
  robots: 'String',
  createdAt: 'Date',
  updatedAt: 'Date'
};

// Admin Settings Model
const adminSettingsSchema = {
  _id: 'ObjectId',
  siteName: 'String',
  siteDescription: 'String',
  siteUrl: 'String',
  logo: 'String (URL)',
  favicon: 'String (URL)',
  contactEmail: 'String',
  contactPhone: 'String',
  address: 'String',
  socialMedia: {
    facebook: 'String',
    twitter: 'String',
    linkedin: 'String',
    instagram: 'String',
    youtube: 'String'
  },
  analyticsIds: {
    googleAnalytics: 'String',
    googleTagManager: 'String',
    hotjar: 'String'
  },
  emailSettings: {
    smtpHost: 'String',
    smtpPort: 'Number',
    fromEmail: 'String'
  },
  paymentGateways: {
    stripe: 'Boolean',
    razorpay: 'Boolean'
  },
  features: {
    comments: 'Boolean',
    ratings: 'Boolean',
    reviews: 'Boolean',
    certificates: 'Boolean'
  },
  updatedAt: 'Date'
};

// Enrollment Model
const enrollmentSchema = {
  _id: 'ObjectId',
  user: 'UserId (required)',
  course: 'CourseId (required)',
  enrolledAt: 'Date',
  completedAt: 'Date',
  progress: 'Number (0-100)',
  status: 'String (active, completed, dropped)',
  certificateIssued: 'Boolean',
  certificateUrl: 'String (URL)',
  grade: 'String (A, B, C, etc.)',
  notes: 'String'
};

// Analytics Event Model
const analyticsEventSchema = {
  _id: 'ObjectId',
  userId: 'UserId',
  eventType: 'String (pageview, click, purchase, etc.)',
  eventName: 'String',
  eventData: 'Object',
  page: 'String (URL)',
  referrer: 'String (URL)',
  userAgent: 'String',
  ipAddress: 'String',
  timestamp: 'Date'
};

module.exports = {
  userSchema,
  postSchema,
  videoSchema,
  courseSchema,
  transactionSchema,
  seoSettingsSchema,
  adminSettingsSchema,
  enrollmentSchema,
  analyticsEventSchema
};
