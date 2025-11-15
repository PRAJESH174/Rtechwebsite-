/**
 * File Storage Configuration
 * Supports AWS S3, Google Cloud Storage, and Local Storage
 * 
 * Environment Variables:
 * - STORAGE_PROVIDER: s3 | gcs | local (default: local)
 * - AWS_ACCESS_KEY_ID: AWS access key
 * - AWS_SECRET_ACCESS_KEY: AWS secret key
 * - AWS_S3_BUCKET: S3 bucket name
 * - AWS_S3_REGION: AWS region
 * - GCS_PROJECT_ID: GCS project ID
 * - GCS_BUCKET: GCS bucket name
 * - GCS_KEY_FILE: Path to GCS credentials JSON
 * - LOCAL_UPLOAD_DIR: Local upload directory (default: ./uploads)
 * - CDN_URL: CDN URL for serving files
 * - MAX_FILE_SIZE: Max file size in bytes (default: 52428800 = 50MB)
 */

const path = require('path');
const fs = require('fs');

// File configurations
const FILE_TYPES = {
  VIDEO: {
    extensions: ['mp4', 'avi', 'mkv', 'mov', 'flv', 'wmv'],
    mimeTypes: ['video/mp4', 'video/x-msvideo', 'video/x-matroska', 'video/quicktime'],
    maxSize: 1073741824, // 1GB
  },
  IMAGE: {
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 5242880, // 5MB
  },
  DOCUMENT: {
    extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.ms-excel'],
    maxSize: 52428800, // 50MB
  },
  ARCHIVE: {
    extensions: ['zip', 'rar', '7z', 'tar', 'gz'],
    mimeTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
    maxSize: 1073741824, // 1GB
  },
};

// ===== STORAGE SERVICE CLASS =====

class StorageService {
  constructor(provider = process.env.STORAGE_PROVIDER || 'local') {
    this.provider = provider;
    this.client = null;
    this.initialized = false;
    this.cdnUrl = process.env.CDN_URL || '';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 52428800; // 50MB
  }

  /**
   * Initialize storage service
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      console.log(`Initializing ${this.provider} storage service...`);

      if (this.provider === 's3') {
        this.initializeS3();
      } else if (this.provider === 'gcs') {
        this.initializeGCS();
      } else if (this.provider === 'local') {
        this.initializeLocal();
      } else {
        throw new Error(`Unknown storage provider: ${this.provider}`);
      }

      this.initialized = true;
      console.log(`Storage service initialized (${this.provider})`);
    } catch (error) {
      console.error(`Storage initialization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Initialize AWS S3
   */
  initializeS3() {
    const AWS = require('aws-sdk');

    const s3Config = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_S3_REGION || 'us-east-1',
    };

    if (!s3Config.accessKeyId || !s3Config.secretAccessKey) {
      throw new Error('AWS credentials not set');
    }

    AWS.config.update(s3Config);
    this.client = new AWS.S3();
    this.bucketName = process.env.AWS_S3_BUCKET;

