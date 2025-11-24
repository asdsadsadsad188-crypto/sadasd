# Implementation Plan - Voice Calls & Screen Share

- [x] 1. Extend ConnectionManager for media streams



  - Add methods for adding audio/video tracks to existing RTCPeerConnection
  - Implement track management (add/remove/replace)
  - Handle remote track events

  - _Requirements: 1.4, 4.3_


- [x] 2. Create CallManager module

  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 2.1 Implement call state management


  - Create CallState data structure
  - Implement state transitions (idle → calling → active → ended)

  - Track call metadata (start time, participants, status)
  - _Requirements: 1.1, 6.1, 6.2_



- [ ] 2.2 Implement call initiation
  - Create initiateCall() method
  - Request microphone access with getUserMedia()

  - Add audio track to existing WebRTC connection

  - Send call-offer signal through SignalingClient
  - _Requirements: 1.1, 1.2, 1.3_


- [ ] 2.3 Implement call receiving
  - Handle incoming call-offer signals
  - Create acceptCall() method to accept calls

  - Create rejectCall() method to reject calls
  - Request microphone access on accept



  - Send call-answer or call-reject signals
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_



- [ ] 2.4 Implement call termination
  - Create endCall() method
  - Stop all media tracks
  - Remove tracks from RTCPeerConnection

  - Send call-end signal


  - Clean up call state
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_



- [x] 3. Implement microphone controls


  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3.1 Create toggleMicrophone() method
  - Toggle audio track enabled state
  - Update call state with microphone status

  - Emit microphoneToggled event

  - _Requirements: 3.1, 3.3_

- [x] 3.2 Implement microphone state tracking


  - Track microphone enabled/disabled state


  - Provide getMicrophoneState() method

  - Handle microphone state in CallState
  - _Requirements: 3.2, 3.4, 3.5_


- [x] 4. Implement screen sharing

  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_




- [ ] 4.1 Create startScreenShare() method
  - Request screen capture with getDisplayMedia()
  - Add video track to RTCPeerConnection

  - Send screen-share-start signal
  - Update call state

  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 4.2 Create stopScreenShare() method
  - Stop screen capture track

  - Remove video track from connection

  - Send screen-share-stop signal
  - Update call state
  - _Requirements: 4.5_





- [ ] 4.3 Handle remote screen share
  - Listen for screen-share-start signals


  - Receive and display remote video track
  - Listen for screen-share-stop signals




  - _Requirements: 4.4, 6.4_

- [ ] 5. Create AudioManager module
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_



- [ ] 5.1 Implement ringtone playback
  - Create audio elements for ringtone
  - Implement playRingtone() method with loop
  - Implement stopRingtone() method
  - _Requirements: 7.1_

- [x] 5.2 Implement dial tone playback

  - Create audio elements for dial tone

  - Implement playDialTone() method
  - Implement stopDialTone() method
  - _Requirements: 7.2_


- [ ] 5.3 Implement call end sound
  - Create audio element for end sound
  - Implement playEndCallSound() method

  - _Requirements: 7.4_



- [x] 5.4 Implement remote audio attachment

  - Create attachRemoteAudio() method
  - Connect remote MediaStream to audio element
  - Implement detachRemoteAudio() method
  - _Requirements: 1.4_

- [x] 6. Create CallUI module

  - _Requirements: 1.2, 2.1, 5.1, 6.1, 6.2, 6.3, 6.4_


- [ ] 6.1 Create HTML structure for call UI
  - Add call button to chat header
  - Create incoming call modal HTML
  - Create active call screen HTML

  - Add audio element for remote audio
  - Add video element for screen share
  - _Requirements: 1.2, 2.1_




- [ ] 6.2 Create CSS styles for call UI
  - Style call button

  - Style incoming call modal (centered, overlay)

  - Style active call screen (full screen overlay)
  - Style call controls (microphone, screen share, end call buttons)
  - Style screen share video container
  - Add animations for modal appearance


  - _Requirements: 2.1, 6.1_


