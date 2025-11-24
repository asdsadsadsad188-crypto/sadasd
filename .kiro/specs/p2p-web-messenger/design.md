# Design Document

## Overview

P2P Web Messenger - это децентрализованное веб-приложение для обмена сообщениями, использующее WebRTC для прямого соединения между пользователями. Приложение состоит из клиентской части (HTML/CSS/JavaScript) и минимального signaling сервера на Node.js с WebSocket для координации установления соединений.

Ключевые особенности архитектуры:
- Peer-to-peer передача сообщений через WebRTC Data Channels
- Минимальный signaling server только для обмена SDP и ICE candidates
- Клиентское хранилище для username и истории сообщений
- Публичные STUN/TURN серверы для NAT traversal

## Architecture

### High-Level Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Browser A     │         │   Browser B     │
│  (User 1)       │         │  (User 2)       │
│                 │         │                 │
│  ┌───────────┐  │         │  ┌───────────┐  │
│  │ WebRTC    │◄─┼─────────┼─►│ WebRTC    │  │
│  │ Data      │  │  P2P    │  │ Data      │  │
│  │ Channel   │  │ Messages│  │ Channel   │  │
│  └─────┬─────┘  │         │  └─────┬─────┘  │
│        │        │         │        │        │
│  ┌─────▼─────┐  │         │  ┌─────▼─────┐  │
│  │ UI Layer  │  │         │  │ UI Layer  │  │
│  └───────────┘  │         │  └───────────┘  │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │    WebSocket (Signaling) │
         │                           │
         └──────────┬────────────────┘
                    │
         ┌──────────▼──────────┐
         │  Signaling Server   │
         │  (Node.js + WS)     │
         │                     │
         │  - User Registry    │
         │  - SDP Exchange     │
         │  - ICE Candidates   │
         └─────────────────────┘
```

### Component Layers

1. **Presentation Layer** (Client-side)
   - HTML структура интерфейса
   - CSS стилизация
   - UI компоненты (чат, список пользователей, поиск)

2. **Application Layer** (Client-side)
   - Управление состоянием приложения
   - Обработка пользовательских действий
   - Управление чатами и сообщениями

3. **Communication Layer** (Client-side)
   - WebRTC connection management
   - Signaling через WebSocket
   - Data channel для сообщений

4. **Storage Layer** (Client-side)
   - LocalStorage для username
   - LocalStorage для истории сообщений
   - Session state management

5. **Signaling Server** (Server-side)
   - WebSocket server
   - User registry (username → socket mapping)
   - Message routing для signaling

## Components and Interfaces

### Client-Side Components

#### 1. ConnectionManager
Управляет WebRTC соединениями с peers.

```javascript
class ConnectionManager {
  constructor(signalingClient, localUsername)
  
  // Создать новое соединение с peer
  createConnection(remoteUsername): RTCPeerConnection
  
  // Закрыть соединение с peer
  closeConnection(remoteUsername): void
  
  // Получить активное соединение
  getConnection(remoteUsername): RTCPeerConnection | null
  
  // Обработать входящий offer
  handleOffer(remoteUsername, offer): Promise<void>
  
  // Обработать входящий answer
  handleAnswer(remoteUsername, answer): Promise<void>
  
  // Обработать ICE candidate
  handleIceCandidate(remoteUsername, candidate): void
  
  // События
  on('message', (remoteUsername, message) => {})
  on('connectionStateChange', (remoteUsername, state) => {})
}
```

#### 2. SignalingClient
Управляет WebSocket соединением с signaling сервером.

```javascript
class SignalingClient {
  constructor(serverUrl)
  
  // Подключиться к signaling серверу
  connect(): Promise<void>
  
  // Отключиться от сервера
  disconnect(): void
  
  // Зарегистрировать username
  register(username): Promise<void>
  
  // Отправить offer peer'у
  sendOffer(targetUsername, offer): void
  
  // Отправить answer peer'у
  sendAnswer(targetUsername, answer): void
  
  // Отправить ICE candidate
  sendIceCandidate(targetUsername, candidate): void
  
  // Поиск пользователей
  searchUsers(query): Promise<string[]>
  
  // События
  on('offer', (fromUsername, offer) => {})
  on('answer', (fromUsername, answer) => {})
  on('iceCandidate', (fromUsername, candidate) => {})
  on('userOnline', (username) => {})
  on('userOffline', (username) => {})
}
```

#### 3. ChatManager
Управляет чатами и сообщениями.

```javascript
class ChatManager {
  constructor(connectionManager, storageManager)
  
