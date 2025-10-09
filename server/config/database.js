import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'database.sqlite');

// Create database connection
export const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('📊 Connected to SQLite database at:', dbPath);
    }
});

// Promisify database methods for easier async/await usage
export const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID, changes: this.changes });
            }
        });
    });
};

export const dbGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

export const dbAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// Initialize database tables
export const initializeDatabase = async() => {
    try {
        // Users table
        await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Boxes table
        await dbRun(`
      CREATE TABLE IF NOT EXISTS boxes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

        // PDFs table
        await dbRun(`
      CREATE TABLE IF NOT EXISTS pdfs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        filename TEXT,
        original_name TEXT,
        path TEXT,
        size INTEGER DEFAULT 0,
        box_id TEXT NOT NULL,
        upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (box_id) REFERENCES boxes (id) ON DELETE CASCADE
      )
    `);

        // Create indexes for better performance
        await dbRun('CREATE INDEX IF NOT EXISTS idx_boxes_user_id ON boxes (user_id)');
        await dbRun('CREATE INDEX IF NOT EXISTS idx_pdfs_box_id ON pdfs (box_id)');
        await dbRun('CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)');

        // Migration: Handle existing databases with old schema
        try {
            // Check if title column exists
            const tableInfo = await dbAll('PRAGMA table_info(pdfs)');
            const hasTitle = tableInfo.some(col => col.name === 'title');
            const filenameCol = tableInfo.find(col => col.name === 'filename');

            if (!hasTitle || (filenameCol && filenameCol.notnull === 1)) {
                console.log('🔄 Migrating database schema for title support...');

                // Create new table with correct schema
                await dbRun(`
                    CREATE TABLE IF NOT EXISTS pdfs_new (
                        id TEXT PRIMARY KEY,
                        title TEXT NOT NULL,
                        filename TEXT,
                        original_name TEXT,
                        path TEXT,
                        size INTEGER DEFAULT 0,
                        box_id TEXT NOT NULL,
                        upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (box_id) REFERENCES boxes (id) ON DELETE CASCADE
                    )
                `);

                // Copy existing data if any
                const existingData = await dbAll('SELECT * FROM pdfs');
                if (existingData.length > 0) {
                    console.log(`📦 Migrating ${existingData.length} existing entries...`);
                    for (const row of existingData) {
                        await dbRun(`
                            INSERT INTO pdfs_new (id, title, filename, original_name, path, size, box_id, upload_date)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        `, [
                            row.id,
                            row.title || row.filename || row.original_name || 'Untitled',
                            row.filename,
                            row.original_name,
                            row.path,
                            row.size || 0,
                            row.box_id,
                            row.upload_date
                        ]);
                    }
                }

                // Replace old table with new one
                await dbRun('DROP TABLE pdfs');
                await dbRun('ALTER TABLE pdfs_new RENAME TO pdfs');

                console.log('✅ Database schema migration completed');
            } else {
                console.log('ℹ️ Database schema is already up to date');
            }
        } catch (error) {
            console.error('❌ Migration error:', error);
            // If migration fails, try to continue with existing schema
            console.log('⚠️ Continuing with existing schema - some features may not work');
        }

        console.log('✅ Database tables initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        throw error;
    }
};

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('📊 Database connection closed.');
        }
        process.exit(0);
    });
});