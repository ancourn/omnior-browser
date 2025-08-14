/**
 * Test utility for verifying export/import data integrity
 * This utility tests the Phase 1.2 encrypted cloud backup preparation functionality
 */

import { SecureStorage } from '@/storage/SecureStorage';
import { CloudSyncManager } from '@/cloud/CloudSyncManager';
import { CryptoUtils } from '@/auth/CryptoUtils';

export interface TestData {
  id: string;
  content: any;
  category: string;
}

export class BackupRestoreTest {
  private testStorage: SecureStorage;
  private cloudSyncManager: CloudSyncManager;
  private testData: TestData[] = [];

  constructor() {
    // Create test storage with a mock encryption key
    const mockEncryptionKey = this.createMockEncryptionKey();
    this.testStorage = new SecureStorage('test-profile', mockEncryptionKey);
    this.cloudSyncManager = new CloudSyncManager(this.testStorage);
  }

  /**
   * Create a mock encryption key for testing
   */
  private async createMockEncryptionKey(): Promise<CryptoKey> {
    const testPassword = 'test-password-123';
    const testSalt = CryptoUtils.generateSalt();
    return CryptoUtils.deriveKey(testPassword, testSalt);
  }

  /**
   * Initialize test data
   */
  async initializeTestData(): Promise<void> {
    await this.testStorage.initialize();

    // Create test data for different categories
    this.testData = [
      {
        id: 'bookmark_1',
        content: {
          title: 'Test Bookmark',
          url: 'https://example.com',
          folder: 'Test Folder',
          tags: ['test', 'example']
        },
        category: 'bookmarks'
      },
      {
        id: 'bookmark_2',
        content: {
          title: 'Another Bookmark',
          url: 'https://test.com',
          folder: 'Test Folder',
          tags: ['test']
        },
        category: 'bookmarks'
      },
      {
        id: 'setting_1',
        content: {
          theme: 'dark',
          language: 'en-US',
          homepage: 'https://omnior.com',
          autoLock: 30
        },
        category: 'settings'
      },
      {
        id: 'extension_1',
        content: {
          name: 'Test Extension',
          version: '1.0.0',
          enabled: true,
          permissions: ['storage', 'tabs']
        },
        category: 'extensions'
      },
      {
        id: 'session_1',
        content: {
          name: 'Work Session',
          tabs: [
            { url: 'https://github.com', title: 'GitHub' },
            { url: 'https://stackoverflow.com', title: 'Stack Overflow' }
          ],
          timestamp: Date.now()
        },
        category: 'sessions'
      },
      {
        id: 'history_1',
        content: {
          url: 'https://example.com',
          title: 'Example Domain',
          visitTime: Date.now(),
          visitCount: 3
        },
        category: 'history'
      }
    ];

    // Store test data
    for (const item of this.testData) {
      await this.testStorage.store(item.id, item.content, {
        category: item.category,
        test: true
      });
    }
  }

