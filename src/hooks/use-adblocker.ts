'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  AdBlockerService, 
  FilterList, 
  BlockerRule, 
  SiteSettings, 
  BlockerStats 
} from '@/lib/adblocker/adblocker-service';

export function useAdBlocker() {
  const [adBlockerService] = useState(() => new AdBlockerService());
  const [filterLists, setFilterLists] = useState<FilterList[]>([]);
  const [customRules, setCustomRules] = useState<BlockerRule[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings[]>([]);
  const [stats, setStats] = useState<BlockerStats>(adBlockerService.getStats());
  const [settings, setSettings] = useState(adBlockerService.getSettings());
  const [isUpdating, setIsUpdating] = useState(false);

  // Load initial data
  useEffect(() => {
    setFilterLists(adBlockerService.getFilterLists());
    setCustomRules(adBlockerService.getCustomRules());
    setStats(adBlockerService.getStats());
    setSettings(adBlockerService.getSettings());
  }, [adBlockerService]);

  // Check if a request should be blocked
  const shouldBlockRequest = useCallback((url: string, type: string, sourceUrl?: string): boolean => {
    return adBlockerService.shouldBlockRequest(url, type, sourceUrl);
  }, [adBlockerService]);

  // Filter list management
  const toggleFilterList = useCallback((id: string): boolean => {
    const success = adBlockerService.toggleFilterList(id);
    if (success) {
      setFilterLists(adBlockerService.getFilterLists());
    }
    return success;
  }, [adBlockerService]);

  const updateFilterList = useCallback(async (id: string): Promise<boolean> => {
    setIsUpdating(true);
    try {
      const success = await adBlockerService.updateFilterList(id);
      if (success) {
        setFilterLists(adBlockerService.getFilterLists());
      }
      return success;
    } finally {
      setIsUpdating(false);
    }
  }, [adBlockerService]);

  const updateAllFilterLists = useCallback(async (): Promise<void> => {
    setIsUpdating(true);
    try {
      const promises = filterLists
        .filter(list => list.enabled)
        .map(list => updateFilterList(list.id));
      
      await Promise.all(promises);
    } finally {
      setIsUpdating(false);
    }
  }, [filterLists, updateFilterList]);

  // Custom rules management
  const addCustomRule = useCallback((rule: Omit<BlockerRule, 'id' | 'source'>): BlockerRule => {
    const newRule = adBlockerService.addCustomRule(rule);
    setCustomRules(adBlockerService.getCustomRules());
    return newRule;
  }, [adBlockerService]);

  const updateCustomRule = useCallback((id: string, updates: Partial<BlockerRule>): boolean => {
    const success = adBlockerService.updateCustomRule(id, updates);
    if (success) {
      setCustomRules(adBlockerService.getCustomRules());
    }
    return success;
  }, [adBlockerService]);

  const deleteCustomRule = useCallback((id: string): boolean => {
    const success = adBlockerService.deleteCustomRule(id);
    if (success) {
      setCustomRules(adBlockerService.getCustomRules());
    }
    return success;
  }, [adBlockerService]);

  // Site settings management
  const getSiteSettings = useCallback((domain: string): SiteSettings => {
    return adBlockerService.getSiteSettings(domain);
  }, [adBlockerService]);

  const updateSiteSettings = useCallback((domain: string, updates: Partial<SiteSettings>): boolean => {
    const success = adBlockerService.updateSiteSettings(domain, updates);
    if (success) {
      // Refresh site settings
      const updatedSettings = adBlockerService.getSiteSettings(domain);
      setSiteSettings(prev => {
        const index = prev.findIndex(s => s.domain === domain);
        if (index !== -1) {
          const newSettings = [...prev];
          newSettings[index] = updatedSettings;
          return newSettings;
        }
        return [...prev, updatedSettings];
      });
    }
    return success;
  }, [adBlockerService]);

  // Toggle site whitelisting
  const toggleSiteWhitelist = useCallback((domain: string): boolean => {
    const currentSettings = getSiteSettings(domain);
    return updateSiteSettings(domain, { 
      whitelisted: !currentSettings.whitelisted 
    });
  }, [getSiteSettings, updateSiteSettings]);

  // Toggle site blocker
  const toggleSiteBlocker = useCallback((domain: string): boolean => {
    const currentSettings = getSiteSettings(domain);
    return updateSiteSettings(domain, { 
      enabled: !currentSettings.enabled 
    });
  }, [getSiteSettings, updateSiteSettings]);

  // Settings management
  const updateSettings = useCallback((newSettings: Partial<typeof settings>) => {
    adBlockerService.updateSettings(newSettings);
    setSettings(adBlockerService.getSettings());
  }, [adBlockerService]);

  // Toggle global blocker
  const toggleBlocker = useCallback(() => {
    updateSettings({ enabled: !settings.enabled });
  }, [settings.enabled, updateSettings]);

  // Statistics
  const refreshStats = useCallback(() => {
    setStats(adBlockerService.getStats());
  }, [adBlockerService]);

  const resetStats = useCallback(() => {
    adBlockerService.resetStats();
    setStats(adBlockerService.getStats());
  }, [adBlockerService]);

  // Get enabled filter lists count
  const getEnabledFilterListsCount = useCallback(() => {
    return filterLists.filter(list => list.enabled).length;
  }, [filterLists]);

  // Get total rules count
  const getTotalRulesCount = useCallback(() => {
    return filterLists.reduce((total, list) => 
      list.enabled ? total + list.ruleCount : total, 0
    ) + customRules.length;
  }, [filterLists, customRules]);

  // Get today's blocked count
  const getTodayBlockedCount = useCallback(() => {
    return stats.todayBlocked;
  }, [stats]);

  // Get top blocked domains
  const getTopBlockedDomains = useCallback((limit: number = 10) => {
    return Object.entries(stats.byDomain)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([domain, count]) => ({ domain, count }));
  }, [stats]);

  // Get blocked by type
  const getBlockedByType = useCallback(() => {
    return Object.entries(stats.byType).map(([type, count]) => ({
      type,
      count
    }));
  }, [stats]);

  // Auto-update status
  const isAutoUpdateEnabled = useCallback(() => {
    return settings.autoUpdate;
  }, [settings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      adBlockerService.cleanup();
    };
  }, [adBlockerService]);

  return {
    // State
    filterLists,
    customRules,
    siteSettings,
    stats,
    settings,
    isUpdating,

    // Core functionality
    shouldBlockRequest,
    toggleBlocker,

    // Filter lists
    toggleFilterList,
    updateFilterList,
    updateAllFilterLists,
    getEnabledFilterListsCount,
    getTotalRulesCount,

    // Custom rules
    addCustomRule,
    updateCustomRule,
    deleteCustomRule,

    // Site settings
    getSiteSettings,
    updateSiteSettings,
    toggleSiteWhitelist,
    toggleSiteBlocker,

    // Settings
    updateSettings,
    isAutoUpdateEnabled,

    // Statistics
    refreshStats,
    resetStats,
    getTodayBlockedCount,
    getTopBlockedDomains,
    getBlockedByType
  };
}