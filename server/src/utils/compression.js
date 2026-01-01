import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

/**
 * Compress data using gzip
 * @param {object} data - Data to compress
 * @returns {Promise<Buffer>} Compressed data
 */
export async function compressData(data) {
  try {
    const jsonString = JSON.stringify(data);
    const compressed = await gzip(jsonString, { level: 6 });
    return compressed;
  } catch (error) {
    console.error('❌ Compression error:', error);
    throw error;
  }
}

/**
 * Decompress data using gunzip
 * @param {Buffer} compressedData - Compressed data
 * @returns {Promise<object>} Decompressed data
 */
export async function decompressData(compressedData) {
  try {
    const decompressed = await gunzip(compressedData);
    const jsonString = decompressed.toString('utf-8');
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('❌ Decompression error:', error);
    throw error;
  }
}

/**
 * Store compressed data in database
 * @param {object} collection - MongoDB collection
 * @param {string} fieldName - Field name to store compressed data
 * @param {object} data - Data to compress and store
 * @returns {Promise<Buffer>} Compressed data
 */
export async function storeCompressed(data) {
  return await compressData(data);
}

/**
 * Retrieve and decompress data from database
 * @param {Buffer} compressedData - Compressed data from database
 * @returns {Promise<object>} Decompressed data
 */
export async function retrieveCompressed(compressedData) {
  if (!compressedData) return null;
  return await decompressData(compressedData);
}
