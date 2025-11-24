# Requirements Document

## Introduction

Веб-мессенджер с peer-to-peer архитектурой, позволяющий пользователям общаться напрямую без центрального сервера. Приложение использует WebRTC для установления прямого соединения между пользователями из разных стран. При входе каждому пользователю автоматически присваивается случайный username, и пользователи могут находить друг друга через поиск по username.

## Glossary

- **P2P-Messenger**: Веб-приложение для обмена сообщениями между пользователями
- **WebRTC**: Технология для peer-to-peer соединения между браузерами
- **Username**: Уникальный идентификатор пользователя в системе
- **Signaling-Server**: Минимальный сервер для обмена connection metadata (необходим только для установления соединения)
- **Peer**: Другой пользователь в сети
- **Chat-Session**: Активное соединение для обмена сообщениями между двумя пользователями

## Requirements

### Requirement 1

**User Story:** Как новый пользователь, я хочу автоматически получить случайный username при входе, чтобы сразу начать использовать мессенджер без регистрации

#### Acceptance Criteria

1. WHEN пользователь открывает приложение впервые, THEN THE P2P-Messenger SHALL генерировать случайный username
2. WHEN username генерируется, THEN THE P2P-Messenger SHALL отображать его пользователю в интерфейсе
3. WHEN username создан, THEN THE P2P-Messenger SHALL сохранять его в local storage браузера
4. WHEN пользователь возвращается в приложение, THEN THE P2P-Messenger SHALL загружать сохраненный username из local storage
5. THE P2P-Messenger SHALL генерировать username длиной от 8 до 16 символов с использованием букв и цифр

### Requirement 2

**User Story:** Как пользователь, я хочу искать других пользователей по их username, чтобы начать с ними переписку

#### Acceptance Criteria

1. THE P2P-Messenger SHALL предоставлять поле поиска для ввода username
2. WHEN пользователь вводит username в поле поиска, THEN THE P2P-Messenger SHALL отображать результаты поиска в реальном времени
3. WHEN найден пользователь с указанным username, THEN THE P2P-Messenger SHALL отображать его в списке результатов
4. WHEN пользователь выбирает найденного peer из результатов, THEN THE P2P-Messenger SHALL инициировать установление соединения
5. WHEN username не найден, THEN THE P2P-Messenger SHALL отображать сообщение об отсутствии результатов

### Requirement 3

**User Story:** Как пользователь, я хочу отправлять и получать сообщения напрямую с другими пользователями, чтобы общаться без центрального сервера

#### Acceptance Criteria

1. WHEN два пользователя установили соединение, THEN THE P2P-Messenger SHALL передавать сообщения напрямую через WebRTC data channel
2. WHEN пользователь вводит сообщение и нажимает отправить, THEN THE P2P-Messenger SHALL передать сообщение peer через установленное соединение
3. WHEN сообщение получено от peer, THEN THE P2P-Messenger SHALL отобразить его в интерфейсе чата с указанием отправителя
4. WHEN сообщение отправлено, THEN THE P2P-Messenger SHALL отобразить его в интерфейсе чата как отправленное
5. THE P2P-Messenger SHALL сохранять историю сообщений в local storage для каждого chat-session

### Requirement 4

**User Story:** Как пользователь из другой страны, я хочу устанавливать соединение с пользователями независимо от их географического расположения, чтобы общаться с друзьями по всему миру

#### Acceptance Criteria

1. WHEN пользователи находятся за NAT или firewall, THEN THE P2P-Messenger SHALL использовать STUN сервер для определения публичного IP адреса
2. WHEN прямое соединение невозможно, THEN THE P2P-Messenger SHALL использовать TURN сервер для relay трафика
3. WHEN устанавливается соединение, THEN THE P2P-Messenger SHALL обмениваться ICE candidates через signaling-server
4. WHEN соединение установлено, THEN THE P2P-Messenger SHALL отображать статус "Connected" в интерфейсе
5. WHEN соединение разорвано, THEN THE P2P-Messenger SHALL отображать статус "Disconnected" и предлагать переподключение

### Requirement 5

**User Story:** Как пользователь, я хочу видеть список моих активных чатов, чтобы легко переключаться между разговорами

#### Acceptance Criteria

1. THE P2P-Messenger SHALL отображать список всех активных chat-sessions в боковой панели
2. WHEN новый chat-session создан, THEN THE P2P-Messenger SHALL добавить его в список активных чатов
3. WHEN пользователь выбирает chat-session из списка, THEN THE P2P-Messenger SHALL отобразить историю сообщений этого чата
4. WHEN получено новое сообщение в неактивном чате, THEN THE P2P-Messenger SHALL отобразить уведомление на соответствующем элементе списка
5. WHEN peer отключается, THEN THE P2P-Messenger SHALL обновить статус соответствующего chat-session на "Offline"

### Requirement 6

**User Story:** Как пользователь, я хочу, чтобы приложение работало в одном HTML файле со всеми необходимыми ресурсами, чтобы легко развернуть и использовать его

#### Acceptance Criteria

1. THE P2P-Messenger SHALL быть реализован как multi-file веб-приложение с HTML, CSS и JavaScript файлами
2. THE P2P-Messenger SHALL включать все необходимые стили в отдельных CSS файлах
3. THE P2P-Messenger SHALL включать всю логику в отдельных JavaScript модулях
4. THE P2P-Messenger SHALL работать при открытии index.html в любом современном браузере
5. THE P2P-Messenger SHALL не требовать установки дополнительных зависимостей для работы клиентской части

### Requirement 7

**User Story:** Как разработчик, я хочу развернуть приложение на хостинге, чтобы мои друзья могли протестировать мессенджер по URL

#### Acceptance Criteria

1. THE P2P-Messenger SHALL быть развернут на публично доступном хостинге
2. WHEN пользователь открывает URL приложения, THEN THE P2P-Messenger SHALL загрузиться и быть готовым к использованию
3. THE P2P-Messenger SHALL использовать публичные STUN/TURN серверы для работы WebRTC
4. THE P2P-Messenger SHALL включать минимальный signaling-server для обмена connection metadata
5. WHEN несколько пользователей открывают приложение одновременно, THEN THE P2P-Messenger SHALL позволять им находить друг друга и общаться

### Requirement 8

**User Story:** Как пользователь, я хочу видеть интуитивно понятный интерфейс, чтобы легко использовать все функции мессенджера

#### Acceptance Criteria

1. THE P2P-Messenger SHALL отображать username пользователя в верхней части интерфейса
2. THE P2P-Messenger SHALL предоставлять четко видимое поле поиска для нахождения других пользователей
3. THE P2P-Messenger SHALL отображать список чатов в боковой панели с именами peers
4. THE P2P-Messenger SHALL отображать область сообщений с четким разделением между отправленными и полученными сообщениями
5. THE P2P-Messenger SHALL предоставлять поле ввода сообщения с кнопкой отправки в нижней части чата
