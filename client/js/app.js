/**
 * Главный файл приложения - инициализация и связывание всех модулей
 */

import { UsernameGenerator } from './modules/UsernameGenerator.js';
import { StorageManager } from './modules/StorageManager.js';
import { SignalingClient } from './modules/SignalingClient.js';
import { ConnectionManager } from './modules/ConnectionManager.js';
import { ChatManager } from './modules/ChatManager.js';
import { UIController } from './modules/UIController.js';
import { AudioManager } from './modules/AudioManager.js';
import { CallManager } from './modules/CallManager.js';
import { CallUI } from './modules/CallUI.js';
import { SIGNALING_SERVER_URL, ICE_SERVERS } from './config.js';

/**
 * Инициализация приложения
 */
async function initApp() {
  try {
    console.log('Инициализация P2P Messenger...');

    // 1. Инициализация StorageManager
    const storageManager = new StorageManager();

    // 2. Загрузка или генерация username
    let username = storageManager.loadUsername();
    if (!username) {
      username = UsernameGenerator.generate();
      storageManager.saveUsername(username);
      console.log('Сгенерирован новый username:', username);
    } else {
      console.log('Загружен username:', username);
    }

    // 3. Инициализация SignalingClient
    const signalingClient = new SignalingClient(SIGNALING_SERVER_URL);
    
    console.log('Подключение к signaling серверу...');
    await signalingClient.connect();
    
    console.log('Регистрация username...');
    await signalingClient.register(username);
    
    console.log('Успешно зарегистрирован как:', username);

    // 4. Инициализация ConnectionManager
    const connectionManager = new ConnectionManager(signalingClient, username, ICE_SERVERS);

    // 5. Инициализация ChatManager
    const chatManager = new ChatManager(connectionManager, storageManager);

    // 6. Инициализация AudioManager
    const audioManager = new AudioManager();

    // 7. Инициализация CallManager
    const callManager = new CallManager(connectionManager, signalingClient, username);

    // 8. Инициализация CallUI
    const callUI = new CallUI(callManager, audioManager);

    // 9. Инициализация UIController
    const uiController = new UIController(chatManager, signalingClient, connectionManager);
    uiController.init();

    // 10. Отображение username в UI
    uiController.displayUsername(username);

    // 11. Загрузка существующих чатов
    uiController.updateChatList();

    // 12. Запрос разрешения на уведомления
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    console.log('P2P Messenger успешно инициализирован!');

    // Делаем доступным для отладки
    window.app = {
      username,
      storageManager,
      signalingClient,
      connectionManager,
      chatManager,
      uiController,
      audioManager,
      callManager,
      callUI
    };

  } catch (error) {
    console.error('Ошибка инициализации приложения:', error);
    alert('Не удалось подключиться к серверу. Проверьте, что signaling сервер запущен.');
  }
}

// Запуск приложения после загрузки DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
