# 🚀 Quick Network Access Setup

## Step 1: Find Your IP Address

Open PowerShell or Command Prompt and run:
```powershell
ipconfig
```

Look for **"IPv4 Address"** (example: `192.168.1.100`)

## Step 2: Update the .env File

1. Open `client/.env` file
2. Change this line to use YOUR IP address:
   ```
   REACT_APP_SERVER_URL=http://192.168.1.100:3001
   ```
   Replace `192.168.1.100` with YOUR actual IP from Step 1

3. **SAVE the file!**

## Step 3: Restart the Server

Stop the current server (Ctrl+C) and restart:
```bash
npm run dev
```

The server will show you all available URLs:
```
📡 Access URLs:
   Local:    http://localhost:3001
   Network:  http://192.168.1.100:3001
```

## Step 4: Access from Another Laptop

On the other laptop, open a browser and go to:
```
http://YOUR_IP_ADDRESS:3000
```
Example: `http://192.168.1.100:3000`

**NOTE:** Use port **3000** (not 3001)! 
- Port 3001 = Server (backend)
- Port 3000 = Client (what you open in browser)

## ✅ Summary

| What | URL | Notes |
|------|-----|-------|
| **On this laptop** | `http://localhost:3000` | Works locally |
| **From other laptop** | `http://YOUR_IP:3000` | Use your actual IP |
| **Server port** | 3001 | Don't open this directly |
| **Client port** | 3000 | Open this in browser |

## ⚠️ Troubleshooting

**Can't connect?**
- ✅ Did you update `.env` with your IP?
- ✅ Did you restart the server after updating `.env`?
- ✅ Check both laptops are on the same WiFi/network
- ✅ Check Windows Firewall (allow Node.js)
- ✅ Make sure you're using port **3000** (not 3001)

**Test connection:**
From the other laptop, open browser and visit:
```
http://YOUR_IP:3001/api/health
```

If you see `{"status":"ok"}`, the server is accessible!

Then try the client:
```
http://YOUR_IP:3000
```

---

📖 Need more help? See [NETWORK_ACCESS.md](NETWORK_ACCESS.md) for detailed instructions.
