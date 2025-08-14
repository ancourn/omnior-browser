export class BandwidthLimiter {
  private globalLimit: number = 0; // bytes per second, 0 = unlimited
  private perDownloadLimits = new Map<string, number>();
  private tokens = new Map<string, number>();
  private lastRefill = new Map<string, number>();
  private refillInterval: number = 100; // ms
  private intervalId: NodeJS.Timeout;

  constructor() {
    this.intervalId = setInterval(() => this.refillAll(), this.refillInterval);
  }

  async setGlobalLimit(limit: number): Promise<void> {
    this.globalLimit = Math.max(0, limit);
  }

  async setPerDownloadLimit(downloadId: string, limit: number): Promise<void> {
    this.perDownloadLimits.set(downloadId, Math.max(0, limit));
    if (!this.tokens.has(downloadId)) {
      this.tokens.set(downloadId, 0);
      this.lastRefill.set(downloadId, Date.now());
    }
  }

  async canDownload(downloadId: string, bytes: number): Promise<boolean> {
    const now = Date.now();
    const perDownloadLimit = this.perDownloadLimits.get(downloadId) || 0;
    
    // Refill tokens for this download
    this.refillTokens(downloadId, now);
    
    const availableTokens = this.tokens.get(downloadId) || 0;
    
    // Check per-download limit
    if (perDownloadLimit > 0 && availableTokens < bytes) {
      return false;
    }
    
    // Check global limit (simplified - in reality you'd need a global token pool)
    if (this.globalLimit > 0) {
      const globalAvailable = this.getGlobalAvailableTokens(now);
      if (globalAvailable < bytes) {
        return false;
      }
    }
    
    return true;
  }

  async recordDownload(downloadId: string, bytes: number): Promise<void> {
    const currentTokens = this.tokens.get(downloadId) || 0;
    const perDownloadLimit = this.perDownloadLimits.get(downloadId) || 0;
    
    if (perDownloadLimit > 0) {
      this.tokens.set(downloadId, Math.max(0, currentTokens - bytes));
    }
    
    // Record global usage (simplified)
    this.recordGlobalUsage(bytes);
  }

  private refillTokens(downloadId: string, now: number): void {
    const lastRefill = this.lastRefill.get(downloadId) || now;
    const timeDiff = now - lastRefill;
    const perDownloadLimit = this.perDownloadLimits.get(downloadId) || 0;
    
    if (perDownloadLimit > 0 && timeDiff > 0) {
      const tokensToAdd = (perDownloadLimit * timeDiff) / 1000; // Convert to bytes per interval
      const currentTokens = this.tokens.get(downloadId) || 0;
      this.tokens.set(downloadId, Math.min(perDownloadLimit, currentTokens + tokensToAdd));
    }
    
    this.lastRefill.set(downloadId, now);
  }

  private refillAll(): void {
    const now = Date.now();
    for (const downloadId of this.perDownloadLimits.keys()) {
      this.refillTokens(downloadId, now);
    }
  }

  private getGlobalAvailableTokens(now: number): number {
    // Simplified global token calculation
    // In a real implementation, you'd maintain a global token pool
    const globalTokensPerInterval = (this.globalLimit * this.refillInterval) / 1000;
    return globalTokensPerInterval;
  }

  private recordGlobalUsage(bytes: number): void {
    // Simplified global usage tracking
    // In a real implementation, you'd deduct from global token pool
  }

  async removeDownload(downloadId: string): Promise<void> {
    this.perDownloadLimits.delete(downloadId);
    this.tokens.delete(downloadId);
    this.lastRefill.delete(downloadId);
  }

  async destroy(): Promise<void> {
    clearInterval(this.intervalId);
    this.perDownloadLimits.clear();
    this.tokens.clear();
    this.lastRefill.clear();
  }
}