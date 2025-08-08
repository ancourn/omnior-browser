export interface FilterList {
  id: string;
  name: string;
  description: string;
  url: string;
  enabled: boolean;
  lastUpdated: Date;
  ruleCount: number;
  isCustom: boolean;
}

export interface BlockerRule {
  id: string;
  pattern: string;
  type: 'block' | 'allow' | 'redirect';
  domains: string[];
  resourceTypes: ('script' | 'image' | 'stylesheet' | 'font' | 'media' | 'websocket')[];
  thirdParty: boolean;
  matchCase: boolean;
  enabled: boolean;
  source: string; // filter list ID or 'custom'
}

export interface BlockerStats {
  totalBlocked: number;
  todayBlocked: number;
  byType: Record<string, number>;
  byDomain: Record<string, number>;
  lastUpdated: Date;
}

export interface SiteSettings {
  domain: string;
  enabled: boolean;
  customRules: BlockerRule[];
  whitelisted: boolean;
  trusted: boolean;
}

export interface AdBlockerStorage {
  filterLists: FilterList[];
  customRules: BlockerRule[];
  siteSettings: SiteSettings[];
  stats: BlockerStats;
  settings: {
    enabled: boolean;
    blockTrackers: boolean;
    blockAds: boolean;
    blockMalware: boolean;
    blockSocial: boolean;
    blockAnnoyances: boolean;
    autoUpdate: boolean;
    updateInterval: number; // in hours
    showBlockedCount: boolean;
    enableContextMenu: boolean;
    enableStats: boolean;
  };
}

export class AdBlockerService {
  private static STORAGE_KEY = 'omnior-adblocker';
  private static STATS_KEY = 'omnior-adblocker-stats';
  private static SETTINGS_KEY = 'omnior-adblocker-settings';
  
  // Default filter lists (uBlock Origin compatible)
  private static DEFAULT_FILTER_LISTS: Omit<FilterList, 'lastUpdated' | 'ruleCount'>[] = [
    {
      id: 'easylist',
      name: 'EasyList',
      description: 'Primary filter list for most ads',
      url: 'https://easylist.to/easylist/easylist.txt',
      enabled: true,
      isCustom: false
    },
    {
      id: 'easyprivacy',
      name: 'EasyPrivacy',
      description: 'Primary tracking protection list',
      url: 'https://easylist.to/easylist/easyprivacy.txt',
      enabled: true,
      isCustom: false
    },
    {
      id: 'malware',
      name: 'Malware Domain List',
      description: 'Block known malware domains',
      url: 'https://mirror1.malwaredomains.com/files/justdomains',
      enabled: true,
      isCustom: false
    },
    {
      id: 'social',
      name: 'Social Media Blocker',
      description: 'Block social media widgets and trackers',
      url: 'https://easylist.to/easylist/fanboy-social.txt',
      enabled: false,
      isCustom: false
    },
    {
      id: 'annoyances',
      name: 'Annoyances List',
      description: 'Block cookie notices, pop-ups, and other annoyances',
      url: 'https://easylist.to/easylist/fanboy-annoyance.txt',
      enabled: false,
      isCustom: false
    }
  ];

  // Pre-compiled common patterns for performance
  private static COMMON_PATTERNS = [
    /ads?\./i,
    /advertisement/i,
    /banner/i,
    /tracking/i,
    /analytics/i,
    /telemetry/i,
    /doubleclick/i,
    /google-analytics/i,
    /facebook/i,
    /twitter/i,
    /pixel/i,
    /beacon/i
  ];

  private settings: AdBlockerStorage['settings'];
  private filterLists: FilterList[];
  private customRules: BlockerRule[];
  private siteSettings: SiteSettings[];
  private stats: BlockerStats;
  private compiledRules: BlockerRule[] = [];
  private autoUpdateTimer: NodeJS.Timeout | null = null;

  constructor() {
    const storage = this.loadStorage();
    this.settings = storage.settings;
    this.filterLists = storage.filterLists;
    this.customRules = storage.customRules;
    this.siteSettings = storage.siteSettings;
    this.stats = storage.stats;
    
    this.compileRules();
    this.startAutoUpdate();
  }

  private loadStorage(): AdBlockerStorage {
    if (typeof window === 'undefined') {
      return this.getDefaultStorage();
    }

    try {
      const data = localStorage.getItem(AdBlockerStorage.STORAGE_KEY);
      const statsData = localStorage.getItem(AdBlockerStorage.STATS_KEY);
      const settingsData = localStorage.getItem(AdBlockerStorage.SETTINGS_KEY);

      if (data && statsData && settingsData) {
        const parsed = JSON.parse(data);
        const stats = JSON.parse(statsData);
        const settings = JSON.parse(settingsData);

        // Convert date strings back to Date objects
        const filterLists = parsed.filterLists.map((list: any) => ({
          ...list,
          lastUpdated: new Date(list.lastUpdated)
        }));

        const siteSettings = parsed.siteSettings.map((site: any) => ({
          ...site,
          customRules: site.customRules.map((rule: any) => ({
            ...rule,
            // Add any additional rule processing here
          }))
        }));

        return {
          filterLists,
          customRules: parsed.customRules,
          siteSettings,
          stats: {
            ...stats,
            lastUpdated: new Date(stats.lastUpdated)
          },
          settings
        };
      }
    } catch (error) {
      console.error('Error loading ad blocker storage:', error);
    }

    return this.getDefaultStorage();
  }

