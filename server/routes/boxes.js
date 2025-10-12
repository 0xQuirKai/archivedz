import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { dbRun, dbGet, dbAll } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 10MB default
        files: parseInt(process.env.MAX_FILES_PER_UPLOAD) || 10
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

// Get all boxes for authenticated user
router.get('/', authenticateToken, async(req, res) => {
    try {
        const boxes = await dbAll(`
      SELECT
        b.id,
        b.name,
        b.retention_date as retentionDate,
        b.status,
        b.created_at as createdAt,
        COUNT(p.id) as pdfCount
      FROM boxes b
      LEFT JOIN pdfs p ON b.id = p.box_id
      WHERE b.user_id = ?
      GROUP BY b.id, b.name, b.retention_date, b.status, b.created_at
      ORDER BY b.created_at DESC
    `, [req.user.id]);

        res.json(boxes);
    } catch (error) {
        console.error('Get boxes error:', error);
        res.status(500).json({
            error: 'Failed to fetch boxes',
            message: 'An error occurred while fetching boxes'
        });
    }
});

// Get single box with PDFs
router.get('/:boxId', authenticateToken, async(req, res) => {
    try {
        const { boxId } = req.params;

        // Get box details
        const box = await dbGet(`
      SELECT id, name, retention_date as retentionDate, status, created_at as createdAt
      FROM boxes
      WHERE id = ? AND user_id = ?
    `, [boxId, req.user.id]);

        if (!box) {
            return res.status(404).json({
                error: 'Box not found',
                message: 'The requested box does not exist or you do not have access to it'
            });
        }

        // Get PDFs in the box
        const pdfs = await dbAll(`
      SELECT
        id,
        title,
        filename,
        original_name,
        path,
        size,
        upload_date as uploadDate
      FROM pdfs
      WHERE box_id = ?
      ORDER BY upload_date DESC
    `, [boxId]); // Count PDFs
        const pdfCount = pdfs.length;

        res.json({
            ...box,
            pdfCount,
            pdfs
        });
    } catch (error) {
        console.error('Get box error:', error);
        res.status(500).json({
            error: 'Failed to fetch box',
            message: 'An error occurred while fetching the box'
        });
    }
});

// Create new box
router.post('/', authenticateToken, async(req, res) => {
    try {
        const { name, retentionDate, status } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                error: 'Invalid box name',
                message: 'Box name is required and cannot be empty'
            });
        }

        const boxId = uuidv4();
        const result = await dbRun(
            'INSERT INTO boxes (id, name, user_id, retention_date, status) VALUES (?, ?, ?, ?, ?)', [boxId, name.trim(), req.user.id, retentionDate || null, status || 'active']
        );

        const newBox = await dbGet(`
      SELECT id, name, retention_date as retentionDate, status, created_at as createdAt
      FROM boxes
      WHERE id = ?
    `, [boxId]);

        res.status(201).json({
            ...newBox,
            pdfCount: 0
        });
    } catch (error) {
        console.error('Create box error:', error);
        res.status(500).json({
            error: 'Failed to create box',
            message: 'An error occurred while creating the box'
        });
    }
});

// Update box
router.put('/:boxId', authenticateToken, async(req, res) => {
    try {
        const { boxId } = req.params;
        const { name, retentionDate, status } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                error: 'Invalid box name',
                message: 'Box name is required and cannot be empty'
            });
        }

        // Check if box exists and belongs to user
        const existingBox = await dbGet(
            'SELECT id FROM boxes WHERE id = ? AND user_id = ?', [boxId, req.user.id]
        );

        if (!existingBox) {
            return res.status(404).json({
                error: 'Box not found',
                message: 'The requested box does not exist or you do not have access to it'
            });
        }

        // Update box
        await dbRun(
            'UPDATE boxes SET name = ?, retention_date = ?, status = ? WHERE id = ?', [name.trim(), retentionDate || null, status || 'active', boxId]
        );

        // Get updated box with PDF count
        const updatedBox = await dbGet(`
      SELECT
        b.id,
        b.name,
        b.retention_date as retentionDate,
        b.status,
        b.created_at as createdAt,
        COUNT(p.id) as pdfCount
      FROM boxes b
      LEFT JOIN pdfs p ON b.id = p.box_id
      WHERE b.id = ?
      GROUP BY b.id, b.name, b.retention_date, b.status, b.created_at
    `, [boxId]);

        res.json(updatedBox);
    } catch (error) {
        console.error('Update box error:', error);
        res.status(500).json({
            error: 'Failed to update box',
            message: 'An error occurred while updating the box'
        });
    }
});

