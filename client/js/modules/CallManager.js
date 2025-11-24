/**
 * CallManager - управляет голосовыми звонками и демонстрацией экрана
 */
export class CallManager {
  constructor(connectionManager, signalingClient, username) {
    this.connectionManager = connectionManager;
    this.signalingClient = signalingClient;
    this.username = username;
    
    this.callState = null;
    this.localStream = null;
    this.screenStream = null;
    this.eventHandlers = {};
    
    this.bindSignalingEvents();
  }

  /**
   * Привязывает события signaling
   */
  bindSignalingEvents() {
    this.signalingClient.on('callOffer', (from, payload) => {
      this.handleIncomingCall(from, payload);
    });
    
    this.signalingClient.on('callAnswer', (from, payload) => {
      this.handleCallAnswer(from, payload);
    });
    
    this.signalingClient.on('callReject', (from) => {
      this.handleCallReject(from);
    });
    
    this.signalingClient.on('callEnd', (from) => {
      this.handleCallEnd(from);
    });
    
    this.signalingClient.on('screenShareStart', (from) => {
      this.emit('remoteScreenShareStarted', from);
    });
    
    this.signalingClient.on('screenShareStop', (from) => {
      this.emit('remoteScreenShareStopped', from);
    });
  }

  /**
   * Инициирует звонок
   * @param {string} remoteUsername
   */
  async initiateCall(remoteUsername) {
    try {
      console.log('Инициация звонка к:', remoteUsername);
      
      // Запрашиваем доступ к микрофону
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Создаем состояние звонка
      this.callState = {
        remoteUsername,
        status: 'calling',
        startTime: null,
        isMicrophoneEnabled: true,
        isScreenSharing: false
      };
      
      // Добавляем аудио треки к соединению
      const connection = this.connectionManager.getConnection(remoteUsername);
      if (connection) {
        this.localStream.getTracks().forEach(track => {
          connection.addTrack(track, this.localStream);
        });
      }
      
      // Отправляем сигнал call-offer
      this.signalingClient.send({
        type: 'call-offer',
        to: remoteUsername,
        payload: {}
      });
      
      this.emit('callInitiated', remoteUsername);
      
    } catch (error) {
      console.error('Ошибка инициации звонка:', error);
      
      // Обработка ошибок доступа к микрофону
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        this.emit('microphonePermissionError', 'Доступ к микрофону запрещен. Разрешите доступ в настройках браузера.');
      } else if (error.name === 'NotFoundError') {
        this.emit('microphonePermissionError', 'Микрофон не найден. Подключите микрофон и попробуйте снова.');
      } else {
        this.emit('callError', error);
      }
      
      this.cleanupCall();
      throw error;
    }
  }

  /**
   * Обрабатывает входящий звонок
   * @param {string} from
   * @param {Object} payload
   */
  handleIncomingCall(from, payload) {
    console.log('Входящий звонок от:', from);
    
    this.callState = {
      remoteUsername: from,
      status: 'incoming',
      startTime: null,
      isMicrophoneEnabled: true,
      isScreenSharing: false
    };
    
    this.emit('incomingCall', from);
  }

  /**
   * Принимает звонок
   * @param {string} remoteUsername
   */
  async acceptCall(remoteUsername) {
    try {
      console.log('Принятие звонка от:', remoteUsername);
      
      // Запрашиваем доступ к микрофону
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Обновляем состояние
      if (this.callState) {
        this.callState.status = 'active';
        this.callState.startTime = Date.now();
      }
      
      // Добавляем аудио треки к соединению
      const connection = this.connectionManager.getConnection(remoteUsername);
      if (connection) {
        this.localStream.getTracks().forEach(track => {
          connection.addTrack(track, this.localStream);
        });
        
        // Подписываемся на удаленные треки
        connection.ontrack = (event) => {
          console.log('Получен удаленный трек:', event.track.kind);
          this.emit('remoteStream', event.streams[0]);
        };
      }
      
      // Отправляем сигнал call-answer
      this.signalingClient.send({
        type: 'call-answer',
        to: remoteUsername,
        payload: {}
      });
      
      this.emit('callAccepted', remoteUsername);
      
    } catch (error) {
      console.error('Ошибка принятия звонка:', error);
      
      // Обработка ошибок доступа к микрофону
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        this.emit('microphonePermissionError', 'Доступ к микрофону запрещен. Разрешите доступ в настройках браузера.');
      } else if (error.name === 'NotFoundError') {
        this.emit('microphonePermissionError', 'Микрофон не найден. Подключите микрофон и попробуйте снова.');
      } else {
        this.emit('callError', error);
      }
      
      this.cleanupCall();
      throw error;
    }
  }

  /**
   * Отклоняет звонок
   * @param {string} remoteUsername
   */
  rejectCall(remoteUsername) {
    console.log('Отклонение звонка от:', remoteUsername);
    
    // Отправляем сигнал call-reject
    this.signalingClient.send({
      type: 'call-reject',
      to: remoteUsername
    });
    
    this.cleanupCall();
    this.emit('callRejected', remoteUsername);
  }

  /**
   * Обрабатывает ответ на звонок
   * @param {string} from
   * @param {Object} payload
   */
  handleCallAnswer(from, payload) {
    console.log('Звонок принят:', from);
    
    if (this.callState) {
      this.callState.status = 'active';
      this.callState.startTime = Date.now();
    }
    
    // Подписываемся на удаленные треки
    const connection = this.connectionManager.getConnection(from);
    if (connection) {
      connection.ontrack = (event) => {
        console.log('Получен удаленный трек:', event.track.kind);
        this.emit('remoteStream', event.streams[0]);
      };
      
      // Отслеживаем состояние соединения
      connection.onconnectionstatechange = () => {
        this.handleConnectionStateChange(connection);
      };
    }
    
    this.emit('callAccepted', from);
  }

  /**
   * Обрабатывает изменение состояния соединения
   * @param {RTCPeerConnection} connection
   */
  handleConnectionStateChange(connection) {
    const state = connection.connectionState;
    console.log('Состояние соединения:', state);
    
    if (state === 'disconnected') {
      this.emit('connectionDisconnected');
      // Попытка переподключения
      console.log('Попытка переподключения...');
    } else if (state === 'failed') {
      console.error('Соединение потеряно');
      this.emit('connectionFailed');
      // Завершаем звонок после неудачного переподключения
      this.endCall();
    } else if (state === 'connected') {
      this.emit('connectionRestored');
    }
  }

  /**
   * Обрабатывает отклонение звонка
   * @param {string} from
   */
  handleCallReject(from) {
    console.log('Звонок отклонен:', from);
    
    this.cleanupCall();
    this.emit('callRejected', from);
  }

  /**
   * Завершает звонок
   */
  endCall() {
    if (!this.callState) {
      return;
    }
    
    console.log('Завершение звонка');
    
    const remoteUsername = this.callState.remoteUsername;
    
    // Отправляем сигнал call-end
    this.signalingClient.send({
      type: 'call-end',
      to: remoteUsername
    });
    
    this.cleanupCall();
    this.emit('callEnded');
  }

  /**
   * Обрабатывает завершение звонка
   * @param {string} from
   */
  handleCallEnd(from) {
    console.log('Звонок завершен:', from);
    
    this.cleanupCall();
    this.emit('callEnded');
  }

  /**
   * Очищает ресурсы звонка
   */
  cleanupCall() {
    // Останавливаем локальный поток
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    // Останавливаем демонстрацию экрана
    if (this.screenStream) {
      this.stopScreenShare();
    }
    
    this.callState = null;
  }

  /**
   * Переключает микрофон
   * @returns {boolean} Новое состояние микрофона
   */
  toggleMicrophone() {
    if (!this.localStream || !this.callState) {
      return false;
    }
    
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.callState.isMicrophoneEnabled = audioTrack.enabled;
      
      this.emit('microphoneToggled', audioTrack.enabled);
      return audioTrack.enabled;
    }
    
    return false;
  }

  /**
   * Получает состояние микрофона
   * @returns {boolean}
   */
  getMicrophoneState() {
    return this.callState?.isMicrophoneEnabled || false;
  }

  /**
   * Начинает демонстрацию экрана
   */
  async startScreenShare() {
    try {
      if (!this.callState || this.callState.status !== 'active') {
        throw new Error('Нет активного звонка');
      }
      
      console.log('Начало демонстрации экрана');
      
      // Запрашиваем доступ к экрану
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true 
      });
      
      const remoteUsername = this.callState.remoteUsername;
      const connection = this.connectionManager.getConnection(remoteUsername);
      
      if (connection) {
        // Добавляем видео трек
        const videoTrack = this.screenStream.getVideoTracks()[0];
        connection.addTrack(videoTrack, this.screenStream);
        
        // Обрабатываем остановку демонстрации
        videoTrack.onended = () => {
          this.stopScreenShare();
        };
      }
      
      this.callState.isScreenSharing = true;
      
      // Отправляем сигнал screen-share-start
      this.signalingClient.send({
        type: 'screen-share-start',
        to: remoteUsername
      });
      
      this.emit('screenShareStarted', this.screenStream);
      
    } catch (error) {
      console.error('Ошибка демонстрации экрана:', error);
      
      // Обработка отмены пользователем
      if (error.name === 'NotAllowedError' || error.name === 'AbortError') {
        console.log('Пользователь отменил демонстрацию экрана');
        // Не прерываем звонок, просто не начинаем демонстрацию
      } else {
        this.emit('screenShareError', error);
      }
    }
  }

  /**
   * Останавливает демонстрацию экрана
   */
  stopScreenShare() {
    if (!this.screenStream) {
      return;
    }
    
    console.log('Остановка демонстрации экрана');
    
    // Останавливаем треки
    this.screenStream.getTracks().forEach(track => track.stop());
    
    const remoteUsername = this.callState?.remoteUsername;
    if (remoteUsername) {
      // Отправляем сигнал screen-share-stop
      this.signalingClient.send({
        type: 'screen-share-stop',
        to: remoteUsername
      });
    }
    
    this.screenStream = null;
    
    if (this.callState) {
      this.callState.isScreenSharing = false;
    }
    
    this.emit('screenShareStopped');
  }

  /**
   * Подписка на события
   * @param {string} event
   * @param {Function} handler
   */
  on(event, handler) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  /**
   * Генерация события
   * @param {string} event
   * @param  {...any} args
   */
  emit(event, ...args) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => handler(...args));
    }
  }
}