  // Создать новый чат
  createChat(remoteUsername): Chat
  
  // Получить чат
  getChat(remoteUsername): Chat | null
  
  // Получить все чаты
  getAllChats(): Chat[]
  
  // Отправить сообщение
  sendMessage(remoteUsername, text): void
  
  // Обработать входящее сообщение
  handleIncomingMessage(remoteUsername, message): void
  
  // Загрузить историю чата
  loadChatHistory(remoteUsername): Message[]
  
  // События
  on('newMessage', (remoteUsername, message) => {})
  on('chatCreated', (chat) => {})
}
```

#### 4. StorageManager
Управляет локальным хранилищем.

```javascript
class StorageManager {
  // Username
  saveUsername(username): void
  loadUsername(): string | null
  
  // История сообщений
  saveMessage(remoteUsername, message): void
  loadMessages(remoteUsername): Message[]
  clearMessages(remoteUsername): void
  
  // Список чатов
  saveChatList(chats): void
  loadChatList(): string[]
}
```

#### 5. UsernameGenerator
Генерирует случайные usernames.

```javascript
class UsernameGenerator {
  // Сгенерировать случайный username
  static generate(): string
  
  // Проверить валидность username
  static isValid(username): boolean
}
```

#### 6. UIController
Управляет пользовательским интерфейсом.

```javascript
class UIController {
  constructor(chatManager, signalingClient)
  
  // Инициализация UI
  init(): void
  
  // Отобразить username
  displayUsername(username): void
  
  // Обновить список чатов
  updateChatList(chats): void
  
  // Отобразить сообщения чата
  displayChat(remoteUsername): void
  
  // Добавить сообщение в UI
  addMessage(remoteUsername, message, isSent): void
  
  // Показать результаты поиска
  displaySearchResults(usernames): void
  
  // Обновить статус соединения
  updateConnectionStatus(remoteUsername, status): void
  
  // Показать уведомление
  showNotification(message): void
}
```

### Server-Side Components

#### 1. SignalingServer
WebSocket сервер для координации соединений.

```javascript
class SignalingServer {
  constructor(port)
  
  // Запустить сервер
  start(): void
  
  // Обработать регистрацию пользователя
  handleRegister(socket, username): void
  
  // Обработать поиск пользователей
  handleSearch(socket, query): string[]
  
  // Переслать signaling сообщение
  forwardMessage(fromSocket, toUsername, message): void
  
