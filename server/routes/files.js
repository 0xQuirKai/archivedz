import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dbGet } from '../config/database.js';

const router = express.Router();
const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

// Serve uploaded files
router.get('/:filename', async(req, res) => {
    try {
        const { filename } = req.params;
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        const filePath = path.join(__dirname, '..', uploadDir, filename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                error: 'File not found',
                message: 'The requested file does not exist'
            });
        }

        // Verify file is in database (basic security check)
        const pdfRecord = await dbGet('SELECT original_name FROM pdfs WHERE path = ?', [filename]);
        if (!pdfRecord) {
            return res.status(404).json({
                error: 'File not found',
                message: 'The requested file does not exist in our records'
            });
        }

        // Set appropriate headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${pdfRecord.original_name}"`);

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        fileStream.on('error', (error) => {
            console.error('File stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    error: 'File read error',
                    message: 'An error occurred while reading the file'
                });
            }
        });
    } catch (error) {
        console.error('File serve error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Failed to serve file',
                message: 'An error occurred while serving the file'
            });
        }
    }
});

// Download file with original filename
router.get('/:filename/download', async(req, res) => {
    try {
        const { filename } = req.params;
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        const filePath = path.join(__dirname, '..', uploadDir, filename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                error: 'File not found',
                message: 'The requested file does not exist'
            });
        }

        // Verify file is in database
        const pdfRecord = await dbGet('SELECT original_name FROM pdfs WHERE path = ?', [filename]);
        if (!pdfRecord) {
            return res.status(404).json({
                error: 'File not found',
                message: 'The requested file does not exist in our records'
            });
        }

        // Set download headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${pdfRecord.original_name}"`);

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        fileStream.on('error', (error) => {
            console.error('File download error:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    error: 'Download error',
                    message: 'An error occurred while downloading the file'
                });
            }
        });
    } catch (error) {
        console.error('File download error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Failed to download file',
                message: 'An error occurred while downloading the file'
            });
        }
    }
});

export default router;