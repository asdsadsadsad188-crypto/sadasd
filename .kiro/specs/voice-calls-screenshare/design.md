# Design Document - Voice Calls & Screen Share

## Overview

Расширение существующего P2P мессенджера функциями голосовых звонков и демонстрации экрана. Используется существующая WebRTC инфраструктура с добавлением медиа потоков (audio/video). Звонки работают peer-to-peer, signaling проходит через существующий сервер.

## Architecture

### Call Flow

```
Caller                    Signaling Server              Callee
  │                              │                         │
  │──call-offer──────────────────>│──call-offer────────────>│
  │                              │                         │
  │                              │<──call-answer───────────│
  │<─call-answer─────────────────│                         │
  │                              │                         │
  │<────────────WebRTC Audio Stream (P2P)─────────────────>│
  │                              │                         │
  │──screen-share-start──────────>│──screen-share-start───>│
  │<────────────WebRTC Video Stream (P2P)─────────────────>│
```

## Components and Interfaces

### 1. CallManager

Управляет голосовыми звонками и медиа потоками.

```javascript
class CallManager {
  constructor(connectionManager, signalingClient)
  
  // Инициировать звонок
  initiateCall(remoteUsername): Promise<void>
  
  // Принять входящий звонок
  acceptCall(remoteUsername): Promise<void>
  
  // Отклонить звонок
  rejectCall(remoteUsername): void
  
  // Завершить звонок
  endCall(): void
  
  // Переключить микрофон
  toggleMicrophone(): boolean
  
  // Начать демонстрацию экрана
  startScreenShare(): Promise<void>
  
  // Остановить демонстрацию экрана
  stopScreenShare(): void
  
  // Получить локальный аудио поток
  getLocalAudioStream(): Promise<MediaStream>
  
  // Получить поток демонстрации экрана
  getScreenStream(): Promise<MediaStream>
  
  // События
  on('incomingCall', (remoteUsername) => {})
  on('callAccepted', (remoteUsername) => {})
  on('callRejected', (remoteUsername) => {})
  on('callEnded', () => {})
  on('remoteStream', (stream) => {})
  on('screenShareStarted', (stream) => {})
  on('screenShareStopped', () => {})
}
```

### 2. CallUI

Управляет интерфейсом звонков.

```javascript
class CallUI {
  constructor(callManager)
  
  // Показать модальное окно входящего звонка
  showIncomingCallModal(remoteUsername): void
  
  // Показать экран активного звонка
  showActiveCallScreen(remoteUsername): void
  
  // Скрыть экран звонка
  hideCallScreen(): void
  
  // Обновить статус звонка
  updateCallStatus(status): void
  
  // Обновить таймер
  updateCallTimer(seconds): void
  
  // Обновить состояние микрофона
  updateMicrophoneState(enabled): void
  
  // Показать видео демонстрации экрана
  showScreenShare(stream): void
  
  // Скрыть видео демонстрации экрана
  hideScreenShare(): void
}
```

### 3. AudioManager

Управляет аудио потоками и звуковыми эффектами.

```javascript
class AudioManager {
  // Воспроизвести звук входящего звонка
  playRingtone(): void
  
  // Остановить звук входящего звонка
  stopRingtone(): void
  
  // Воспроизвести звук ожидания
  playDialTone(): void
  
  // Остановить звук ожидания
  stopDialTone(): void
  
  // Воспроизвести звук завершения
  playEndCallSound(): void
  
  // Подключить удаленный аудио поток
  attachRemoteAudio(stream): void
  
  // Отключить удаленный аудио поток
  detachRemoteAudio(): void
}
```

## Data Models

### CallState
```javascript
{
  isActive: boolean,           // Активен ли звонок
  remoteUsername: string,      // Username собеседника
  isIncoming: boolean,         // Входящий или исходящий
  startTime: number,           // Время начала звонка
  status: string,              // 'calling' | 'ringing' | 'active' | 'ended'
  isMicrophoneEnabled: boolean,// Включен ли микрофон
  isScreenSharing: boolean,    // Идет ли демонстрация экрана
  localStream: MediaStream,    // Локальный аудио поток
  remoteStream: MediaStream,   // Удаленный аудио поток
  screenStream: MediaStream    // Поток демонстрации экрана
}
```

