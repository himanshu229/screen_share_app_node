const express = require('express');
const router = express.Router();

// Get server capture status
router.get('/capture/status', (req, res) => {
  const screenCapture = req.app.get('screenCapture');
  res.json(screenCapture.getStatus());
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;