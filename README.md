# Screen Share App# Screen Share App# Screen Share App



Real-time screen sharing application with audio streaming and remote control capabilities.



## FeaturesReal-time screen sharing application with audio streaming and remote control capabilities.A real-time server-side screen sharing application with 120+ FPS using WebSocket, Node.js, Express, and React.js.



- Server-side screen capture (120+ FPS)

- Audio streaming (48kHz stereo) - **No admin access required**

- Remote control (mouse & keyboard)## Features## Features

- Auto-start/stop on client connection

- Multi-client support



## System Requirements- Server-side screen capture (120+ FPS)- **Server-Side Screen Capture**: Captures the entire host computer screen at 120+ FPS



- **Node.js**: 16.0.0 or higher- Audio streaming (44.1kHz stereo)- **Audio Streaming**: Captures and streams system audio in real-time (optional)

- **Python**: 3.7 or higher (3.13 recommended)

- **OS**: Windows, macOS, or Linux- Remote control (mouse & keyboard)- **Auto-Start**: Automatically starts screen capture when the first viewer connects



## Installation- Auto-start/stop on client connection- **Direct Access**: Simply visit the URL to see the host screen immediately



### Step 1: Install Node.js Dependencies- Multi-client support- **High Performance**: Real-time streaming with minimal latency



```bash- **Clean Interface**: Full-screen viewing with minimal UI elements

npm run install-all

```## System Requirements- **Fullscreen Support**: Built-in fullscreen mode for optimal viewing



This installs dependencies for both server and client.- **Auto-Stop**: Automatically stops capture when no viewers are connected



### Step 2: Install Python Dependencies (for Audio)- **Node.js**: 16.0.0 or higher- **Remote Control**: Control the host machine remotely (optional)



**Windows:**- **Python**: 3.7 or higher (3.13 recommended)

```powershell

.\install-audio-deps.bat- **OS**: Windows, macOS, or Linux## How It Works

```



**macOS/Linux:**

```bash## Installation1. **Server captures the screen** of the computer running the Node.js application

chmod +x install-audio-deps.sh

./install-audio-deps.sh2. **Automatic capture** starts when the first user visits the web page

```

### Step 1: Install Node.js Dependencies3. **Real-time streaming** via WebSocket to all connected browsers

**Note:** Audio capture works automatically without admin access. The system will automatically detect and use available audio devices (microphone or system audio loopback if available).

4. **No manual controls** - everything happens automatically

## Running the Application

```bash

### Development Mode

npm run install-all## Technology Stack

```bash

npm run dev```

```

- **Backend**: Node.js, Express.js, Socket.IO, screenshot-desktop, Sharp

- Server: `http://localhost:3001`

- Client: `http://localhost:3000`This installs dependencies for both server and client.- **Frontend**: React.js (viewer-only interface)



### Production Mode- **Real-time Communication**: WebSocket (Socket.IO)



```bash### Step 2: Install Python Dependencies (for Audio)- **Screen Capture**: Server-side screenshot-desktop library

npm run build

npm start

```

**Windows:**## Installation

Application available at: `http://localhost:3001`

```powershell

## Network Access

.\install-audio-deps.bat1. Clone the repository

To access from other devices on the same network:

```2. Install dependencies for both server and client:

1. Start the server (it will display network URLs)

2. Use the Network URL shown in console (e.g., `http://192.168.1.100:3001`)   ```bash

3. Open this URL in any browser on the same network

**macOS/Linux:**   npm run install-all

## Client Controls

```bash   ```

- **🖥️ Fullscreen** - Toggle fullscreen mode

- **🎮 Remote Control** - Enable/disable remote controlchmod +x install-audio-deps.sh

- **🔊 Audio** - Toggle audio streaming (click to unmute)

./install-audio-deps.sh3. **(Optional)** Install Python dependencies for audio streaming:

## Troubleshooting

```   

### No Audio

- Check Python dependencies are installed   **Windows:**

- Click "Audio ON" button in client

- System will use available microphone or system audio if configured### Step 3: Enable Audio Capture (Windows Only)   ```powershell



