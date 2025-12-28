# Quick Start Guide

## Step 1: Install Dependencies
```bash
npm install
```

**Note**: If `sharp` installation fails, it's optional. The app will work without it.

## Step 2: Check if Port 3000 is Available

### Windows PowerShell:
```powershell
netstat -ano | findstr :3000
```

If something is using port 3000, either:
- Kill that process, OR
- Change port in `.env` file: `PORT=3001`

## Step 3: Seed Database (First Time Only)
```bash
npm run seed
```

This creates:
- Default creator account (creator@mediashare.com / creator123)
- 10 sample photos

## Step 4: Start the Server
```bash
npm start
```

You should see:
```
Server running on port 3000
Frontend available at http://localhost:3000
API available at http://localhost:3000/api
```

## Step 5: Open Browser
Navigate to: `http://localhost:3000`

## Step 6: Login or Register

### Option 1: Login as Creator
- Email: `creator@mediashare.com`
- Password: `creator123`

### Option 2: Register as Consumer
- Click "Register"
- Fill in details
- Select "Consumer" role
- Click "Register"

## Troubleshooting

### Server Won't Start
1. Check if port 3000 is in use
2. Check console for error messages
3. Make sure all dependencies are installed: `npm install`

### Frontend Not Loading
1. Open browser console (F12)
2. Check for JavaScript errors
3. Verify server is running
4. Try hard refresh (Ctrl+F5)

### No Photos Showing
1. Run: `npm run seed`
2. Check if database file exists: `database/media_app.db`
3. Restart server

### Consumer Dashboard Not Opening
1. Make sure you're logged in as a consumer
2. Check browser console for errors
3. Try logging out and back in

## Common Commands

```bash
# Start server
npm start

# Start with auto-reload (development)
npm run dev

# Initialize database
npm run init-db

# Seed sample data
npm run seed
```

## Need Help?

Check `TROUBLESHOOTING.md` for detailed solutions.

