const screenshot = require('screenshot-desktop');
const sharp = require('sharp');

class ServerScreenCapture {
  constructor() {
    this.isCapturing = false;
    this.captureInterval = null;
    this.frameRate = 60; // High FPS for low latency
    this.quality = 85; // Higher quality for better image
    this.scale = 0.8; // 80% scale - good balance
    this.frameCallbacks = new Set();
    this.lastScreenshot = null;
    this.frameBuffer = null; // Pre-allocated buffer
    this.isProcessing = false; // Prevent frame queue buildup
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
      // Skip frame if still processing previous one (prevent queue buildup)
      if (this.isProcessing) {
        return;
      }
      
      try {
        this.isProcessing = true;
        await this.captureFrame();
      } catch (error) {
        console.error('Error capturing frame:', error);
        // Don't reduce frequency on errors in high-performance mode
      } finally {
        this.isProcessing = false;
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
    const startTime = Date.now();
    
    try {
      // Take screenshot using screenshot-desktop
      const img = await screenshot(this.captureOptions);
      
      // Check if we got valid image data
      if (!img || img.length === 0) {
        throw new Error('Empty screenshot data received - check screen recording permissions');
      }
      
      // Get image metadata (cached if possible)
      const sharpInstance = sharp(img);
      const metadata = await sharpInstance.metadata();
      
      // Calculate scaled dimensions
      const scaledWidth = Math.round(metadata.width * this.scale);
      const scaledHeight = Math.round(metadata.height * this.scale);
      
      // Optimized processing: fast resize + good quality compression
      const processedImg = await sharpInstance
        .resize(scaledWidth, scaledHeight, {
          fit: 'inside',
          kernel: 'cubic', // Good balance of speed and quality
          withoutEnlargement: true,
          fastShrinkOnLoad: true
        })
        .jpeg({ 
          quality: this.quality,
          progressive: false,
          mozjpeg: true, // Better compression with minimal speed impact
          chromaSubsampling: '4:2:0',
          trellisQuantisation: false,
          overshootDeringing: false,
          optimizeScans: false,
          optimizeCoding: true, // Slightly better compression
          force: true
        })
        .toBuffer({ resolveWithObject: false });

      const encodeTime = Date.now() - startTime;

      // Convert to base64 for transmission
      const base64Data = processedImg.toString('base64');

      // Create minimal frame data object (no extra metadata)
      const frameData = {
        d: base64Data, // Shortened property names for smaller payload
        w: scaledWidth,
        h: scaledHeight,
        t: Date.now()
      };

      // Store last screenshot for reference
      this.lastScreenshot = {
        data: `data:image/jpeg;base64,${base64Data}`,
        width: scaledWidth,
        height: scaledHeight,
        timestamp: frameData.t,
        encodeTime: encodeTime
      };

      // Send to all registered callbacks immediately (binary transfer)
      this.frameCallbacks.forEach(callback => {
        try {
          callback(frameData);
        } catch (error) {
          console.error('Error in frame callback:', error);
        }
      });

      // Log performance metrics periodically
      if (Math.random() < 0.1) { // 10% of frames
        console.log(`⚡ Frame encode: ${encodeTime}ms | Size: ${(processedImg.length / 1024).toFixed(1)}KB | FPS: ${this.frameRate}`);
      }

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
      scale: this.scale,
      callbackCount: this.frameCallbacks.size,
      lastFrameTime: this.lastScreenshot?.timestamp || null
    };
  }

  // Update capture settings
  updateSettings(settings = {}) {
    if (settings.frameRate && settings.frameRate > 0 && settings.frameRate <= 60) {
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

    if (settings.scale && settings.scale > 0 && settings.scale <= 1) {
      this.scale = settings.scale;
    }

    if (settings.screen !== undefined) {
      this.captureOptions.screen = settings.screen;
    }

    console.log('Updated capture settings:', {
      frameRate: this.frameRate,
      quality: this.quality,
      scale: this.scale,
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