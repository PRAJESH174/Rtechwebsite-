/**
 * MongoDB Configuration and Connection Management
 * Handles database connection pooling, migration, and queries
 * 
 * Environment Variables Required:
 * - MONGODB_URI: MongoDB connection string (default: mongodb://localhost:27017/rtech)
 * - MONGODB_POOL_SIZE: Connection pool size (default: 10)
 * - MONGODB_TIMEOUT: Connection timeout in ms (default: 5000)
 */

const mongoose = require('mongoose');

// Configuration
const config = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rtech',
  poolSize: parseInt(process.env.MONGODB_POOL_SIZE) || 10,
  timeout: parseInt(process.env.MONGODB_TIMEOUT) || 5000,
  retryWrites: true,
  w: 'majority',
};

// Connection options
const mongooseOptions = {
  maxPoolSize: config.poolSize,
  minPoolSize: Math.floor(config.poolSize / 2),
  socketTimeoutMS: config.timeout,
  connectTimeoutMS: config.timeout,
  serverSelectionTimeoutMS: config.timeout,
  retryWrites: config.retryWrites,
  w: config.w,
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// ===== DATABASE CONNECTION =====

class DatabaseConnection {
  constructor() {
    this.connected = false;
    this.connection = null;
  }

  /**
   * Connect to MongoDB
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      console.log('🔄 Connecting to MongoDB...');
      console.log(`📍 URI: ${config.uri}`);
      console.log(`🔌 Pool Size: ${config.poolSize}`);

      this.connection = await mongoose.connect(config.uri, mongooseOptions);
      this.connected = true;

      console.log('✅ MongoDB connected successfully');
      console.log(`📊 Connection Name: ${mongoose.connection.name}`);
      console.log(`📍 Host: ${mongoose.connection.host}`);

      return this.connection;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   * @returns {Promise<void>}
   */
  async disconnect() {
    try {
      if (this.connected) {
        await mongoose.disconnect();
        this.connected = false;
        console.log('✅ MongoDB disconnected');
      }
    } catch (error) {
      console.error('❌ MongoDB disconnection failed:', error.message);
      throw error;
    }
  }

  /**
   * Check database connection status
   * @returns {boolean}
   */
  isConnected() {
    return this.connected && mongoose.connection.readyState === 1;
  }

  async createIndexes() {
    try {
      await createIndexes();
    } catch (error) {
      console.error('Error in createIndexes method:', error.message || error);
      throw error;
    }
  }

  /**
   * Get database statistics
   * @returns {Promise<Object>}
   */
  async getStats() {
    try {
      const db = mongoose.connection.db;
      const stats = await db.stats();
      return {
        name: db.getName(),
        sizeOnDisk: stats.dataSize,
        avgObjSize: stats.avgObjSize,
        collections: stats.collections,
        indexes: stats.indexes,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return null;
    }
  }

  /**
   * Run health check
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      const db = mongoose.connection.db;
      const result = await db.command({ ping: 1 });
      return result.ok === 1;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

// ===== SCHEMA DEFINITIONS =====

// User Schema
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    mobile: { type: String, required: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    profile: {
      avatar: String,
      bio: String,
      company: String,
      website: String,
    },
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      theme: { type: String, default: 'light' },
    },
    stats: {
      postsCount: { type: Number, default: 0 },
      videoCount: { type: Number, default: 0 },
      coursesEnrolled: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
    },
    lastLogin: Date,
    verifiedAt: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: 'users', timestamps: true }
);

// Post Schema
const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, default: 'general' },
    tags: [String],
    likes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    views: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: 'posts', timestamps: true }
);

// Video Schema
const videoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    url: { type: String, required: true },
    thumbnail: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: String,
    duration: Number,
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    tags: [String],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: 'videos', timestamps: true }
);

// Course Schema
const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    price: { type: Number, required: true },
    duration: Number,
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    category: String,
    modules: [
      {
        title: String,
        description: String,
        videos: [String],
      },
    ],
    enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: Number,
    published: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: 'courses', timestamps: true }
);

// Transaction Schema
const transactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    amount: { type: Number, required: true },
    tax: Number,
    total: Number,
    method: { type: String, enum: ['card', 'upi', 'wallet'], required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    paymentGateway: String,
    gatewayTransactionId: String,
    metadata: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: 'transactions', timestamps: true }
);

// ===== CREATE MODELS =====

const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);
const Video = mongoose.model('Video', videoSchema);
const Course = mongoose.model('Course', courseSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

// ===== CREATE INDEXES =====

async function createIndexes() {
  try {
    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ createdAt: 1 });
    await User.collection.createIndex({ isAdmin: 1 });

    // Post indexes
    await Post.collection.createIndex({ author: 1, createdAt: -1 });
    await Post.collection.createIndex({ category: 1 });
    await Post.collection.createIndex({ tags: 1 });
    await Post.collection.createIndex({ published: 1 });

    // Video indexes
    await Video.collection.createIndex({ author: 1, createdAt: -1 });
    await Video.collection.createIndex({ category: 1 });
    await Video.collection.createIndex({ views: -1 });

    // Course indexes
    await Course.collection.createIndex({ instructor: 1 });
    await Course.collection.createIndex({ category: 1 });
    await Course.collection.createIndex({ published: 1 });
    await Course.collection.createIndex({ rating: -1 });

    // Transaction indexes
    await Transaction.collection.createIndex({ user: 1, createdAt: -1 });
    await Transaction.collection.createIndex({ status: 1 });
    await Transaction.collection.createIndex({ transactionId: 1 }, { unique: true });

    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
}

// ===== MIGRATION FUNCTIONS =====

/**
 * Migrate data from in-memory storage to MongoDB
 * @param {Array} data - Array of objects to migrate
 * @param {Model} model - Mongoose model to insert into
 * @returns {Promise<Array>}
 */
async function migrateData(data, model) {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    const result = await model.insertMany(data, { ordered: false });
    console.log(`✅ Migrated ${result.length} documents to ${model.collection.name}`);
    return result;
  } catch (error) {
    console.error(`Error migrating data to ${model.collection.name}:`, error);
    return [];
  }
}

/**
 * Clear all collections
 * @returns {Promise<void>}
 */
async function clearDatabase() {
  try {
    await Promise.all([
      User.deleteMany({}),
      Post.deleteMany({}),
      Video.deleteMany({}),
      Course.deleteMany({}),
      Transaction.deleteMany({}),
    ]);
    console.log('✅ Database cleared');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
}

// ===== EXPORTS =====

module.exports = {
  DatabaseConnection,
  User,
  Post,
  Video,
  Course,
  Transaction,
  createIndexes,
  migrateData,
  clearDatabase,
  mongooseOptions,
};
