// src/services/notification.service.js
// EventEmitter para eventos del ciclo de vida del usuario (T2).
// En la práctica final los listeners enviarán notificaciones a Slack;
// por ahora solo hacen log en consola.

import { EventEmitter } from 'events';

class NotificationService extends EventEmitter {}

export const notificationService = new NotificationService();

// ── Listeners ────────────────────────────────────────────────────────────────

notificationService.on('user:registered', (user) => {
  console.log(`[event] user:registered — ${user.email}`);
});

notificationService.on('user:verified', (user) => {
  console.log(`[event] user:verified — ${user.email}`);
});

notificationService.on('user:invited', (user) => {
  console.log(`[event] user:invited — ${user.email}`);
});

notificationService.on('user:deleted', (user) => {
  console.log(`[event] user:deleted — ${user.email}`);
});