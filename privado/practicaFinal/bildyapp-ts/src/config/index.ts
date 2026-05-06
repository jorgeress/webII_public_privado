// src/config/index.ts

export const config = {
  get port() { return Number(process.env.PORT) || 3000; },
  get nodeEnv() { return process.env.NODE_ENV || 'development'; },
  get mongoUri() { return process.env.MONGODB_URI ?? ''; },

  get jwt() {
    return {
      accessSecret: process.env.JWT_ACCESS_SECRET ?? 'cambia_esto_por_un_secreto_largo_y_aleatorio',
      refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'otro_secreto_diferente_para_refresh',
      accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
      refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
    };
  },

  get upload() {
    return { maxSizeMb: Number(process.env.UPLOAD_MAX_SIZE_MB) || 5 };
  },

  get cloudinary() {
    return {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
      apiKey: process.env.CLOUDINARY_API_KEY ?? '',
      apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
    };
  },

  get mail() {
    return {
      host: process.env.MAIL_HOST ?? 'sandbox.smtp.mailtrap.io',
      port: Number(process.env.MAIL_PORT) || 2525,
      user: process.env.MAIL_USER ?? '',
      pass: process.env.MAIL_PASS ?? '',
      from: process.env.MAIL_FROM ?? 'noreply@bildyapp.com',
    };
  },

  get slack() {
    return { webhookUrl: process.env.SLACK_WEBHOOK_URL ?? '' };
  },
};