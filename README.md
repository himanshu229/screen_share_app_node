# Screen Share App

A real-time server-side screen sharing application with 120+ FPS using WebSocket, Node.js, Express, and React.js.

## Features

- **Server-Side Screen Capture**: Captures the entire host computer screen at 120+ FPS
- **Auto-Start**: Automatically starts screen capture when the first viewer connects
- **Direct Access**: Simply visit the URL to see the host screen immediately
- **High Performance**: Real-time streaming with minimal latency
- **Clean Interface**: Full-screen viewing with minimal UI elements
- **Fullscreen Support**: Built-in fullscreen mode for optimal viewing
- **Auto-Stop**: Automatically stops capture when no viewers are connected

## How It Works

1. **Server captures the screen** of the computer running the Node.js application
2. **Automatic capture** starts when the first user visits the web page
3. **Real-time streaming** via WebSocket to all connected browsers
4. **No manual controls** - everything happens automatically

## Technology Stack

- **Backend**: Node.js, Express.js, Socket.IO, screenshot-desktop, Sharp
- **Frontend**: React.js (viewer-only interface)
- **Real-time Communication**: WebSocket (Socket.IO)
- **Screen Capture**: Server-side screenshot-desktop library

## Installation

1. Clone the repository
2. Install dependencies for both server and client:
   ```bash
   npm run install-all
   ```

## Development

Run both server and client in development mode:
```bash
npm run dev
```

- Server runs on port 3001
- Client runs on port 3000 (proxied to server)

## Production

1. Build the React app:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

The app will be available at `http://localhost:3001`

## Usage

### For Host (Server Admin)
1. Start the application with `npm run dev` or `npm start`
2. The server will automatically capture the screen when viewers connect
3. Share the URL `http://your-server:3000` with viewers

### For Viewers
1. Visit the shared URL (e.g., `http://host-computer:3000`)
2. The host's screen will automatically appear
3. Use the fullscreen button for optimal viewing

### Controls
- **Fullscreen**: Toggle fullscreen mode (only visible control)
- **Auto-Start**: Screen capture starts automatically when you visit the page
- **Auto-Stop**: Screen capture stops when all viewers disconnect

## API Endpoints

- `GET /api/capture/status` - Get current capture status
- `GET /api/health` - Health check

## Socket Events

### Server to Client
- `screen-frame` - Receive screen frame data from server
- `capture-started` - Server started screen capture
- `capture-stopped` - Server stopped screen capture  
- `capture-status` - Current capture status

## Performance Optimization

- Server-side screen capture at 120+ FPS
- High-quality JPEG compression (quality: 100)
- Efficient Socket.IO transmission
- Canvas-based rendering for smooth playback
- Auto-start/stop to conserve resources

## Browser Support

- Chrome 72+ (recommended)
- Firefox 66+
- Safari 13+
- Edge 79+

## System Requirements

**Server (Host Computer):**
- Node.js 16+
- macOS, Windows, or Linux
- Sufficient CPU for 120+ FPS screen capture

**Viewers:**
- Any modern web browser
- Internet connection to the host server

## Folder Structure

```
screen-share-app/
├── package.json
├── server/
│   ├── index.js (Express + Socket.IO + Auto-capture)
│   ├── routes/api.js (Simplified API)
│   └── services/
│       └── serverScreenCapture.js (Screen capture service)
└── client/
    ├── package.json
    ├── public/index.html
    └── src/
        ├── App.js (Simple single route)
        ├── index.js
        ├── pages/
        │   └── ScreenShare.js (Viewer-only component)
        ├── services/
        │   └── socketService.js (WebSocket client)
        └── styles/
            └── index.css (Clean fullscreen styles)
```

## Key Changes from Previous Version

- ✅ **Removed room functionality** - Direct access to single screen
- ✅ **Auto-start capture** - No manual start/stop buttons needed
- ✅ **Server-side capture** - Host computer screen is captured by server
- ✅ **Simplified UI** - Only fullscreen control visible
- ✅ **Direct URL access** - Just visit the URL to see the screen
- ✅ **Auto-management** - Starts/stops based on viewer presence