  // Обработать отключение
  handleDisconnect(socket): void
}
```

## Data Models

### Message
```javascript
{
  id: string,              // Уникальный ID сообщения
  from: string,            // Username отправителя
  to: string,              // Username получателя
  text: string,            // Текст сообщения
  timestamp: number,       // Unix timestamp
  delivered: boolean       // Статус доставки
}
```

### Chat
```javascript
{
  remoteUsername: string,  // Username собеседника
  messages: Message[],     // Массив сообщений
  lastMessage: Message,    // Последнее сообщение
  unreadCount: number,     // Количество непрочитанных
  connectionStatus: string // 'connected' | 'disconnected' | 'connecting'
}
```

### SignalingMessage
```javascript
{
  type: string,            // 'offer' | 'answer' | 'ice-candidate' | 'register' | 'search'
  from: string,            // Username отправителя
  to: string,              // Username получателя
  payload: any             // Данные (SDP, ICE candidate, etc.)
}
```

### User
```javascript
{
  username: string,        // Уникальный username
  socketId: string,        // ID WebSocket соединения
  online: boolean          // Статус онлайн
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Username generation format invariant
*For any* generated username, it should have length between 8 and 16 characters and contain only alphanumeric characters.
**Validates: Requirements 1.5**

### Property 2: Username persistence round-trip
*For any* generated username, saving it to localStorage and then loading it should return the same username.
**Validates: Requirements 1.3, 1.4**

### Property 3: Message persistence round-trip
*For any* message sent in a chat session, saving it to localStorage and then loading the chat history should include that message with the same content.
**Validates: Requirements 3.5**

### Property 4: Sent messages appear in UI
*For any* message sent by the user, it should appear in the chat interface marked as sent (outgoing).
**Validates: Requirements 3.4**

### Property 5: Received messages appear in UI with sender
*For any* message received from a peer, it should appear in the chat interface with the sender's username displayed.
**Validates: Requirements 3.3**

### Property 6: Chat list contains all active chats
*For any* active chat session, it should appear in the sidebar chat list.
**Validates: Requirements 5.1, 5.2**

### Property 7: Connection status reflects actual state
*For any* peer connection, when the connection state changes to "connected", the UI should display "Connected" status, and when it changes to "disconnected", the UI should display "Disconnected" status.
**Validates: Requirements 4.4, 4.5, 5.5**

### Property 8: Search returns matching users
*For any* search query and list of online users, all returned results should have usernames that contain the search query as a substring.
**Validates: Requirements 2.3**

### Property 9: Message display differentiation
*For any* chat with both sent and received messages, sent messages should have different CSS classes than received messages to visually distinguish them.
**Validates: Requirements 8.4**

### Property 10: ICE candidates are exchanged
*For any* WebRTC connection being established, ICE candidates generated locally should be sent to the remote peer through the signaling server.
**Validates: Requirements 4.3**

## Error Handling

### Client-Side Error Handling

1. **WebRTC Connection Errors**
   - Timeout при установлении соединения (30 секунд)
   - Ошибки ICE connection (показать пользователю)
   - Data channel errors (попытка переподключения)

2. **Signaling Errors**
   - WebSocket disconnection (автоматическое переподключение)
   - Username уже занят (предложить новый)
   - Peer не найден (показать сообщение)

3. **Storage Errors**
   - localStorage недоступен (работа без сохранения)
   - Quota exceeded (очистка старых сообщений)

4. **Validation Errors**
   - Пустое сообщение (блокировка отправки)
   - Невалидный username (показать ошибку)

### Server-Side Error Handling

1. **WebSocket Errors**
   - Invalid message format (игнорировать)
   - Unknown message type (логировать)
   - Target user offline (отправить error response)

2. **Registration Errors**
   - Duplicate username (отправить error response)
   - Invalid username format (отклонить)

## Testing Strategy

### Unit Testing

Мы будем использовать **Vitest** как testing framework для JavaScript/TypeScript кода.

**Unit tests будут покрывать:**

1. **UsernameGenerator**
   - Генерация username правильного формата
   - Валидация username

2. **StorageManager**
   - Сохранение и загрузка username
   - Сохранение и загрузка сообщений
   - Обработка отсутствующих данных

3. **ChatManager**
   - Создание нового чата
   - Добавление сообщения в чат
   - Получение истории чата

4. **SignalingClient**
   - Формирование signaling сообщений
   - Парсинг входящих сообщений

5. **ConnectionManager**
   - Создание RTCPeerConnection с правильной конфигурацией
   - Обработка connection state changes

### Property-Based Testing

Мы будем использовать **fast-check** как property-based testing библиотеку для JavaScript.

**Конфигурация:** Каждый property-based тест должен выполняться минимум 100 итераций.

**Property tests будут покрывать:**

1. **Property 1: Username generation format invariant**
   - Генерировать множество usernames и проверять формат
   - Tag: `Feature: p2p-web-messenger, Property 1: Username generation format invariant`

2. **Property 2: Username persistence round-trip**
   - Генерировать случайные usernames, сохранять и загружать
   - Tag: `Feature: p2p-web-messenger, Property 2: Username persistence round-trip`

3. **Property 3: Message persistence round-trip**
   - Генерировать случайные сообщения, сохранять и загружать
   - Tag: `Feature: p2p-web-messenger, Property 3: Message persistence round-trip`

4. **Property 4: Sent messages appear in UI**
   - Генерировать случайные сообщения и проверять их отображение
   - Tag: `Feature: p2p-web-messenger, Property 4: Sent messages appear in UI`

5. **Property 5: Received messages appear in UI with sender**
   - Генерировать случайные сообщения от разных отправителей
   - Tag: `Feature: p2p-web-messenger, Property 5: Received messages appear in UI with sender`

6. **Property 6: Chat list contains all active chats**
   - Создавать случайное количество чатов и проверять список
   - Tag: `Feature: p2p-web-messenger, Property 6: Chat list contains all active chats`

7. **Property 7: Connection status reflects actual state**
   - Симулировать различные состояния соединения
   - Tag: `Feature: p2p-web-messenger, Property 7: Connection status reflects actual state`

8. **Property 8: Search returns matching users**
   - Генерировать случайные списки пользователей и поисковые запросы
   - Tag: `Feature: p2p-web-messenger, Property 8: Search returns matching users`

9. **Property 9: Message display differentiation**
   - Генерировать чаты с разными типами сообщений
   - Tag: `Feature: p2p-web-messenger, Property 9: Message display differentiation`

10. **Property 10: ICE candidates are exchanged**
    - Симулировать генерацию ICE candidates
    - Tag: `Feature: p2p-web-messenger, Property 10: ICE candidates are exchanged`

### Integration Testing

- Тестирование полного flow установления соединения между двумя peers
- Тестирование отправки и получения сообщений end-to-end
- Тестирование signaling server с реальными WebSocket соединениями

### Manual Testing

- Тестирование в разных браузерах (Chrome, Firefox, Safari)
- Тестирование с пользователями из разных стран
- Тестирование UI/UX и визуального дизайна
- Тестирование на публичном хостинге

## Technology Stack

### Client-Side
- **HTML5** - структура приложения
- **CSS3** - стилизация (Flexbox/Grid для layout)
- **Vanilla JavaScript (ES6+)** - логика приложения
- **WebRTC API** - peer-to-peer соединения
- **WebSocket API** - signaling
- **LocalStorage API** - хранение данных

### Server-Side
- **Node.js** - runtime для signaling сервера
- **ws** - WebSocket библиотека
- **Express** - HTTP сервер для статических файлов

### Testing
- **Vitest** - unit testing framework
- **fast-check** - property-based testing library
- **jsdom** - DOM simulation для тестов

### Deployment
- **Vercel/Netlify** - хостинг для клиентской части
- **Render/Railway** - хостинг для signaling сервера
- Альтернатива: **GitHub Pages** (клиент) + **Glitch** (сервер)

## Security Considerations

1. **Input Validation**
   - Валидация всех пользовательских вводов
   - Санитизация сообщений для предотвращения XSS

2. **WebRTC Security**
   - Использование DTLS для шифрования data channels
   - Проверка origin для signaling сообщений

3. **Storage Security**
   - Не хранить чувствительные данные в localStorage
   - Очистка данных при выходе (опционально)

4. **Rate Limiting**
   - Ограничение частоты signaling сообщений
   - Ограничение размера сообщений

## Performance Considerations

1. **Message History**
   - Ограничение количества сохраняемых сообщений (например, 1000 на чат)
   - Lazy loading истории сообщений

2. **Connection Management**
   - Закрытие неактивных соединений
   - Переиспользование существующих соединений

3. **UI Rendering**
   - Virtual scrolling для больших списков сообщений
   - Debouncing для поиска пользователей

4. **Storage Optimization**
   - Периодическая очистка старых данных
   - Compression для больших объемов данных

## Deployment Architecture

```
┌─────────────────────────────────────┐
│         Static Hosting              │
│      (Vercel/Netlify/GitHub)        │
│                                     │
│  - index.html                       │
│  - styles.css                       │
│  - app.js                           │
│  - modules/*.js                     │
└─────────────────────────────────────┘
              │
              │ WebSocket
              ▼
┌─────────────────────────────────────┐
│      Signaling Server               │
│      (Render/Railway/Glitch)        │
│                                     │
│  - Node.js + ws                     │
│  - User registry                    │
│  - Message routing                  │
└─────────────────────────────────────┘
              │
              │ STUN/TURN
              ▼
┌─────────────────────────────────────┐
│    Public STUN/TURN Servers         │
│                                     │
│  - stun:stun.l.google.com:19302     │
│  - Free TURN servers (optional)     │
└─────────────────────────────────────┘
```

## File Structure

```
p2p-web-messenger/
├── client/
│   ├── index.html
│   ├── styles/
│   │   ├── main.css
│   │   ├── chat.css
│   │   └── sidebar.css
│   ├── js/
│   │   ├── app.js (entry point)
│   │   ├── modules/
│   │   │   ├── ConnectionManager.js
│   │   │   ├── SignalingClient.js
│   │   │   ├── ChatManager.js
│   │   │   ├── StorageManager.js
│   │   │   ├── UsernameGenerator.js
│   │   │   └── UIController.js
│   │   └── config.js
│   └── assets/
│       └── icons/
├── server/
│   ├── index.js
│   ├── SignalingServer.js
│   ├── package.json
│   └── .env
├── tests/
│   ├── unit/
│   │   ├── UsernameGenerator.test.js
│   │   ├── StorageManager.test.js
│   │   ├── ChatManager.test.js
│   │   └── SignalingClient.test.js
│   └── property/
│       ├── username.property.test.js
│       ├── storage.property.test.js
│       ├── messages.property.test.js
│       └── search.property.test.js
├── package.json
├── vitest.config.js
└── README.md
```
