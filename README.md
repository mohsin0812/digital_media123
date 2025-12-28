# Media Distribution Platform

A scalable, cloud-native web application for sharing photos, similar to Instagram. This platform enables creators to upload photos with metadata and consumers to browse, search, comment, and rate photos.

## Features

### Creator Features
- **Photo Upload**: Upload photos with metadata including:
  - Title (required)
  - Caption
  - Location
  - People (comma-separated list)
- **Creator Dashboard**: Manage uploaded photos
- **Delete Photos**: Remove your own photos

### Consumer Features
- **Browse Photos**: View all uploaded photos in a grid layout
- **Search**: Search photos by title, caption, people, location, or creator
- **View Details**: Click on any photo to see full details
- **Rate Photos**: Rate photos from 1-5 stars
- **Comment**: Add comments on photos
- **Consumer Dashboard**: Dedicated view for consumers

### Technical Features
- **RESTful API**: Complete REST API for all operations
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Separate permissions for creators and consumers
- **Scalable Database**: SQLite (easily upgradeable to PostgreSQL)
- **File Storage**: Local file storage (configurable for cloud storage like S3)
- **Rate Limiting**: API rate limiting for security
- **Responsive Design**: Modern, mobile-friendly UI

## Project Structure

```
.
├── database/
│   └── db.js              # Database initialization and connection
├── middleware/
│   └── auth.js            # Authentication middleware
├── routes/
│   ├── auth.js            # Authentication routes
│   ├── photos.js          # Photo management routes
│   ├── comments.js        # Comment routes
│   ├── ratings.js         # Rating routes
│   └── search.js          # Search routes
├── public/
│   ├── index.html         # Frontend HTML
│   ├── styles.css         # Frontend styles
│   └── app.js             # Frontend JavaScript
├── uploads/               # Uploaded photos storage
├── server.js             # Express server setup
├── package.json          # Dependencies
└── README.md             # This file
```

## Installation

1. **Clone or download the project**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables** (optional):
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NODE_ENV=development
   ```

4. **Initialize the database**:
   The database will be automatically created on first run. You can also run:
   ```bash
   npm run init-db
   ```

5. **Start the server**:
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

6. **Access the application**:
   Open your browser and navigate to `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user (creator or consumer)
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile (requires auth)

### Photos
- `GET /api/photos` - Get all photos (paginated)
- `GET /api/photos/:id` - Get photo by ID
- `GET /api/photos/creator/:creatorId` - Get photos by creator
- `POST /api/photos/upload` - Upload photo (creator only, requires auth)
- `DELETE /api/photos/:id` - Delete photo (creator only, own photos, requires auth)

### Comments
- `GET /api/comments/photo/:photoId` - Get comments for a photo
- `POST /api/comments` - Add comment (requires auth)
- `PUT /api/comments/:id` - Update comment (own comments only, requires auth)
- `DELETE /api/comments/:id` - Delete comment (own comments only, requires auth)

### Ratings
- `GET /api/ratings/photo/:photoId` - Get ratings for a photo
- `GET /api/ratings/photo/:photoId/user` - Get user's rating (requires auth)
- `POST /api/ratings` - Add or update rating (requires auth)
- `DELETE /api/ratings/photo/:photoId` - Delete rating (requires auth)

### Search
- `GET /api/search?q=query&location=loc&creator=name` - Search photos

## Usage

### Creating Accounts

1. Click "Register" in the navigation
2. Fill in username, email, password
3. Select role: "Creator" or "Consumer"
4. Click "Register"

**Note**: In production, creator accounts would typically be created through an admin interface, not public registration.

### As a Creator

1. Login with your creator account
2. Click "Creator Dashboard"
3. Fill in the upload form:
   - Select a photo file
   - Enter a title (required)
   - Optionally add caption, location, and people
4. Click "Upload Photo"
5. View and manage your photos in "My Photos" section
6. Delete photos by clicking the "Delete" button

### As a Consumer

1. Login with your consumer account
2. Browse photos on the home page
3. Use the search feature to find specific photos
4. Click on any photo to view details
5. Rate photos by clicking the stars (1-5)
6. Add comments in the comment section
7. Use "Consumer Dashboard" for a dedicated view

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite (easily upgradeable to PostgreSQL)
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Security**: Helmet, CORS, Rate Limiting, bcrypt

## Cloud Deployment Considerations

This application is designed to be cloud-native and can be easily deployed to:

- **AWS**: Use S3 for file storage, RDS for PostgreSQL, CloudFront for CDN
- **Azure**: Use Blob Storage, Azure SQL Database, Azure CDN
- **Google Cloud**: Use Cloud Storage, Cloud SQL, Cloud CDN
- **Heroku**: Use Heroku Postgres, AWS S3 addon

### Recommended Cloud Enhancements

1. **Object Storage**: Replace local file storage with S3/Azure Blob/Google Cloud Storage
2. **Database**: Migrate from SQLite to PostgreSQL/MySQL for production
3. **Caching**: Add Redis for session management and API caching
4. **CDN**: Use CloudFront/CloudFlare for static asset delivery
5. **Load Balancing**: Use AWS ELB/Azure Load Balancer for scalability
6. **Media Processing**: Add image resizing/optimization (AWS Lambda, Azure Functions)
7. **Cognitive Services**: Integrate for image tagging, face detection (optional)

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Role-based access control
- API rate limiting
- Input validation and sanitization
- SQL injection protection (parameterized queries)
- XSS protection (HTML escaping)

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses nodemon for automatic server restart on file changes.

### Database Schema

The application uses the following tables:
- `users` - User accounts with roles
- `photos` - Photo metadata and file paths
- `comments` - User comments on photos
- `ratings` - User ratings (1-5 stars) on photos

## License

ISC

## Author

Full Stack Developer

## Notes

- The application uses SQLite by default for simplicity. For production, migrate to PostgreSQL or MySQL.
- File uploads are stored locally in the `uploads/` directory. For cloud deployment, configure S3 or similar.
- JWT secret should be changed in production environment.
- Creator account registration is enabled for testing. In production, this should be restricted to admin-only.

