/**
 * UIController - управляет пользовательским интерфейсом
 */
export class UIController {
  constructor(chatManager, signalingClient, connectionManager) {
    this.chatManager = chatManager;
    this.signalingClient = signalingClient;
    this.connectionManager = connectionManager;
    this.searchTimeout = null;
  }

  /**
   * Инициализирует UI и event listeners
   */
  init() {
    // Поиск пользователей
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
      this.handleSearch(e.target.value);
    });

    // Отправка сообщения
    const sendButton = document.getElementById('send-button');
    const messageInput = document.getElementById('message-input');
    
    sendButton.addEventListener('click', () => {
      this.handleSendMessage();
    });

    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleSendMessage();
      }
    });

    // Подписка на события чата
    this.chatManager.on('newMessage', (remoteUsername, message) => {
      this.handleNewMessage(remoteUsername, message);
    });

    this.chatManager.on('chatCreated', (chat) => {
      this.updateChatList();
    });

    // Подписка на изменения состояния соединения
    this.connectionManager.on('connectionStateChange', (remoteUsername, state) => {
      this.updateConnectionStatus(remoteUsername, state);
    });
  }

  /**
   * Отображает username пользователя
   * @param {string} username
   */
  displayUsername(username) {
    const usernameDisplay = document.getElementById('current-username');
    usernameDisplay.textContent = username;
  }

  /**
   * Обрабатывает поиск с debouncing
   * @param {string} query
   */
  handleSearch(query) {
    clearTimeout(this.searchTimeout);

    if (!query || query.trim() === '') {
      this.displaySearchResults([]);
      return;
    }

    this.searchTimeout = setTimeout(async () => {
      try {
        const results = await this.signalingClient.searchUsers(query.trim());
        this.displaySearchResults(results);
      } catch (error) {
        console.error('Ошибка поиска:', error);
      }
    }, 300);
  }

  /**
   * Отображает результаты поиска
   * @param {Array<string>} usernames
   */
  displaySearchResults(usernames) {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';

    if (usernames.length === 0) {
      const searchInput = document.getElementById('search-input');
      if (searchInput.value.trim() !== '') {
        resultsContainer.innerHTML = '<div class="no-results">Пользователи не найдены</div>';
      }
      return;
    }

    usernames.forEach(username => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.textContent = username;
      item.addEventListener('click', () => {
        this.handleUserSelect(username);
      });
      resultsContainer.appendChild(item);
    });
  }

  /**
   * Обрабатывает выбор пользователя из поиска
   * @param {string} username
   */
  async handleUserSelect(username) {
    // Создаем или получаем чат
    let chat = this.chatManager.getChat(username);
    if (!chat) {
      chat = this.chatManager.createChat(username);
    }

    // Инициируем соединение
    try {
      await this.connectionManager.initiateConnection(username);
      this.updateConnectionStatus(username, 'connecting');
    } catch (error) {
      console.error('Ошибка установления соединения:', error);
    }

    // Отображаем чат
    this.displayChat(username);

    // Очищаем поиск
    document.getElementById('search-input').value = '';
    this.displaySearchResults([]);

    // Обновляем список чатов
    this.updateChatList();
  }

  /**
   * Обновляет список чатов
   */
  updateChatList() {
    const chatList = document.getElementById('chat-list');
    const chats = this.chatManager.getAllChats();

    if (chats.length === 0) {
      chatList.innerHTML = '<div class="no-chats">Нет активных чатов</div>';
      return;
    }

    chatList.innerHTML = '';

    chats.forEach(chat => {
      const item = document.createElement('div');
      item.className = 'chat-item';
      
      if (this.chatManager.activeChat === chat.remoteUsername) {
        item.classList.add('active');
      }

      const header = document.createElement('div');
      header.className = 'chat-item-header';

      const username = document.createElement('div');
      username.className = 'chat-item-username';
      username.textContent = chat.remoteUsername;

      const status = document.createElement('div');
      status.className = `chat-item-status ${chat.connectionStatus}`;
      status.textContent = this.getStatusText(chat.connectionStatus);

      header.appendChild(username);
      header.appendChild(status);

      item.appendChild(header);

      if (chat.lastMessage) {
        const lastMessage = document.createElement('div');
        lastMessage.className = 'chat-item-last-message';
        lastMessage.textContent = chat.lastMessage.text;
        item.appendChild(lastMessage);
      }

      if (chat.unreadCount > 0) {
        const unread = document.createElement('div');
        unread.className = 'chat-item-unread';
        unread.textContent = chat.unreadCount;
        item.appendChild(unread);
      }

      item.addEventListener('click', () => {
        this.displayChat(chat.remoteUsername);
      });

      chatList.appendChild(item);
    });
  }

  /**
   * Отображает чат
   * @param {string} remoteUsername
   */
  displayChat(remoteUsername) {
    this.chatManager.setActiveChat(remoteUsername);

    // Скрываем welcome screen, показываем чат
    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('chat-container').style.display = 'flex';

    // Обновляем заголовок чата
    document.getElementById('chat-peer-username').textContent = remoteUsername;

    // Загружаем и отображаем сообщения
    const messages = this.chatManager.loadChatHistory(remoteUsername);
    this.displayMessages(messages);

    // Обновляем статус соединения
    const chat = this.chatManager.getChat(remoteUsername);
    if (chat) {
      this.updateConnectionStatus(remoteUsername, chat.connectionStatus);
    }

    // Обновляем список чатов
    this.updateChatList();

    // Фокус на поле ввода
    document.getElementById('message-input').focus();
  }

  /**
   * Отображает сообщения в чате
   * @param {Array<Object>} messages
   */
  displayMessages(messages) {
    const messagesArea = document.getElementById('messages-area');
    messagesArea.innerHTML = '';

    messages.forEach(message => {
      this.addMessageToUI(message);
    });

    // Прокрутка вниз
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }

  /**
   * Добавляет сообщение в UI
   * @param {Object} message
   */
  addMessageToUI(message) {
    const messagesArea = document.getElementById('messages-area');
    const messageDiv = document.createElement('div');
    
    const isSent = message.from === this.connectionManager.localUsername;
    messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    if (!isSent) {
      const sender = document.createElement('div');
      sender.className = 'message-sender';
      sender.textContent = message.from;
      bubble.appendChild(sender);
    }

    const text = document.createElement('div');
    text.className = 'message-text';
    text.textContent = message.text;
    bubble.appendChild(text);

    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = this.formatTime(message.timestamp);
    bubble.appendChild(time);

    messageDiv.appendChild(bubble);
    messagesArea.appendChild(messageDiv);

    // Прокрутка вниз
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }

  /**
   * Обрабатывает новое сообщение
   * @param {string} remoteUsername
   * @param {Object} message
   */
  handleNewMessage(remoteUsername, message) {
    // Если это активный чат, добавляем сообщение
    if (this.chatManager.activeChat === remoteUsername) {
      this.addMessageToUI(message);
    } else {
      // Показываем уведомление
      this.showNotification(`Новое сообщение от ${remoteUsername}`);
    }

    // Обновляем список чатов
    this.updateChatList();
  }

  /**
   * Обрабатывает отправку сообщения
   */
  handleSendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();

    if (!text || !this.chatManager.activeChat) {
      return;
    }

    const message = this.chatManager.sendMessage(this.chatManager.activeChat, text);
    
    if (message) {
      this.addMessageToUI(message);
      input.value = '';
      this.updateChatList();
    }
  }

  /**
   * Обновляет статус соединения
   * @param {string} remoteUsername
   * @param {string} state
   */
  updateConnectionStatus(remoteUsername, state) {
    let status = 'disconnected';
    
    if (state === 'connected') {
      status = 'connected';
    } else if (state === 'connecting' || state === 'new') {
      status = 'connecting';
    }

    this.chatManager.updateConnectionStatus(remoteUsername, status);

    // Обновляем UI если это активный чат
    if (this.chatManager.activeChat === remoteUsername) {
      const statusElement = document.getElementById('connection-status');
      statusElement.className = `connection-status ${status}`;
      statusElement.textContent = this.getStatusText(status);
    }

    // Обновляем список чатов
    this.updateChatList();
  }

  /**
   * Показывает уведомление
   * @param {string} message
   */
  showNotification(message) {
    // Простое уведомление в консоли
    console.log('Уведомление:', message);
    
    // Можно добавить browser notification API
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('P2P Messenger', { body: message });
    }
  }

  /**
   * Форматирует время
   * @param {number} timestamp
   * @returns {string}
   */
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Получает текст статуса
   * @param {string} status
   * @returns {string}
   */
  getStatusText(status) {
    const statusTexts = {
      'connected': 'Подключен',
      'connecting': 'Подключение...',
      'disconnected': 'Отключен'
    };
    return statusTexts[status] || 'Неизвестно';
  }
}