// Delete box
router.delete('/:boxId', authenticateToken, async(req, res) => {
    try {
        const { boxId } = req.params;

        // Check if box exists and belongs to user
        const box = await dbGet(
            'SELECT id FROM boxes WHERE id = ? AND user_id = ?', [boxId, req.user.id]
        );

        if (!box) {
            return res.status(404).json({
                error: 'Box not found',
                message: 'The requested box does not exist or you do not have access to it'
            });
        }

        // Get all PDFs in the box to delete files
        const pdfs = await dbAll('SELECT path FROM pdfs WHERE box_id = ?', [boxId]);

        // Delete physical files
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        for (const pdf of pdfs) {
            const filePath = path.join(uploadDir, pdf.path);
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (fileError) {
                console.error('Error deleting file:', filePath, fileError);
            }
        }

        // Delete box (PDFs will be deleted due to CASCADE)
        await dbRun('DELETE FROM boxes WHERE id = ?', [boxId]);

        res.json({
            message: 'Box deleted successfully'
        });
    } catch (error) {
        console.error('Delete box error:', error);
        res.status(500).json({
            error: 'Failed to delete box',
            message: 'An error occurred while deleting the box'
        });
    }
});

// Generate QR code for box
router.get('/:boxId/qr', authenticateToken, async(req, res) => {
    try {
        const { boxId } = req.params;

        // Check if box exists and belongs to user
        const box = await dbGet(
            'SELECT id FROM boxes WHERE id = ? AND user_id = ?', [boxId, req.user.id]
        );

        if (!box) {
            return res.status(404).json({
                error: 'Box not found',
                message: 'The requested box does not exist or you do not have access to it'
            });
        }

        // Generate QR code URL (assuming frontend is at same domain with different port or path)
        const baseUrl = 'https://72.60.215.86';
        const qrUrl = `${baseUrl}/view/${boxId}`;

        // Generate QR code
        const qrCode = await QRCode.toDataURL(qrUrl, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            quality: 0.92,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        res.json({
            qrCode,
            url: qrUrl
        });
    } catch (error) {
        console.error('Generate QR code error:', error);
        res.status(500).json({
            error: 'Failed to generate QR code',
            message: 'An error occurred while generating the QR code'
        });
    }
});

// Upload PDFs to box (with title, file optional)
router.post('/:boxId/pdfs', authenticateToken, upload.array('pdfs'), async(req, res) => {
    try {
        const { boxId } = req.params;
        const { title, titles } = req.body; // Support both single title and multiple titles

        // Check if box exists and belongs to user
        const box = await dbGet(
            'SELECT id FROM boxes WHERE id = ? AND user_id = ?', [boxId, req.user.id]
        );

        if (!box) {
            return res.status(404).json({
                error: 'Box not found',
                message: 'The requested box does not exist or you do not have access to it'
            });
        }

        // Handle both title-only entries and file uploads
        const files = req.files || [];
        let titleArray = [];

        // Parse titles - could be single title or array of titles
        if (titles) {
            titleArray = Array.isArray(titles) ? titles : [titles];
        } else if (title) {
            titleArray = [title];
        }

        // Validate that we have at least a title
        if (titleArray.length === 0) {
            return res.status(400).json({
                error: 'Title required',
                message: 'Please provide at least one title'
            });
        }

        // If we have files, ensure titles match file count or use single title for all files
        if (files.length > 0 && titleArray.length === 1 && files.length > 1) {
            // Use the single title for all files (append index)
            const baseTitle = titleArray[0];
            titleArray = files.map((_, index) => `${baseTitle} (${index + 1})`);
        }

        // Create entries
        const uploadedEntries = [];

        // Handle files with titles
        for (let i = 0; i < Math.max(files.length, titleArray.length); i++) {
            const file = files[i];
            const entryTitle = titleArray[i] || titleArray[0] || `Untitled ${i + 1}`;
            const entryId = uuidv4();

            if (file) {
                // Entry with file
                await dbRun(`
                    INSERT INTO pdfs (id, title, filename, original_name, path, size, box_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [entryId, entryTitle, file.filename, file.originalname, file.filename, file.size, boxId]);

                uploadedEntries.push({
                    id: entryId,
                    title: entryTitle,
                    filename: file.filename,
                    originalName: file.originalname,
                    path: file.filename,
                    size: file.size,
                    uploadDate: new Date().toISOString(),
                    hasFile: true
                });
            } else {
                // Title-only entry
                await dbRun(`
                    INSERT INTO pdfs (id, title, box_id)
                    VALUES (?, ?, ?)
                `, [entryId, entryTitle, boxId]);

                uploadedEntries.push({
                    id: entryId,
                    title: entryTitle,
                    filename: null,
                    originalName: null,
                    path: null,
                    size: 0,
                    uploadDate: new Date().toISOString(),
                    hasFile: false
                });
            }
        }

        res.status(201).json(uploadedEntries);
    } catch (error) {
        console.error('Upload entries error:', error);

        // Clean up uploaded files on error
        if (req.files) {
            const uploadDir = process.env.UPLOAD_DIR || './uploads';
            for (const file of req.files) {
                try {
                    const filePath = path.join(uploadDir, file.filename);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                } catch (cleanupError) {
                    console.error('Error cleaning up file:', file.filename, cleanupError);
                }
            }
        }

        res.status(500).json({
            error: 'Failed to upload entries',
            message: 'An error occurred while creating the entries'
        });
    }
});

// Create title-only entry (no file)
router.post('/:boxId/titles', authenticateToken, async(req, res) => {
    try {
        const { boxId } = req.params;
        const { title } = req.body;

        // Check if box exists and belongs to user
        const box = await dbGet(
            'SELECT id FROM boxes WHERE id = ? AND user_id = ?', [boxId, req.user.id]
        );

        if (!box) {
            return res.status(404).json({
                error: 'Box not found',
                message: 'The requested box does not exist or you do not have access to it'
            });
        }

        if (!title || title.trim().length === 0) {
            return res.status(400).json({
                error: 'Title required',
                message: 'Please provide a title'
            });
        }

        const entryId = uuidv4();

        // Try to insert title-only entry
        try {
            await dbRun(`
                INSERT INTO pdfs (id, title, box_id)
                VALUES (?, ?, ?)
            `, [entryId, title.trim(), boxId]);
        } catch (insertError) {
            // If we get a NOT NULL constraint error, try with empty filename values
            if (insertError.message.includes('NOT NULL constraint failed')) {
                console.log('⚠️ Fallback: Using empty values for file fields');
                await dbRun(`
                    INSERT INTO pdfs (id, title, filename, original_name, path, size, box_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [entryId, title.trim(), '', '', '', 0, boxId]);
            } else {
                throw insertError;
            }
        }

        const newEntry = {
            id: entryId,
            title: title.trim(),
            filename: null,
            originalName: null,
            path: null,
            size: 0,
            uploadDate: new Date().toISOString(),
            hasFile: false
        };

        res.status(201).json(newEntry);
    } catch (error) {
        console.error('Create title entry error:', error);
        res.status(500).json({
            error: 'Failed to create title entry',
            message: 'An error occurred while creating the title entry'
        });
    }
});

// Delete PDF from box
router.delete('/:boxId/pdfs/:pdfId', authenticateToken, async(req, res) => {
    try {
        const { boxId, pdfId } = req.params;

        // Check if box exists and belongs to user
        const box = await dbGet(
            'SELECT id FROM boxes WHERE id = ? AND user_id = ?', [boxId, req.user.id]
        );

        if (!box) {
            return res.status(404).json({
                error: 'Box not found',
                message: 'The requested box does not exist or you do not have access to it'
            });
        }

        // Get entry details
        const entry = await dbGet(
            'SELECT title, path FROM pdfs WHERE id = ? AND box_id = ?', [pdfId, boxId]
        );

        if (!entry) {
            return res.status(404).json({
                error: 'Entry not found',
                message: 'The requested entry does not exist in this box'
            });
        }

        // Delete physical file if it exists
        if (entry.path) {
            const uploadDir = process.env.UPLOAD_DIR || './uploads';
            const filePath = path.join(uploadDir, entry.path);
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (fileError) {
                console.error('Error deleting file:', filePath, fileError);
            }
        }

        // Delete PDF record
        await dbRun('DELETE FROM pdfs WHERE id = ?', [pdfId]);

        res.json({
            message: 'Entry deleted successfully'
        });
    } catch (error) {
        console.error('Delete entry error:', error);
        res.status(500).json({
            error: 'Failed to delete entry',
            message: 'An error occurred while deleting the entry'
        });
    }
});

export default router;