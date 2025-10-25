import React, { useState, useEffect, useRef } from 'react';
import socketService from '../services/socketService';

const ScreenShare = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastFrameTime, setLastFrameTime] = useState(null);
  const [connectedClients, setConnectedClients] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [permissionError, setPermissionError] = useState(false);
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    initializeConnection();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeConnection = () => {
    try {
      // Connect to socket server
      socketService.connect();
      
      // Set up socket event listeners
      setupSocketListeners();
      
      setIsConnected(true);
      console.log('Connected to screen share server');
    } catch (error) {
      console.error('Failed to initialize connection:', error);
    }
  };

  const setupSocketListeners = () => {
    // Listen for screen frames from server
    socketService.onScreenFrame((frameData) => {
      displayFrame(frameData);
      setLastFrameTime(frameData.timestamp);
      setErrorMessage(null); // Clear any previous errors
      setPermissionError(false);
    });

    // Listen for capture status changes
    socketService.onCaptureStatus((status) => {
      setIsCapturing(status.isCapturing);
      setConnectedClients(status.connectedClients || 0);
    });

    socketService.onCaptureStarted(() => {
      console.log('Server screen capture started');
      setIsCapturing(true);
      setErrorMessage(null);
      setPermissionError(false);
    });

    socketService.onCaptureStopped(() => {
      console.log('Server screen capture stopped');
      setIsCapturing(false);
      clearCanvas();
    });

    // Listen for capture errors (permission issues)
    socketService.onCaptureError((error) => {
      console.error('Server capture error:', error);
      setErrorMessage(error.message);
      setIsCapturing(false);
      if (error.type === 'permission_error') {
        setPermissionError(true);
      }
    });
  };

  const displayFrame = (frameData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.onload = () => {
      // Set canvas size to match received frame
      if (canvas.width !== frameData.width || canvas.height !== frameData.height) {
        canvas.width = frameData.width;
        canvas.height = frameData.height;
      }
      
      // Draw the received frame
      ctx.drawImage(img, 0, 0);
    };
    img.src = frameData.data;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    
    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  const cleanup = () => {
    socketService.disconnect();
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div ref={containerRef} className="screen-share-container">
      {/* Minimal controls - only fullscreen */}
      <div className="controls">
        <button className="control-btn" onClick={toggleFullscreen}>
          {isFullscreen ? '🪟 Exit Fullscreen' : '🖥️ Fullscreen'}
        </button>
      </div>

      {/* Status info (optional, can be removed for completely clean UI) */}
      <div className="status-info">
        <div>
          Status: {isConnected ? (isCapturing ? 'Live' : 'Connecting...') : 'Disconnected'}
        </div>
        {connectedClients > 0 && <div>Viewers: {connectedClients}</div>}
        {lastFrameTime && (
          <div>
            Last Frame: {new Date(lastFrameTime).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Screen Display */}
      {isCapturing ? (
        <canvas
          ref={canvasRef}
          className="screen-canvas"
          style={{
            width: '100vw',
            height: '100vh',
            objectFit: 'contain'
          }}
        />
      ) : (
        <div className="loading-message">
          {permissionError ? (
            <div style={{ textAlign: 'center', maxWidth: '600px', padding: '20px' }}>
              <h3>🔒 Screen Recording Permission Required</h3>
              <p>The server needs permission to capture the screen.</p>
              <p><strong>Please follow these steps:</strong></p>
              <ol style={{ textAlign: 'left', margin: '20px auto', display: 'inline-block' }}>
                <li>Open <strong>System Preferences</strong></li>
                <li>Go to <strong>Security & Privacy</strong></li>
                <li>Click on <strong>Privacy</strong> tab</li>
                <li>Select <strong>Screen Recording</strong> from the left panel</li>
                <li>Check the box next to <strong>Terminal</strong> (or your Node.js app)</li>
                <li>Restart the server application</li>
              </ol>
              <p style={{ fontSize: '14px', color: '#ccc', marginTop: '20px' }}>
                After granting permission, refresh this page.
              </p>
            </div>
          ) : errorMessage ? (
            <div style={{ textAlign: 'center', color: '#ff6b6b' }}>
              <h3>❌ Error</h3>
              <p>{errorMessage}</p>
            </div>
          ) : (
            <div>
              {isConnected 
                ? 'Starting screen capture...' 
                : 'Connecting to server...'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScreenShare;