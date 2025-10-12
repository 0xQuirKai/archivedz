# Backend API Integration

This file contains all the API endpoints that need to be implemented in your Node.js + Express backend.

## Base URL Configuration

Update `API_BASE_URL` in `api.ts` to point to your backend server:
```typescript
const API_BASE_URL = 'http://72.60.215.86:3000/api';
```

## Required Backend Endpoints

### Authentication Endpoints

#### POST /api/auth/register
Register a new user
```json
Request:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "id": "user123",
  "name": "John Doe",
  "email": "john@example.com",
  "token": "jwt-token-here"
}
```

#### POST /api/auth/login
Login existing user
```json
Request:
{
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "id": "user123",
  "name": "John Doe",
  "email": "john@example.com",
  "token": "jwt-token-here"
}
```

#### GET /api/auth/me
Get current user (requires Authorization header)
```json
Response:
{
  "id": "user123",
  "name": "John Doe",
  "email": "john@example.com"
}
```

### Box Endpoints

#### GET /api/boxes
Get all boxes for authenticated user
```json
Response:
[
  {
    "id": "box123",
    "name": "Work Documents",
    "pdfCount": 5,
    "createdAt": "2024-01-15T10:00:00Z"
  }
]
```

#### GET /api/boxes/:boxId
Get box details with PDFs
```json
Response:
{
  "id": "box123",
  "name": "Work Documents",
  "pdfCount": 5,
  "createdAt": "2024-01-15T10:00:00Z",
  "pdfs": [
    {
      "id": "pdf123",
      "filename": "document.pdf",
      "path": "userId/boxId/document.pdf",
      "uploadDate": "2024-01-15T10:00:00Z",
      "size": 2048576
    }
  ]
}
```

#### POST /api/boxes
Create new box
```json
Request:
{
  "name": "My New Box"
}

Response:
{
  "id": "box123",
  "name": "My New Box",
  "pdfCount": 0,
  "createdAt": "2024-01-15T10:00:00Z"
}
```

#### PUT /api/boxes/:boxId
Update box name
```json
Request:
{
  "name": "Updated Box Name"
}

Response:
{
  "id": "box123",
  "name": "Updated Box Name",
  "pdfCount": 5,
  "createdAt": "2024-01-15T10:00:00Z"
}
```

#### DELETE /api/boxes/:boxId
Delete box and all its PDFs

#### GET /api/boxes/:boxId/qr
Generate QR code for box
```json
Response:
{
  "qrCode": "data:image/png;base64,..." // Base64 encoded QR code image
}
```

### PDF Endpoints

#### POST /api/boxes/:boxId/pdfs
Upload PDFs (multipart/form-data)
```
Form Data:
- pdfs: File[] (multiple PDF files)

Response:
[
  {
    "id": "pdf123",
    "filename": "document.pdf",
    "path": "userId/boxId/document.pdf",
    "uploadDate": "2024-01-15T10:00:00Z",
    "size": 2048576
  }
]
```

#### DELETE /api/boxes/:boxId/pdfs/:pdfId
Delete a PDF

#### GET /api/files/:filePath
Serve PDF file (download)

### Public Endpoints

#### GET /api/public/boxes/:boxId
Get box details (no authentication required)
```json
Response:
{
  "id": "box123",
  "name": "Work Documents",
  "pdfCount": 5,
  "createdAt": "2024-01-15T10:00:00Z",
  "pdfs": [
    {
      "id": "pdf123",
      "filename": "document.pdf",
      "path": "userId/boxId/document.pdf",
      "uploadDate": "2024-01-15T10:00:00Z",
      "size": 2048576
    }
  ]
}
```

## Data Storage Structure

### JSON Files Location
Store all data in `/data/` directory:
- `/data/users.json` - All user records
- `/uploads/{userId}/{boxId}/` - PDF files

### Users JSON Structure
```json
[
  {
    "id": "user123",
    "email": "john@example.com",
    "password": "hashed-password",
    "name": "John Doe",
    "boxes": [
      {
        "id": "box123",
        "name": "Work Documents",
        "createdAt": "2024-01-15T10:00:00Z",
        "pdfFiles": [
          {
            "id": "pdf123",
            "filename": "document.pdf",
            "path": "user123/box123/document.pdf",
            "uploadDate": "2024-01-15T10:00:00Z",
            "size": 2048576
          }
        ]
      }
    ]
  }
]
```

## Authentication

All authenticated endpoints expect an Authorization header:
```
Authorization: Bearer <jwt-token>
```

## File Validation

### PDF Upload Rules
- Only accept `application/pdf` MIME type
- Maximum file size: 10MB per file
- Store files in: `/uploads/{userId}/{boxId}/`

## QR Code Generation

Generate QR codes that encode the URL:
```
{FRONTEND_URL}/view/{boxId}
```

Use a library like `qrcode` to generate the QR code as a PNG image.

## Error Responses

All errors should return:
```json
{
  "message": "Error description"
}
```

Common status codes:
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 413: Payload Too Large (file size)
- 500: Internal Server Error