### Python Not Found   .\install-audio-deps.bat

- Install Python 3.7+ from [python.org](https://python.org)

- Ensure "Add Python to PATH" is checked during installation1. Right-click **Speaker icon** (taskbar) → **Sounds**   ```



### PyAudio Installation Error2. Go to **Recording** tab   

- Windows: Download pre-built wheel from [here](https://www.lfd.uci.edu/~gohlke/pythonlibs/#pyaudio)

- macOS: `brew install portaudio && pip install pyaudio`3. Right-click in empty area → Check **"Show Disabled Devices"**   **macOS/Linux:**

- Linux: `sudo apt-get install portaudio19-dev && pip install pyaudio`

4. Right-click **"Stereo Mix"** → **Enable**   ```bash

### Optional: Better Audio Quality (Advanced Users)

For system audio capture on Windows (requires manual setup):5. Set as **Default Device** → Click **OK**   chmod +x install-audio-deps.sh

1. Right-click Speaker icon → Sounds → Recording tab

2. Right-click → "Show Disabled Devices"   ./install-audio-deps.sh

3. Enable "Stereo Mix" (if available)

4. Set as Default Device## Running the Application   ```



## License   



MIT### Development Mode   📖 See [AUDIO_CAPTURE_GUIDE.md](AUDIO_CAPTURE_GUIDE.md) for detailed audio setup instructions.




```bash## Development

npm run dev

```Run both server and client in development mode:

```bash

- Server: `http://localhost:3001`npm run dev

- Client: `http://localhost:3000````



### Production Mode- Server runs on port 3001

- Client runs on port 3000 (proxied to server)

```bash

npm run build### Network Access (Access from Another Laptop)

npm start

```When you start the server, it will display all available URLs including network URLs:



Application available at: `http://localhost:3001````

🚀 Server running on port 3001

## Network Access

📡 Access URLs:

To access from other devices on the same network:   Local:    http://localhost:3001

   Network:  http://192.168.1.100:3001

1. Start the server (it will display network URLs)```

2. Use the Network URL shown in console (e.g., `http://192.168.1.100:3001`)

3. Open this URL in any browser on the same networkTo access from another laptop on the same network:

1. Use the Network URL shown when the server starts

## Client Controls2. Or update `client/.env` with your IP address:

   ```

- **🖥️ Fullscreen** - Toggle fullscreen mode   REACT_APP_SERVER_URL=http://192.168.1.100:3001

- **🎮 Remote Control** - Enable/disable remote control   ```

- **🔊 Audio** - Toggle audio streaming (click to unmute)3. Access the client at `http://YOUR_IP:3000` from the other laptop



## Troubleshooting📖 See [NETWORK_ACCESS.md](NETWORK_ACCESS.md) for detailed network setup instructions.



### No Audio## Production

- Verify Stereo Mix is enabled and set as default

- Check Python dependencies are installed1. Build the React app:

- Click "Audio ON" button in client   ```bash

   npm run build

### Python Not Found   ```

- Install Python 3.7+ from [python.org](https://python.org)

- Ensure "Add Python to PATH" is checked during installation2. Start the production server:

   ```bash

### PyAudio Installation Error   npm start

- Windows: Download pre-built wheel from [here](https://www.lfd.uci.edu/~gohlke/pythonlibs/#pyaudio)   ```

- macOS: `brew install portaudio && pip install pyaudio`

- Linux: `sudo apt-get install portaudio19-dev && pip install pyaudio`The app will be available at `http://localhost:3001`



## License## Usage



MIT### For Host (Server Admin)

1. Start the application with `npm run dev` or `npm start`
2. The server will automatically capture the screen when viewers connect
3. Share the URL `http://your-server:3000` with viewers

### For Viewers
1. Visit the shared URL (e.g., `http://host-computer:3000`)
2. The host's screen will automatically appear
3. Use the fullscreen button for optimal viewing

### Controls
- **Fullscreen**: Toggle fullscreen mode
- **Remote Control**: Enable/disable remote mouse and keyboard control
- **Audio**: Toggle audio streaming ON/OFF (unmute to hear system audio)
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