  /**
   * Test full export/import cycle
   */
  async testFullExportImport(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      const testPassword = 'test-backup-password';
      const cloudSalt = CryptoUtils.generateSalt();

      // Export all data
      const encryptedBackup = await this.cloudSyncManager.exportBackup(testPassword);
      
      // Validate backup metadata
      const metadata = this.cloudSyncManager.validateBackupMetadata(encryptedBackup);
      if (!metadata) {
        return {
          success: false,
          message: 'Failed to validate backup metadata'
        };
      }

      // Clear storage to simulate fresh import
      await this.testStorage.clear();

      // Import the backup
      await this.cloudSyncManager.importBackup(encryptedBackup, testPassword);

      // Verify all data was restored
      const verificationResult = await this.verifyDataIntegrity();
      
      if (!verificationResult.success) {
        return verificationResult;
      }

      return {
        success: true,
        message: 'Full export/import cycle completed successfully',
        details: {
          backupMetadata: metadata,
          verification: verificationResult.details
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Test failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Test category-specific export/import
   */
  async testCategoryExportImport(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      const testPassword = 'test-category-password';
      const cloudSalt = CryptoUtils.generateSalt();
      const categories = ['bookmarks', 'settings'];

      // Export specific categories
      const encryptedBackup = await this.cloudSyncManager.exportBackup(testPassword, {
        categories
      });

      // Validate backup metadata
      const metadata = this.cloudSyncManager.validateBackupMetadata(encryptedBackup);
      if (!metadata) {
        return {
          success: false,
          message: 'Failed to validate category backup metadata'
        };
      }

      // Verify backup is marked as partial
      if (!metadata.partial || !metadata.includedCategories) {
        return {
          success: false,
          message: 'Category backup not properly marked as partial'
        };
      }

      // Clear storage
      await this.testStorage.clear();

      // Import the backup
      await this.cloudSyncManager.importBackup(encryptedBackup, testPassword);

      // Verify only specified categories were restored
      const verificationResult = await this.verifyDataIntegrity(categories);
      
      if (!verificationResult.success) {
        return verificationResult;
      }

      return {
        success: true,
        message: 'Category export/import cycle completed successfully',
        details: {
          backupMetadata: metadata,
          verification: verificationResult.details
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Category test failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Test data integrity verification
   */
  async verifyDataIntegrity(expectedCategories?: string[]): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      const allIds = await this.testStorage.listIds();
      const verificationResults: any[] = [];

      for (const testItem of this.testData) {
        // Skip if category filtering is enabled and this item's category is not expected
        if (expectedCategories && !expectedCategories.includes(testItem.category)) {
          continue;
        }

        const restoredData = await this.testStorage.retrieve(testItem.id);
        
        if (!restoredData) {
          verificationResults.push({
            id: testItem.id,
            success: false,
            message: 'Data not found'
          });
          continue;
        }

        // Compare restored data with original
        const isEqual = this.deepEqual(restoredData, testItem.content);
        
        verificationResults.push({
          id: testItem.id,
          success: isEqual,
          message: isEqual ? 'Data matches' : 'Data mismatch',
          expected: testItem.content,
          actual: restoredData
        });
      }

      const failedVerifications = verificationResults.filter(r => !r.success);
      
      if (failedVerifications.length > 0) {
        return {
          success: false,
          message: `${failedVerifications.length} data integrity checks failed`,
          details: {
            failed: failedVerifications,
            total: verificationResults.length
          }
        };
      }

      return {
        success: true,
        message: 'All data integrity checks passed',
        details: {
          verified: verificationResults.length,
          total: this.testData.length
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Verification failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Test backup version compatibility
   */
  async testVersionCompatibility(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      const testPassword = 'test-version-password';
      const cloudSalt = CryptoUtils.generateSalt();

      // Export backup
      const encryptedBackup = await this.cloudSyncManager.exportBackup(testPassword);
      const metadata = this.cloudSyncManager.validateBackupMetadata(encryptedBackup);

      if (!metadata) {
        return {
          success: false,
          message: 'Failed to validate backup metadata'
        };
      }

      // Test version compatibility check
      const isCompatible = this.cloudSyncManager.isBackupCompatible(metadata);
      
      // Test with different version
      const modifiedMetadata = { ...metadata, dataVersion: '2.0.0' };
      const isCompatibleModified = this.cloudSyncManager.isBackupCompatible(modifiedMetadata);

      return {
        success: true,
        message: 'Version compatibility test completed',
        details: {
          currentVersionCompatible: isCompatible,
          differentVersionCompatible: isCompatibleModified,
          currentVersion: metadata.dataVersion,
          testedVersion: modifiedMetadata.dataVersion
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Version compatibility test failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Test backup filename generation
   */
  async testFilenameGeneration(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      const testMetadata = {
        profileId: 'test-profile-123',
        timestamp: 1640995200000, // 2022-01-01 00:00:00 UTC
        dataVersion: '1.0.0',
        categories: {
          bookmarks: 2,
          settings: 1
        },
        partial: false
      };

      const filename = this.cloudSyncManager.generateBackupFilename(testMetadata);
      
      // Expected format: omnior_backup_test-profile-123_2022-01-01_00-00-00.omnibackup
      const expectedPattern = /^omnior_backup_test-profile-123_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.omnibackup$/;
      
      const isValid = expectedPattern.test(filename);

      // Test partial backup filename
      const partialMetadata = {
        ...testMetadata,
        partial: true,
        includedCategories: ['bookmarks', 'settings']
      };

      const partialFilename = this.cloudSyncManager.generateBackupFilename(partialMetadata);
      const partialExpectedPattern = /^omnior_backup_test-profile-123_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}_partial_bookmarks-settings\.omnibackup$/;
      const isPartialValid = partialExpectedPattern.test(partialFilename);

      return {
        success: isValid && isPartialValid,
        message: 'Filename generation test completed',
        details: {
          fullBackup: {
            filename,
            isValid
          },
          partialBackup: {
            filename: partialFilename,
            isValid: isPartialValid
          }
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Filename generation test failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Test error handling
   */
  async testErrorHandling(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      const errorTests: any[] = [];

      // Test export with wrong password
      try {
        await this.cloudSyncManager.exportBackup('wrong-password');
        errorTests.push({
          test: 'Export with wrong password',
          success: false,
          message: 'Should have thrown an error'
        });
      } catch (error) {
        errorTests.push({
          test: 'Export with wrong password',
          success: true,
          message: 'Correctly threw error'
        });
      }

      // Test import with invalid backup
      try {
        await this.cloudSyncManager.importBackup('invalid-backup-data', 'any-password');
        errorTests.push({
          test: 'Import invalid backup',
          success: false,
          message: 'Should have thrown an error'
        });
      } catch (error) {
        errorTests.push({
          test: 'Import invalid backup',
          success: true,
          message: 'Correctly threw error'
        });
      }

      // Test metadata validation with invalid data
      const validationResult = this.cloudSyncManager.validateBackupMetadata('invalid-json');
      errorTests.push({
        test: 'Metadata validation with invalid data',
        success: validationResult === null,
        message: validationResult === null ? 'Correctly returned null' : 'Should return null'
      });

      const failedTests = errorTests.filter(t => !t.success);
      
      return {
        success: failedTests.length === 0,
        message: failedTests.length === 0 ? 'All error handling tests passed' : `${failedTests.length} error handling tests failed`,
        details: {
          tests: errorTests,
          failed: failedTests.length
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Error handling test failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<{
    success: boolean;
    message: string;
    results: any[];
  }> {
    try {
      console.log('Starting Phase 1.2 backup/restore tests...');
      
      // Initialize test data
      await this.initializeTestData();
      
      const testResults = [];
      
      // Run all tests
      const tests = [
        { name: 'Full Export/Import', fn: () => this.testFullExportImport() },
        { name: 'Category Export/Import', fn: () => this.testCategoryExportImport() },
        { name: 'Version Compatibility', fn: () => this.testVersionCompatibility() },
        { name: 'Filename Generation', fn: () => this.testFilenameGeneration() },
        { name: 'Error Handling', fn: () => this.testErrorHandling() }
      ];

      for (const test of tests) {
        console.log(`Running ${test.name} test...`);
        const result = await test.fn();
        testResults.push({
          name: test.name,
          ...result
        });
        console.log(`${test.name}: ${result.success ? 'PASS' : 'FAIL'} - ${result.message}`);
      }

      const passedTests = testResults.filter(r => r.success);
      const failedTests = testResults.filter(r => !r.success);

      const overallSuccess = failedTests.length === 0;
      const message = overallSuccess 
        ? `All ${passedTests.length} tests passed!`
        : `${passedTests.length} passed, ${failedTests.length} failed`;

      console.log(`\nTest Summary: ${message}`);

      return {
        success: overallSuccess,
        message,
        results: testResults
      };

    } catch (error) {
      return {
        success: false,
        message: `Test suite failed: ${(error as Error).message}`,
        results: []
      };
    }
  }

  /**
   * Deep equality check for objects
   */
  private deepEqual(obj1: any, obj2: any): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  /**
   * Clean up test data
   */
  async cleanup(): Promise<void> {
    try {
      await this.testStorage.clear();
      await this.testStorage.deleteDatabase();
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
}

// Export a function to run tests from console
export async function runBackupRestoreTests(): Promise<void> {
  const test = new BackupRestoreTest();
  
  try {
    const results = await test.runAllTests();
    console.log('\n=== Test Results ===');
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Test execution failed:', error);
  } finally {
    await test.cleanup();
  }
}