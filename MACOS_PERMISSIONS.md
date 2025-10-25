# macOS Screen Recording Permission Setup

## Issue
The screen sharing application is failing with the error:
```
Error: Command failed: screencapture -x -t png
could not create image from display
```

This happens because macOS requires explicit permission for applications to capture the screen.

## Solution

### Step 1: Grant Screen Recording Permission
1. Open **System Preferences** (or **System Settings** on macOS Ventura+)
2. Go to **Security & Privacy** (or **Privacy & Security**)
3. Click on the **Privacy** tab
4. Select **Screen Recording** from the left sidebar
5. You'll see a list of applications
6. Check the box next to **Terminal** (if running via terminal)
7. If you don't see Terminal, click the **+** button and add it manually
8. You may need to enter your admin password

### Step 2: Restart the Application
1. Stop the current server (Ctrl+C in terminal)
2. Restart with: `npm run dev`

### Step 3: Alternative - Run with Different Methods
If Terminal doesn't work, try:
- **VS Code**: If running from VS Code terminal, grant permission to VS Code
- **iTerm2**: If using iTerm2, grant permission to iTerm2
- **Node.js directly**: Grant permission to the Node.js binary

### Troubleshooting

#### If permission is already granted but still failing:
1. **Uncheck and recheck** the Terminal permission
2. **Restart your Mac** (sometimes required for permissions to take effect)
3. **Try running from a different terminal app**

#### For development:
You can also test screen capture manually:
```bash
screencapture -x test.png
```
If this works, the Node.js app should work too.

### Security Note
This permission allows the application to capture everything on your screen. Only grant this permission to trusted applications and development environments.

## Next Steps
After granting permission and restarting:
1. The server should start capturing automatically when clients connect
2. Visit `http://localhost:3000` to view the screen
3. You should see your desktop being streamed in real-time

## Still Having Issues?
- Check the terminal output for specific error messages
- Make sure you're using macOS 10.15+ (required for modern screen recording APIs)
- Consider using alternative screen capture libraries if this continues to fail