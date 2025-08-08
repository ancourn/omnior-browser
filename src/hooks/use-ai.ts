'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  AIService, 
  SummaryRequest, 
  SummaryResponse, 
  SearchQuery,
  AIAction,
  RecommendationItem,
  AISettings 
} from '@/lib/ai/ai-service';

export function useAI() {
  const [aiService] = useState(() => new AIService());
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AISettings>(aiService.getSettings());
  const [usage, setUsage] = useState(aiService.getUsage());

  // Load initial data
  useEffect(() => {
    setSettings(aiService.getSettings());
    setUsage(aiService.getUsage());
  }, [aiService]);

  // Core AI functionality
  const summarize = useCallback(async (request: SummaryRequest): Promise<SummaryResponse | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await aiService.summarize(request);
      setUsage(aiService.getUsage());
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI summarization failed';
      setError(errorMessage);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [aiService]);

  // Quick summarize with default settings
  const quickSummarize = useCallback(async (
    text: string, 
    style?: string
  ): Promise<SummaryResponse | null> => {
    const request: SummaryRequest = {
      text,
      style: style || settings.defaultSummaryStyle,
      provider: settings.defaultProvider
    };

    return summarize(request);
  }, [summarize, settings]);

  // Summarize current page
  const summarizePage = useCallback(async (
    style?: string
  ): Promise<SummaryResponse | null> => {
    const text = aiService.extractTextFromDOM();
    return quickSummarize(text, style);
  }, [quickSummarize, aiService]);

  // Summarize selected text
  const summarizeSelection = useCallback(async (
    style?: string
  ): Promise<SummaryResponse | null> => {
    const text = aiService.extractSelectedText();
    if (!text) {
      setError('No text selected');
      return null;
    }
    return quickSummarize(text, style);
  }, [quickSummarize, aiService]);

  // Smart Search functionality
  const reformulateQuery = useCallback(async (
    query: string, 
    context: string = ''
  ): Promise<SearchQuery | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await aiService.reformulateQuery(query, context);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Query reformulation failed';
      setError(errorMessage);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [aiService]);

  // Contextual AI Actions
  const performAIAction = useCallback(async (
    actionId: string, 
    text?: string
  ): Promise<string | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const targetText = text || aiService.extractSelectedText();
      if (!targetText) {
        setError('No text selected for AI action');
        return null;
      }

      const result = await aiService.performAIAction(actionId, targetText);
      setUsage(aiService.getUsage());
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI action failed';
      setError(errorMessage);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [aiService]);

  // Provider management
  const getProviders = useCallback(() => {
    return aiService.getProviders();
  }, [aiService]);

  const getProvider = useCallback((id: string) => {
    return aiService.getProvider(id);
  }, [aiService]);

  const updateProvider = useCallback((id: string, updates: any) => {
    aiService.updateProvider(id, updates);
    setSettings(aiService.getSettings());
  }, [aiService]);

  const setApiKey = useCallback((providerId: string, apiKey: string) => {
    aiService.setApiKey(providerId, apiKey);
    setSettings(aiService.getSettings());
  }, [aiService]);

  // Summary styles
  const getSummaryStyles = useCallback(() => {
    return aiService.getSummaryStyles();
  }, [aiService]);

  const getSummaryStyle = useCallback((id: string) => {
    return aiService.getSummaryStyle(id);
  }, [aiService]);

  // AI Actions
  const getAIActions = useCallback(() => {
    return aiService.getAIActions();
  }, [aiService]);

  const getAIAction = useCallback((id: string) => {
    return aiService.getAIAction(id);
  }, [aiService]);

  // Settings management
  const updateSettings = useCallback((newSettings: Partial<AISettings>) => {
    aiService.updateSettings(newSettings);
    setSettings(aiService.getSettings());
  }, [aiService]);

  // Usage tracking
  const refreshUsage = useCallback(() => {
    setUsage(aiService.getUsage());
  }, [aiService]);

  const resetUsage = useCallback(() => {
    aiService.resetUsage();
    setUsage(aiService.getUsage());
  }, [aiService]);

  // Utility functions
  const hasValidApiKey = useCallback((providerId: string) => {
    const provider = getProvider(providerId);
    return provider?.apiKey && provider.apiKey.length > 0;
  }, [getProvider]);

  const getDailyTokenLimit = useCallback(() => {
    return settings.privacyMode === 'local' ? Infinity : 100000; // 100k tokens daily limit for cloud
  }, [settings.privacyMode]);

  const getRemainingTokens = useCallback(() => {
    return Math.max(0, getDailyTokenLimit() - usage.dailyTokens);
  }, [usage.dailyTokens, getDailyTokenLimit]);

  const isUsageLimitExceeded = useCallback(() => {
    return getRemainingTokens() <= 0;
  }, [getRemainingTokens]);

  // Privacy mode helpers
  const isLocalOnly = useCallback(() => {
    return settings.privacyMode === 'local';
  }, [settings.privacyMode]);

  const canUseCloud = useCallback(() => {
    return settings.privacyMode !== 'local' && !isUsageLimitExceeded();
  }, [settings.privacyMode, isUsageLimitExceeded]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      aiService.cleanup();
    };
  }, [aiService]);

  return {
    // State
    isProcessing,
    error,
    settings,
    usage,

    // Core functionality
    summarize,
    quickSummarize,
    summarizePage,
    summarizeSelection,
    reformulateQuery,
    performAIAction,

    // Provider management
    getProviders,
    getProvider,
    updateProvider,
    setApiKey,

    // Summary styles
    getSummaryStyles,
    getSummaryStyle,

    // AI Actions
    getAIActions,
    getAIAction,

    // Settings
    updateSettings,

    // Usage
    refreshUsage,
    resetUsage,
    getDailyTokenLimit,
    getRemainingTokens,
    isUsageLimitExceeded,

    // Utilities
    hasValidApiKey,
    isLocalOnly,
    canUseCloud,

    // Clear error
    clearError: () => setError(null)
  };
}