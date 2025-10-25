# Performance Optimization Guide

## Current Optimizations Applied

### 🚀 Real-Time Performance Settings

The application has been optimized for real-time screen sharing with minimal latency:

#### Server-Side Optimizations:
1. **Frame Rate**: 30 FPS (balanced for smooth real-time viewing)
2. **Image Quality**: 60% JPEG quality (good balance between quality and speed)
3. **Image Scaling**: 70% of original size (faster transmission)
4. **Compression**: MozJPEG with 4:2:0 chroma subsampling
5. **Progressive JPEG**: Disabled for faster encoding
6. **Socket.IO**: WebSocket with compression disabled for lower latency

#### Client-Side Optimizations:
1. **Canvas Rendering**: Hardware acceleration enabled
2. **Image Smoothing**: Low quality for faster rendering
3. **Alpha Channel**: Disabled for better performance
4. **Desynchronized Rendering**: Enabled for async canvas updates

## Performance Tuning

### If You Need BETTER QUALITY (at cost of speed):

Edit `server/services/serverScreenCapture.js`:

```javascript
this.frameRate = 30;    // Keep at 30 FPS
this.quality = 80;      // Increase from 60 to 80
this.scale = 0.85;      // Increase from 0.7 to 0.85
```

### If You Need BETTER SPEED (at cost of quality):

Edit `server/services/serverScreenCapture.js`:

```javascript
this.frameRate = 24;    // Decrease to 24 FPS
this.quality = 50;      // Decrease from 60 to 50
this.scale = 0.6;       // Decrease from 0.7 to 0.6
```

### If You Have FAST NETWORK (LAN):

Edit `server/services/serverScreenCapture.js`:

```javascript
this.frameRate = 30;    // Keep at 30 FPS
this.quality = 75;      // Increase quality
this.scale = 0.9;       // Minimal scaling
```

### If You Have SLOW NETWORK (WiFi):

Edit `server/services/serverScreenCapture.js`:

```javascript
this.frameRate = 20;    // Lower FPS
this.quality = 50;      // Lower quality
this.scale = 0.5;       // More aggressive scaling
```

## Recommended Settings by Use Case

### 1. **Presentations** (High Quality, Lower FPS OK)
```javascript
frameRate: 20
quality: 75
scale: 0.85
```

### 2. **Video Playback** (Smooth Motion)
```javascript
frameRate: 30
quality: 60
scale: 0.7
```

### 3. **Coding/Text Work** (High Clarity)
```javascript
frameRate: 24
quality: 80
scale: 0.9
```

### 4. **Gaming/Fast Motion** (Smooth, Lower Quality OK)
```javascript
frameRate: 30
quality: 50
scale: 0.6
```

## Network Requirements

### Bandwidth Estimates (per viewer):

- **Current Settings (30 FPS, 60% quality, 70% scale)**:
  - ~2-4 Mbps for 1080p content
  - ~1-2 Mbps for 720p content

- **High Quality (30 FPS, 80% quality, 85% scale)**:
  - ~4-6 Mbps for 1080p content
  - ~2-3 Mbps for 720p content

- **Low Quality (20 FPS, 50% quality, 60% scale)**:
  - ~1-2 Mbps for 1080p content
  - ~0.5-1 Mbps for 720p content

## Troubleshooting Slowness

### Symptoms: Laggy/Choppy Video

**Possible Causes:**
1. Slow network connection
2. Too many viewers connected
3. Server CPU overload
4. Client device too slow

**Solutions:**
1. Lower the quality/scale settings
2. Reduce frame rate
3. Ensure both devices are on same network (not over internet)
4. Close other applications on server computer
5. Use wired connection instead of WiFi

### Symptoms: Blurry Image

**Causes:**
1. Quality setting too low
2. Scale setting too low

**Solutions:**
1. Increase quality (60 → 75)
2. Increase scale (0.7 → 0.85)
3. Ensure you're viewing in fullscreen mode

### Symptoms: Connection Drops

**Causes:**
1. Network instability
2. Firewall blocking
3. Socket.IO timeout

**Solutions:**
1. Check network stability
2. Increase `maxHttpBufferSize` in server/index.js
3. Check firewall settings

## Advanced Configuration

### Dynamic Quality Adjustment

You can add an API endpoint to change settings on-the-fly:

```javascript
// In server/routes/api.js
router.post('/capture/settings', (req, res) => {
  const { frameRate, quality, scale } = req.body;
  const screenCapture = req.app.get('screenCapture');
  
  screenCapture.updateSettings({ frameRate, quality, scale });
  
  res.json({ 
    success: true, 
    settings: screenCapture.getStatus() 
  });
});
```

### Monitor Performance

Check the console logs for:
- Frame capture time
- Socket transmission time
- Client rendering time

## Best Practices

1. ✅ **Use LAN/Local Network** for best performance
2. ✅ **Close unnecessary applications** on server computer
3. ✅ **Use fullscreen mode** on client for better viewing
4. ✅ **Test different settings** to find optimal balance
5. ✅ **Monitor CPU usage** - if high, reduce FPS or quality
6. ✅ **Check network speed** - ensure sufficient bandwidth

## Current Default Settings Summary

```javascript
Frame Rate: 30 FPS       // Smooth real-time viewing
Quality:    60%          // Good balance
Scale:      70%          // Faster transmission
Transport:  WebSocket    // Low latency
```

These settings provide a good balance for most use cases with minimal latency!
