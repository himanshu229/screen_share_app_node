const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ServerScreenCapture = require('./services/serverScreenCapture');

const app = express();
const server = http.createServer(app);

// Initialize server-side screen capture
const screenCapture = new ServerScreenCapture();

// Configure Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Store active connections (simplified - no rooms)
const connections = new Map();
let isServerCapturing = false;
let connectedClients = 0;

// Screen capture frame handler - broadcast to all connected clients
const handleScreenFrame = (frameData) => {
  // Broadcast to all connected clients
  io.emit('screen-frame', frameData);
};

// Auto-start capture when first client connects
const autoStartCapture = async () => {
  if (!isServerCapturing && connectedClients > 0) {
    try {
      console.log('Auto-starting server screen capture...');
      screenCapture.addFrameCallback(handleScreenFrame);
      await screenCapture.startCapture();
      isServerCapturing = true;
      
      console.log('Server screen capture started successfully');
      
      // Notify all clients
      io.emit('capture-started');
      io.emit('capture-status', {
        isCapturing: isServerCapturing,
        connectedClients: connectedClients,
        ...screenCapture.getStatus()
      });
    } catch (error) {
      console.error('Failed to auto-start server capture:', error);
      
      // Notify clients about the permission error
      io.emit('capture-error', { 
        message: error.message,
        type: 'permission_error',
        instructions: 'Please grant screen recording permission to Terminal/Node.js in System Preferences > Security & Privacy > Privacy > Screen Recording, then restart the server.'
      });
    }
  }
};

// Auto-stop capture when no clients connected
const autoStopCapture = () => {
  if (isServerCapturing && connectedClients === 0) {
    console.log('Auto-stopping server screen capture (no clients)...');
    screenCapture.stopCapture();
    screenCapture.removeFrameCallback(handleScreenFrame);
    isServerCapturing = false;
  }
};

// API Routes
app.use('/api', require('./routes/api'));

// Make io and screenCapture available to API routes
app.set('io', io);
app.set('screenCapture', screenCapture);

// Serve static files from React build (in production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  connectedClients++;
  
  // Store connection
  connections.set(socket.id, {
    connectedAt: Date.now()
  });

  // Send last frame immediately if available
  const lastFrame = screenCapture.getLastFrame();
  if (lastFrame) {
    socket.emit('screen-frame', lastFrame);
  }

  // Auto-start capture when first client connects
  autoStartCapture();

  // Send current capture status to new client
  socket.emit('capture-status', {
    isCapturing: isServerCapturing,
    connectedClients: connectedClients,
    ...screenCapture.getStatus()
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    connectedClients--;
    connections.delete(socket.id);
    
    // Auto-stop capture if no clients left
    setTimeout(() => {
      autoStopCapture();
    }, 1000); // Small delay to handle quick reconnects
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});