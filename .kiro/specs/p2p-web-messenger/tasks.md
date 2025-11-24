# Implementation Plan

- [x] 1. Set up project structure and configuration


  - Create directory structure for client, server, and tests
  - Initialize package.json with dependencies (ws, express, vitest, fast-check, jsdom)
  - Create vitest.config.js for test configuration
  - Set up basic HTML structure in client/index.html
  - _Requirements: 6.1, 6.3_

- [ ] 2. Implement username generation and storage
  - _Requirements: 1.1, 1.3, 1.4, 1.5_



- [ ] 2.1 Create UsernameGenerator module
  - Implement generate() method to create random alphanumeric usernames (8-16 chars)
  - Implement isValid() method to validate username format
  - _Requirements: 1.1, 1.5_

- [x]* 2.2 Write property test for username generation


  - **Property 1: Username generation format invariant**
  - **Validates: Requirements 1.5**

- [ ] 2.3 Create StorageManager module
  - Implement saveUsername() and loadUsername() methods
  - Implement saveMessage() and loadMessages() methods
  - Implement saveChatList() and loadChatList() methods
  - Handle localStorage errors gracefully
  - _Requirements: 1.3, 1.4, 3.5_

- [ ]* 2.4 Write property test for username persistence
  - **Property 2: Username persistence round-trip**
  - **Validates: Requirements 1.3, 1.4**

- [ ]* 2.5 Write property test for message persistence
  - **Property 3: Message persistence round-trip**


  - **Validates: Requirements 3.5**

- [ ] 3. Implement signaling server
  - _Requirements: 4.3, 7.4_

- [ ] 3.1 Create SignalingServer class
  - Set up WebSocket server using 'ws' library




  - Implement user registry (username → socket mapping)
  - Implement handleRegister() to register users with usernames
  - Implement handleSearch() to search for online users
  - Implement forwardMessage() to route signaling messages between peers
  - Implement handleDisconnect() to clean up on user disconnect
  - _Requirements: 4.3, 7.4_

- [ ] 3.2 Create server entry point
  - Initialize SignalingServer
  - Set up Express server for serving static files
  - Configure CORS if needed
  - Add environment variable support for port configuration
  - _Requirements: 7.4_

- [ ]* 3.3 Write unit tests for SignalingServer
  - Test user registration
  - Test message forwarding
  - Test user search functionality
  - Test disconnect handling
  - _Requirements: 4.3_

- [ ] 4. Implement client-side signaling
  - _Requirements: 2.2, 2.3, 4.3_

- [ ] 4.1 Create SignalingClient module
  - Implement WebSocket connection to signaling server
  - Implement connect() and disconnect() methods
  - Implement register() to register username with server
  - Implement sendOffer(), sendAnswer(), sendIceCandidate() methods
  - Implement searchUsers() method
  - Set up event emitters for incoming messages (offer, answer, iceCandidate)
  - _Requirements: 4.3, 2.2_

- [ ]* 4.2 Write unit tests for SignalingClient
  - Test message formatting
  - Test event emission
  - Test connection handling
  - _Requirements: 4.3_

- [ ] 5. Implement WebRTC connection management
  - _Requirements: 3.1, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 5.1 Create ConnectionManager module
  - Configure RTCPeerConnection with STUN/TURN servers
  - Implement createConnection() to establish peer connections
  - Implement handleOffer() and handleAnswer() for SDP exchange
  - Implement handleIceCandidate() for ICE candidate processing
  - Set up data channel for message transmission
  - Implement connection state change handlers
  - Implement closeConnection() method
  - _Requirements: 3.1, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 5.2 Write property test for ICE candidate exchange
  - **Property 10: ICE candidates are exchanged**
  - **Validates: Requirements 4.3**

- [ ]* 5.3 Write unit tests for ConnectionManager
  - Test RTCPeerConnection creation with correct configuration
  - Test data channel setup
  - Test connection state handling
  - _Requirements: 4.1, 4.3_

- [ ] 6. Implement chat management
  - _Requirements: 3.2, 3.3, 3.4, 5.1, 5.2, 5.3_

- [ ] 6.1 Create ChatManager module
  - Implement createChat() to initialize new chat sessions
  - Implement getChat() and getAllChats() methods
  - Implement sendMessage() to send messages through data channel
  - Implement handleIncomingMessage() to process received messages
  - Implement loadChatHistory() to load messages from storage
  - Integrate with ConnectionManager for message transmission
  - Integrate with StorageManager for persistence
  - _Requirements: 3.2, 3.3, 3.4, 5.1, 5.2, 5.3_

- [ ]* 6.2 Write property test for sent messages
  - **Property 4: Sent messages appear in UI**
  - **Validates: Requirements 3.4**

