/**
 * StorageManager - управляет локальным хранилищем данных
 */
export class StorageManager {
  constructor() {
    this.STORAGE_KEYS = {
      USERNAME: 'p2p_messenger_username',
      MESSAGES_PREFIX: 'p2p_messenger_messages_',
      CHAT_LIST: 'p2p_messenger_chat_list'
    };
  }

  /**
   * Проверяет доступность localStorage
   * @returns {boolean}
   */
  isStorageAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Сохраняет username
   * @param {string} username
   */
  saveUsername(username) {
    if (!this.isStorageAvailable()) {
      console.warn('localStorage недоступен');
      return;
    }
    
    try {
      localStorage.setItem(this.STORAGE_KEYS.USERNAME, username);
    } catch (e) {
      console.error('Ошибка сохранения username:', e);
    }
  }

  /**
   * Загружает username
   * @returns {string|null}
   */
  loadUsername() {
    if (!this.isStorageAvailable()) {
      return null;
    }
    
    try {
      return localStorage.getItem(this.STORAGE_KEYS.USERNAME);
    } catch (e) {
      console.error('Ошибка загрузки username:', e);
      return null;
    }
  }

  /**
   * Сохраняет сообщение
   * @param {string} remoteUsername - Username собеседника
   * @param {Object} message - Объект сообщения
   */
  saveMessage(remoteUsername, message) {
    if (!this.isStorageAvailable()) {
      return;
    }
    
    try {
      const messages = this.loadMessages(remoteUsername);
      messages.push(message);
      
      const key = this.STORAGE_KEYS.MESSAGES_PREFIX + remoteUsername;
      localStorage.setItem(key, JSON.stringify(messages));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn('Превышен лимит localStorage, очищаем старые сообщения');
        this.clearOldMessages(remoteUsername);
      } else {
        console.error('Ошибка сохранения сообщения:', e);
      }
    }
  }

  /**
   * Загружает сообщения для конкретного чата
   * @param {string} remoteUsername - Username собеседника
   * @returns {Array} Массив сообщений
   */
  loadMessages(remoteUsername) {
    if (!this.isStorageAvailable()) {
      return [];
    }
    
    try {
      const key = this.STORAGE_KEYS.MESSAGES_PREFIX + remoteUsername;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Ошибка загрузки сообщений:', e);
      return [];
    }
  }

  /**
   * Очищает сообщения для конкретного чата
   * @param {string} remoteUsername - Username собеседника
   */
  clearMessages(remoteUsername) {
    if (!this.isStorageAvailable()) {
      return;
    }
    
    try {
      const key = this.STORAGE_KEYS.MESSAGES_PREFIX + remoteUsername;
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Ошибка очистки сообщений:', e);
    }
  }

  /**
   * Очищает старые сообщения (оставляет последние 500)
   * @param {string} remoteUsername - Username собеседника
   */
  clearOldMessages(remoteUsername) {
    const messages = this.loadMessages(remoteUsername);
    if (messages.length > 500) {
      const recentMessages = messages.slice(-500);
      const key = this.STORAGE_KEYS.MESSAGES_PREFIX + remoteUsername;
      localStorage.setItem(key, JSON.stringify(recentMessages));
    }
  }

  /**
   * Сохраняет список чатов
   * @param {Array<string>} chats - Массив usernames
   */
  saveChatList(chats) {
    if (!this.isStorageAvailable()) {
      return;
    }
    
    try {
      localStorage.setItem(this.STORAGE_KEYS.CHAT_LIST, JSON.stringify(chats));
    } catch (e) {
      console.error('Ошибка сохранения списка чатов:', e);
    }
  }

  /**
   * Загружает список чатов
   * @returns {Array<string>} Массив usernames
   */
  loadChatList() {
    if (!this.isStorageAvailable()) {
      return [];
    }
    
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.CHAT_LIST);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Ошибка загрузки списка чатов:', e);
      return [];
    }
  }
}
