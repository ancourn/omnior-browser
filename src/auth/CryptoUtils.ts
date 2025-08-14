/**
 * AES-256-GCM Encryption Utilities with PBKDF2 Key Derivation
 * Provides secure encryption/decryption for user data
 */

export interface EncryptedData {
  iv: string;        // Initialization Vector (base64)
  ciphertext: string; // Encrypted data (base64)
  tag: string;      // Authentication tag (base64)
}

export class CryptoUtils {
  private static readonly PBKDF2_ITERATIONS = 310000;
  private static readonly SALT_LENGTH = 32;
  private static readonly KEY_LENGTH = 32; // 256 bits for AES-256
  private static readonly IV_LENGTH = 12;   // 96 bits for GCM

  /**
   * Derive encryption key from password using PBKDF2
   */
  static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    
    const key = await crypto.subtle.importKey(
      'raw',
      passwordData,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      key,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate a random salt for key derivation
   */
  static generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
  }

  /**
   * Generate a random IV for encryption
   */
  static generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  static async encrypt(key: CryptoKey, data: string): Promise<EncryptedData> {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);
    
    const iv = this.generateIV();
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      dataBytes
    );

    // Extract ciphertext and authentication tag
    const encryptedArray = new Uint8Array(encrypted);
    const ciphertext = encryptedArray.slice(0, encryptedArray.length - 16);
    const tag = encryptedArray.slice(encryptedArray.length - 16);

    return {
      iv: this.arrayBufferToBase64(iv),
      ciphertext: this.arrayBufferToBase64(ciphertext),
      tag: this.arrayBufferToBase64(tag)
    };
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  static async decrypt(key: CryptoKey, encryptedData: EncryptedData): Promise<string> {
    const iv = this.base64ToArrayBuffer(encryptedData.iv);
    const ciphertext = this.base64ToArrayBuffer(encryptedData.ciphertext);
    const tag = this.base64ToArrayBuffer(encryptedData.tag);

    // Combine ciphertext and tag for decryption
    const combined = new Uint8Array(ciphertext.length + tag.length);
    combined.set(ciphertext);
    combined.set(tag, ciphertext.length);

    try {
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        combined
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      throw new Error('Decryption failed: Invalid key or corrupted data');
    }
  }

  /**
   * Hash password using PBKDF2 for storage (not encryption)
   */
  static async hashPassword(password: string, salt: Uint8Array): Promise<string> {
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    
    const key = await crypto.subtle.importKey(
      'raw',
      passwordData,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      key,
      256
    );

    return this.arrayBufferToBase64(new Uint8Array(derivedBits));
  }

  /**
   * Verify password against stored hash
   */
  static async verifyPassword(password: string, salt: Uint8Array, storedHash: string): Promise<boolean> {
    const computedHash = await this.hashPassword(password, salt);
    return computedHash === storedHash;
  }

  /**
   * Securely wipe sensitive data from memory
   */
  static wipeArrayBuffer(buffer: ArrayBuffer): void {
    const view = new Uint8Array(buffer);
    for (let i = 0; i < view.length; i++) {
      view[i] = 0;
    }
  }

  /**
   * Convert ArrayBuffer to Base64 string
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }

  /**
   * Convert Base64 string to ArrayBuffer
   */
  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Generate a secure random token
   */
  static generateToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}