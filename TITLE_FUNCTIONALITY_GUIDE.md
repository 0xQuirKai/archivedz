# PDF Box Cloud - Usage Examples with Titles

This document shows how to use the new title functionality in PDF Box Cloud, where users can create entries with titles and optionally attach PDF files.

## Frontend Component Usage

### Using the UploadZoneWithTitle Component

```tsx
import UploadZoneWithTitle from "@/components/UploadZoneWithTitle";
import PDFCardWithTitle from "@/components/PDFCardWithTitle";
import { pdfAPI } from "@/lib/api";

function BoxDetailPage() {
  const [pdfs, setPdfs] = useState<PDF[]>([]);

  const handleUploadWithFiles = async (files: File[], title: string) => {
    try {
      const uploadedEntries = await pdfAPI.upload(boxId, files, title);
      setPdfs(prev => [...uploadedEntries, ...prev]);
      toast.success(`Uploaded "${title}" with ${files.length} file(s)`);
    } catch (error) {
      toast.error("Upload failed");
    }
  };

  const handleTitleOnly = async (title: string) => {
    try {
      const newEntry = await pdfAPI.createTitleOnly(boxId, title);
      setPdfs(prev => [newEntry, ...prev]);
      toast.success(`Created title-only entry: "${title}"`);
    } catch (error) {
      toast.error("Failed to create entry");
    }
  };

  return (
    <div>
      <UploadZoneWithTitle
        onUpload={handleUploadWithFiles}
        onTitleOnly={handleTitleOnly}
        onCancel={() => setShowUpload(false)}
      />

      <div className="grid gap-4">
        {pdfs.map(pdf => (
          <PDFCardWithTitle
            key={pdf.id}
            pdf={pdf}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
```

## API Usage Examples

### 1. Create Title-Only Entry

**Endpoint:** `POST /api/boxes/{boxId}/titles`

```bash
curl -X POST http://localhost:3000/api/boxes/box-123/titles \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Meeting Notes - Q4 Planning"
  }'
```

**Response:**
```json
{
  "id": "entry-456",
  "title": "Meeting Notes - Q4 Planning",
  "filename": null,
  "originalName": null,
  "path": null,
  "size": 0,
  "uploadDate": "2025-10-08T14:30:00.000Z",
  "hasFile": false
}
```

### 2. Upload Entry with Title and Files

**Endpoint:** `POST /api/boxes/{boxId}/pdfs`

```bash
curl -X POST http://localhost:3000/api/boxes/box-123/pdfs \
  -H "Authorization: Bearer your-jwt-token" \
  -F "title=Project Documentation" \
  -F "pdfs=@document1.pdf" \
  -F "pdfs=@document2.pdf"
```

**Response:**
```json
[
  {
    "id": "entry-789",
    "title": "Project Documentation (1)",
    "filename": "uuid-123-document1.pdf",
    "originalName": "document1.pdf",
    "path": "uuid-123-document1.pdf",
    "size": 1024567,
    "uploadDate": "2025-10-08T14:30:00.000Z",
    "hasFile": true
  },
  {
    "id": "entry-790",
    "title": "Project Documentation (2)",
    "filename": "uuid-124-document2.pdf",
    "originalName": "document2.pdf",
    "path": "uuid-124-document2.pdf",
    "size": 2048123,
    "uploadDate": "2025-10-08T14:30:00.000Z",
    "hasFile": true
  }
]
```

### 3. Get Box with Entries

**Endpoint:** `GET /api/boxes/{boxId}`

```bash
curl -X GET http://localhost:3000/api/boxes/box-123 \
  -H "Authorization: Bearer your-jwt-token"
```

**Response:**
```json
{
  "id": "box-123",
  "name": "My Document Box",
  "createdAt": "2025-10-08T10:00:00.000Z",
  "pdfCount": 3,
  "pdfs": [
    {
      "id": "entry-790",
      "title": "Project Documentation (2)",
      "filename": "uuid-124-document2.pdf",
      "original_name": "document2.pdf",
      "path": "uuid-124-document2.pdf",
      "size": 2048123,
      "uploadDate": "2025-10-08T14:30:00.000Z"
    },
    {
      "id": "entry-789",
      "title": "Project Documentation (1)",
      "filename": "uuid-123-document1.pdf",
      "original_name": "document1.pdf",
      "path": "uuid-123-document1.pdf",
      "size": 1024567,
      "uploadDate": "2025-10-08T14:30:00.000Z"
    },
    {
      "id": "entry-456",
      "title": "Meeting Notes - Q4 Planning",
      "filename": null,
      "original_name": null,
      "path": null,
      "size": 0,
      "uploadDate": "2025-10-08T14:30:00.000Z"
    }
  ]
}
```

## Database Structure Examples

### Entry with File
```sql
INSERT INTO pdfs VALUES (
  'entry-123',                    -- id
  'Contract Review Document',     -- title
  'uuid-456-contract.pdf',       -- filename
  'contract.pdf',                 -- original_name
  'uuid-456-contract.pdf',       -- path
  1024567,                        -- size
  'box-789',                      -- box_id
  '2025-10-08 14:30:00'          -- upload_date
);
```

### Title-Only Entry
```sql
INSERT INTO pdfs VALUES (
  'entry-124',                    -- id
  'Ideas for New Features',       -- title
  NULL,                           -- filename
  NULL,                           -- original_name
  NULL,                           -- path
  0,                              -- size
  'box-789',                      -- box_id
  '2025-10-08 14:30:00'          -- upload_date
);
```

## Frontend Display Logic

### Determining Entry Type
```tsx
const hasFile = pdf.hasFile || (pdf.filename && pdf.path);

if (hasFile) {
  // Show download button and file info
  return (
    <div>
      <h3>{pdf.title}</h3>
      <p>File: {pdf.originalName}</p>
      <p>Size: {formatFileSize(pdf.size)}</p>
      <Button onClick={() => downloadFile(pdf.path)}>
        Download
      </Button>
    </div>
  );
} else {
  // Show title-only entry
  return (
    <div>
      <h3>{pdf.title}</h3>
      <p>No file attached</p>
      <Badge variant="secondary">Title Only</Badge>
    </div>
  );
}
```

## Migration Notes

### Existing Databases
The server automatically handles migration by:
1. Adding the `title` column if it doesn't exist
2. Making `filename`, `original_name`, and `path` nullable in application logic
3. Setting `size` default to 0 for title-only entries

### Backward Compatibility
- Existing entries without titles will need manual migration
- Old API calls without titles will fail - update frontend to always include titles
- File serving endpoints remain unchanged

## Best Practices

1. **Always provide meaningful titles** - Users will see these prominently
2. **Use title-only entries for** - Ideas, notes, reminders, placeholders
3. **Use entries with files for** - Actual documents, contracts, reports
4. **Organize by title** - Sort and search primarily by title, not filename
5. **Clear naming** - Make titles descriptive and searchable