- [ ]* 6.3 Write property test for received messages
  - **Property 5: Received messages appear in UI with sender**
  - **Validates: Requirements 3.3**

- [ ]* 6.4 Write property test for chat list
  - **Property 6: Chat list contains all active chats**
  - **Validates: Requirements 5.1, 5.2**

- [ ]* 6.5 Write unit tests for ChatManager
  - Test chat creation
  - Test message handling
  - Test history loading
  - _Requirements: 3.2, 5.1_

- [ ] 7. Implement user interface
  - _Requirements: 1.2, 2.1, 5.3, 8.1, 8.3, 8.4, 8.5_

- [ ] 7.1 Create HTML structure
  - Create header with username display
  - Create sidebar for chat list and search
  - Create main chat area with message display
  - Create message input area with send button
  - _Requirements: 1.2, 2.1, 8.1, 8.3, 8.5_

- [ ] 7.2 Create CSS styles
  - Style main.css for overall layout and theme
  - Style chat.css for message display and differentiation
  - Style sidebar.css for chat list and search interface
  - Implement responsive design
  - Add visual indicators for connection status
  - _Requirements: 8.4_

- [ ] 7.3 Create UIController module
  - Implement init() to set up event listeners
  - Implement displayUsername() to show current username
  - Implement updateChatList() to render chat list
  - Implement displayChat() to show selected chat messages
  - Implement addMessage() to append new messages to UI
  - Implement displaySearchResults() to show search results
  - Implement updateConnectionStatus() to show connection state
  - Implement showNotification() for new messages in background chats
  - _Requirements: 1.2, 2.2, 2.3, 3.3, 3.4, 4.4, 4.5, 5.3, 5.4_

- [ ]* 7.4 Write property test for connection status display
  - **Property 7: Connection status reflects actual state**
  - **Validates: Requirements 4.4, 4.5, 5.5**

- [ ]* 7.5 Write property test for message differentiation
  - **Property 9: Message display differentiation**
  - **Validates: Requirements 8.4**

- [ ] 8. Implement search functionality
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 8.1 Add search logic to UIController
  - Implement real-time search input handling with debouncing
  - Call SignalingClient.searchUsers() on input
  - Display search results in UI
  - Handle user selection from results to initiate connection
  - Show "no results" message when appropriate
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 8.2 Write property test for search results
  - **Property 8: Search returns matching users**
  - **Validates: Requirements 2.3**

- [ ] 9. Create main application entry point
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.4_

- [ ] 9.1 Create app.js to wire everything together
  - Initialize StorageManager and load or generate username
  - Initialize SignalingClient and connect to server
  - Initialize ConnectionManager with signaling client
  - Initialize ChatManager with connection and storage managers
  - Initialize UIController with chat manager and signaling client
  - Set up event handlers to connect all modules
  - Handle initial username display
  - Handle connection initiation when user selects peer from search
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.4_

- [ ] 10. Add configuration and deployment setup
  - _Requirements: 4.1, 4.2, 7.1, 7.2, 7.3_

- [ ] 10.1 Create config.js for client configuration
  - Define signaling server URL (with environment detection)
  - Define STUN server configuration (stun:stun.l.google.com:19302)
  - Define TURN server configuration (optional free TURN servers)
  - Add WebRTC configuration constants
  - _Requirements: 4.1, 4.2, 7.3_

- [ ] 10.2 Create deployment configuration files
  - Create vercel.json or netlify.toml for client deployment
  - Create Procfile or railway.json for server deployment
  - Add environment variable templates (.env.example)
  - Update README.md with deployment instructions
  - _Requirements: 7.1, 7.2_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Run all unit tests and property-based tests
  - Fix any failing tests
  - Ensure all core functionality works
  - Ask the user if questions arise

- [ ] 12. Deploy to hosting
  - _Requirements: 7.1, 7.2, 7.5_

- [ ] 12.1 Deploy signaling server
  - Deploy server to Render, Railway, or Glitch
  - Configure environment variables (PORT, etc.)
  - Test WebSocket connectivity
  - Note the server URL for client configuration
  - _Requirements: 7.1, 7.4_

- [ ] 12.2 Deploy client application
  - Update config.js with production signaling server URL
  - Deploy client to Vercel, Netlify, or GitHub Pages
  - Test application loading and basic functionality
  - Verify STUN/TURN server connectivity
  - _Requirements: 7.1, 7.2, 7.5_

- [ ] 12.3 End-to-end testing
  - Test with multiple users from different locations
  - Verify username generation and display
  - Verify search functionality
  - Verify message sending and receiving
  - Verify connection status updates
  - Share URL with friends for testing
  - _Requirements: 7.5_
