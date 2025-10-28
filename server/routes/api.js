const express = require('express');
const router = express.Router();

// Get server capture status
router.get('/capture/status', (req, res) => {
  const screenCapture = req.app.get('screenCapture');
  res.json(screenCapture.getStatus());
});

// Handle audio stream from Python script
router.post('/audio-stream', (req, res) => {
  try {
    const audioData = req.body;
    const audioManager = req.app.get('audioManager');
    
    if (audioManager) {
      // Broadcast audio chunk to all connected clients
      audioManager.broadcastAudioChunk(audioData);
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error handling audio stream:', error);
    res.status(500).send('Error');
  }
});

// Get audio capture status
router.get('/audio/status', (req, res) => {
  const audioManager = req.app.get('audioManager');
  res.json(audioManager ? audioManager.getStatus() : { isCapturing: false });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;