const { spawn } = require('child_process');
const path = require('path');

class AudioManager {
  constructor() {
    this.pythonProcess = null;
    this.isCapturing = false;
    this.io = null;
  }

  setIO(io) {
    this.io = io;
  }

  startAudioCapture(serverUrl = 'http://localhost:3001') {
    if (this.isCapturing) {
      console.log('Audio capture already running');
      return;
    }

    try {
      const pythonScript = path.join(__dirname, 'audioCapture.py');
      
      // Spawn Python process in hidden mode (no console window)
      const spawnOptions = {
        detached: false,
        stdio: ['ignore', 'pipe', 'pipe']
      };

      // On Windows, hide the console window
      if (process.platform === 'win32') {
        spawnOptions.windowsHide = true;
      }

      this.pythonProcess = spawn('python', [pythonScript, serverUrl], spawnOptions);
      
      this.pythonProcess.stdout.on('data', (data) => {
        const message = data.toString().trim();
        if (message) {
          console.log(`🐍 Python: ${message}`);
        }
      });

      this.pythonProcess.stderr.on('data', (data) => {
        const message = data.toString().trim();
        if (message) {
          console.error(`🐍 Python Error: ${message}`);
        }
      });

      this.pythonProcess.on('error', (error) => {
        console.error('Failed to start audio capture:', error);
        this.isCapturing = false;
      });

      this.pythonProcess.on('exit', (code) => {
        console.log(`Audio capture process exited with code ${code}`);
        this.isCapturing = false;
        this.pythonProcess = null;
      });

      this.isCapturing = true;
      console.log('Audio capture started successfully');
      
    } catch (error) {
      console.error('Error starting audio capture:', error);
      this.isCapturing = false;
    }
  }

  stopAudioCapture() {
    if (this.pythonProcess) {
      try {
        this.pythonProcess.kill('SIGTERM');
        this.pythonProcess = null;
        this.isCapturing = false;
        console.log('Audio capture stopped');
      } catch (error) {
        console.error('Error stopping audio capture:', error);
      }
    }
  }

  broadcastAudioChunk(audioData) {
    if (this.io) {
      // Broadcast audio to all connected clients
      this.io.emit('audio-chunk', audioData);
    } else {
      console.warn('⚠️ Cannot broadcast audio: io not initialized');
    }
  }

  getStatus() {
    return {
      isCapturing: this.isCapturing,
      processRunning: this.pythonProcess !== null
    };
  }
}

module.exports = AudioManager;
