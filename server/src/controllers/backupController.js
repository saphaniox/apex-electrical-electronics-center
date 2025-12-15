import { getDatabase } from '../db/connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_DIR = path.join(__dirname, '../../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Create database backup
export async function createBackup(req, res) {
  try {
    console.log('Starting backup creation...');
    const db = getDatabase();
    
    if (!db) {
      throw new Error('Database connection not available');
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup_${timestamp}`;
    const backupPath = path.join(BACKUP_DIR, backupName);

    console.log('Backup path:', backupPath);

    // Create backup directory
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }

    // Get all collections
    console.log('Fetching collections...');
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('Collections found:', collectionNames);

    let totalDocuments = 0;
    let totalSize = 0;

    // Export each collection
    for (const collectionName of collectionNames) {
      console.log(`Exporting collection: ${collectionName}...`);
      const collection = db.collection(collectionName);
      const documents = await collection.find({}).toArray();
      
      const collectionData = {
        collection: collectionName,
        documents: documents,
        count: documents.length,
        exportedAt: new Date()
      };

      const jsonData = JSON.stringify(collectionData, null, 2);
      const filePath = path.join(backupPath, `${collectionName}.json`);
      fs.writeFileSync(filePath, jsonData);

      totalDocuments += documents.length;
      totalSize += Buffer.byteLength(jsonData);
      console.log(`  ✓ Exported ${documents.length} documents`);
    }

    // Create metadata file
    const metadata = {
      backup_name: backupName,
      database: db.databaseName,
      created_at: new Date(),
      created_by_user_id: req.user.id,
      created_by_username: req.user.username,
      collections: collectionNames,
      total_documents: totalDocuments,
      size: totalSize,
      formatted_size: formatBytes(totalSize)
    };

    fs.writeFileSync(
      path.join(backupPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    console.log('Backup created successfully:', backupName);
    res.json({
      message: 'Backup created successfully',
      backup: metadata
    });
  } catch (error) {
    console.error('Backup error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to create backup', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
      .filter(file => {
        const fullPath = path.join(BACKUP_DIR, file);
        return fs.statSync(fullPath).isDirectory();
      })
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
          database: 'Unknown',
          created_at: stats.birthtime,
          created_by_username: 'Unknown',
          size: getDirectorySize(path.join(BACKUP_DIR, backupName)),
          formatted_size: formatBytes(getDirectorySize(path.join(BACKUP_DIR, backupName)))
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
    const db = getDatabase();
    const backupPath = path.join(BACKUP_DIR, backup_name);

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    // Read metadata
    const metadataPath = path.join(backupPath, 'metadata.json');
    if (!fs.existsSync(metadataPath)) {
      return res.status(400).json({ error: 'Invalid backup: metadata not found' });
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    
    let restoredCollections = 0;
    let restoredDocuments = 0;

    // Restore each collection
    for (const collectionName of metadata.collections) {
      const collectionFile = path.join(backupPath, `${collectionName}.json`);
      
      if (!fs.existsSync(collectionFile)) {
        console.warn(`Collection file not found: ${collectionName}.json`);
        continue;
      }

      const collectionData = JSON.parse(fs.readFileSync(collectionFile, 'utf8'));
      const collection = db.collection(collectionName);

      // Drop existing collection
      try {
        await collection.drop();
      } catch (error) {
        // Collection might not exist, that's okay
        console.log(`Collection ${collectionName} doesn't exist, creating new one`);
      }

      // Insert documents
      if (collectionData.documents && collectionData.documents.length > 0) {
        await collection.insertMany(collectionData.documents);
        restoredDocuments += collectionData.documents.length;
      }

      restoredCollections++;
    }

    res.json({
      message: 'Database restored successfully',
      backup_name,
      restored_at: new Date(),
      restored_by: req.user.username,
      collections_restored: restoredCollections,
      documents_restored: restoredDocuments
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

    const zipName = `${backup_name}.zip`;
    
    res.attachment(zipName);
    
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(res);
    archive.directory(backupPath, false);
    await archive.finalize();
  } catch (error) {
    console.error('Download backup error:', error);
    res.status(500).json({ error: error.message });
  }
}
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

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
