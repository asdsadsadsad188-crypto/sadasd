import express from 'express';
import { SignalingServer } from './SignalingServer.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Конфигурация из переменных окружения
const WS_PORT = process.env.WS_PORT || 8080;
const HTTP_PORT = process.env.HTTP_PORT || 3000;

// Запуск Signaling Server
const signalingServer = new SignalingServer(WS_PORT);
signalingServer.start();

// Настройка Express для статических файлов
const app = express();

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Статические файлы из client директории
app.use(express.static(path.join(__dirname, '../client')));

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Запуск HTTP сервера
app.listen(HTTP_PORT, () => {
  console.log(`HTTP сервер запущен на http://localhost:${HTTP_PORT}`);
  console.log(`WebSocket сервер на ws://localhost:${WS_PORT}`);
});
