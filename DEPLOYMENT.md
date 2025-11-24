# Руководство по развертыванию P2P Web Messenger

## Быстрый старт для тестирования с друзьями

### Вариант 1: Использование Glitch (Самый простой)

Glitch позволяет развернуть и сервер, и клиент в одном месте.

1. Перейдите на https://glitch.com
2. Нажмите "New Project" → "Import from GitHub"
3. Вставьте URL вашего GitHub репозитория
4. Glitch автоматически установит зависимости и запустит сервер
5. Нажмите "Show" → "In a New Window"
6. Скопируйте URL и отправьте друзьям!

**Важно:** Обновите `client/js/config.js`:
```javascript
export const SIGNALING_SERVER_URL = isProduction
  ? 'wss://your-project-name.glitch.me' // Замените на ваш Glitch URL
  : 'ws://localhost:8080';
```

### Вариант 2: Railway + Vercel (Рекомендуется для production)

#### Шаг 1: Развертывание сервера на Railway

1. Зарегистрируйтесь на https://railway.app
2. Нажмите "New Project"
3. Выберите "Deploy from GitHub repo"
4. Выберите ваш репозиторий
5. Railway автоматически определит настройки
6. После развертывания нажмите на сервис
7. Перейдите в "Settings" → "Networking"
8. Скопируйте "Public Domain" (например: `your-app.railway.app`)

#### Шаг 2: Обновление конфигурации

Откройте `client/js/config.js` и обновите:
```javascript
export const SIGNALING_SERVER_URL = isProduction
  ? 'wss://your-app.railway.app' // Ваш Railway URL
  : 'ws://localhost:8080';
```

Закоммитьте изменения:
```bash
git add client/js/config.js
git commit -m "Update signaling server URL"
git push
```

#### Шаг 3: Развертывание клиента на Vercel

1. Установите Vercel CLI:
```bash
npm i -g vercel
```

2. Запустите развертывание:
```bash
vercel
```

3. Следуйте инструкциям:
   - Link to existing project? → No
   - Project name? → (нажмите Enter)
   - Directory? → `./` (нажмите Enter)
   - Override settings? → No

4. Для production развертывания:
```bash
vercel --prod
```

5. Vercel выдаст URL (например: `https://your-app.vercel.app`)

#### Шаг 4: Тестирование

1. Откройте URL Vercel в браузере
2. Вам будет присвоен случайный username
3. Откройте тот же URL на другом устройстве или отправьте друзьям
4. Используйте поиск для нахождения друг друга
5. Начните общение!

### Вариант 3: Netlify + Render

#### Развертывание сервера на Render

1. Зарегистрируйтесь на https://render.com
2. Нажмите "New +" → "Web Service"
3. Подключите GitHub репозиторий
4. Настройки:
   - Name: `p2p-messenger-server`
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Нажмите "Create Web Service"
6. Скопируйте URL после развертывания

#### Развертывание клиента на Netlify

1. Обновите `client/js/config.js` с URL Render сервера
2. Установите Netlify CLI:
```bash
npm i -g netlify-cli
```

3. Запустите:
```bash
netlify deploy
```

4. Выберите:
   - Create & configure a new site
   - Publish directory: `client`

5. Для production:
```bash
netlify deploy --prod
```

## Проверка работоспособности

### Локальное тестирование

1. Запустите сервер:
```bash
npm run server
```

2. Откройте http://localhost:3000 в двух разных вкладках браузера

3. В каждой вкладке будет свой username

4. В одной вкладке найдите username из другой вкладки через поиск

5. Начните общение!

### Production тестирование

1. Откройте URL клиента в браузере
2. Проверьте, что username отображается
3. Откройте Developer Console (F12)
4. Проверьте, что нет ошибок подключения
5. Откройте URL на другом устройстве
6. Попробуйте найти и отправить сообщение

## Устранение проблем

### Ошибка "Не удалось подключиться к серверу"

- Проверьте, что signaling сервер запущен и доступен
- Проверьте URL в `client/js/config.js`
- Убедитесь, что используется `wss://` для HTTPS сайтов

### Сообщения не отправляются

- Проверьте статус соединения (должен быть "Подключен")
- Откройте Developer Console и проверьте ошибки WebRTC
- Убедитесь, что STUN серверы доступны

### Пользователи не находят друг друга

- Убедитесь, что оба пользователя подключены к одному signaling серверу
- Проверьте, что usernames разные
- Попробуйте обновить страницу

## Дополнительные настройки

### Добавление TURN сервера

Для более надежного соединения через NAT/Firewall добавьте TURN сервер в `client/js/config.js`:

```javascript
export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: 'turn:your-turn-server.com:3478',
    username: 'your-username',
    credential: 'your-password'
  }
];
```

Бесплатные TURN серверы:
- https://www.metered.ca/tools/openrelay/ (бесплатный TURN сервер)
- https://numb.viagenie.ca/ (требует регистрацию)

### Настройка домена

После развертывания вы можете настроить свой домен:

**Vercel:**
1. Перейдите в Settings → Domains
2. Добавьте свой домен
3. Настройте DNS записи

**Railway:**
1. Перейдите в Settings → Networking
2. Добавьте Custom Domain
3. Настройте DNS записи

## Поделиться с друзьями

После успешного развертывания:

1. Скопируйте URL клиентского приложения
2. Отправьте друзьям через:
   - Telegram
   - WhatsApp
   - Email
   - SMS

3. Объясните, что нужно:
   - Открыть ссылку
   - Запомнить свой username
   - Использовать поиск для нахождения друг друга

## Безопасность

- Все сообщения передаются напрямую между пользователями через WebRTC
- Signaling сервер видит только метаданные для установления соединения
- Сообщения шифруются на уровне WebRTC (DTLS)
- История сохраняется только локально в браузере

## Ограничения

- Сообщения не сохраняются на сервере
- История доступна только на устройстве, где велась переписка
- Для общения оба пользователя должны быть онлайн
- Некоторые корпоративные firewall могут блокировать WebRTC

## Поддержка

Если возникли проблемы:
1. Проверьте Developer Console (F12) на ошибки
2. Убедитесь, что используете современный браузер (Chrome, Firefox, Safari)
3. Проверьте, что signaling сервер доступен
4. Попробуйте использовать TURN сервер для обхода NAT
