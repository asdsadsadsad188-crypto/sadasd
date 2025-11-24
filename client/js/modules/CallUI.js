/**
 * CallUI - управляет интерфейсом звонков
 */
export class CallUI {
  constructor(callManager, audioManager) {
    this.callManager = callManager;
    this.audioManager = audioManager;
    this.callTimer = null;
    this.callStartTime = null;
    
    this.initializeUI();
    this.bindEvents();
  }

  /**
   * Инициализирует UI элементы
   */
  initializeUI() {
    this.createCallButton();
    this.createIncomingCallModal();
    this.createActiveCallScreen();
  }

  /**
   * Создает кнопку звонка в чате
   */
  createCallButton() {
    // Кнопка уже существует в HTML, просто проверяем её наличие
    const callButton = document.getElementById('call-button');
    if (!callButton) {
      console.warn('Call button not found in HTML');
    }
  }

  /**
   * Создает модальное окно входящего звонка
   */
  createIncomingCallModal() {
    const modal = document.createElement('div');
    modal.id = 'incoming-call-modal';
    modal.className = 'call-modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="caller-info">
          <div class="caller-avatar">👤</div>
          <div class="caller-name" id="caller-name"></div>
          <div class="call-status">Входящий звонок...</div>
        </div>
        <div class="call-actions">
          <button id="accept-call-btn" class="accept-call-btn">✓ Принять</button>
          <button id="reject-call-btn" class="reject-call-btn">✗ Отклонить</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  /**
   * Создает экран активного звонка
   */
  createActiveCallScreen() {
    const screen = document.createElement('div');
    screen.id = 'active-call-screen';
    screen.className = 'call-screen';
    screen.innerHTML = `
      <div class="call-header">
        <div class="call-peer-name" id="call-peer-name"></div>
        <div class="call-timer" id="call-timer">00:00</div>
        <div class="call-status" id="call-status">Подключение...</div>
      </div>
      
      <div class="screen-share-container" id="screen-share-container" style="display: none;">
        <video id="screen-share-video" autoplay muted></video>
        <div class="screen-share-label">Демонстрация экрана</div>
      </div>
      
      <div class="call-controls">
        <button id="toggle-mic-btn" class="control-btn mic-btn active">
          <span class="btn-icon">🎤</span>
          <span class="btn-label">Микрофон</span>
        </button>
        <button id="toggle-screen-btn" class="control-btn screen-btn">
          <span class="btn-icon">🖥️</span>
          <span class="btn-label">Экран</span>
        </button>
        <button id="end-call-btn" class="control-btn end-call-btn">
          <span class="btn-icon">📞</span>
          <span class="btn-label">Завершить</span>
        </button>
      </div>
    `;
    document.body.appendChild(screen);
  }

  /**
   * Привязывает события
   */
  bindEvents() {
    // Кнопка звонка
    const callButton = document.getElementById('call-button');
    if (callButton) {
      callButton.addEventListener('click', () => {
        const activeChat = this.getActiveChat();
        if (activeChat) {
          this.callManager.initiateCall(activeChat);
        }
      });
    }

    // Кнопки входящего звонка
    const acceptBtn = document.getElementById('accept-call-btn');
    const rejectBtn = document.getElementById('reject-call-btn');
    
    if (acceptBtn) {
      acceptBtn.addEventListener('click', () => {
        const callerName = document.getElementById('caller-name').textContent;
        this.hideIncomingCallModal();
        this.callManager.acceptCall(callerName);
      });
    }
    
    if (rejectBtn) {
      rejectBtn.addEventListener('click', () => {
        const callerName = document.getElementById('caller-name').textContent;
        this.hideIncomingCallModal();
        this.callManager.rejectCall(callerName);
      });
    }

    // Кнопки управления звонком
    const micBtn = document.getElementById('toggle-mic-btn');
    const screenBtn = document.getElementById('toggle-screen-btn');
    const endBtn = document.getElementById('end-call-btn');
    
    if (micBtn) {
      micBtn.addEventListener('click', () => {
        const enabled = this.callManager.toggleMicrophone();
        this.updateMicrophoneButton(enabled);
      });
    }
    
    if (screenBtn) {
      screenBtn.addEventListener('click', () => {
        if (this.callManager.callState?.isScreenSharing) {
          this.callManager.stopScreenShare();
        } else {
          this.callManager.startScreenShare();
        }
      });
    }
    
    if (endBtn) {
      endBtn.addEventListener('click', () => {
        this.callManager.endCall();
      });
    }

    // События CallManager
    this.callManager.on('incomingCall', (username) => {
      this.showIncomingCallModal(username);
    });
    
    this.callManager.on('callAccepted', (username) => {
      this.audioManager.stopDialTone();
      this.showActiveCallScreen(username);
    });
    
    this.callManager.on('callRejected', (username) => {
      this.audioManager.stopDialTone();
      this.audioManager.playEndCallSound();
      this.hideCallScreen();
    });
    
    this.callManager.on('callEnded', () => {
      this.audioManager.stopRingtone();
      this.audioManager.stopDialTone();
      this.audioManager.playEndCallSound();
      this.hideCallScreen();
    });
    
    this.callManager.on('remoteStream', (stream) => {
      this.audioManager.attachRemoteAudio(stream);
    });
    
    this.callManager.on('screenShareStarted', (stream) => {
      this.showScreenShare(stream);
      this.updateScreenShareButton(true);
    });
    
    this.callManager.on('screenShareStopped', () => {
      this.hideScreenShare();
      this.updateScreenShareButton(false);
    });
    
    // Обработка ошибок
    this.callManager.on('microphonePermissionError', (message) => {
      alert(message);
      this.hideCallScreen();
    });
    
    this.callManager.on('callError', (error) => {
      alert('Ошибка звонка: ' + error.message);
      this.hideCallScreen();
    });
    
    this.callManager.on('connectionDisconnected', () => {
      this.updateCallStatus('Переподключение...');
    });
    
    this.callManager.on('connectionRestored', () => {
      this.updateCallStatus('Активен');
    });
    
    this.callManager.on('connectionFailed', () => {
      alert('Соединение потеряно. Звонок завершен.');
    });
  }

  /**
   * Показывает модальное окно входящего звонка
   * @param {string} callerUsername
   */
  showIncomingCallModal(callerUsername) {
    const modal = document.getElementById('incoming-call-modal');
    const callerName = document.getElementById('caller-name');
    
    if (modal && callerName) {
      callerName.textContent = callerUsername;
      modal.style.display = 'flex';
      this.audioManager.playRingtone();
      
      // Показать browser notification
      this.showCallNotification(callerUsername);
    }
  }

  /**
   * Скрывает модальное окно входящего звонка
   */
  hideIncomingCallModal() {
    const modal = document.getElementById('incoming-call-modal');
    if (modal) {
      modal.style.display = 'none';
      this.audioManager.stopRingtone();
    }
  }

  /**
   * Показывает экран активного звонка
   * @param {string} peerUsername
   */
  showActiveCallScreen(peerUsername) {
    const screen = document.getElementById('active-call-screen');
    const peerName = document.getElementById('call-peer-name');
    const status = document.getElementById('call-status');
    
    if (screen && peerName && status) {
      peerName.textContent = peerUsername;
      status.textContent = 'Активен';
      screen.style.display = 'flex';
      
      this.startCallTimer();
      this.hideCallButton();
    }
  }

  /**
   * Скрывает экран звонка
   */
  hideCallScreen() {
    const screen = document.getElementById('active-call-screen');
    const modal = document.getElementById('incoming-call-modal');
    
    if (screen) {
      screen.style.display = 'none';
    }
    
    if (modal) {
      modal.style.display = 'none';
    }
    
    this.stopCallTimer();
    this.hideScreenShare();
    this.showCallButton();
    this.audioManager.detachRemoteAudio();
  }

  /**
   * Показывает демонстрацию экрана
   * @param {MediaStream} stream
   */
  showScreenShare(stream) {
    const container = document.getElementById('screen-share-container');
    const video = document.getElementById('screen-share-video');
    
    if (container && video && stream) {
      video.srcObject = stream;
      container.style.display = 'block';
    }
  }

  /**
   * Скрывает демонстрацию экрана
   */
  hideScreenShare() {
    const container = document.getElementById('screen-share-container');
    const video = document.getElementById('screen-share-video');
    
    if (container) {
      container.style.display = 'none';
    }
    
    if (video) {
      video.srcObject = null;
    }
  }

  /**
   * Обновляет кнопку микрофона
   * @param {boolean} enabled
   */
  updateMicrophoneButton(enabled) {
    const btn = document.getElementById('toggle-mic-btn');
    if (btn) {
      if (enabled) {
        btn.classList.add('active');
        btn.querySelector('.btn-icon').textContent = '🎤';
      } else {
        btn.classList.remove('active');
        btn.querySelector('.btn-icon').textContent = '🔇';
      }
    }
  }

  /**
   * Обновляет кнопку демонстрации экрана
   * @param {boolean} sharing
   */
  updateScreenShareButton(sharing) {
    const btn = document.getElementById('toggle-screen-btn');
    if (btn) {
      if (sharing) {
        btn.classList.add('active');
        btn.querySelector('.btn-label').textContent = 'Остановить';
      } else {
        btn.classList.remove('active');
        btn.querySelector('.btn-label').textContent = 'Экран';
      }
    }
  }

  /**
   * Запускает таймер звонка
   */
  startCallTimer() {
    this.callStartTime = Date.now();
    this.callTimer = setInterval(() => {
      this.updateCallTimer();
    }, 1000);
  }

  /**
   * Останавливает таймер звонка
   */
  stopCallTimer() {
    if (this.callTimer) {
      clearInterval(this.callTimer);
      this.callTimer = null;
    }
  }

  /**
   * Обновляет отображение таймера
   */
  updateCallTimer() {
    if (this.callStartTime) {
      const elapsed = Math.floor((Date.now() - this.callStartTime) / 1000);
      const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
      const seconds = (elapsed % 60).toString().padStart(2, '0');
      
      const timer = document.getElementById('call-timer');
      if (timer) {
        timer.textContent = `${minutes}:${seconds}`;
      }
    }
  }

  /**
   * Показывает кнопку звонка
   */
  showCallButton() {
    const btn = document.getElementById('call-button');
    if (btn) {
      btn.style.display = 'inline-block';
    }
  }

  /**
   * Скрывает кнопку звонка
   */
  hideCallButton() {
    const btn = document.getElementById('call-button');
    if (btn) {
      btn.style.display = 'none';
    }
  }

  /**
   * Показывает browser notification
   * @param {string} callerUsername
   */
  showCallNotification(callerUsername) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Входящий звонок', {
        body: `Звонок от ${callerUsername}`,
        icon: '/favicon.ico',
        tag: 'incoming-call'
      });
    }
  }

  /**
   * Получает активный чат
   * @returns {string|null}
   */
  getActiveChat() {
    const peerUsername = document.getElementById('chat-peer-username');
    return peerUsername ? peerUsername.textContent : null;
  }

  /**
   * Обновляет статус звонка
   * @param {string} status
   */
  updateCallStatus(status) {
    const statusElement = document.getElementById('call-status');
    if (statusElement) {
      statusElement.textContent = status;
    }
  }
}
