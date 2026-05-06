// src/services/logger.service.ts

import { config } from '../config/index.js';

interface SlackPayload {
  text: string;
  attachments?: Array<{ text: string; color: string }>;
}

async function sendToSlack(payload: SlackPayload): Promise<void> {
  if (!config.slack.webhookUrl) return;
  try {
    await fetch(config.slack.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // No lanzar error desde el logger para no crear bucles
    console.error('[logger] No se pudo enviar mensaje a Slack');
  }
}

export const logger = {
  error(err: Error, req?: { method?: string; originalUrl?: string }): void {
    const method = req?.method ?? 'UNKNOWN';
    const url = req?.originalUrl ?? 'UNKNOWN';
    const ts = new Date().toISOString();

    console.error(`[${ts}] ${method} ${url} — ${err.message}`);

    void sendToSlack({
      text: `🚨 *Error 5XX en BildyApp*`,
      attachments: [
        {
          color: '#e53e3e',
          text: [
            `*Timestamp:* ${ts}`,
            `*Ruta:* \`${method} ${url}\``,
            `*Mensaje:* ${err.message}`,
            `*Stack:*\n\`\`\`${(err.stack ?? '').slice(0, 800)}\`\`\``,
          ].join('\n'),
        },
      ],
    });
  },

  info(message: string): void {
    console.log(`[${new Date().toISOString()}] INFO — ${message}`);
  },
};
