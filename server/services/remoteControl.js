const robot = require('robotjs');

class RemoteControl {
  constructor() {
    this.isEnabled = false;
    this.screenSize = robot.getScreenSize();
    this.lastMouseMove = 0;
    this.mouseMoveDelay = 8; // Minimum 8ms between moves (~125 FPS max)
    
    // Configure robot for speed
    robot.setMouseDelay(0); // No delay for instant movement
    robot.setKeyboardDelay(1); // Minimal delay
  }

  enable() {
    this.isEnabled = true;
    this.screenSize = robot.getScreenSize();
    console.log('Remote control enabled. Screen size:', this.screenSize);
  }

  disable() {
    this.isEnabled = false;
    console.log('Remote control disabled');
  }

  // Mouse movement
  moveMouse(data) {
    if (!this.isEnabled) return;
    
    // Throttle on server side too
    const now = Date.now();
    if (now - this.lastMouseMove < this.mouseMoveDelay) {
      return; // Skip
    }
    this.lastMouseMove = now;
    
    try {
      const { x, y, scaleX, scaleY } = data;
      
      // Convert from canvas coordinates to screen coordinates
      // x, y are in canvas pixels
      // scaleX, scaleY are canvas pixels / screen pixels
      const actualX = Math.round(x / scaleX);
      const actualY = Math.round(y / scaleY);
      
      // Clamp to screen bounds
      const clampedX = Math.max(0, Math.min(actualX, this.screenSize.width - 1));
      const clampedY = Math.max(0, Math.min(actualY, this.screenSize.height - 1));
      
      // Debug log occasionally
      if (Math.random() < 0.01) {
        console.log(`Mouse: canvas(${x.toFixed(0)},${y.toFixed(0)}) → screen(${clampedX},${clampedY}) | Screen: ${this.screenSize.width}x${this.screenSize.height}`);
      }
      
      // Move mouse smoothly
      robot.moveMouse(clampedX, clampedY);
    } catch (error) {
      console.error('Error moving mouse:', error);
    }
  }

  // Mouse click
  mouseClick(data) {
    if (!this.isEnabled) return;
    
    try {
      const { button, double } = data;
      const mouseButton = button === 'right' ? 'right' : 'left';
      
      if (double) {
        robot.mouseClick(mouseButton, true); // Double click
      } else {
        robot.mouseClick(mouseButton, false); // Single click
      }
      
      console.log(`Mouse ${mouseButton} ${double ? 'double-' : ''}click`);
    } catch (error) {
      console.error('Error clicking mouse:', error);
    }
  }

  // Mouse down
  mouseDown(data) {
    if (!this.isEnabled) return;
    
    try {
      const { button } = data;
      const mouseButton = button === 'right' ? 'right' : 'left';
      robot.mouseToggle('down', mouseButton);
    } catch (error) {
      console.error('Error mouse down:', error);
    }
  }

  // Mouse up
  mouseUp(data) {
    if (!this.isEnabled) return;
    
    try {
      const { button } = data;
      const mouseButton = button === 'right' ? 'right' : 'left';
      robot.mouseToggle('up', mouseButton);
    } catch (error) {
      console.error('Error mouse up:', error);
    }
  }

  // Mouse scroll
  mouseScroll(data) {
    if (!this.isEnabled) return;
    
    try {
      const { deltaY } = data;
      // Normalize scroll amount
      const scrollAmount = Math.round(deltaY / 10);
      robot.scrollMouse(0, -scrollAmount); // Negative for natural scrolling
    } catch (error) {
      console.error('Error scrolling:', error);
    }
  }

  // Keyboard input
  keyPress(data) {
    if (!this.isEnabled) return;
    
    try {
      const { key, modifiers } = data;
      
      // Handle modifier keys (ctrl, shift, alt, meta/cmd)
      if (modifiers && modifiers.length > 0) {
        const keys = [...modifiers, key];
        robot.keyTap(key, modifiers);
      } else {
        robot.keyTap(key);
      }
      
      console.log(`Key press: ${key}`, modifiers);
    } catch (error) {
      console.error('Error pressing key:', error);
    }
  }

  // Type text
  typeText(data) {
    if (!this.isEnabled) return;
    
    try {
      const { text } = data;
      robot.typeString(text);
      console.log(`Typed text: ${text.substring(0, 20)}...`);
    } catch (error) {
      console.error('Error typing text:', error);
    }
  }

  // Get screen size
  getScreenSize() {
    return this.screenSize;
  }
}

module.exports = RemoteControl;