  private getDefaultStorage(): AdBlockerStorage {
    const now = new Date();
    
    return {
      filterLists: AdBlockerService.DEFAULT_FILTER_LISTS.map(list => ({
        ...list,
        lastUpdated: now,
        ruleCount: 0
      })),
      customRules: [],
      siteSettings: [],
      stats: {
        totalBlocked: 0,
        todayBlocked: 0,
        byType: {},
        byDomain: {},
        lastUpdated: now
      },
      settings: {
        enabled: true,
        blockTrackers: true,
        blockAds: true,
        blockMalware: true,
        blockSocial: false,
        blockAnnoyances: false,
        autoUpdate: true,
        updateInterval: 24,
        showBlockedCount: true,
        enableContextMenu: true,
        enableStats: true
      }
    };
  }

  private saveStorage() {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(AdBlockerStorage.STORAGE_KEY, JSON.stringify({
        filterLists: this.filterLists,
        customRules: this.customRules,
        siteSettings: this.siteSettings
      }));
      
      localStorage.setItem(AdBlockerStorage.STATS_KEY, JSON.stringify(this.stats));
      localStorage.setItem(AdBlockerStorage.SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving ad blocker storage:', error);
    }
  }

  private compileRules() {
    this.compiledRules = [];
    
    // Add enabled filter list rules
    this.filterLists.forEach(list => {
      if (list.enabled) {
        // In a real implementation, we would parse the filter list content
        // For now, we'll add some basic rules based on the list type
        this.compiledRules.push(...this.generateRulesForList(list));
      }
    });

    // Add custom rules
    this.customRules.forEach(rule => {
      if (rule.enabled) {
        this.compiledRules.push(rule);
      }
    });
  }

  private generateRulesForList(list: FilterList): BlockerRule[] {
    const rules: BlockerRule[] = [];
    
    // Generate rules based on filter list type
    switch (list.id) {
      case 'easylist':
        rules.push(
          {
            id: `${list.id}-ads`,
            pattern: 'ads',
            type: 'block',
            domains: [],
            resourceTypes: ['script', 'image', 'media'],
            thirdParty: true,
            matchCase: false,
            enabled: true,
            source: list.id
          },
          {
            id: `${list.id}-doubleclick`,
            pattern: 'doubleclick',
            type: 'block',
            domains: [],
            resourceTypes: ['script'],
            thirdParty: true,
            matchCase: false,
            enabled: true,
            source: list.id
          }
        );
        break;
        
      case 'easyprivacy':
        rules.push(
          {
            id: `${list.id}-analytics`,
            pattern: 'analytics',
            type: 'block',
            domains: [],
            resourceTypes: ['script'],
            thirdParty: true,
            matchCase: false,
            enabled: true,
            source: list.id
          },
          {
            id: `${list.id}-tracking`,
            pattern: 'tracking',
            type: 'block',
            domains: [],
            resourceTypes: ['script', 'image'],
            thirdParty: true,
            matchCase: false,
            enabled: true,
            source: list.id
          }
        );
        break;
        
      case 'malware':
        rules.push(
          {
            id: `${list.id}-malware`,
            pattern: 'malware',
            type: 'block',
            domains: [],
            resourceTypes: ['script', 'media'],
            thirdParty: true,
            matchCase: false,
            enabled: true,
            source: list.id
          }
        );
        break;
    }

    return rules;
  }

