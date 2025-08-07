import { app, session, ipcMain } from 'electron';
import { join } from 'path';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

export interface PrivacyConfig {
  blockTrackers: boolean;
  blockAds: boolean;
  blockCookies: boolean;
  enableDoNotTrack: boolean;
  enableHTTPSOnly: boolean;
  blockWebRTC: boolean;
  blockLocation: boolean;
  blockCamera: boolean;
  blockMicrophone: boolean;
  blockNotifications: boolean;
  clearOnExit: boolean;
  enablePrivateSearch: boolean;
  fingerprintProtection: boolean;
  safeBrowsing: boolean;
}

export interface TrackingRule {
  id: string;
  name: string;
  description: string;
  category: 'tracker' | 'ad' | 'malware' | 'social' | 'analytics';
  pattern: string;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high';
}

export interface PrivacyStats {
  trackersBlocked: number;
  adsBlocked: number;
  cookiesBlocked: number;
  fingerprintingAttempts: number;
  httpsUpgrades: number;
  dataSaved: number;
  scanTime: number;
}

export class PrivacyManager {
  private config: PrivacyConfig;
  private trackingRules: Map<string, TrackingRule> = new Map();
  private stats: PrivacyStats;
  private userDataPath: string;
  private privacyLogPath: string;

  constructor(userDataPath: string) {
    this.userDataPath = userDataPath;
    this.privacyLogPath = join(userDataPath, 'privacy-logs');
    
    this.config = {
      blockTrackers: true,
      blockAds: true,
      blockCookies: false,
      enableDoNotTrack: true,
      enableHTTPSOnly: false,
      blockWebRTC: false,
      blockLocation: true,
      blockCamera: true,
      blockMicrophone: true,
      blockNotifications: true,
      clearOnExit: false,
      enablePrivateSearch: false,
      fingerprintProtection: true,
      safeBrowsing: true
    };

    this.stats = {
      trackersBlocked: 0,
      adsBlocked: 0,
      cookiesBlocked: 0,
      fingerprintingAttempts: 0,
      httpsUpgrades: 0,
      dataSaved: 0,
      scanTime: 0
    };

    this.initialize();
  }

  private async initialize() {
    try {
      await this.ensurePrivacyDirectory();
      await this.loadConfig();
      await this.loadTrackingRules();
      await this.loadStats();
      this.setupPrivacyProtection();
      this.setupIPCHandlers();
    } catch (error) {
      console.error('Failed to initialize Privacy Manager:', error);
    }
  }