### CallSignal
```javascript
{
  type: string,                // 'call-offer' | 'call-answer' | 'call-reject' | 'call-end' | 'screen-share-start' | 'screen-share-stop'
  from: string,                // Username отправителя
  to: string,                  // Username получателя
  sdp: RTCSessionDescription,  // SDP для WebRTC (если применимо)
  timestamp: number            // Время отправки
}
```

## Implementation Details

### WebRTC Configuration for Calls

```javascript
const mediaConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  },
  video: false  // Только аудио для голосовых звонков
};

const screenConstraints = {
  video: {
    cursor: 'always',
    displaySurface: 'monitor'
  },
  audio: false
};
```

### Call Signaling Flow

1. **Инициация звонка:**
   - Caller получает локальный аудио поток
   - Создает offer через существующее WebRTC соединение
   - Отправляет `call-offer` через signaling

2. **Прием звонка:**
   - Callee получает `call-offer`
   - Показывает модальное окно
   - При принятии: получает локальный аудио поток, создает answer
   - Отправляет `call-answer`

3. **Активный звонок:**
   - Оба участника обмениваются аудио потоками через WebRTC
   - Управление микрофоном локально (mute/unmute track)
   - Демонстрация экрана добавляет video track к существующему соединению

## UI Design

### Call Button (в чате)
```html
<button id="call-button" class="call-button">
  📞 Позвонить
</button>
```

### Incoming Call Modal
```html
<div id="incoming-call-modal" class="call-modal">
  <div class="modal-content">
    <div class="caller-info">
      <div class="caller-avatar">👤</div>
      <div class="caller-name">{username}</div>
      <div class="call-status">Входящий звонок...</div>
    </div>
    <div class="call-actions">
      <button class="accept-call-btn">✓ Принять</button>
      <button class="reject-call-btn">✗ Отклонить</button>
    </div>
  </div>
</div>
```

### Active Call Screen
```html
<div id="active-call-screen" class="call-screen">
  <div class="call-header">
    <div class="call-peer-name">{username}</div>
    <div class="call-timer">00:00</div>
    <div class="call-status">Активен</div>
  </div>
  
  <div class="screen-share-container" style="display: none;">
    <video id="screen-share-video" autoplay></video>
  </div>
  
  <div class="call-controls">
    <button id="toggle-mic-btn" class="control-btn active">
      🎤 Микрофон
    </button>
    <button id="toggle-screen-btn" class="control-btn">
      🖥️ Экран
    </button>
    <button id="end-call-btn" class="control-btn end-call">
      📞 Завершить
    </button>
  </div>
  
  <audio id="remote-audio" autoplay></audio>
</div>
```

## Error Handling

1. **Microphone Access Denied**
   - Показать уведомление о необходимости разрешения
   - Предложить проверить настройки браузера

2. **Screen Share Cancelled**
   - Gracefully handle отмену выбора экрана
   - Не прерывать звонок

3. **Connection Lost During Call**
   - Попытка переподключения (3 попытки)
   - Уведомление пользователя
   - Автоматическое завершение при неудаче

4. **Peer Offline**
   - Немедленное уведомление
   - Завершение звонка

## Testing Strategy

### Manual Testing
- Тестирование звонков между двумя браузерами
- Проверка работы микрофона
- Проверка демонстрации экрана
- Тестирование на разных браузерах (Chrome, Firefox)

### Integration Testing
- Тестирование signaling для звонков
- Тестирование WebRTC медиа потоков
- Тестирование переключения состояний

## Browser Compatibility

- **Chrome/Edge**: Полная поддержка
- **Firefox**: Полная поддержка
- **Safari**: Поддержка с ограничениями (требует HTTPS)
- **Mobile**: Ограниченная поддержка (зависит от браузера)

## Security Considerations

1. **Permissions**
   - Запрос разрешений только при необходимости
   - Четкое объяснение зачем нужны разрешения

2. **Privacy**
   - Аудио/видео потоки только P2P
   - Нет записи на сервере
   - Пользователь контролирует микрофон и демонстрацию

3. **HTTPS Required**
   - getUserMedia требует HTTPS в production
   - Vercel автоматически предоставляет HTTPS
