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
  const [remoteControlEnabled, setRemoteControlEnabled] = useState(false);
  const [screenSize, setScreenSize] = useState({ width: 1920, height: 1080 });
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [showCursor, setShowCursor] = useState(false);
  const [showButtons, setShowButtons] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const cursorRef = useRef(null);
  const imageCache = useRef(new Image()); // Reuse same image object
  const lastFrameId = useRef(0); // Track frame sequence
  const rafId = useRef(null); // RequestAnimationFrame ID
  const lastMouseSendTime = useRef(0); // Throttle mouse events
  const mouseThrottleDelay = 16; // ~60 FPS for mouse (16ms)
  const lastClickTime = useRef(0);
  const doubleClickDelay = 300;
  const buttonHideTimer = useRef(null);
  const audioContextRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingAudioRef = useRef(false);
  const isAudioEnabledRef = useRef(false); // Use ref to avoid stale closure
  const nextPlayTimeRef = useRef(0); // Track next scheduled play time for smooth playback
  const scheduledSourcesRef = useRef([]); // Track all scheduled sources

  useEffect(() => {
    initializeConnection();
    
    return () => {
      cleanup();
    };
  }, []);

  // Initialize audio context
  useEffect(() => {
    const initAudio = async () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext({
          sampleRate: 48000, // Match server sample rate
          latencyHint: 'interactive'
        });
        console.log('Audio context initialized:', audioContextRef.current.sampleRate);
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
      }
    };

    initAudio();

    return () => {
      if (audioContextRef.current) {
        // Stop all scheduled sources
        scheduledSourcesRef.current.forEach(source => {
          try {
            source.stop();
          } catch (e) {
            // Ignore if already stopped
          }
        });
        scheduledSourcesRef.current = [];
        audioContextRef.current.close();
      }
    };
  }, []);

  // Auto-hide buttons effect
  useEffect(() => {
    // Clear any existing timer on cleanup
    return () => {
      if (buttonHideTimer.current) {
        clearTimeout(buttonHideTimer.current);
      }
    };
  }, []);

  // Handle button visibility based on control state
  const resetButtonHideTimer = () => {
    if (!remoteControlEnabled) {
      return; // Don't hide if control is off
    }

    // Show buttons
    setShowButtons(true);

    // Clear existing timer
    if (buttonHideTimer.current) {
      clearTimeout(buttonHideTimer.current);
    }

    // Set new timer to hide after 3 seconds
    buttonHideTimer.current = setTimeout(() => {
      setShowButtons(false);
    }, 3000);
  };

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
      // Parse optimized frame data
      const parsedFrame = {
        data: `data:image/jpeg;base64,${frameData.d}`,
        width: frameData.w,
        height: frameData.h,
        timestamp: frameData.t
      };
      
      // Only display if newer than last frame (prevent old frames)
      if (parsedFrame.timestamp > lastFrameId.current) {
        lastFrameId.current = parsedFrame.timestamp;
        displayFrame(parsedFrame);
        setLastFrameTime(parsedFrame.timestamp);
        setErrorMessage(null);
        setPermissionError(false);
      }
    });

    // Listen for audio chunks
    socketService.onAudioChunk((audioData) => {
      // Use ref instead of state to avoid stale closure
      if (isAudioEnabledRef.current) {
        playAudioChunk(audioData);
      }
    });

    // Listen for capture status changes
    socketService.onCaptureStatus((status) => {
      setIsCapturing(status.isCapturing);
      setConnectedClients(status.connectedClients || 0);
      if (status.remoteControlEnabled !== undefined) {
        setRemoteControlEnabled(status.remoteControlEnabled);
      }
      if (status.screenSize) {
        setScreenSize(status.screenSize);
      }
    });

    socketService.onRemoteControlStatus((status) => {
      setRemoteControlEnabled(status.enabled);
    });

    socketService.onCaptureStarted(() => {
      console.log('Server screen capture started');
      setIsCapturing(true);
      setErrorMessage(null);
      setPermissionError(false);
      lastFrameId.current = 0; // Reset frame tracking
    });

    socketService.onCaptureStopped(() => {
      console.log('Server screen capture stopped');
      setIsCapturing(false);
      clearCanvas();
      lastFrameId.current = 0;
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

  const playAudioChunk = async (audioData) => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        return;
      }

      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const audioContext = audioContextRef.current;

      // Decode base64 audio data
      const binaryString = atob(audioData.audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert Int16 to Float32
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      // Create audio buffer
      const numFrames = float32Array.length / audioData.channels;
      const audioBuffer = audioContext.createBuffer(
        audioData.channels,
        numFrames,
        audioData.sampleRate
      );

      // Fill channels
      for (let channel = 0; channel < audioData.channels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        for (let i = 0; i < numFrames; i++) {
          channelData[i] = float32Array[i * audioData.channels + channel];
        }
      }

      // Log occasionally
      if (Math.random() < 0.05) {
        console.log('🎵 Chunk:', {
          duration: (audioBuffer.duration * 1000).toFixed(1) + 'ms',
          queueSize: audioQueueRef.current.length,
          bufferAhead: ((nextPlayTimeRef.current - audioContext.currentTime) * 1000).toFixed(0) + 'ms'
        });
      }

      // Add to queue
      audioQueueRef.current.push(audioBuffer);

      // Start playing if not already playing
      if (!isPlayingAudioRef.current) {
        isPlayingAudioRef.current = true;
        processAudioQueue();
      }

    } catch (error) {
      console.error('❌ Error in playAudioChunk:', error);
    }
  };

  const processAudioQueue = () => {
    if (!isAudioEnabledRef.current || !audioContextRef.current) {
      isPlayingAudioRef.current = false;
      audioQueueRef.current = [];
      nextPlayTimeRef.current = 0;
      return;
    }

    const audioContext = audioContextRef.current;
    const currentTime = audioContext.currentTime;

    // Minimal initial buffer for ultra-low latency - 2 chunks (~32ms)
    if (audioQueueRef.current.length < 2 && nextPlayTimeRef.current <= currentTime) {
      isPlayingAudioRef.current = false;
      setTimeout(() => {
        if (audioQueueRef.current.length > 0) {
          processAudioQueue();
        }
      }, 10);
      return;
    }

    // Initialize nextPlayTime with minimal buffer (30ms)
    if (nextPlayTimeRef.current < currentTime) {
      nextPlayTimeRef.current = currentTime + 0.03;
      console.log('🎵 Starting audio playback with', audioQueueRef.current.length, 'chunks buffered');
    }

    // Process chunks in batches for smoother playback
    let chunksProcessed = 0;
    const maxChunksPerBatch = 3;
    
    while (audioQueueRef.current.length > 0 && chunksProcessed < maxChunksPerBatch) {
      const audioBuffer = audioQueueRef.current.shift();
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      // Schedule playback
      source.start(nextPlayTimeRef.current);
      scheduledSourcesRef.current.push(source);
      
      // Update next play time
      nextPlayTimeRef.current += audioBuffer.duration;
      chunksProcessed++;
      
      // Clean up finished sources
      source.onended = () => {
        const index = scheduledSourcesRef.current.indexOf(source);
        if (index > -1) {
          scheduledSourcesRef.current.splice(index, 1);
        }
      };
    }

    // Continue processing
    if (isAudioEnabledRef.current) {
      if (audioQueueRef.current.length > 0) {
        // Process next batch very quickly
        setTimeout(() => processAudioQueue(), 5);
      } else {
        // Check buffer level
        const bufferAhead = nextPlayTimeRef.current - audioContext.currentTime;
        if (bufferAhead < 0.02) {
          // Buffer underrun - reset and wait for more data
          nextPlayTimeRef.current = 0;
        }
        isPlayingAudioRef.current = false;
        // Check again soon
        setTimeout(() => {
          if (audioQueueRef.current.length > 0) {
            processAudioQueue();
          }
        }, 10);
      }
    } else {
      isPlayingAudioRef.current = false;
    }
  };

  const toggleAudio = async () => {
    const newAudioState = !isAudioEnabled;
    
    if (newAudioState && audioContextRef.current) {
      // Resume audio context on user interaction
      console.log('🔊 Enabling audio...');
      await audioContextRef.current.resume();
      console.log('✅ Audio enabled, state:', audioContextRef.current.state);
      
      // Reset everything
      audioQueueRef.current = [];
      nextPlayTimeRef.current = 0;
      isPlayingAudioRef.current = false;
    } else if (!newAudioState) {
      console.log('🔇 Disabling audio');
      
      // Stop all scheduled audio
      scheduledSourcesRef.current.forEach(source => {
        try {
          source.stop();
        } catch (e) {
          // Ignore
        }
      });
      scheduledSourcesRef.current = [];
      audioQueueRef.current = [];
      nextPlayTimeRef.current = 0;
      isPlayingAudioRef.current = false;
    }
    
    setIsAudioEnabled(newAudioState);
    isAudioEnabledRef.current = newAudioState;
  };

  const displayFrame = (frameData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Skip requestAnimationFrame for lower latency - render immediately
    const ctx = canvas.getContext('2d', { 
      alpha: false,
      desynchronized: true, // Allow async rendering for performance
      willReadFrequently: false
    });
    
    // Reuse the same image object for better performance
    const img = imageCache.current;
    
    img.onload = () => {
      // Resize canvas only if dimensions changed
      if (canvas.width !== frameData.width || canvas.height !== frameData.height) {
        canvas.width = frameData.width;
        canvas.height = frameData.height;
      }
      
      // Enable smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium'; // Balance of quality and speed
      
      // Direct pixel-perfect rendering - no RAF for lower latency
      ctx.drawImage(img, 0, 0, frameData.width, frameData.height);
    };
    
    // Set source last to trigger load
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

  const toggleRemoteControl = () => {
    if (remoteControlEnabled) {
      socketService.disableRemoteControl();
      // Clear hide timer when turning off control
      if (buttonHideTimer.current) {
        clearTimeout(buttonHideTimer.current);
      }
      setShowButtons(true); // Show buttons when control is off
    } else {
      socketService.enableRemoteControl();
      setShowButtons(false); // Hide buttons initially when control is on
    }
  };

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    
    // Get mouse position relative to canvas display
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate the actual canvas content size (accounting for object-fit: contain)
    const canvasRatio = canvas.width / canvas.height;
    const displayRatio = rect.width / rect.height;
    
    let contentWidth, contentHeight, offsetX, offsetY;
    
    if (displayRatio > canvasRatio) {
      // Canvas is limited by height (black bars on sides)
      contentHeight = rect.height;
      contentWidth = contentHeight * canvasRatio;
      offsetX = (rect.width - contentWidth) / 2;
      offsetY = 0;
    } else {
      // Canvas is limited by width (black bars on top/bottom)
      contentWidth = rect.width;
      contentHeight = contentWidth / canvasRatio;
      offsetX = 0;
      offsetY = (rect.height - contentHeight) / 2;
    }
    
    // Adjust mouse position for content offset
    const adjustedX = mouseX - offsetX;
    const adjustedY = mouseY - offsetY;
    
    // If outside content area, ignore
    if (adjustedX < 0 || adjustedX > contentWidth || adjustedY < 0 || adjustedY > contentHeight) {
      return null;
    }
    
    // Scale from content size to canvas pixel size
    const x = (adjustedX / contentWidth) * canvas.width;
    const y = (adjustedY / contentHeight) * canvas.height;
    
    // Calculate scale factors for server-side mapping
    const scaleX = canvas.width / screenSize.width;
    const scaleY = canvas.height / screenSize.height;

    return { x, y, scaleX, scaleY };
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Update cursor position for visual feedback (always smooth)
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCursorPosition({ x, y });
    setShowCursor(true);

    // Don't reset timer on mouse movement inside screen when control is ON
    // Timer resets only when mouse leaves the screen

    if (!remoteControlEnabled) return;
    
    // Throttle mouse move events to prevent network flooding
    const now = Date.now();
    if (now - lastMouseSendTime.current < mouseThrottleDelay) {
      return; // Skip this event
    }
    lastMouseSendTime.current = now;
    
    const coords = getCanvasCoordinates(e);
    if (coords) {
      socketService.sendMouseMove(coords);
    }
  };

  const handleMouseLeave = () => {
    setShowCursor(false);
    
    // Show buttons when cursor leaves the screen area (while control is ON)
    if (remoteControlEnabled) {
      resetButtonHideTimer();
    }
  };

  const handleMouseClick = (e) => {
    if (!remoteControlEnabled) return;
    
    e.preventDefault();
    const button = e.button === 2 ? 'right' : 'left';
    socketService.sendMouseClick({ button, double: e.detail === 2 });
  };

  const handleMouseDown = (e) => {
    if (!remoteControlEnabled) return;
    
    e.preventDefault();
    const button = e.button === 2 ? 'right' : 'left';
    socketService.sendMouseDown({ button });
  };

  const handleMouseUp = (e) => {
    if (!remoteControlEnabled) return;
    
    e.preventDefault();
    const button = e.button === 2 ? 'right' : 'left';
    socketService.sendMouseUp({ button });
  };

  const handleWheel = (e) => {
    if (!remoteControlEnabled) return;
    
    e.preventDefault();
    socketService.sendMouseScroll({ deltaY: e.deltaY });
  };

  const handleContextMenu = (e) => {
    if (remoteControlEnabled) {
      e.preventDefault();
    }
  };

  const handleKeyDown = (e) => {
    if (!remoteControlEnabled) return;
    
    // Don't prevent certain important browser shortcuts
    if ((e.ctrlKey || e.metaKey) && ['r', 'w', 't', 'n'].includes(e.key.toLowerCase())) {
      return; // Allow refresh, close, new tab
    }
    
    e.preventDefault();
    
    const modifiers = [];
    if (e.ctrlKey) modifiers.push('control');
    if (e.shiftKey) modifiers.push('shift');
    if (e.altKey) modifiers.push('alt');
    if (e.metaKey) modifiers.push('command');
    
    socketService.sendKeyPress({ key: e.key.toLowerCase(), modifiers });
  };

  const cleanup = () => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
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

  // Add keyboard listener when remote control is enabled
  useEffect(() => {
    if (remoteControlEnabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [remoteControlEnabled]);

  return (
    <div ref={containerRef} className="screen-share-container">
      {/* Controls - conditionally show/hide */}
      {showButtons && (
        <div className="controls">
          <button className="control-btn" onClick={toggleFullscreen}>
            {isFullscreen ? '🪟 Exit Fullscreen' : '🖥️ Fullscreen'}
          </button>
          <button 
            className={`control-btn ${remoteControlEnabled ? 'active' : ''}`}
            onClick={toggleRemoteControl}
            title={remoteControlEnabled ? 'Disable Remote Control' : 'Enable Remote Control'}
          >
            {remoteControlEnabled ? '🎮 Control ON' : '🎮 Control OFF'}
          </button>
          <button 
            className={`control-btn ${isAudioEnabled ? 'active' : ''}`}
            onClick={toggleAudio}
            title={isAudioEnabled ? 'Mute Audio' : 'Unmute Audio'}
          >
            {isAudioEnabled ? '🔊 Audio ON' : '🔇 Audio OFF'}
          </button>
        </div>
      )}

      {/* Screen Display */}
      {isCapturing ? (
        <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
          <canvas
            ref={canvasRef}
            className="screen-canvas"
            style={{
              width: '100vw',
              height: '100vh',
              objectFit: 'contain',
              cursor: 'none' // Always hide system cursor for better visual
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleMouseClick}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            onContextMenu={handleContextMenu}
            tabIndex={0}
          />
          {/* Custom Cursor Overlay */}
          {showCursor && (
            <div
              ref={cursorRef}
              style={{
                position: 'absolute',
                left: `${cursorPosition.x}px`,
                top: `${cursorPosition.y}px`,
                width: '20px',
                height: '20px',
                pointerEvents: 'none',
                zIndex: 10000,
                transform: 'translate(-2px, -2px)',
                willChange: 'left, top' // Optimize for smooth movement
              }}
            >
              {/* Arrow Cursor */}
              <svg width="20" height="20" viewBox="0 0 20 20" style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))' }}>
                <path
                  d="M 0 0 L 0 16 L 5 11 L 8 18 L 10 17 L 7 10 L 13 10 Z"
                  fill={remoteControlEnabled ? '#00ff00' : '#ffffff'}
                  stroke="#000000"
                  strokeWidth="1"
                />
              </svg>
              {/* Control indicator */}
              {remoteControlEnabled && (
                <div
                  style={{
                    position: 'absolute',
                    top: '22px',
                    left: '0px',
                    background: 'rgba(0, 255, 0, 0.8)',
                    color: '#000',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}
                >
                  CONTROLLING
                </div>
              )}
            </div>
          )}
        </div>
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