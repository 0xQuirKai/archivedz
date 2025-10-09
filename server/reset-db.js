import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the database file
const dbPath = path.join(__dirname, 'database.sqlite');

console.log('🗑️ Resetting database...');

// Delete the existing database file if it exists
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('✅ Existing database deleted');
} else {
    console.log('ℹ️ No existing database found');
}

console.log('✅ Database reset complete. Restart the server to create a fresh database.');