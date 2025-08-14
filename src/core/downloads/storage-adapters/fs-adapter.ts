import { StorageAdapter } from '../models';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { createCipheriv, createDecipheriv } from 'crypto';

export class FileSystemStorageAdapter implements StorageAdapter {
  private algorithm = 'aes-256-gcm';
  private keyLength = 32; // 256 bits
  private ivLength = 16; // 128 bits

  async writeChunk(downloadId: string, chunkId: string, data: Buffer): Promise<void> {
    const chunkPath = this.getChunkPath(downloadId, chunkId);
    const chunkDir = path.dirname(chunkPath);
    
    // Ensure directory exists
    await fs.mkdir(chunkDir, { recursive: true });
    
    // Write chunk data
    await fs.writeFile(chunkPath, data);
  }

  async readChunk(downloadId: string, chunkId: string): Promise<Buffer> {
    const chunkPath = this.getChunkPath(downloadId, chunkId);
    return await fs.readFile(chunkPath);
  }

  async mergeChunks(downloadId: string, destPath: string, encrypt: boolean = false): Promise<void> {
    const tempDir = this.getTempPath(downloadId);
    const chunks = await this.getChunkList(downloadId);
    
    // Sort chunks by their ID to ensure proper order
    chunks.sort();
    
    // Create destination directory
    const destDir = path.dirname(destPath);
    await fs.mkdir(destDir, { recursive: true });
    
    if (encrypt) {
      await this.mergeAndEncrypt(chunks, destPath, tempDir);
    } else {
      await this.mergePlain(chunks, destPath, tempDir);
    }
    
    // Clean up temp files
    await this.cleanupTempFiles(downloadId);
  }

  async cleanupTempFiles(downloadId: string): Promise<void> {
    const tempDir = this.getTempPath(downloadId);
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error(`Failed to cleanup temp files for ${downloadId}:`, error);
    }
  }

  getTempPath(downloadId: string): string {
    return path.join('./downloads', 'tmp', downloadId);
  }

  private getChunkPath(downloadId: string, chunkId: string): string {
    return path.join(this.getTempPath(downloadId), `${chunkId}.part`);
  }

  private async getChunkList(downloadId: string): Promise<string[]> {
    const tempDir = this.getTempPath(downloadId);
    try {
      const files = await fs.readdir(tempDir);
      return files.filter(file => file.endsWith('.part')).sort();
    } catch {
      return [];
    }
  }

  private async mergePlain(chunks: string[], destPath: string, tempDir: string): Promise<void> {
    const destFile = await fs.open(destPath, 'w');
    
    try {
      for (const chunkFile of chunks) {
        const chunkPath = path.join(tempDir, chunkFile);
        const chunkData = await fs.readFile(chunkPath);
        await destFile.write(chunkData);
      }
    } finally {
      await destFile.close();
    }
  }

  private async mergeAndEncrypt(chunks: string[], destPath: string, tempDir: string): Promise<void> {
    // Generate encryption key and IV
    const key = crypto.randomBytes(this.keyLength);
    const iv = crypto.randomBytes(this.ivLength);
    
    const cipher = createCipheriv(this.algorithm, key, iv);
    
    const destFile = await fs.open(destPath, 'w');
    
    try {
      // Write IV and authentication tag first
      await destFile.write(iv);
      
      for (const chunkFile of chunks) {
        const chunkPath = path.join(tempDir, chunkFile);
        const chunkData = await fs.readFile(chunkPath);
        const encryptedChunk = cipher.update(chunkData);
        await destFile.write(encryptedChunk);
      }
      
      // Finalize encryption
      const finalChunk = cipher.final();
      await destFile.write(finalChunk);
      
      // Get authentication tag
      const authTag = cipher.getAuthTag();
      await destFile.write(authTag);
      
    } finally {
      await destFile.close();
    }
    
    // Store the encryption key securely (in a real implementation, this would be stored in SecureStorage)
    await this.storeEncryptionKey(destPath, key);
  }

  private async storeEncryptionKey(filePath: string, key: Buffer): Promise<void> {
    const keyPath = `${filePath}.key`;
    await fs.writeFile(keyPath, key, { mode: 0o600 }); // Restrictive permissions
  }

  private async getEncryptionKey(filePath: string): Promise<Buffer> {
    const keyPath = `${filePath}.key`;
    return await fs.readFile(keyPath);
  }

  async decryptFile(encryptedPath: string, outputPath: string): Promise<void> {
    const key = await this.getEncryptionKey(encryptedPath);
    const encryptedData = await fs.readFile(encryptedPath);
    
    // Extract IV (first 16 bytes)
    const iv = encryptedData.subarray(0, this.ivLength);
    
    // Extract authentication tag (last 16 bytes)
    const authTag = encryptedData.subarray(encryptedData.length - 16);
    
    // Extract encrypted data (between IV and auth tag)
    const cipherText = encryptedData.subarray(this.ivLength, encryptedData.length - 16);
    
    const decipher = createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    const decrypted = Buffer.concat([
      decipher.update(cipherText),
      decipher.final()
    ]);
    
    await fs.writeFile(outputPath, decrypted);
  }

  async getFileInfo(filePath: string): Promise<{ size: number; exists: boolean; isEncrypted: boolean }> {
    try {
      const stats = await fs.stat(filePath);
      const keyExists = await fs.access(`${filePath}.key`).then(() => true).catch(() => false);
      
      return {
        size: stats.size,
        exists: true,
        isEncrypted: keyExists
      };
    } catch {
      return {
        size: 0,
        exists: false,
        isEncrypted: false
      };
    }
  }
}