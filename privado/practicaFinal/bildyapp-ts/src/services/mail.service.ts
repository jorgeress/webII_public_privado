// src/services/mail.service.ts

import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

const transporter = nodemailer.createTransport({
  host: config.mail.host,
  port: config.mail.port,
  auth: { user: config.mail.user, pass: config.mail.pass },
});

export const mailService = {
  async sendVerificationCode(to: string, code: string): Promise<void> {
    await transporter.sendMail({
      from: `"BildyApp" <${config.mail.from}>`,
      to,
      subject: 'Verifica tu cuenta — BildyApp',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#2563eb">BildyApp</h2>
          <p>Tu código de verificación es:</p>
          <div style="font-size:2.5rem;font-weight:bold;letter-spacing:0.3rem;
                      text-align:center;padding:1rem;background:#f1f5f9;
                      border-radius:8px;margin:1rem 0">${code}</div>
          <p style="color:#64748b;font-size:0.9rem">
            Este código expira en 24 horas. Si no creaste esta cuenta, ignora este correo.
          </p>
        </div>
      `,
    });
  },

  async sendInvitation(to: string, code: string, inviterName: string): Promise<void> {
    await transporter.sendMail({
      from: `"BildyApp" <${config.mail.from}>`,
      to,
      subject: `${inviterName} te ha invitado a BildyApp`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#2563eb">BildyApp</h2>
          <p><strong>${inviterName}</strong> te ha invitado a unirte a su equipo.</p>
          <p>Tu código de acceso es:</p>
          <div style="font-size:2rem;font-weight:bold;letter-spacing:0.3rem;
                      text-align:center;padding:1rem;background:#f1f5f9;
                      border-radius:8px;margin:1rem 0">${code}</div>
        </div>
      `,
    });
  },
};
