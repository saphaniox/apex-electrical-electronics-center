import { getDatabase } from '../db/connection.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_DIR = path.join(__dirname, '../../backups');
const DB_NAME = process.env.DB_NAME || 'stock_sales_system';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Create database backup
export async function createBackup(req, res) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup_${timestamp}`;
    const backupPath = path.join(BACKUP_DIR, backupName);

    // Use mongodump to create backup
    const command = `mongodump --uri="${MONGO_URI}" --db="${DB_NAME}" --out="${backupPath}"`;
    
    await execAsync(command);

    // Create metadata file
    const metadata = {
      backup_name: backupName,
      database: DB_NAME,
      created_at: new Date(),
      created_by_user_id: req.user.id,
      created_by_username: req.user.username,
      size: getDirectorySize(backupPath)
    };

    fs.writeFileSync(
      path.join(backupPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    res.json({
      message: 'Backup created successfully',
      backup: metadata
    });
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ 
      error: 'Failed to create backup', 
      details: error.message 
    });
  }
}

// Get all backups
export async function getBackups(req, res) {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return res.json({ data: [] });
    }

    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(file => fs.statSync(path.join(BACKUP_DIR, file)).isDirectory())
      .map(backupName => {
        const metadataPath = path.join(BACKUP_DIR, backupName, 'metadata.json');
        
        if (fs.existsSync(metadataPath)) {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          return metadata;
        }

        // If no metadata, create basic info
        const stats = fs.statSync(path.join(BACKUP_DIR, backupName));
        return {
          backup_name: backupName,
          database: DB_NAME,
          created_at: stats.birthtime,
          created_by_username: 'Unknown',
          size: getDirectorySize(path.join(BACKUP_DIR, backupName))
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ data: backups });
  } catch (error) {
    console.error('Get backups error:', error);
    res.status(500).json({ error: error.message });
  }
}

// Restore database from backup
export async function restoreBackup(req, res) {
  const { backup_name } = req.body;

  try {
    const backupPath = path.join(BACKUP_DIR, backup_name, DB_NAME);

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    // Use mongorestore to restore backup
    const command = `mongorestore --uri="${MONGO_URI}" --db="${DB_NAME}" --drop "${backupPath}"`;
    
    await execAsync(command);

    res.json({
      message: 'Database restored successfully',
      backup_name,
      restored_at: new Date(),
      restored_by: req.user.username
    });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ 
      error: 'Failed to restore backup', 
      details: error.message 
    });
  }
}

// Download backup as zip
export async function downloadBackup(req, res) {
  const { backup_name } = req.params;

  try {
    const backupPath = path.join(BACKUP_DIR, backup_name);

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    // Create zip archive
    const archiver = require('archiver');
    const zipName = `${backup_name}.zip`;
    
    res.attachment(zipName);
    
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);
    archive.directory(backupPath, false);
    await archive.finalize();
  } catch (error) {
    console.error('Download backup error:', error);
    res.status(500).json({ error: error.message });
  }
}

// Delete backup
export async function deleteBackup(req, res) {
  const { backup_name } = req.params;

  try {
    const backupPath = path.join(BACKUP_DIR, backup_name);

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    // Delete backup directory recursively
    fs.rmSync(backupPath, { recursive: true, force: true });

    res.json({ message: 'Backup deleted successfully' });
  } catch (error) {
    console.error('Delete backup error:', error);
    res.status(500).json({ error: error.message });
  }
}

// Helper function to get directory size
function getDirectorySize(dirPath) {
  let totalSize = 0;

  function calculateSize(itemPath) {
    const stats = fs.statSync(itemPath);
    
    if (stats.isFile()) {
      totalSize += stats.size;
    } else if (stats.isDirectory()) {
      const files = fs.readdirSync(itemPath);
      files.forEach(file => {
        calculateSize(path.join(itemPath, file));
      });
    }
  }

  try {
    calculateSize(dirPath);
    return totalSize;
  } catch (error) {
    return 0;
  }
}
