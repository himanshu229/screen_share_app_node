import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(serverUrl = '') {
    // In development, connect to backend server on port 3001
    const url = serverUrl || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001');
    
    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
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