- [ ] 6.3 Implement incoming call modal
  - Create showIncomingCallModal() method

  - Display caller username
  - Wire up accept button

  - Wire up reject button
  - Play ringtone when showing
  - _Requirements: 2.1, 2.2, 2.3, 7.1_

- [x] 6.4 Implement active call screen

  - Create showActiveCallScreen() method

  - Display peer username
  - Implement call timer (update every second)
  - Wire up microphone toggle button


  - Wire up screen share toggle button
  - Wire up end call button

  - Update button states based on call state
  - _Requirements: 5.1, 6.1, 6.2, 6.3_



- [ ] 6.5 Implement screen share display
  - Create showScreenShare() method
  - Attach remote screen stream to video element




  - Show video container
  - Create hideScreenShare() method

  - _Requirements: 4.4, 6.4_

- [ ] 6.6 Implement call status updates
  - Create updateCallStatus() method
  - Display status text (Вызов..., Активен, etc.)

  - Update UI based on call state changes
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 7. Integrate call functionality with existing app
  - _Requirements: 1.1, 1.2, 2.1, 5.1_


- [ ] 7.1 Update SignalingClient for call signals
  - Add handling for call-offer messages
  - Add handling for call-answer messages
  - Add handling for call-reject messages
  - Add handling for call-end messages
  - Add handling for screen-share-start messages
  - Add handling for screen-share-stop messages
  - Emit appropriate events for CallManager
  - _Requirements: 1.2, 1.3, 2.4, 5.3_

- [ ] 7.2 Update SignalingServer for call signals
  - Forward call-offer messages
  - Forward call-answer messages
  - Forward call-reject messages
  - Forward call-end messages
  - Forward screen-share-start messages
  - Forward screen-share-stop messages
  - _Requirements: 1.2, 2.4, 5.3_

- [ ] 7.3 Initialize CallManager in app.js
  - Create CallManager instance
  - Pass ConnectionManager and SignalingClient
  - Create AudioManager instance
  - Create CallUI instance
  - Wire up event handlers between components
  - _Requirements: 1.1, 2.1_

- [ ] 7.4 Add call button to chat interface
  - Add call button to chat header (next to username)
  - Show button only when chat is active
  - Wire up button to CallManager.initiateCall()
  - _Requirements: 1.1, 1.2_

- [ ] 8. Implement error handling
  - _Requirements: 1.5, 2.5, 4.2, 5.4_

- [ ] 8.1 Handle microphone permission errors
  - Catch getUserMedia errors
  - Show user-friendly error message
  - Provide instructions for granting permission
  - _Requirements: 3.1_

- [ ] 8.2 Handle screen share cancellation
  - Catch getDisplayMedia errors
  - Handle user cancelling screen selection
  - Don't interrupt call on cancellation
  - _Requirements: 4.2_

- [ ] 8.3 Handle connection errors during call
  - Listen for connection state changes
  - Attempt reconnection on disconnect
  - Show reconnecting status to user
  - End call after failed reconnection attempts
  - _Requirements: 5.4_

- [ ] 9. Add call notifications
  - _Requirements: 2.1, 6.1_

- [ ] 9.1 Request notification permission
  - Request permission on app load
  - Store permission state
  - _Requirements: 2.1_

- [ ] 9.2 Show browser notification for incoming calls
  - Show notification when call received
  - Include caller username in notification
  - Play sound with notification
  - _Requirements: 2.1, 7.1_

- [ ] 10. Testing and deployment
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [ ] 10.1 Test call functionality locally
  - Test call initiation and acceptance
  - Test call rejection
  - Test microphone toggle
  - Test screen sharing
  - Test call termination
  - Test with two browser windows
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [ ] 10.2 Deploy to production
  - Commit all changes to GitHub
  - Verify HTTPS is enabled (required for getUserMedia)
  - Test on production URLs
  - Test between different devices
  - _Requirements: 1.1, 2.1_
