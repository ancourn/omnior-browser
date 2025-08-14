import crypto from 'crypto';

/**
 * AES-256-GCM Encryption Layer for Omnior Browser
 * Implements secure encryption with PBKDF2 key derivation
 */
export class EncryptionLayer {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly PBKDF2_ITERATIONS = 310000; // 310k iterations as specified
  private static readonly SALT_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;
  private static readonly KEY_LENGTH = 32; // 256 bits

  /**
   * Derive encryption key from password using PBKDF2
   */
  static deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(
      password,
      salt,
      this.PBKDF2_ITERATIONS,
      this.KEY_LENGTH,
      'sha256'
    );
  }

  /**
   * Generate a random salt for key derivation
   */
  static generateSalt(): Buffer {
    return crypto.randomBytes(this.SALT_LENGTH);
  }

  /**
   * Encrypt data using AES-256-GCM
   * Returns: salt + iv + tag + encrypted data (all concatenated)
   */
  static encrypt(data: string, password: string): string {
    const salt = this.generateSalt();
    const key = this.deriveKey(password, salt);
    const iv = crypto.randomBytes(this.IV_LENGTH);

    const cipher = crypto.createCipher(this.ALGORITHM, key);
    cipher.setAAD(Buffer.from('omnior-browser', 'utf8'));

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Combine all components: salt + iv + tag + encrypted data
    const combined = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, 'hex')
    ]);

    return combined.toString('base64');
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  static decrypt(encryptedData: string, password: string): string {
    try {
      const combined = Buffer.from(encryptedData, 'base64');
      
      // Extract components
      const salt = combined.subarray(0, this.SALT_LENGTH);
      const iv = combined.subarray(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
      const tag = combined.subarray(
        this.SALT_LENGTH + this.IV_LENGTH,
        this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH
      );
      const encrypted = combined.subarray(this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH);

      const key = this.deriveKey(password, salt);

      const decipher = crypto.createDecipher(this.ALGORITHM, key);
      decipher.setAAD(Buffer.from('omnior-browser', 'utf8'));
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed: Invalid password or corrupted data');
    }
  }

  /**
   * Hash password for storage (using PBKDF2)
   */
  static hashPassword(password: string, salt?: Buffer): { hash: string; salt: string } {
    const useSalt = salt || this.generateSalt();
    const hash = crypto.pbkdf2Sync(
      password,
      useSalt,
      this.PBKDF2_ITERATIONS,
      64, // Output length for hash
      'sha256'
    );

    return {
      hash: hash.toString('hex'),
      salt: useSalt.toString('hex')
    };
  }

  /**
   * Verify password against hash
   */
  static verifyPassword(password: string, hash: string, salt: string): boolean {
    try {
      const saltBuffer = Buffer.from(salt, 'hex');
      const { hash: computedHash } = this.hashPassword(password, saltBuffer);
      return computedHash === hash;
    } catch (error) {
      return false;
    }
  }

  /**
   * Securely wipe sensitive data from memory
   */
  static secureWipe(buffer: Buffer): void {
    if (buffer && buffer.length > 0) {
      buffer.fill(0);
    }
  }

  /**
   * Generate secure random token
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}