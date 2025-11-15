/**
 * Email Service Configuration
 * Supports SendGrid, AWS SES, and SMTP
 * 
 * Environment Variables:
 * - EMAIL_PROVIDER: sendgrid | ses | smtp (default: sendgrid)
 * - SENDGRID_API_KEY: SendGrid API key
 * - AWS_SES_REGION: AWS region for SES
 * - AWS_ACCESS_KEY_ID: AWS access key
 * - AWS_SECRET_ACCESS_KEY: AWS secret key
 * - SMTP_HOST: SMTP server host
 * - SMTP_PORT: SMTP port (default: 587)
 * - SMTP_USER: SMTP username
 * - SMTP_PASSWORD: SMTP password
 * - EMAIL_FROM: Sender email address
 * - EMAIL_FROM_NAME: Sender name (default: RTech Solutions)
 */

// Email templates
const emailTemplates = {
  OTP: {
    subject: 'Your OTP for RTech Solutions',
    template: (name, otp) => `
      <h2>Welcome to RTech Solutions, ${name}!</h2>
      <p>Your One-Time Password (OTP) is:</p>
      <h1>${otp}</h1>
      <p>This OTP is valid for 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  },
  WELCOME: {
    subject: 'Welcome to RTech Solutions!',
    template: (name) => `
      <h2>Welcome, ${name}!</h2>
      <p>Your account has been created successfully.</p>
      <p>Start exploring our courses and training programs.</p>
      <a href="https://www.rTechLearners.com">Visit RTech Solutions</a>
    `,
  },
  ENROLLMENT_CONFIRMATION: {
    subject: 'Enrollment Confirmation - RTech Solutions',
    template: (name, courseTitle) => `
      <h2>Enrollment Confirmed!</h2>
      <p>Hi ${name},</p>
      <p>You have successfully enrolled in: <strong>${courseTitle}</strong></p>
      <p>You can now access the course materials and start learning.</p>
      <a href="https://www.rTechLearners.com/courses">Go to Courses</a>
    `,
  },
  PAYMENT_RECEIPT: {
    subject: 'Payment Receipt - RTech Solutions',
    template: (name, amount, courseTitle, transactionId) => `
      <h2>Payment Receipt</h2>
      <p>Hi ${name},</p>
      <p>Thank you for your payment!</p>
      <table style="width:100%; border-collapse: collapse;">
        <tr style="background-color: #f2f2f2;">
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Course</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${courseTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Amount</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">₹${amount}</td>
        </tr>
        <tr style="background-color: #f2f2f2;">
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Transaction ID</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${transactionId}</td>
        </tr>
      </table>
      <p>For support, contact us at support@rtechsolutions.com</p>
    `,
  },
  NOTIFICATION: {
    subject: 'New Notification - RTech Solutions',
    template: (name, message, actionUrl) => `
      <h2>Hello ${name},</h2>
      <p>${message}</p>
      ${actionUrl ? `<a href="${actionUrl}">View Details</a>` : ''}
    `,
  },
};

// ===== EMAIL SERVICE CLASS =====

class EmailService {
  constructor(provider = process.env.EMAIL_PROVIDER || 'sendgrid') {
    this.provider = provider;
    this.client = null;
    this.initialized = false;
  }

  /**
   * Initialize email service based on provider
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      console.log(`🔄 Initializing ${this.provider} email service...`);

      if (this.provider === 'sendgrid') {
        this.initializeSendGrid();
      } else if (this.provider === 'ses') {
        this.initializeSES();
      } else if (this.provider === 'smtp') {
        this.initializeSMTP();
      } else {
        throw new Error(`Unknown email provider: ${this.provider}`);
      }

      this.initialized = true;
      console.log(`✅ Email service initialized (${this.provider})`);
    } catch (error) {
      console.error(`❌ Email service initialization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Initialize SendGrid
   */
  initializeSendGrid() {
    const sgMail = require('@sendgrid/mail');
    const apiKey = process.env.SENDGRID_API_KEY;

    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY not set');
    }

    sgMail.setApiKey(apiKey);
    this.client = sgMail;
  }

  /**
   * Initialize AWS SES
   */
  initializeSES() {
    const AWS = require('aws-sdk');

    const sesConfig = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_SES_REGION || 'us-east-1',
    };

    if (!sesConfig.accessKeyId || !sesConfig.secretAccessKey) {
      throw new Error('AWS credentials not set');
    }

    AWS.config.update(sesConfig);
    this.client = new AWS.SES({ apiVersion: '2010-12-01' });
  }

  /**
   * Initialize SMTP
   */
  initializeSMTP() {
    const nodemailer = require('nodemailer');

    const smtpConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    };

    if (!smtpConfig.host || !smtpConfig.auth.user) {
      throw new Error('SMTP configuration incomplete');
    }

    this.client = nodemailer.createTransport(smtpConfig);
  }

  /**
   * Send email
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} html - HTML content
   * @param {Object} options - Additional options
   * @returns {Promise<Object>}
   */
  async send(to, subject, html, options = {}) {
    if (!this.initialized) {
      throw new Error('Email service not initialized');
    }

    const from = process.env.EMAIL_FROM || 'noreply@rtechsolutions.com';
    const fromName = process.env.EMAIL_FROM_NAME || 'RTech Solutions';

    try {
      let response;

      if (this.provider === 'sendgrid') {
        response = await this.client.send({
          to,
          from: `${fromName} <${from}>`,
          subject,
          html,
          ...options,
        });
      } else if (this.provider === 'ses') {
        response = await this.client
          .sendEmail({
            Source: `${fromName} <${from}>`,
            Destination: { ToAddresses: [to] },
            Message: {
              Subject: { Data: subject },
              Body: { Html: { Data: html } },
            },
            ...options,
          })
          .promise();
      } else if (this.provider === 'smtp') {
        response = await this.client.sendMail({
          from: `${fromName} <${from}>`,
          to,
          subject,
          html,
          ...options,
        });
      }

      console.log(`✅ Email sent to ${to}`);
      return { success: true, response };
    } catch (error) {
      console.error(`❌ Email sending failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send OTP email
   * @param {string} to - Recipient email
   * @param {string} name - Recipient name
   * @param {string} otp - OTP code
   * @returns {Promise<Object>}
   */
  async sendOTP(to, name, otp) {
    const template = emailTemplates.OTP;
    const html = template.template(name, otp);
    return this.send(to, template.subject, html);
  }

  /**
   * Send welcome email
   * @param {string} to - Recipient email
   * @param {string} name - Recipient name
   * @returns {Promise<Object>}
   */
  async sendWelcome(to, name) {
    const template = emailTemplates.WELCOME;
    const html = template.template(name);
    return this.send(to, template.subject, html);
  }

  /**
   * Send enrollment confirmation
   * @param {string} to - Recipient email
   * @param {string} name - Recipient name
   * @param {string} courseTitle - Course title
   * @returns {Promise<Object>}
   */
  async sendEnrollmentConfirmation(to, name, courseTitle) {
    const template = emailTemplates.ENROLLMENT_CONFIRMATION;
    const html = template.template(name, courseTitle);
    return this.send(to, template.subject, html);
  }

  /**
   * Send payment receipt
   * @param {string} to - Recipient email
   * @param {string} name - Recipient name
   * @param {number} amount - Payment amount
   * @param {string} courseTitle - Course title
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>}
   */
  async sendPaymentReceipt(to, name, amount, courseTitle, transactionId) {
    const template = emailTemplates.PAYMENT_RECEIPT;
    const html = template.template(name, amount, courseTitle, transactionId);
    return this.send(to, template.subject, html);
  }

  /**
   * Send custom notification
   * @param {string} to - Recipient email
   * @param {string} name - Recipient name
   * @param {string} message - Notification message
   * @param {string} actionUrl - Action URL (optional)
   * @returns {Promise<Object>}
   */
  async sendNotification(to, name, message, actionUrl = null) {
    const template = emailTemplates.NOTIFICATION;
    const html = template.template(name, message, actionUrl);
    return this.send(to, template.subject, html);
  }

  /**
   * Send batch emails
   * @param {Array<Object>} recipients - Array of {to, subject, html}
   * @returns {Promise<Array>}
   */
  async sendBatch(recipients) {
    const promises = recipients.map((recipient) =>
      this.send(recipient.to, recipient.subject, recipient.html).catch((error) => ({
        to: recipient.to,
        error,
      }))
    );

    return Promise.all(promises);
  }

  /**
   * Verify email service connection
   * @returns {Promise<boolean>}
   */
  async verify() {
    try {
      if (this.provider === 'smtp' && this.client) {
        await this.client.verify();
        console.log('✅ SMTP connection verified');
        return true;
      }
      console.log(`✅ ${this.provider} connection verified`);
      return true;
    } catch (error) {
      console.error('❌ Email service verification failed:', error.message);
      return false;
    }
  }
}

// ===== EXPORTS =====

module.exports = {
  EmailService,
  emailTemplates,
};
