# How to Start the Server

## Quick Start (Windows)

### Option 1: Use the Batch File (Easiest)
Double-click `start-server.bat` - it will automatically:
- Kill any process using port 3000
- Start the server

### Option 2: Manual Start

1. **Check if port 3000 is in use:**
   ```powershell
   netstat -ano | findstr :3000
   ```

2. **If port is in use, kill the process:**
   ```powershell
   taskkill /PID <PID_NUMBER> /F
   ```
   (Replace <PID_NUMBER> with the number from step 1)

3. **Start the server:**
   ```bash
   npm start
   ```

### Option 3: Use a Different Port

1. Create a `.env` file in the project root:
   ```
   PORT=3001
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Access at: `http://localhost:3001`

## Verify Server is Running

After starting, you should see:
```
✅ Server running on port 3000
🌐 Frontend available at http://localhost:3000
🔌 API available at http://localhost:3000/api
💚 Health check: http://localhost:3000/api/health
```

## Test the Server

Open your browser and go to:
- **Frontend**: http://localhost:3000
- **API Health**: http://localhost:3000/api/health

## Stop the Server

### Option 1: Use the Batch File
Double-click `stop-server.bat`

### Option 2: Manual Stop
Press `Ctrl+C` in the terminal where the server is running

### Option 3: Kill Process
```powershell
# Find the process
netstat -ano | findstr :3000

# Kill it (replace PID with the number from above)
taskkill /PID <PID> /F
```

## Troubleshooting

### "Port 3000 is already in use"
- Use `start-server.bat` (it handles this automatically)
- Or kill the process manually (see above)
- Or use a different port

### "Cannot find module"
Run: `npm install`

### Server starts but page doesn't load
1. Check browser console (F12)
2. Verify server is actually running
3. Try hard refresh (Ctrl+F5)

## Development Mode

For auto-reload on file changes:
```bash
npm run dev
```

