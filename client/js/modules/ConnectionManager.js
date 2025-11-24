/**
 * ConnectionManager - управляет WebRTC соединениями с peers
 */
export class ConnectionManager {
  constructor(signalingClient, localUsername, iceServers) {
    this.signalingClient = signalingClient;
    this.localUsername = localUsername;
    this.iceServers = iceServers;
    this.connections = new Map(); // remoteUsername -> RTCPeerConnection
    this.dataChannels = new Map(); // remoteUsername -> RTCDataChannel
    this.eventHandlers = {
      'message': [],
      'connectionStateChange': []
    };

    // Подписка на signaling события
    this.signalingClient.on('offer', (from, offer) => this.handleOffer(from, offer));
    this.signalingClient.on('answer', (from, answer) => this.handleAnswer(from, answer));
    this.signalingClient.on('iceCandidate', (from, candidate) => this.handleIceCandidate(from, candidate));
  }

  /**
   * Создает новое соединение с peer
   * @param {string} remoteUsername
   * @param {boolean} isInitiator - true если мы инициируем соединение
   * @returns {RTCPeerConnection}
   */
  createConnection(remoteUsername, isInitiator = false) {
    if (this.connections.has(remoteUsername)) {
      return this.connections.get(remoteUsername);
    }

    const config = {
      iceServers: this.iceServers
    };

    const pc = new RTCPeerConnection(config);
    this.connections.set(remoteUsername, pc);

    // ICE candidate handling
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.signalingClient.sendIceCandidate(remoteUsername, event.candidate);
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${remoteUsername}:`, pc.connectionState);
      this.emit('connectionStateChange', remoteUsername, pc.connectionState);

      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.closeConnection(remoteUsername);
      }
    };

    // ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state with ${remoteUsername}:`, pc.iceConnectionState);
    };

    // Data channel handling
    if (isInitiator) {
      // Создаем data channel если мы инициаторы
      const dataChannel = pc.createDataChannel('messages');
      this.setupDataChannel(remoteUsername, dataChannel);
    } else {
      // Ждем data channel от другой стороны
      pc.ondatachannel = (event) => {
        this.setupDataChannel(remoteUsername, event.channel);
      };
    }

    return pc;
  }

  /**
   * Настраивает data channel
   * @param {string} remoteUsername
   * @param {RTCDataChannel} dataChannel
   */
  setupDataChannel(remoteUsername, dataChannel) {
    this.dataChannels.set(remoteUsername, dataChannel);

    dataChannel.onopen = () => {
      console.log(`Data channel открыт с ${remoteUsername}`);
    };

    dataChannel.onclose = () => {
      console.log(`Data channel закрыт с ${remoteUsername}`);
    };

    dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.emit('message', remoteUsername, message);
      } catch (e) {
        console.error('Ошибка парсинга сообщения:', e);
      }
    };

    dataChannel.onerror = (error) => {
      console.error(`Data channel ошибка с ${remoteUsername}:`, error);
    };
  }

  /**
   * Инициирует соединение с peer (создает offer)
   * @param {string} remoteUsername
   * @returns {Promise<void>}
   */
  async initiateConnection(remoteUsername) {
    const pc = this.createConnection(remoteUsername, true);

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.signalingClient.sendOffer(remoteUsername, offer);
    } catch (error) {
      console.error('Ошибка создания offer:', error);
      throw error;
    }
  }

  /**
   * Обрабатывает входящий offer
   * @param {string} remoteUsername
   * @param {RTCSessionDescriptionInit} offer
   * @returns {Promise<void>}
   */
  async handleOffer(remoteUsername, offer) {
    const pc = this.createConnection(remoteUsername, false);

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.signalingClient.sendAnswer(remoteUsername, answer);
    } catch (error) {
      console.error('Ошибка обработки offer:', error);
    }
  }

  /**
   * Обрабатывает входящий answer
   * @param {string} remoteUsername
   * @param {RTCSessionDescriptionInit} answer
   * @returns {Promise<void>}
   */
  async handleAnswer(remoteUsername, answer) {
    const pc = this.connections.get(remoteUsername);

    if (!pc) {
      console.error('Соединение не найдено для', remoteUsername);
      return;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Ошибка обработки answer:', error);
    }
  }

  /**
   * Обрабатывает ICE candidate
   * @param {string} remoteUsername
   * @param {RTCIceCandidateInit} candidate
   */
  async handleIceCandidate(remoteUsername, candidate) {
    const pc = this.connections.get(remoteUsername);

    if (!pc) {
      console.error('Соединение не найдено для', remoteUsername);
      return;
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Ошибка добавления ICE candidate:', error);
    }
  }

  /**
   * Отправляет сообщение через data channel
   * @param {string} remoteUsername
   * @param {Object} message
   * @returns {boolean} true если отправлено успешно
   */
  sendMessage(remoteUsername, message) {
    const dataChannel = this.dataChannels.get(remoteUsername);

    if (!dataChannel || dataChannel.readyState !== 'open') {
      console.error('Data channel не открыт для', remoteUsername);
      return false;
    }

    try {
      dataChannel.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      return false;
    }
  }

  /**
   * Закрывает соединение с peer
   * @param {string} remoteUsername
   */
  closeConnection(remoteUsername) {
    const pc = this.connections.get(remoteUsername);
    const dataChannel = this.dataChannels.get(remoteUsername);

    if (dataChannel) {
      dataChannel.close();
      this.dataChannels.delete(remoteUsername);
    }

    if (pc) {
      pc.close();
      this.connections.delete(remoteUsername);
    }

    console.log(`Соединение закрыто с ${remoteUsername}`);
  }

  /**
   * Получает активное соединение
   * @param {string} remoteUsername
   * @returns {RTCPeerConnection|null}
   */
  getConnection(remoteUsername) {
    return this.connections.get(remoteUsername) || null;
  }

  /**
   * Проверяет, открыт ли data channel
   * @param {string} remoteUsername
   * @returns {boolean}
   */
  isDataChannelOpen(remoteUsername) {
    const dataChannel = this.dataChannels.get(remoteUsername);
    return dataChannel && dataChannel.readyState === 'open';
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
