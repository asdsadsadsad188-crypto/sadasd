/**
 * SignalingClient - управляет WebSocket соединением с signaling сервером
 */
export class SignalingClient {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.ws = null;
    this.username = null;
    this.eventHandlers = {
      'offer': [],
      'answer': [],
      'iceCandidate': [],
      'userOnline': [],
      'userOffline': [],
      'registered': [],
      'searchResults': [],
      'error': []
    };
  }

  /**
   * Подключается к signaling серверу
   * @returns {Promise<void>}
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.serverUrl);

        this.ws.onopen = () => {
          console.log('Подключено к signaling серверу');
          resolve();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket ошибка:', error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = () => {
          console.log('Отключено от signaling сервера');
          // Попытка переподключения через 3 секунды
          setTimeout(() => {
            if (this.username) {
              console.log('Попытка переподключения...');
              this.connect().then(() => {
                this.register(this.username);
              });
            }
          }, 3000);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Отключается от сервера
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Регистрирует username на сервере
   * @param {string} username
   * @returns {Promise<void>}
   */
  register(username) {
    return new Promise((resolve, reject) => {
      this.username = username;
      
      const onRegistered = () => {
        this.off('registered', onRegistered);
        this.off('error', onError);
        resolve();
      };

      const onError = (error) => {
        this.off('registered', onRegistered);
        this.off('error', onError);
        reject(new Error(error.message));
      };

      this.on('registered', onRegistered);
      this.on('error', onError);

      this.send({
        type: 'register',
        username: username
      });
    });
  }

  /**
   * Отправляет offer peer'у
   * @param {string} targetUsername
   * @param {RTCSessionDescriptionInit} offer
   */
  sendOffer(targetUsername, offer) {
    this.send({
      type: 'offer',
      to: targetUsername,
      payload: offer
    });
  }

  /**
   * Отправляет answer peer'у
   * @param {string} targetUsername
   * @param {RTCSessionDescriptionInit} answer
   */
  sendAnswer(targetUsername, answer) {
    this.send({
      type: 'answer',
      to: targetUsername,
      payload: answer
    });
  }

  /**
   * Отправляет ICE candidate
   * @param {string} targetUsername
   * @param {RTCIceCandidate} candidate
   */
  sendIceCandidate(targetUsername, candidate) {
    this.send({
      type: 'ice-candidate',
      to: targetUsername,
      payload: candidate
    });
  }

  /**
   * Ищет пользователей по запросу
   * @param {string} query
   * @returns {Promise<string[]>}
   */
  searchUsers(query) {
    return new Promise((resolve) => {
      const onResults = (results) => {
        this.off('searchResults', onResults);
        resolve(results);
      };

      this.on('searchResults', onResults);

      this.send({
        type: 'search',
        query: query
      });
    });
  }

  /**
   * Отправляет сообщение на сервер
   * @param {Object} message
   */
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket не подключен');
    }
  }

  /**
   * Обрабатывает входящие сообщения
   * @param {string} data
   */
  handleMessage(data) {
    try {
      const message = JSON.parse(data);
      const { type } = message;

      switch (type) {
        case 'offer':
          this.emit('offer', message.from, message.payload);
          break;
        case 'answer':
          this.emit('answer', message.from, message.payload);
          break;
        case 'ice-candidate':
          this.emit('iceCandidate', message.from, message.payload);
          break;
        case 'user-online':
          this.emit('userOnline', message.username);
          break;
        case 'user-offline':
          this.emit('userOffline', message.username);
          break;
        case 'registered':
          this.emit('registered');
          break;
        case 'search-results':
          this.emit('searchResults', message.results);
          break;
        case 'error':
          this.emit('error', message);
          break;
        default:
          console.warn('Неизвестный тип сообщения:', type);
      }
    } catch (e) {
      console.error('Ошибка обработки сообщения:', e);
    }
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
   * Отписывается от события
   * @param {string} event
   * @param {Function} handler
   */
  off(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
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
