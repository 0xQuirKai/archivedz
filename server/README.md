# PDF Box Cloud Server

A Node.js Express server for the PDF Box Cloud application that provides secure file storage, user authentication, and box management functionality.

## Features

- 🔐 **User Authentication** - JWT-based authentication with bcrypt password hashing
- 📦 **Box Management** - Create, read, update, delete boxes for organizing PDFs
- 📄 **PDF Upload/Download** - Secure file upload with size limits and type validation
- 🔗 **QR Code Generation** - Generate QR codes for public box sharing
- 🌐 **Public Access** - Share boxes publicly via QR codes or direct links
- 🛡️ **Security** - Rate limiting, CORS protection, helmet security headers
- 🗄️ **SQLite Database** - Lightweight database with automatic table initialization

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /me` - Get current user info
- `POST /logout` - Logout user

### Boxes (`/api/boxes`)
- `GET /` - Get all boxes for authenticated user
- `GET /:boxId` - Get single box with entries (titles and PDFs)
- `POST /` - Create new box
- `PUT /:boxId` - Update box name
- `DELETE /:boxId` - Delete box and all entries
- `GET /:boxId/qr` - Generate QR code for box
- `POST /:boxId/pdfs` - Upload PDFs with title (files optional)
- `POST /:boxId/titles` - Create title-only entry
- `DELETE /:boxId/pdfs/:pdfId` - Delete entry (title and/or PDF)

### Public Access (`/api/public`)
- `GET /boxes/:boxId` - Get public box view
- `GET /boxes/:boxId/stats` - Get box statistics

### File Serving (`/api/files`)
- `GET /:filename` - Serve PDF file inline
- `GET /:filename/download` - Download PDF file

### System
- `GET /health` - Health check endpoint
- `GET /` - API information

## Installation

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables by copying `.env` and updating values:
   ```bash
   cp .env .env.local
   ```

4. Start the server:
   ```bash
   # Development with auto-reload
   npm run dev

   # Production
   npm start
   ```

## Environment Variables

Create a `.env` file in the server directory with the following variables:

```env
NODE_ENV=development
PORT=3000
DB_PATH=./database.sqlite
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
MAX_FILES_PER_UPLOAD=10
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
FRONTEND_URL=http://localhost:5173
```

## Database Schema

The server uses SQLite with the following tables:

### Users
- `id` (TEXT PRIMARY KEY)
- `email` (TEXT UNIQUE)
- `name` (TEXT)
- `password` (TEXT, hashed)
- `created_at` (DATETIME)

### Boxes
- `id` (TEXT PRIMARY KEY)
- `name` (TEXT)
- `user_id` (TEXT, foreign key)
- `created_at` (DATETIME)

### PDFs (Entries)
- `id` (TEXT PRIMARY KEY)
- `title` (TEXT, required - entry title)
- `filename` (TEXT, nullable - stored filename)
- `original_name` (TEXT, nullable - original filename)
- `path` (TEXT, nullable - file path)
- `size` (INTEGER, default 0 - file size)
- `box_id` (TEXT, foreign key)
- `upload_date` (DATETIME)

## File Upload and Entry Creation

- **Entry Types**: Title-only entries or entries with PDF files
- **Title**: Required for all entries
- **Files**: Optional - can create title-only entries
- **Allowed formats**: PDF only (when files are uploaded)
- **Default max file size**: 10MB per file
- **Default max files per upload**: 10 files
- **Storage**: Local filesystem with UUID-based filenames
- **Validation**: MIME type checking for PDF files

### Upload Examples

#### Upload with title and files:
```bash
curl -X POST http://localhost:3000/api/boxes/{boxId}/pdfs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=My Document Title" \
  -F "pdfs=@document1.pdf" \
  -F "pdfs=@document2.pdf"
```

#### Create title-only entry:
```bash
curl -X POST http://localhost:3000/api/boxes/{boxId}/titles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Title Only Entry"}'
```

## Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configurable origin restrictions
- **Helmet**: Security headers
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **File Validation**: PDF-only uploads with size limits

## Development

The server includes several development-friendly features:

- Hot reload with nodemon
- Detailed error logging
- Health check endpoint
- Development vs production configurations
- Graceful database shutdown handling

## Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure appropriate CORS origins
4. Set up proper file storage (consider cloud storage for scalability)
5. Use a process manager like PM2
6. Set up proper logging and monitoring

## File Structure

```
server/
├── config/
│   └── database.js          # Database configuration and initialization
├── middleware/
│   └── auth.js              # Authentication middleware
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── boxes.js             # Box management routes
│   ├── files.js             # File serving routes
│   └── public.js            # Public access routes
├── uploads/                 # File upload directory (auto-created)
├── .env                     # Environment configuration
├── package.json             # Dependencies and scripts
├── server.js                # Main server file
└── README.md                # This file
```

## Testing

Test the API endpoints using tools like Postman, curl, or the frontend application:

```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Create box
curl -X POST http://localhost:3000/api/boxes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name":"My Test Box"}'
```