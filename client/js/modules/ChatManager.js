/**
 * ChatManager - управляет чатами и сообщениями
 */
export class ChatManager {
  constructor(connectionManager, storageManager) {
    this.connectionManager = connectionManager;
    this.storageManager = storageManager;
    this.chats = new Map(); // remoteUsername -> Chat
    this.activeChat = null;
    this.eventHandlers = {
      'newMessage': [],
      'chatCreated': []
    };

    // Подписка на входящие сообщения
    this.connectionManager.on('message', (remoteUsername, message) => {
      this.handleIncomingMessage(remoteUsername, message);
    });

    // Загрузка существующих чатов из storage
    this.loadChatsFromStorage();
  }

  /**
   * Загружает чаты из storage
   */
  loadChatsFromStorage() {
    const chatList = this.storageManager.loadChatList();
    chatList.forEach(remoteUsername => {
      const messages = this.storageManager.loadMessages(remoteUsername);
      const chat = {
        remoteUsername,
        messages,
        lastMessage: messages[messages.length - 1] || null,
        unreadCount: 0,
        connectionStatus: 'disconnected'
      };
      this.chats.set(remoteUsername, chat);
    });
  }

  /**
   * Создает новый чат
   * @param {string} remoteUsername
   * @returns {Object} Chat object
   */
  createChat(remoteUsername) {
    if (this.chats.has(remoteUsername)) {
      return this.chats.get(remoteUsername);
    }

    const chat = {
      remoteUsername,
      messages: [],
      lastMessage: null,
      unreadCount: 0,
      connectionStatus: 'connecting'
    };

    this.chats.set(remoteUsername, chat);
    this.updateChatList();
    this.emit('chatCreated', chat);

    return chat;
  }

  /**
   * Получает чат
   * @param {string} remoteUsername
   * @returns {Object|null}
   */
  getChat(remoteUsername) {
    return this.chats.get(remoteUsername) || null;
  }

  /**
   * Получает все чаты
   * @returns {Array<Object>}
   */
  getAllChats() {
    return Array.from(this.chats.values());
  }

  /**
   * Устанавливает активный чат
   * @param {string} remoteUsername
   */
  setActiveChat(remoteUsername) {
    this.activeChat = remoteUsername;
    const chat = this.chats.get(remoteUsername);
    if (chat) {
      chat.unreadCount = 0;
    }
  }

  /**
   * Отправляет сообщение
   * @param {string} remoteUsername
   * @param {string} text
   * @returns {Object|null} Message object или null если не удалось отправить
   */
  sendMessage(remoteUsername, text) {
    if (!text || text.trim() === '') {
      return null;
    }

    const message = {
      id: this.generateMessageId(),
      from: this.connectionManager.localUsername,
      to: remoteUsername,
      text: text.trim(),
      timestamp: Date.now(),
      delivered: false
    };

    // Попытка отправить через data channel
    const sent = this.connectionManager.sendMessage(remoteUsername, message);
    
    if (sent) {
      message.delivered = true;
    }

    // Добавляем в чат
    let chat = this.chats.get(remoteUsername);
    if (!chat) {
      chat = this.createChat(remoteUsername);
    }

    chat.messages.push(message);
    chat.lastMessage = message;

    // Сохраняем в storage
    this.storageManager.saveMessage(remoteUsername, message);

    this.emit('newMessage', remoteUsername, message);

    return message;
  }

  /**
   * Обрабатывает входящее сообщение
   * @param {string} remoteUsername
   * @param {Object} message
   */
  handleIncomingMessage(remoteUsername, message) {
    let chat = this.chats.get(remoteUsername);
    if (!chat) {
      chat = this.createChat(remoteUsername);
    }

    chat.messages.push(message);
    chat.lastMessage = message;

    // Увеличиваем счетчик непрочитанных если чат неактивен
    if (this.activeChat !== remoteUsername) {
      chat.unreadCount++;
    }

    // Сохраняем в storage
    this.storageManager.saveMessage(remoteUsername, message);

    this.emit('newMessage', remoteUsername, message);
  }

  /**
   * Загружает историю чата
   * @param {string} remoteUsername
   * @returns {Array<Object>} Массив сообщений
   */
  loadChatHistory(remoteUsername) {
    const chat = this.chats.get(remoteUsername);
    if (chat) {
      return chat.messages;
    }
    return this.storageManager.loadMessages(remoteUsername);
  }

  /**
   * Обновляет статус соединения чата
   * @param {string} remoteUsername
   * @param {string} status - 'connected' | 'disconnected' | 'connecting'
   */
  updateConnectionStatus(remoteUsername, status) {
    const chat = this.chats.get(remoteUsername);
    if (chat) {
      chat.connectionStatus = status;
    }
  }

  /**
   * Обновляет список чатов в storage
   */
  updateChatList() {
    const chatList = Array.from(this.chats.keys());
    this.storageManager.saveChatList(chatList);
  }

  /**
   * Генерирует уникальный ID сообщения
   * @returns {string}
   */
  generateMessageId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Подписывается на событие
   * @param {string} event
   * @param {Function} handler
   */
  on(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].push(handler);
    }
  }

  /**
   * Вызывает обработчики события
   * @param {string} event
   * @param {...any} args
   */
  emit(event, ...args) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => {
        try {
          handler(...args);
        } catch (e) {
          console.error(`Ошибка в обработчике события ${event}:`, e);
        }
      });
    }
  }
}