    if (!this.bucketName) {
      throw new Error('AWS_S3_BUCKET not set');
    }
  }

  /**
   * Initialize Google Cloud Storage
   */
  initializeGCS() {
    const { Storage } = require('@google-cloud/storage');

    const gcsConfig = {
      projectId: process.env.GCS_PROJECT_ID,
      keyFilename: process.env.GCS_KEY_FILE,
    };

    if (!gcsConfig.projectId) {
      throw new Error('GCS_PROJECT_ID not set');
    }

    this.client = new Storage(gcsConfig);
    this.bucketName = process.env.GCS_BUCKET;

    if (!this.bucketName) {
      throw new Error('GCS_BUCKET not set');
    }
  }

  /**
   * Initialize Local Storage
   */
  initializeLocal() {
    const uploadDir = process.env.LOCAL_UPLOAD_DIR || './uploads';

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`Created upload directory: ${uploadDir}`);
    }

    this.uploadDir = uploadDir;
  }

  /**
   * Validate file
   * @param {Object} file - File object with name, data, mimeType
   * @param {string} fileType - File type category
   * @returns {Object} - Validation result
   */
  validateFile(file, fileType) {
    const config = FILE_TYPES[fileType];

    if (!config) {
      return { valid: false, error: `Unknown file type: ${fileType}` };
    }

    const ext = path.extname(file.name).slice(1).toLowerCase();

    if (!config.extensions.includes(ext)) {
      return {
        valid: false,
        error: `Invalid file extension. Allowed: ${config.extensions.join(', ')}`,
      };
    }

    if (file.size > config.maxSize) {
      return {
        valid: false,
        error: `File size exceeds limit (${config.maxSize / 1024 / 1024}MB)`,
      };
    }

    return { valid: true };
  }

  /**
   * Upload file
   * @param {Object} file - File object
   * @param {string} folder - Folder path
   * @param {Object} options - Upload options
   * @returns {Promise<Object>}
   */
  async upload(file, folder, options = {}) {
    if (!this.initialized) {
      throw new Error('Storage service not initialized');
    }

    try {
      let result;

      if (this.provider === 's3') {
        result = await this.uploadToS3(file, folder, options);
      } else if (this.provider === 'gcs') {
        result = await this.uploadToGCS(file, folder, options);
      } else if (this.provider === 'local') {
        result = await this.uploadLocal(file, folder, options);
      }

      console.log(`File uploaded: ${result.url}`);
      return result;
    } catch (error) {
      console.error(`Upload failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upload to S3
   */
  async uploadToS3(file, folder, options = {}) {
    const fileName = `${folder}/${Date.now()}-${file.name}`;

    const params = {
      Bucket: this.bucketName,
      Key: fileName,
      Body: file.data,
      ContentType: file.mimeType,
      ACL: 'public-read',
      ...options,
    };

    const result = await this.client.upload(params).promise();

    return {
      url: result.Location,
      key: result.Key,
      bucket: result.Bucket,
      provider: 's3',
    };
  }

  /**
   * Upload to GCS
   */
  async uploadToGCS(file, folder, options = {}) {
    const bucket = this.client.bucket(this.bucketName);
    const fileName = `${folder}/${Date.now()}-${file.name}`;
    const gcsFile = bucket.file(fileName);

    await gcsFile.save(file.data, {
      metadata: {
        contentType: file.mimeType,
      },
      public: true,
      ...options,
    });

    const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;

    return {
      url: publicUrl,
      name: fileName,
      bucket: this.bucketName,
      provider: 'gcs',
    };
  }

  /**
   * Upload locally
   */
  async uploadLocal(file, folder, options = {}) {
    const uploadPath = path.join(this.uploadDir, folder);

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadPath, fileName);

    fs.writeFileSync(filePath, file.data);

    const url = this.cdnUrl
      ? `${this.cdnUrl}/${folder}/${fileName}`
      : `/uploads/${folder}/${fileName}`;

    return {
      url,
      path: filePath,
      fileName,
      folder,
      provider: 'local',
    };
  }

  /**
   * Delete file
   * @param {string} fileKey - File key or path
   * @returns {Promise<void>}
   */
  async delete(fileKey) {
    try {
      if (this.provider === 's3') {
        await this.client.deleteObject({ Bucket: this.bucketName, Key: fileKey }).promise();
      } else if (this.provider === 'gcs') {
        await this.client.bucket(this.bucketName).file(fileKey).delete();
      } else if (this.provider === 'local') {
        const filePath = path.join(this.uploadDir, fileKey);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      console.log(`File deleted: ${fileKey}`);
    } catch (error) {
      console.error(`Delete failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get file URL
   * @param {string} fileKey - File key or path
   * @returns {string}
   */
  getFileUrl(fileKey) {
    if (this.provider === 's3') {
      return `https://${this.bucketName}.s3.amazonaws.com/${fileKey}`;
    } else if (this.provider === 'gcs') {
      return `https://storage.googleapis.com/${this.bucketName}/${fileKey}`;
    } else if (this.provider === 'local') {
      return this.cdnUrl ? `${this.cdnUrl}/${fileKey}` : `/uploads/${fileKey}`;
    }
  }

  /**
   * List files in folder
   * @param {string} folder - Folder path
   * @returns {Promise<Array>}
   */
  async listFiles(folder) {
    try {
      if (this.provider === 's3') {
        const result = await this.client
          .listObjectsV2({ Bucket: this.bucketName, Prefix: folder })
          .promise();
        return result.Contents || [];
      } else if (this.provider === 'gcs') {
        const [files] = await this.client.bucket(this.bucketName).getFiles({ prefix: folder });
        return files;
      } else if (this.provider === 'local') {
        const folderPath = path.join(this.uploadDir, folder);
        if (!fs.existsSync(folderPath)) {
          return [];
        }
        return fs.readdirSync(folderPath);
      }
    } catch (error) {
      console.error(`List files failed: ${error.message}`);
      return [];
    }
  }
}

// ===== EXPORTS =====

module.exports = {
  StorageService,
  FILE_TYPES,
};
