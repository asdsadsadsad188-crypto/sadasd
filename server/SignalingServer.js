import { WebSocketServer } from 'ws';

/**
 * SignalingServer - координирует установление WebRTC соединений
 */
export class SignalingServer {
  constructor(port = 8080) {
    this.port = port;
    this.wss = null;
    this.users = new Map(); // username -> socket
    this.socketToUsername = new Map(); // socket -> username
  }

  /**
   * Запускает WebSocket сервер
   */
  start() {
    this.wss = new WebSocketServer({ port: this.port });

    this.wss.on('connection', (socket) => {
      console.log('Новое WebSocket соединение');

      socket.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(socket, message);
        } catch (e) {
          console.error('Ошибка парсинга сообщения:', e);
        }
      });

      socket.on('close', () => {
        this.handleDisconnect(socket);
      });

      socket.on('error', (error) => {
        console.error('WebSocket ошибка:', error);
      });
    });

    console.log(`Signaling server запущен на порту ${this.port}`);
  }

  /**
   * Обрабатывает входящие сообщения
   * @param {WebSocket} socket
   * @param {Object} message
   */
  handleMessage(socket, message) {
    const { type } = message;

    switch (type) {
      case 'register':
        this.handleRegister(socket, message.username);
        break;
      case 'search':
        this.handleSearch(socket, message.query);
        break;
      case 'offer':
      case 'answer':
      case 'ice-candidate':
        this.forwardMessage(socket, message.to, message);
        break;
      default:
        console.warn('Неизвестный тип сообщения:', type);
    }
  }

  /**
   * Регистрирует пользователя
   * @param {WebSocket} socket
   * @param {string} username
   */
  handleRegister(socket, username) {
    // Проверка на дубликат username
    if (this.users.has(username)) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Username уже занят'
      }));
      return;
    }

    // Регистрация пользователя
    this.users.set(username, socket);
    this.socketToUsername.set(socket, username);

    console.log(`Пользователь зарегистрирован: ${username}`);

    // Подтверждение регистрации
    socket.send(JSON.stringify({
      type: 'registered',
      username: username
    }));

    // Уведомление других пользователей
    this.broadcastUserOnline(username, socket);
  }

  /**
   * Обрабатывает поиск пользователей
   * @param {WebSocket} socket
   * @param {string} query
   */
  handleSearch(socket, query) {
    const currentUsername = this.socketToUsername.get(socket);
    const results = [];

    // Поиск пользователей по подстроке
    for (const username of this.users.keys()) {
      if (username !== currentUsername && username.toLowerCase().includes(query.toLowerCase())) {
        results.push(username);
      }
    }

    socket.send(JSON.stringify({
      type: 'search-results',
      results: results
    }));
  }

  /**
   * Пересылает signaling сообщение целевому пользователю
   * @param {WebSocket} fromSocket
   * @param {string} toUsername
   * @param {Object} message
   */
  forwardMessage(fromSocket, toUsername, message) {
    const targetSocket = this.users.get(toUsername);

    if (!targetSocket) {
      fromSocket.send(JSON.stringify({
        type: 'error',
        message: 'Пользователь не найден или оффлайн'
      }));
      return;
    }

    // Добавляем информацию об отправителе
    const fromUsername = this.socketToUsername.get(fromSocket);
    message.from = fromUsername;

    targetSocket.send(JSON.stringify(message));
  }

  /**
   * Обрабатывает отключение пользователя
   * @param {WebSocket} socket
   */
  handleDisconnect(socket) {
    const username = this.socketToUsername.get(socket);

    if (username) {
      console.log(`Пользователь отключился: ${username}`);
      
      this.users.delete(username);
      this.socketToUsername.delete(socket);

      // Уведомление других пользователей
      this.broadcastUserOffline(username);
    }
  }

  /**
   * Уведомляет всех о новом пользователе онлайн
   * @param {string} username
   * @param {WebSocket} excludeSocket
   */
  broadcastUserOnline(username, excludeSocket) {
    const message = JSON.stringify({
      type: 'user-online',
      username: username
    });

    for (const [user, socket] of this.users.entries()) {
      if (socket !== excludeSocket) {
        socket.send(message);
      }
    }
  }

  /**
   * Уведомляет всех о пользователе оффлайн
   * @param {string} username
   */
  broadcastUserOffline(username) {
    const message = JSON.stringify({
      type: 'user-offline',
      username: username
    });

    for (const socket of this.users.values()) {
      socket.send(message);
    }
  }
}
