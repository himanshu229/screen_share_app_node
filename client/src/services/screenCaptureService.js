class ScreenCaptureService {
  constructor() {
    this.mediaStream = null;
    this.canvas = null;
    this.context = null;
    this.video = null;
    this.animationFrame = null;
    this.isCapturing = false;
    this.onDataCallback = null;
    this.frameRate = 120; // Target 120+ FPS
    this.frameInterval = 1000 / this.frameRate;
    this.lastFrameTime = 0;
  }

  async startCapture(onDataCallback) {
    try {
      this.onDataCallback = onDataCallback;

      // Request screen capture with high frame rate
      this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          frameRate: { ideal: this.frameRate, min: 60 },
          width: { ideal: 1920, max: 3840 },
          height: { ideal: 1080, max: 2160 },
          cursor: 'always'
        },
        audio: false // Audio can be added later if needed
      });

      // Create video element to capture frames
      this.video = document.createElement('video');
      this.video.srcObject = this.mediaStream;
      this.video.autoplay = true;
      this.video.muted = true;
      this.video.playsInline = true;

      // Wait for video to be ready
      await new Promise((resolve) => {
        this.video.onloadedmetadata = () => {
          this.video.play();
          resolve();
        };
      });

      // Create canvas for frame extraction
      this.canvas = document.createElement('canvas');
      this.context = this.canvas.getContext('2d');
      
      // Set canvas size to match video
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;

      this.isCapturing = true;
      this.captureFrames();

      // Handle stream ending (when user stops sharing)
      this.mediaStream.getTracks().forEach(track => {
        track.onended = () => {
          this.stopCapture();
        };
      });

      return {
        width: this.canvas.width,
        height: this.canvas.height,
        frameRate: this.frameRate
      };

    } catch (error) {
      console.error('Error starting screen capture:', error);
      throw error;
    }
  }

  captureFrames() {
    if (!this.isCapturing) return;

    const now = performance.now();
    
    // Control frame rate
    if (now - this.lastFrameTime >= this.frameInterval) {
      try {
        // Draw video frame to canvas
        this.context.drawImage(this.video, 0, 0);
        
        // Convert to base64 with optimized quality for performance
        const imageData = this.canvas.toDataURL('image/jpeg', 0.8);
        
        // Send frame data
        if (this.onDataCallback) {
          this.onDataCallback({
            type: 'frame',
            data: imageData,
            timestamp: now,
            width: this.canvas.width,
            height: this.canvas.height
          });
        }
        
        this.lastFrameTime = now;
      } catch (error) {
        console.error('Error capturing frame:', error);
      }
    }

    // Continue capturing
    this.animationFrame = requestAnimationFrame(() => this.captureFrames());
  }

  stopCapture() {
    this.isCapturing = false;

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }

    this.canvas = null;
    this.context = null;
    this.onDataCallback = null;
  }

  isSupported() {
    return navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia;
  }

  // Adjust frame rate dynamically for performance
  setFrameRate(frameRate) {
    this.frameRate = Math.max(30, Math.min(frameRate, 240)); // Clamp between 30-240 FPS
    this.frameInterval = 1000 / this.frameRate;
  }

  getStreamInfo() {
    if (!this.mediaStream) return null;

    const videoTrack = this.mediaStream.getVideoTracks()[0];
    if (!videoTrack) return null;

    const settings = videoTrack.getSettings();
    return {
      width: settings.width,
      height: settings.height,
      frameRate: settings.frameRate,
      aspectRatio: settings.aspectRatio
    };
  }
}

const screenCaptureService = new ScreenCaptureService();
export default screenCaptureService;