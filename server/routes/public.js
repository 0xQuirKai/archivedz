import express from 'express';
import { dbGet, dbAll } from '../config/database.js';

const router = express.Router();

// Get public box (no authentication required)
router.get('/boxes/:boxId', async(req, res) => {
    try {
        const { boxId } = req.params;

        // Get box details (no user restriction for public access)
        const box = await dbGet(`
      SELECT
        b.id,
        b.name,
        b.created_at as createdAt,
        u.name as ownerName
      FROM boxes b
      JOIN users u ON b.user_id = u.id
      WHERE b.id = ?
    `, [boxId]);

        if (!box) {
            return res.status(404).json({
                error: 'Box not found',
                message: 'The requested box does not exist'
            });
        }

        // Get entries in the box (both titles and PDFs)
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
        console.error('Get public box error:', error);
        res.status(500).json({
            error: 'Failed to fetch box',
            message: 'An error occurred while fetching the box'
        });
    }
});

// Get box statistics (public endpoint for analytics)
router.get('/boxes/:boxId/stats', async(req, res) => {
    try {
        const { boxId } = req.params;

        // Check if box exists
        const box = await dbGet('SELECT id FROM boxes WHERE id = ?', [boxId]);
        if (!box) {
            return res.status(404).json({
                error: 'Box not found',
                message: 'The requested box does not exist'
            });
        }

        // Get statistics
        const stats = await dbGet(`
      SELECT
        COUNT(*) as totalPdfs,
        COALESCE(SUM(size), 0) as totalSize,
        MIN(upload_date) as firstUpload,
        MAX(upload_date) as lastUpload
      FROM pdfs
      WHERE box_id = ?
    `, [boxId]);

        res.json({
            boxId,
            ...stats
        });
    } catch (error) {
        console.error('Get box stats error:', error);
        res.status(500).json({
            error: 'Failed to fetch box statistics',
            message: 'An error occurred while fetching box statistics'
        });
    }
});

export default router;