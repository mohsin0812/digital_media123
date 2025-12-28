# Setup Guide - Media Distribution Platform

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Seed Database with Sample Images**
   ```bash
   npm run seed
   ```
   This will create:
   - A default creator account (creator@mediashare.com / creator123)
   - 10 sample photos with beautiful placeholder images

3. **Start the Server**
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Access the Application**
   - Open your browser: `http://localhost:3000`
   - Login with the creator account or register a new user

## Default Accounts

### Creator Account
- **Email**: creator@mediashare.com
- **Password**: creator123
- Can upload photos with metadata

### Register New Users
- Click "Register" to create new accounts
- Choose role: "Creator" or "Consumer"
- Creators can upload photos
- Consumers can browse, search, comment, and rate photos

## Consumer Dashboard

The Consumer Dashboard now displays all available photos in a beautiful grid layout. Users can:
- Browse all uploaded photos
- Click on any photo to view details
- Rate photos (1-5 stars)
- Add comments
- Search for specific photos

## Sample Photos Included

The seed script creates 10 sample photos with:
- Beautiful gradient placeholder images
- Titles, captions, locations, and people tags
- Ready for consumers to interact with

## Troubleshooting

### Database Already Has Photos
If you see "Database already has X photos", you can:
1. Delete the database file: `database/media_app.db`
2. Run `npm run seed` again

### No Photos Showing
1. Make sure you ran `npm run seed`
2. Check that the `uploads/` directory exists
3. Restart the server

## Next Steps

- Upload your own photos as a creator
- Register as a consumer to browse and interact
- Explore the search functionality
- Rate and comment on photos

Enjoy your Media Distribution Platform! 🎉

