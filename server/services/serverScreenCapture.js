const screenshot = require('screenshot-desktop');
const sharp = require('sharp');

class ServerScreenCapture {
  constructor() {
    this.isCapturing = false;
    this.captureInterval = null;
    this.frameRate = 120; // Target 120+ FPS
    this.quality = 100; // JPEG quality (1-100)
    this.frameCallbacks = new Set();
    this.lastScreenshot = null;
    this.captureOptions = {
      format: 'png', // screenshot-desktop format
      screen: 0, // Primary screen
    };
  }

  // Add callback for frame data
  addFrameCallback(callback) {
    this.frameCallbacks.add(callback);
  }

  // Remove callback
  removeFrameCallback(callback) {
    this.frameCallbacks.delete(callback);
  }

  // Start capturing screen
  async startCapture() {
    if (this.isCapturing) {
      console.log('Screen capture already running');
      return;
    }

    console.log(`Starting server-side screen capture at ${this.frameRate} FPS`);
    
    // Test screen capture permissions first
    try {
      await this.testScreenCapturePermissions();
    } catch (error) {
      console.error('Screen capture permissions required!');
      console.error('Please grant screen recording permission to Terminal/Node.js in:');
      console.error('System Preferences > Security & Privacy > Privacy > Screen Recording');
      throw new Error('Screen capture permission denied. Please grant screen recording permission to Terminal/Node.js in System Preferences > Security & Privacy > Privacy > Screen Recording');
    }

    this.isCapturing = true;

    // Calculate interval for target FPS
    const intervalMs = Math.floor(1000 / this.frameRate);

    this.captureInterval = setInterval(async () => {
      try {
        await this.captureFrame();
      } catch (error) {
        console.error('Error capturing frame:', error);
        // Don't stop capture on individual frame errors, but reduce frequency
        if (this.frameRate > 30) {
          this.frameRate = Math.max(30, this.frameRate - 10);
          console.log(`Reduced frame rate to ${this.frameRate} FPS due to capture errors`);
        }
      }
    }, intervalMs);

    // Capture first frame immediately
    try {
      await this.captureFrame();
    } catch (error) {
      console.error('Failed to capture initial frame:', error);
      this.stopCapture();
      throw error;
    }
  }

  // Test if screen capture permissions are available
  async testScreenCapturePermissions() {
    try {
      // Try a simple test capture
      const testImg = await screenshot({
        format: 'png',
        screen: 0,
      });
      
      if (!testImg || testImg.length === 0) {
        throw new Error('Empty screenshot data - permissions likely denied');
      }
      
      console.log('Screen capture permissions verified');
      return true;
    } catch (error) {
      throw new Error(`Screen capture permission test failed: ${error.message}`);
    }
  }

  // Stop capturing screen
  stopCapture() {
    if (!this.isCapturing) {
      console.log('Screen capture not running');
      return;
    }

    console.log('Stopping server-side screen capture');
    this.isCapturing = false;

    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }

    // Clear callbacks
    this.frameCallbacks.clear();
  }

  // Capture a single frame
  async captureFrame() {
    try {
      // Take screenshot using screenshot-desktop
      const img = await screenshot(this.captureOptions);
      
      // Check if we got valid image data
      if (!img || img.length === 0) {
        throw new Error('Empty screenshot data received - check screen recording permissions');
      }
      
      // Get image metadata
      const metadata = await sharp(img).metadata();
      
      // Convert to JPEG with compression for faster transmission
      const processedImg = await sharp(img)
        .jpeg({ 
          quality: this.quality,
          progressive: true,
          mozjpeg: true // Better compression
        })
        .toBuffer();

      // Convert to base64 for transmission
      const base64Data = `data:image/jpeg;base64,${processedImg.toString('base64')}`;

      // Create frame data object
      const frameData = {
        data: base64Data,
        width: metadata.width,
        height: metadata.height,
        timestamp: Date.now(),
        frameRate: this.frameRate,
        quality: this.quality
      };

      // Store last screenshot for reference
      this.lastScreenshot = frameData;

      // Send to all registered callbacks
      this.frameCallbacks.forEach(callback => {
        try {
          callback(frameData);
        } catch (error) {
          console.error('Error in frame callback:', error);
        }
      });

    } catch (error) {
      // More specific error handling
      if (error.message.includes('could not create image from display')) {
        throw new Error('Screen recording permission denied. Please grant permission in System Preferences > Security & Privacy > Privacy > Screen Recording');
      }
      console.error('Failed to capture screen:', error);
      throw error;
    }
  }

  // Get current capture status
  getStatus() {
    return {
      isCapturing: this.isCapturing,
      frameRate: this.frameRate,
      quality: this.quality,
      callbackCount: this.frameCallbacks.size,
      lastFrameTime: this.lastScreenshot?.timestamp || null
    };
  }

  // Update capture settings
  updateSettings(settings = {}) {
    if (settings.frameRate && settings.frameRate > 0 && settings.frameRate <= 240) {
      this.frameRate = settings.frameRate;
      
      // Restart capture with new frame rate if currently capturing
      if (this.isCapturing) {
        this.stopCapture();
        setTimeout(() => this.startCapture(), 100);
      }
    }

    if (settings.quality && settings.quality >= 10 && settings.quality <= 100) {
      this.quality = settings.quality;
    }

    if (settings.screen !== undefined) {
      this.captureOptions.screen = settings.screen;
    }

    console.log('Updated capture settings:', {
      frameRate: this.frameRate,
      quality: this.quality,
      screen: this.captureOptions.screen
    });
  }

  // Get available screens (for multi-monitor support)
  async getAvailableScreens() {
    try {
      // screenshot-desktop doesn't provide screen enumeration
      // Return basic info for now
      return [
        { id: 0, name: 'Primary Display', primary: true }
      ];
    } catch (error) {
      console.error('Error getting available screens:', error);
      return [];
    }
  }

  // Get last captured frame (for immediate display)
  getLastFrame() {
    return this.lastScreenshot;
  }
}

module.exports = ServerScreenCapture;