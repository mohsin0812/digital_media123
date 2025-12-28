# Troubleshooting Guide

## Server Not Starting

### Issue: Port Already in Use
**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:
1. Find and kill the process using port 3000:
   ```bash
   # Windows PowerShell
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # Or use a different port
   # Set PORT=3001 in .env file
   ```

2. Or change the port in `.env`:
   ```
   PORT=3001
   ```

### Issue: Missing Dependencies
**Error**: `Cannot find module 'xxx'`

**Solution**:
```bash
npm install
```

### Issue: Sharp Not Installed (Optional)
Sharp is optional for image optimization. The app will work without it, but images won't be optimized.

To install (optional):
```bash
npm install sharp
```

## Frontend Not Loading

### Issue: JavaScript Errors
1. Open browser console (F12)
2. Check for errors in Console tab
3. Check Network tab for failed requests

### Issue: Views Not Showing
1. Check browser console for errors
2. Verify all view elements exist in HTML
3. Check if JavaScript is loaded (Network tab)

### Issue: Consumer Dashboard Not Opening
1. Make sure you're logged in as a consumer
2. Check browser console for errors
3. Verify the view element exists: `#consumerDashboardView`

## Database Issues

### Issue: Database Not Initializing
**Error**: `Failed to initialize database`

**Solution**:
1. Delete the database file: `database/media_app.db`
2. Restart the server
3. Or run: `npm run init-db`

### Issue: No Photos Showing
**Solution**:
1. Run seed script: `npm run seed`
2. Check if `uploads/` directory exists
3. Verify photos exist in database

## API Issues

### Issue: 401 Unauthorized
- Make sure you're logged in
- Check if token is stored in localStorage
- Try logging in again

### Issue: 403 Forbidden
- Check user role (creator vs consumer)
- Verify you have permission for the action

### Issue: 500 Internal Server Error
- Check server console for error messages
- Verify database is accessible
- Check file permissions for uploads directory

## Common Fixes

### Clear Browser Cache
1. Press Ctrl+Shift+Delete
2. Clear cached images and files
3. Hard refresh: Ctrl+F5

### Restart Server
1. Stop server (Ctrl+C)
2. Start again: `npm start`

### Reset Database
1. Delete `database/media_app.db`
2. Run `npm run seed`
3. Restart server

## Still Having Issues?

1. Check server console for errors
2. Check browser console (F12) for errors
3. Verify all files are saved
4. Make sure server is running
5. Check network connectivity

## Quick Health Check

Test if server is running:
```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

