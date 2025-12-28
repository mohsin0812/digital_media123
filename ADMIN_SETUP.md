# Admin Setup Guide

## Overview

The application has been updated to support admin self-registration and proper role-based access control. All hardcoded credentials have been removed.

## Key Changes

### 1. Admin Role Support
- Added `admin` role to the database schema
- Admin users have full access to administrative functions
- Admin can create creator accounts

### 2. Admin Self-Registration
- **First-time setup**: Admin can register themselves if no admin exists
- **Security**: Once an admin exists, no more admin registrations are allowed
- **Endpoint**: `POST /api/auth/register`

### 3. Removed Hardcoded Credentials
- No default admin or creator accounts are created
- Seed script no longer creates hardcoded users
- All users must be registered through the API

### 4. Data Persistence
- All data persists in SQLite database (`database/media_app.db`)
- Uploaded files persist in `uploads/` directory
- Data will be available when the application runs on any system

## Setup Instructions

### First-Time Setup

1. **Seed the database** (creates default admin)
   ```bash
   npm run seed
   ```

   This will create a default admin user with the following credentials:
   - **Email**: `admin@mediashare.com`
   - **Password**: `admin123`
   - **⚠️ Important**: Change the default password after first login!

2. **Start the server**
   ```bash
   npm start
   ```

3. **Login as admin** using the default credentials, or register a new admin if needed

   **Alternative**: Register a new admin (only if no admin exists)
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "username": "admin",
       "email": "admin@example.com",
       "password": "your-secure-password",
       "role": "admin"
     }'
   ```

   **Note**: Admin registration is only allowed if no admin exists in the database.

3. **Login as admin**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@example.com",
       "password": "your-secure-password"
     }'
   ```

4. **Create creator accounts** (as admin)
   ```bash
   curl -X POST http://localhost:3000/api/admin/create-creator \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -d '{
       "username": "creator1",
       "email": "creator@example.com",
       "password": "creator-password"
     }'
   ```

### User Registration

- **Consumers**: Can register publicly at `POST /api/auth/register` with `role: "consumer"`
- **Creators**: Must be created by an admin using `POST /api/admin/create-creator`
- **Admins**: Can only register if no admin exists (first-time setup only)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user (admin first-time, consumer always)
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

### Admin (Admin Only)
- `POST /api/admin/create-creator` - Create creator account
- `GET /api/admin/users` - List all users

## Data Persistence

### Database
- Location: `database/media_app.db`
- Type: SQLite
- Persists: Users, photos, comments, ratings
- **Note**: Database file is excluded from git (see `.gitignore`)

### Uploads
- Location: `uploads/` directory
- Persists: All uploaded photos and videos
- **Note**: Uploads directory is excluded from git (see `.gitignore`)

### Running on Different Systems

When you run the application on a new system:
1. The database file will be created automatically on first run
2. All data (users, photos, etc.) will persist in the local database
3. Uploaded files will persist in the local `uploads/` directory
4. You'll need to register a new admin (if no admin exists) or login with existing credentials

## Security Notes

1. **Admin Registration**: Only allowed when no admin exists
2. **Role-Based Access**: Admin routes require admin role
3. **Creator Creation**: Only admins can create creator accounts
4. **Password Security**: All passwords are hashed using bcrypt

## Troubleshooting

### "Admin already exists" error
- This means an admin has already been registered
- You cannot register another admin
- Login with existing admin credentials instead

### "Admin access required" error
- You're trying to access an admin endpoint without admin role
- Make sure you're logged in as an admin
- Check your JWT token includes `role: "admin"`

### Data not persisting
- Check that `database/` directory is writable
- Check that `uploads/` directory is writable
- Verify database file exists: `database/media_app.db`

