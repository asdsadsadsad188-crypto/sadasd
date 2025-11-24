/**
 * Конфигурация приложения
 */

// Определяем окружение
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// Signaling server URL
export const SIGNALING_SERVER_URL = isProduction
  ? 'wss://sadasd-yv8v.onrender.com' // Production WebSocket URL
  : 'ws://localhost:8080'; // Development WebSocket URL

// WebRTC конфигурация
export const ICE_SERVERS = [
  {
    urls: 'stun:stun.l.google.com:19302'
  },
  {
    urls: 'stun:stun1.l.google.com:19302'
  },
  {
    urls: 'stun:stun2.l.google.com:19302'
  },
  // Можно добавить TURN серверы для более надежного соединения
  // {
  //   urls: 'turn:your-turn-server.com:3478',
  //   username: 'username',
  //   credential: 'password'
  // }
];

// Настройки приложения
export const APP_CONFIG = {
  maxMessagesPerChat: 1000,
  searchDebounceMs: 300,
  reconnectDelayMs: 3000,
  connectionTimeoutMs: 30000
};