  private async ensurePrivacyDirectory() {
    try {
      await fs.mkdir(this.privacyLogPath, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  private async loadConfig() {
    try {
      const configPath = join(this.userDataPath, 'privacy-config.json');
      if (existsSync(configPath)) {
        const data = await fs.readFile(configPath, 'utf-8');
        const saved = JSON.parse(data);
        this.config = { ...this.config, ...saved };
      }
    } catch (error) {
      console.error('Failed to load privacy config:', error);
    }
  }

  private async saveConfig() {
    try {
      const configPath = join(this.userDataPath, 'privacy-config.json');
      await fs.writeFile(configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Failed to save privacy config:', error);
    }
  }

  private async loadTrackingRules() {
    try {
      // Load built-in tracking rules
      const builtinRules: TrackingRule[] = [
        // Social Media Trackers
        {
          id: 'facebook-track',
          name: 'Facebook Tracking',
          description: 'Blocks Facebook tracking scripts and pixels',
          category: 'social',
          pattern: '*facebook.com/tr*',
          enabled: true,
          severity: 'high'
        },
        {
          id: 'twitter-track',
          name: 'Twitter Tracking',
          description: 'Blocks Twitter tracking scripts',
          category: 'social',
          pattern: '*twitter.com/i/jot*',
          enabled: true,
          severity: 'medium'
        },
        {
          id: 'linkedin-track',
          name: 'LinkedIn Tracking',
          description: 'Blocks LinkedIn insight tags',
          category: 'social',
          pattern: '*linkedin.com/li/track*',
          enabled: true,
          severity: 'medium'
        },

        // Analytics Trackers
        {
          id: 'google-analytics',
          name: 'Google Analytics',
          description: 'Blocks Google Analytics tracking',
          category: 'analytics',
          pattern: '*google-analytics.com/*',
          enabled: true,
          severity: 'medium'
        },
        {
          id: 'mixpanel',
          name: 'Mixpanel',
          description: 'Blocks Mixpanel analytics',
          category: 'analytics',
          pattern: '*mixpanel.com/*',
          enabled: true,
          severity: 'medium'
        },
        {
          id: 'hotjar',
          name: 'Hotjar',
          description: 'Blocks Hotjar heatmaps and analytics',
          category: 'analytics',
          pattern: '*hotjar.com/*',
          enabled: true,
          severity: 'medium'
        },

        // Ad Networks
        {
          id: 'google-ads',
          name: 'Google Ads',
          description: 'Blocks Google ad networks',
          category: 'ad',
          pattern: '*doubleclick.net/*',
          enabled: true,
          severity: 'low'
        },
        {
          id: 'facebook-ads',
          name: 'Facebook Ads',
          description: 'Blocks Facebook ad networks',
          category: 'ad',
          pattern: '*facebook.com/tr/*',
          enabled: true,
          severity: 'low'
        },
        {
          id: 'amazon-ads',
          name: 'Amazon Ads',
          description: 'Blocks Amazon advertising',
          category: 'ad',
          pattern: '*amazon-adsystem.com/*',
          enabled: true,
          severity: 'low'
        },

        // Known Trackers
        {
          id: 'cloudflare',
          name: 'Cloudflare Analytics',
          description: 'Blocks Cloudflare analytics',
          category: 'tracker',
          pattern: '*cloudflareinsights.com/*',
          enabled: true,
          severity: 'low'
        },
        {
          id: 'segment',
          name: 'Segment.io',
          description: 'Blocks Segment customer data platform',
          category: 'tracker',
          pattern: '*segment.io/*',
          enabled: true,
          severity: 'medium'
        }
      ];

      // Register all built-in rules
      for (const rule of builtinRules) {
        this.trackingRules.set(rule.id, rule);
      }

      // Load custom rules if they exist
      const customRulesPath = join(this.userDataPath, 'custom-tracking-rules.json');
      if (existsSync(customRulesPath)) {
        const data = await fs.readFile(customRulesPath, 'utf-8');
        const customRules = JSON.parse(data);
        
        if (Array.isArray(customRules)) {
          for (const rule of customRules) {
            this.trackingRules.set(rule.id, rule);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load tracking rules:', error);
    }
  }

  private async saveTrackingRules() {
    try {
      const customRulesPath = join(this.userDataPath, 'custom-tracking-rules.json');
      const customRules = Array.from(this.trackingRules.values())
        .filter(rule => !rule.id.startsWith('facebook-') && 
                       !rule.id.startsWith('twitter-') && 
                       !rule.id.startsWith('linkedin-') &&
                       !rule.id.startsWith('google-') &&
                       !rule.id.startsWith('mixpanel-') &&
                       !rule.id.startsWith('hotjar-') &&
                       !rule.id.startsWith('amazon-') &&
                       !rule.id.startsWith('cloudflare-') &&
                       !rule.id.startsWith('segment-'));
      
      await fs.writeFile(customRulesPath, JSON.stringify(customRules, null, 2));
    } catch (error) {
      console.error('Failed to save tracking rules:', error);
    }
  }

  private async loadStats() {
    try {
      const statsPath = join(this.userDataPath, 'privacy-stats.json');
      if (existsSync(statsPath)) {
        const data = await fs.readFile(statsPath, 'utf-8');
        this.stats = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load privacy stats:', error);
    }
  }

  private async saveStats() {
    try {
      const statsPath = join(this.userDataPath, 'privacy-stats.json');
      await fs.writeFile(statsPath, JSON.stringify(this.stats, null, 2));
    } catch (error) {
      console.error('Failed to save privacy stats:', error);
    }
  }

  private setupPrivacyProtection() {
    const defaultSession = session.defaultSession;

    // Set Do Not Track
    if (this.config.enableDoNotTrack) {
      defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        const requestHeaders = details.requestHeaders || {};
        requestHeaders['DNT'] = '1';
        callback({ requestHeaders });
      });
    }

    // Block trackers and ads
    if (this.config.blockTrackers || this.config.blockAds) {
      defaultSession.webRequest.onBeforeRequest(
        { urls: ['<all_urls>'] },
        (details, callback) => {
          const url = details.url.toLowerCase();
          
          for (const rule of this.trackingRules.values()) {
            if (!rule.enabled) continue;
            
            // Check if rule should apply based on category
            if (this.config.blockTrackers && 
                (rule.category === 'tracker' || rule.category === 'analytics' || rule.category === 'social')) {
              if (this.matchesPattern(url, rule.pattern)) {
                this.stats.trackersBlocked++;
                this.logPrivacyEvent('tracker_blocked', { url, rule: rule.name });
                callback({ cancel: true });
                return;
              }
            }
            
            if (this.config.blockAds && rule.category === 'ad') {
              if (this.matchesPattern(url, rule.pattern)) {
                this.stats.adsBlocked++;
                this.stats.dataSaved += Math.random() * 100; // Estimate data saved
                this.logPrivacyEvent('ad_blocked', { url, rule: rule.name });
                callback({ cancel: true });
                return;
              }
            }
          }
          
          callback({});
        }
      );
    }

    // HTTPS Only mode
    if (this.config.enableHTTPSOnly) {
      defaultSession.webRequest.onBeforeRequest(
        { urls: ['http://*/*'] },
        (details, callback) => {
          const httpsUrl = details.url.replace('http://', 'https://');
          this.stats.httpsUpgrades++;
          this.logPrivacyEvent('https_upgrade', { from: details.url, to: httpsUrl });
          callback({ redirectURL: httpsUrl });
        }
      );
    }

    // Cookie blocking
    if (this.config.blockCookies) {
      defaultSession.webRequest.onHeadersReceived(
        { urls: ['<all_urls>'] },
        (details, callback) => {
          const responseHeaders = details.responseHeaders || {};
          
          if (responseHeaders['set-cookie']) {
            this.stats.cookiesBlocked++;
            this.logPrivacyEvent('cookie_blocked', { url: details.url });
            delete responseHeaders['set-cookie'];
          }
          
          callback({ responseHeaders });
        }
      );
    }

    // Fingerprinting protection
    if (this.config.fingerprintProtection) {
      defaultSession.webRequest.onHeadersReceived(
        { urls: ['<all_urls>'] },
        (details, callback) => {
          const responseHeaders = details.responseHeaders || {};
          
          // Block common fingerprinting scripts
          const fingerprintingPatterns = [
            'fingerprint',
            'fingerprintjs',
            'canvasfingerprint',
            'evercookie',
            'fingerprint2'
          ];
          
          const contentLength = responseHeaders['content-length'];
          if (contentLength && parseInt(contentLength[0]) < 50000) { // Only check small responses
            // This would require actual content inspection in a real implementation
            // For now, we'll just block known fingerprinting domains
            const url = details.url.toLowerCase();
            if (fingerprintingPatterns.some(pattern => url.includes(pattern))) {
              this.stats.fingerprintingAttempts++;
              this.logPrivacyEvent('fingerprint_blocked', { url: details.url });
              callback({ cancel: true });
              return;
            }
          }
          
          callback({ responseHeaders });
        }
      );
    }

    // Permission blocking
    if (this.config.blockLocation) {
      defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        if (permission === 'geolocation') {
          this.logPrivacyEvent('permission_blocked', { permission: 'geolocation' });
          callback(false);
        } else {
          callback(true);
        }
      });
    }

    if (this.config.blockCamera) {
      defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        if (permission === 'media') {
          this.logPrivacyEvent('permission_blocked', { permission: 'camera' });
          callback(false);
        } else {
          callback(true);
        }
      });
    }

    if (this.config.blockMicrophone) {
      defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        if (permission === 'media') {
          this.logPrivacyEvent('permission_blocked', { permission: 'microphone' });
          callback(false);
        } else {
          callback(true);
        }
      });
    }

    if (this.config.blockNotifications) {
      defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        if (permission === 'notifications') {
          this.logPrivacyEvent('permission_blocked', { permission: 'notifications' });
          callback(false);
        } else {
          callback(true);
        }
      });
    }

    // WebRTC blocking
    if (this.config.blockWebRTC) {
      // This would require more complex WebRTC handling in a real implementation
      // For now, we'll just log the intention
      console.log('WebRTC blocking enabled (implementation would require WebRTC policy modifications)');
    }
  }

  private matchesPattern(url: string, pattern: string): boolean {
    // Simple pattern matching - in a real implementation, use more sophisticated matching
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(url);
  }

  private async logPrivacyEvent(event: string, data: any) {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = { timestamp, event, data };
      
      const logFile = join(this.privacyLogPath, `${new Date().toDateString().replace(/\s/g, '-')}.json`);
      
      let logs: any[] = [];
      if (existsSync(logFile)) {
        const existingData = await fs.readFile(logFile, 'utf-8');
        logs = JSON.parse(existingData);
      }
      
      logs.push(logEntry);
      
      // Keep only last 1000 entries per day
      if (logs.length > 1000) {
        logs = logs.slice(-1000);
      }
      
      await fs.writeFile(logFile, JSON.stringify(logs, null, 2));
    } catch (error) {
      console.error('Failed to log privacy event:', error);
    }
  }

  private setupIPCHandlers() {
    // Configuration
    ipcMain.handle('privacy-get-config', async () => {
      return this.config;
    });

    ipcMain.handle('privacy-update-config', async (event, newConfig: Partial<PrivacyConfig>) => {
      this.config = { ...this.config, ...newConfig };
      await this.saveConfig();
      this.setupPrivacyProtection(); // Reapply protection with new config
      return this.config;
    });

    // Tracking rules
    ipcMain.handle('privacy-get-rules', async () => {
      return Array.from(this.trackingRules.values());
    });

    ipcMain.handle('privacy-get-rule', async (event, ruleId: string) => {
      return this.trackingRules.get(ruleId) || null;
    });

    ipcMain.handle('privacy-toggle-rule', async (event, ruleId: string) => {
      const rule = this.trackingRules.get(ruleId);
      if (rule) {
        rule.enabled = !rule.enabled;
        await this.saveTrackingRules();
        this.setupPrivacyProtection();
        return rule.enabled;
      }
      return false;
    });

    ipcMain.handle('privacy-add-rule', async (event, rule: Omit<TrackingRule, 'id'>) => {
      const newRule: TrackingRule = {
        ...rule,
        id: uuidv4()
      };
      this.trackingRules.set(newRule.id, newRule);
      await this.saveTrackingRules();
      this.setupPrivacyProtection();
      return newRule;
    });

    ipcMain.handle('privacy-remove-rule', async (event, ruleId: string) => {
      const deleted = this.trackingRules.delete(ruleId);
      if (deleted) {
        await this.saveTrackingRules();
        this.setupPrivacyProtection();
      }
      return deleted;
    });

    // Statistics
    ipcMain.handle('privacy-get-stats', async () => {
      return this.stats;
    });

    ipcMain.handle('privacy-reset-stats', async () => {
      this.stats = {
        trackersBlocked: 0,
        adsBlocked: 0,
        cookiesBlocked: 0,
        fingerprintingAttempts: 0,
        httpsUpgrades: 0,
        dataSaved: 0,
        scanTime: 0
      };
      await this.saveStats();
      return this.stats;
    });

    // Privacy logs
    ipcMain.handle('privacy-get-logs', async (event, date?: string, limit?: number) => {
      try {
        const logFile = join(this.privacyLogPath, `${date || new Date().toDateString().replace(/\s/g, '-')}.json`);
        
        if (existsSync(logFile)) {
          const data = await fs.readFile(logFile, 'utf-8');
          let logs = JSON.parse(data);
          
          if (limit) {
            logs = logs.slice(-limit);
          }
          
          return logs;
        }
        
        return [];
      } catch (error) {
        console.error('Failed to get privacy logs:', error);
        return [];
      }
    });

    ipcMain.handle('privacy-clear-logs', async () => {
      try {
        const files = await fs.readdir(this.privacyLogPath);
        for (const file of files) {
          await fs.unlink(join(this.privacyLogPath, file));
        }
        return true;
      } catch (error) {
        console.error('Failed to clear privacy logs:', error);
        return false;
      }
    });

    // Privacy actions
    ipcMain.handle('privacy-clear-browsing-data', async (event, options: {
      cookies?: boolean;
      cache?: boolean;
      history?: boolean;
      localStorage?: boolean;
      sessionStorage?: boolean;
      indexedDB?: boolean;
      webSQL?: boolean;
      serviceWorkers?: boolean;
    }) => {
      try {
        const defaultSession = session.defaultSession;
        
        if (options.cookies) {
          await defaultSession.clearStorageData({ storages: ['cookies'] });
        }
        
        if (options.cache) {
          await defaultSession.clearCache();
        }
        
        if (options.localStorage || options.sessionStorage || options.indexedDB || options.webSQL) {
          await defaultSession.clearStorageData({
            storages: ['localstorage', 'indexdb', 'websql', 'serviceworkers']
          });
        }
        
        if (options.serviceWorkers) {
          await defaultSession.clearStorageData({ storages: ['serviceworkers'] });
        }
        
        this.logPrivacyEvent('browsing_data_cleared', options);
        return true;
      } catch (error) {
        console.error('Failed to clear browsing data:', error);
        return false;
      }
    });

    ipcMain.handle('privacy-scan-page', async (event, url: string) => {
      return await this.scanPageForPrivacyIssues(url);
    });
  }

  public async scanPageForPrivacyIssues(url: string): Promise<{
    issues: Array<{
      type: 'tracker' | 'cookie' | 'fingerprint' | 'permission' | 'https';
      severity: 'low' | 'medium' | 'high';
      description: string;
      recommendation: string;
    }>;
    scanTime: number;
  }> {
    const startTime = Date.now();
    const issues: Array<{
      type: 'tracker' | 'cookie' | 'fingerprint' | 'permission' | 'https';
      severity: 'low' | 'medium' | 'high';
      description: string;
      recommendation: string;
    }> = [];

    try {
      // Check for known tracking domains
      const trackingDomains = Array.from(this.trackingRules.values())
        .filter(rule => rule.enabled)
        .map(rule => rule.pattern.replace('*.', '').replace('/*', ''));

      // Simulate page analysis (in a real implementation, this would involve actual page content analysis)
      const pageContent = await this.fetchPageContent(url);
      
      // Check for tracking scripts
      for (const domain of trackingDomains) {
        if (pageContent.toLowerCase().includes(domain)) {
          issues.push({
            type: 'tracker',
            severity: 'medium',
            description: `Tracking scripts from ${domain} detected`,
            recommendation: 'Consider blocking this tracker in privacy settings'
          });
        }
      }

      // Check for cookie usage
      if (pageContent.toLowerCase().includes('cookie') || pageContent.toLowerCase().includes('setcookie')) {
        issues.push({
          type: 'cookie',
          severity: 'low',
          description: 'Cookies are being used on this page',
          recommendation: 'Review cookie settings or enable cookie blocking'
        });
      }

      // Check for HTTP resources
      if (pageContent.includes('http://') && !url.startsWith('https://')) {
        issues.push({
          type: 'https',
          severity: 'medium',
          description: 'Page contains HTTP resources (mixed content)',
          recommendation: 'Enable HTTPS-only mode for better security'
        });
      }

      // Check for common fingerprinting patterns
      const fingerprintingPatterns = [
        'canvas.getcontext',
        'webgl',
        'webrtc',
        'clientrects',
        'timezoneoffset'
      ];

      for (const pattern of fingerprintingPatterns) {
        if (pageContent.toLowerCase().includes(pattern)) {
          issues.push({
            type: 'fingerprint',
            severity: 'high',
            description: `Potential fingerprinting code detected (${pattern})`,
            recommendation: 'Enable fingerprinting protection in privacy settings'
          });
        }
      }
    } catch (error) {
      console.error('Failed to scan page for privacy issues:', error);
    }

    const scanTime = Date.now() - startTime;
    this.stats.scanTime += scanTime;
    await this.saveStats();

    return { issues, scanTime };
  }

  private async fetchPageContent(url: string): Promise<string> {
    // Mock implementation - in a real browser, this would use the actual webContents
    return `<!DOCTYPE html>
<html>
<head><title>Mock Page Content</title></head>
<body>
<script src="https://google-analytics.com/analytics.js"></script>
<script src="https://facebook.com/tracking.js"></script>
<script>
  // Mock canvas fingerprinting
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
</script>
</body>
</html>`;
  }

  public getConfig(): PrivacyConfig {
    return this.config;
  }

  public async updateConfig(newConfig: Partial<PrivacyConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await this.saveConfig();
    this.setupPrivacyProtection();
  }

  public getStats(): PrivacyStats {
    return this.stats;
  }

  public async resetStats(): Promise<void> {
    this.stats = {
      trackersBlocked: 0,
      adsBlocked: 0,
      cookiesBlocked: 0,
      fingerprintingAttempts: 0,
      httpsUpgrades: 0,
      dataSaved: 0,
      scanTime: 0
    };
    await this.saveStats();
  }

  public getTrackingRules(): TrackingRule[] {
    return Array.from(this.trackingRules.values());
  }

  public async addTrackingRule(rule: Omit<TrackingRule, 'id'>): Promise<TrackingRule> {
    const newRule: TrackingRule = {
      ...rule,
      id: uuidv4()
    };
    this.trackingRules.set(newRule.id, newRule);
    await this.saveTrackingRules();
    this.setupPrivacyProtection();
    return newRule;
  }

  public async removeTrackingRule(ruleId: string): Promise<boolean> {
    const deleted = this.trackingRules.delete(ruleId);
    if (deleted) {
      await this.saveTrackingRules();
      this.setupPrivacyProtection();
    }
    return deleted;
  }

  public async toggleTrackingRule(ruleId: string): Promise<boolean> {
    const rule = this.trackingRules.get(ruleId);
    if (rule) {
      rule.enabled = !rule.enabled;
      await this.saveTrackingRules();
      this.setupPrivacyProtection();
      return true;
    }
    return false;
  }

  public async clearBrowsingData(options: {
    cookies?: boolean;
    cache?: boolean;
    history?: boolean;
    localStorage?: boolean;
    sessionStorage?: boolean;
    indexedDB?: boolean;
  }): Promise<boolean> {
    try {
      const defaultSession = session.defaultSession;
      
      if (options.cookies) {
        await defaultSession.clearStorageData({ storages: ['cookies'] });
      }
      
      if (options.cache) {
        await defaultSession.clearCache();
      }
      
      if (options.localStorage || options.sessionStorage || options.indexedDB) {
        await defaultSession.clearStorageData({
          storages: ['localstorage', 'indexdb']
        });
      }
      
      this.logPrivacyEvent('browsing_data_cleared', options);
      return true;
    } catch (error) {
      console.error('Failed to clear browsing data:', error);
      return false;
    }
  }
}