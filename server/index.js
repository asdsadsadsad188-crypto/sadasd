import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Конфигурация из переменных окружения
const PORT = process.env.PORT || 3000;

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

// Создаём HTTP сервер
const server = createServer(app);

// Создаём WebSocket сервер на том же порту
const wss = new WebSocketServer({ server });

// User registry
const users = new Map();
const socketToUsername = new Map();

wss.on('connection', (socket) => {
  console.log('Новое WebSocket соединение');

  socket.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleMessage(socket, message);
    } catch (e) {
      console.error('Ошибка парсинга сообщения:', e);
    }
  });

  socket.on('close', () => {
    handleDisconnect(socket);
  });

  socket.on('error', (error) => {
    console.error('WebSocket ошибка:', error);
  });
});

function handleMessage(socket, message) {
  const { type } = message;

  switch (type) {
    case 'register':
      handleRegister(socket, message.username);
      break;
    case 'search':
      handleSearch(socket, message.query);
      break;
    case 'offer':
    case 'answer':
    case 'ice-candidate':
      forwardMessage(socket, message.to, message);
      break;
    default:
      console.warn('Неизвестный тип сообщения:', type);
  }
}

function handleRegister(socket, username) {
  if (users.has(username)) {
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Username уже занят'
    }));
    return;
  }

  users.set(username, socket);
  socketToUsername.set(socket, username);

  console.log(`Пользователь зарегистрирован: ${username}`);

  socket.send(JSON.stringify({
    type: 'registered',
    username: username
  }));

  broadcastUserOnline(username, socket);
}

function handleSearch(socket, query) {
  const currentUsername = socketToUsername.get(socket);
  const results = [];

  for (const username of users.keys()) {
    if (username !== currentUsername && username.toLowerCase().includes(query.toLowerCase())) {
      results.push(username);
    }
  }

  socket.send(JSON.stringify({
    type: 'search-results',
    results: results
  }));
}

function forwardMessage(fromSocket, toUsername, message) {
  const targetSocket = users.get(toUsername);

  if (!targetSocket) {
    fromSocket.send(JSON.stringify({
      type: 'error',
      message: 'Пользователь не найден или оффлайн'
    }));
    return;
  }

  const fromUsername = socketToUsername.get(fromSocket);
  message.from = fromUsername;

  targetSocket.send(JSON.stringify(message));
}

function handleDisconnect(socket) {
  const username = socketToUsername.get(socket);

  if (username) {
    console.log(`Пользователь отключился: ${username}`);
    
    users.delete(username);
    socketToUsername.delete(socket);

    broadcastUserOffline(username);
  }
}

function broadcastUserOnline(username, excludeSocket) {
  const message = JSON.stringify({
    type: 'user-online',
    username: username
  });

  for (const [user, socket] of users.entries()) {
    if (socket !== excludeSocket) {
      socket.send(message);
    }
  }
}

function broadcastUserOffline(username) {
  const message = JSON.stringify({
    type: 'user-offline',
    username: username
  });

  for (const socket of users.values()) {
    socket.send(message);
  }
}

// Запуск сервера
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`HTTP: http://localhost:${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
});
