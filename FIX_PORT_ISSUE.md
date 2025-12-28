# Fix: Server Not Starting - Port 3000 Already in Use

## Quick Fix (Choose One)

### Solution 1: Kill the Process Using Port 3000

**Windows PowerShell:**
```powershell
# Find the process
netstat -ano | findstr :3000

# Kill it (replace 17044 with the PID from above)
taskkill /PID 17044 /F

# Then start server
npm start
```

**Or use the batch file:**
Double-click `start-server.bat` - it does this automatically!

### Solution 2: Use a Different Port

1. Create a file named `.env` in the project root (same folder as `package.json`)

2. Add this line to `.env`:
   ```
   PORT=3001
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Access at: `http://localhost:3001` instead of 3000

## Step-by-Step Instructions

### Method 1: Kill Process and Restart

1. Open PowerShell in the project folder
2. Run: `netstat -ano | findstr :3000`
3. Note the PID number (last column)
4. Run: `taskkill /PID <PID> /F` (replace <PID> with the number)
5. Run: `npm start`

### Method 2: Use Different Port

1. Create `.env` file:
   ```powershell
   echo PORT=3001 > .env
   ```

2. Start server:
   ```bash
   npm start
   ```

3. Open browser: `http://localhost:3001`

## Verify Server Started

You should see:
```
✅ Server running on port 3000 (or 3001)
🌐 Frontend available at http://localhost:3000
🔌 API available at http://localhost:3000/api
```

## Still Having Issues?

1. Make sure Node.js is installed: `node --version`
2. Make sure dependencies are installed: `npm install`
3. Check for errors in the console
4. Try restarting your computer