  shouldBlockRequest(url: string, type: string, sourceUrl?: string): boolean {
    if (!this.settings.enabled) return false;

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const resourceType = this.mapResourceType(type);

      // Check site-specific settings
      if (sourceUrl) {
        const sourceDomain = new URL(sourceUrl).hostname;
        const siteSettings = this.getSiteSettings(sourceDomain);
        
        if (siteSettings.whitelisted) return false;
        if (!siteSettings.enabled) return false;
      }

      // Check against compiled rules
      for (const rule of this.compiledRules) {
        if (this.matchesRule(url, domain, resourceType, rule)) {
          this.updateStats(rule, domain, resourceType);
          return true;
        }
      }

      // Check against common patterns for performance
      for (const pattern of AdBlockerService.COMMON_PATTERNS) {
        if (pattern.test(url)) {
          this.updateStats({ id: 'common', type: 'block' } as BlockerRule, domain, resourceType);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking request:', error);
      return false;
    }
  }

  private matchesRule(url: string, domain: string, resourceType: string, rule: BlockerRule): boolean {
    // Check resource type
    if (rule.resourceTypes.length > 0 && !rule.resourceTypes.includes(resourceType)) {
      return false;
    }

    // Check domain restrictions
    if (rule.domains.length > 0) {
      const domainMatches = rule.domains.some(d => domain.includes(d) || d.includes(domain));
      if (!domainMatches) return false;
    }

    // Check third-party restriction
    if (rule.thirdParty) {
      // This is a simplified check - in reality, we'd need to compare with source domain
      if (!url.includes('doubleclick') && !url.includes('google-analytics')) {
        return false;
      }
    }

    // Check pattern match
    const pattern = new RegExp(rule.pattern, rule.matchCase ? '' : 'i');
    return pattern.test(url);
  }

  private mapResourceType(type: string): BlockerRule['resourceTypes'][0] {
    switch (type) {
      case 'script': return 'script';
      case 'image': return 'image';
      case 'stylesheet': return 'stylesheet';
      case 'font': return 'font';
      case 'media': return 'media';
      case 'websocket': return 'websocket';
      default: return 'script';
    }
  }

  private updateStats(rule: BlockerRule, domain: string, resourceType: string) {
    this.stats.totalBlocked++;
    this.stats.todayBlocked++;
    
    // Update by type
    this.stats.byType[resourceType] = (this.stats.byType[resourceType] || 0) + 1;
    
    // Update by domain
    this.stats.byDomain[domain] = (this.stats.byDomain[domain] || 0) + 1;
    
    this.stats.lastUpdated = new Date();
    this.saveStorage();
  }

  // Filter list management
  getFilterLists(): FilterList[] {
    return [...this.filterLists];
  }

  toggleFilterList(id: string): boolean {
    const list = this.filterLists.find(l => l.id === id);
    if (!list) return false;

    list.enabled = !list.enabled;
    this.compileRules();
    this.saveStorage();
    return true;
  }

  updateFilterList(id: string): Promise<boolean> {
    return new Promise((resolve) => {
      const list = this.filterLists.find(l => l.id === id);
      if (!list) {
        resolve(false);
        return;
      }

      // Simulate updating filter list
      setTimeout(() => {
        list.lastUpdated = new Date();
        list.ruleCount = Math.floor(Math.random() * 10000) + 1000;
        this.compileRules();
        this.saveStorage();
        resolve(true);
      }, 1000);
    });
  }

  // Custom rules management
  getCustomRules(): BlockerRule[] {
    return [...this.customRules];
  }

  addCustomRule(rule: Omit<BlockerRule, 'id' | 'source'>): BlockerRule {
    const newRule: BlockerRule = {
      ...rule,
      id: this.generateId(),
      source: 'custom'
    };

    this.customRules.push(newRule);
    this.compileRules();
    this.saveStorage();
    return newRule;
  }

  updateCustomRule(id: string, updates: Partial<BlockerRule>): boolean {
    const rule = this.customRules.find(r => r.id === id);
    if (!rule) return false;

    Object.assign(rule, updates);
    this.compileRules();
    this.saveStorage();
    return true;
  }

  deleteCustomRule(id: string): boolean {
    const index = this.customRules.findIndex(r => r.id === id);
    if (index === -1) return false;

    this.customRules.splice(index, 1);
    this.compileRules();
    this.saveStorage();
    return true;
  }

  // Site settings management
  getSiteSettings(domain: string): SiteSettings {
    let settings = this.siteSettings.find(s => s.domain === domain);
    
    if (!settings) {
      settings = {
        domain,
        enabled: true,
        customRules: [],
        whitelisted: false,
        trusted: false
      };
      this.siteSettings.push(settings);
      this.saveStorage();
    }

    return settings;
  }

  updateSiteSettings(domain: string, updates: Partial<SiteSettings>): boolean {
    const settings = this.getSiteSettings(domain);
    Object.assign(settings, updates);
    this.saveStorage();
    return true;
  }

  // Settings management
  getSettings() {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<AdBlockerStorage['settings']>) {
    this.settings = { ...this.settings, ...newSettings };
    this.compileRules();
    this.saveStorage();
    
    // Restart auto-update if needed
    if (newSettings.autoUpdate !== undefined) {
      if (newSettings.autoUpdate) {
        this.startAutoUpdate();
      } else {
        this.stopAutoUpdate();
      }
    }
  }

  // Statistics
  getStats(): BlockerStats {
    return { ...this.stats };
  }

  resetStats() {
    this.stats = {
      totalBlocked: 0,
      todayBlocked: 0,
      byType: {},
      byDomain: {},
      lastUpdated: new Date()
    };
    this.saveStorage();
  }

  // Auto-update functionality
  private startAutoUpdate() {
    if (!this.settings.autoUpdate) return;

    this.stopAutoUpdate();
    const intervalMs = this.settings.updateInterval * 60 * 60 * 1000;
    
    this.autoUpdateTimer = setInterval(() => {
      this.updateAllFilterLists();
    }, intervalMs);
  }

  private stopAutoUpdate() {
    if (this.autoUpdateTimer) {
      clearInterval(this.autoUpdateTimer);
      this.autoUpdateTimer = null;
    }
  }

  private async updateAllFilterLists() {
    const promises = this.filterLists
      .filter(list => list.enabled)
      .map(list => this.updateFilterList(list.id));

    await Promise.all(promises);
  }

  // Utility methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  cleanup() {
    this.stopAutoUpdate();
  }
}