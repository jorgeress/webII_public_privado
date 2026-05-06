// src/config/index.ts

export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI ?? '',

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh',
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },

  upload: {
    maxSizeMb: Number(process.env.UPLOAD_MAX_SIZE_MB) || 5,
    dest: 'uploads/',
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
    apiKey: process.env.CLOUDINARY_API_KEY ?? '',
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
  },

  mail: {
    host: process.env.MAIL_HOST ?? 'sandbox.smtp.mailtrap.io',
    port: Number(process.env.MAIL_PORT) || 2525,
    user: process.env.MAIL_USER ?? '',
    pass: process.env.MAIL_PASS ?? '',
    from: process.env.MAIL_FROM ?? 'noreply@bildyapp.com',
  },

  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL ?? '',
  },
} as const;
