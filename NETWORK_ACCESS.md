# Network Access Setup Guide

This guide will help you access the screen sharing app from another laptop on the same network.

## Quick Setup

### 1. Find Your Computer's IP Address

**On Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (e.g., `192.168.1.100`)

**On Mac/Linux:**
```bash
ifconfig
```
or
```bash
hostname -I
```

### 2. Start the Server

The server is already configured to accept network connections. Just run:
```bash
npm run dev
```

When the server starts, it will display all available URLs:
```
🚀 Server running on port 3001
Environment: development

📡 Access URLs:
   Local:    http://localhost:3001
   Local:    http://127.0.0.1:3001
   Network:  http://192.168.1.100:3001

✨ Use the Network URL to access from other devices on the same network
```

### 3. Access from Another Laptop

#### Option A: Update .env file (Recommended for persistent setup)

1. Open `client/.env` file
2. Replace the localhost URL with your network IP:
   ```
   REACT_APP_SERVER_URL=http://192.168.1.100:3001
   ```
3. Restart the client (if running)

#### Option B: Direct URL (Quick test)

On the other laptop:
1. Make sure both laptops are on the same network (WiFi or LAN)
2. Open a browser and navigate to: `http://YOUR_IP:3000`
   - Example: `http://192.168.1.100:3000`

## Troubleshooting

### Can't Connect from Another Laptop?

1. **Check Firewall Settings**
   - Windows: Allow Node.js through Windows Firewall
   - Mac: System Preferences > Security & Privacy > Firewall > Allow Node.js

2. **Verify Network Connection**
   - Both devices must be on the same network (same WiFi or LAN)
   - Try pinging the server computer from the other laptop

3. **Check Ports**
   - Server port: 3001
   - Client port: 3000
   - Make sure these ports are not blocked

4. **Test Server Accessibility**
   From the other laptop, try accessing: `http://YOUR_IP:3001/api/health`

### Network URL Not Showing?

If you don't see a Network URL when starting the server:
- Make sure you're connected to a network (WiFi or Ethernet)
- Try restarting your network connection
- Check if your network adapter is enabled

## Production Deployment

For production deployment on a remote server:

1. Set the environment variable:
   ```bash
   export NODE_ENV=production
   ```

2. Build the client:
   ```bash
   npm run build
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Update the client .env with your server's public IP or domain:
   ```
   REACT_APP_SERVER_URL=http://your-server-ip:3001
   ```

## Security Notes

⚠️ **Important Security Considerations:**

- This setup exposes your screen to anyone on the same network
- Do not use on untrusted networks (public WiFi, etc.)
- Consider adding authentication if deploying to production
- Use HTTPS/WSS in production environments

## Additional Configuration

### Changing Ports

If you need to use different ports:

1. **Server Port** - Edit `server/index.js`:
   ```javascript
   const PORT = process.env.PORT || 3001;
   ```

2. **Client Port** - Edit `client/package.json`:
   ```json
   "scripts": {
     "start": "PORT=3000 react-scripts start"
   }
   ```

3. **Update .env** with new server port:
   ```
   REACT_APP_SERVER_URL=http://your-ip:NEW_PORT
   ```
