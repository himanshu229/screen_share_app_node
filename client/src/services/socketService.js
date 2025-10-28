import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(serverUrl = '') {
    // Use environment variable if available, otherwise fallback to localhost
    const url = serverUrl || 
                process.env.REACT_APP_SERVER_URL || 
                (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001');
    
    console.log('Connecting to server:', url);
    
    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      upgrade: true,
      forceNew: false,
      ackTimeout: 5000
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  joinRoom(roomId, userId, isHost) {
    if (this.socket) {
      this.socket.emit('join-room', roomId, userId, isHost);
    }
  }

  onScreenFrame(callback) {
    if (this.socket) {
      this.socket.on('screen-frame', callback);
    }
  }

  onCaptureStarted(callback) {
    if (this.socket) {
      this.socket.on('capture-started', callback);
    }
  }

  onCaptureStopped(callback) {
    if (this.socket) {
      this.socket.on('capture-stopped', callback);
    }
  }

  onCaptureStatus(callback) {
    if (this.socket) {
      this.socket.on('capture-status', callback);
    }
  }

  onCaptureError(callback) {
    if (this.socket) {
      this.socket.on('capture-error', callback);
    }
  }

  onAudioChunk(callback) {
    if (this.socket) {
      this.socket.on('audio-chunk', callback);
    } else {
      console.warn('⚠️ Cannot register audio-chunk listener: socket not initialized');
    }
  }

  requestAudioStart() {
    if (this.socket) {
      console.log('📤 Requesting audio start from Python');
      this.socket.emit('request-audio-start');
    }
  }

  requestAudioStop() {
    if (this.socket) {
      console.log('📤 Requesting audio stop from Python');
      this.socket.emit('request-audio-stop');
    }
  }

  onRemoteControlStatus(callback) {
    if (this.socket) {
      this.socket.on('remote-control-status', callback);
    }
  }

  enableRemoteControl() {
    if (this.socket) {
      this.socket.emit('enable-remote-control');
    }
  }

  disableRemoteControl() {
    if (this.socket) {
      this.socket.emit('disable-remote-control');
    }
  }

  sendMouseMove(data) {
    if (this.socket) {
      this.socket.emit('mouse-move', data);
    }
  }

  sendMouseClick(data) {
    if (this.socket) {
      this.socket.emit('mouse-click', data);
    }
  }

  sendMouseDown(data) {
    if (this.socket) {
      this.socket.emit('mouse-down', data);
    }
  }

  sendMouseUp(data) {
    if (this.socket) {
      this.socket.emit('mouse-up', data);
    }
  }

  sendMouseScroll(data) {
    if (this.socket) {
      this.socket.emit('mouse-scroll', data);
    }
  }

  sendKeyPress(data) {
    if (this.socket) {
      this.socket.emit('key-press', data);
    }
  }

  sendTypeText(data) {
    if (this.socket) {
      this.socket.emit('type-text', data);
    }
  }

  onUserJoined(callback) {
    if (this.socket) {
      this.socket.on('user-joined', callback);
    }
  }

  onUserLeft(callback) {
    if (this.socket) {
      this.socket.on('user-left', callback);
    }
  }

  onHostLeft(callback) {
    if (this.socket) {
      this.socket.on('host-left', callback);
    }
  }

  onRoomUsers(callback) {
    if (this.socket) {
      this.socket.on('room-users', callback);
    }
  }

  off(event) {
    if (this.socket) {
      this.socket.off(event);
    }
  }
}

const socketService = new SocketService();
export default socketService;