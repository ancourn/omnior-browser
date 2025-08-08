'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  TranslateService, 
  TranslationRequest, 
  TranslationResponse, 
  Language,
  TranslationProvider 
} from '@/lib/translate/translate-service';

export function useTranslate() {
  const [translateService] = useState(() => new TranslateService());
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<TranslationResponse[]>([]);
  const [settings, setSettings] = useState(translateService.getSettings());
  const [providers] = useState<TranslationProvider[]>(translateService.getProviders());
  const [languages] = useState<Language[]>(translateService.getLanguages());

  // Load initial data
  useEffect(() => {
    setHistory(translateService.getHistory());
    setSettings(translateService.getSettings());
  }, [translateService]);

  // Translate text
  const translate = useCallback(async (request: TranslationRequest): Promise<TranslationResponse | null> => {
    setIsTranslating(true);
    setError(null);

    try {
      const response = await translateService.translate(request);
      setHistory(translateService.getHistory());
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Translation failed';
      setError(errorMessage);
      return null;
    } finally {
      setIsTranslating(false);
    }
  }, [translateService]);

  // Quick translate with default settings
  const quickTranslate = useCallback(async (
    text: string, 
    targetLanguage?: string
  ): Promise<TranslationResponse | null> => {
    const request: TranslationRequest = {
      text,
      sourceLanguage: settings.autoDetectLanguage ? 'auto' : settings.defaultSourceLanguage,
      targetLanguage: targetLanguage || settings.defaultTargetLanguage,
      provider: settings.defaultProvider
    };

    return translate(request);
  }, [translate, settings]);

  // Detect language
  const detectLanguage = useCallback(async (text: string): Promise<string> => {
    try {
      return await translateService.detectLanguage(text);
    } catch (err) {
      console.error('Language detection failed:', err);
      return 'en'; // Default to English
    }
  }, [translateService]);

  // Translate selected text (for context menu)
  const translateSelection = useCallback(async (): Promise<TranslationResponse | null> => {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim() === '') {
      setError('No text selected');
      return null;
    }

    const selectedText = selection.toString().trim();
    return quickTranslate(selectedText);
  }, [quickTranslate]);

  // Translate entire page
  const translatePage = useCallback(async (targetLanguage?: string): Promise<void> => {
    try {
      await translateService.translatePage(targetLanguage || settings.defaultTargetLanguage);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Page translation failed';
      setError(errorMessage);
    }
  }, [translateService, settings.defaultTargetLanguage]);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<typeof settings>) => {
    translateService.updateSettings(newSettings);
    setSettings(translateService.getSettings());
  }, [translateService]);

  // Clear history
  const clearHistory = useCallback(() => {
    translateService.clearHistory();
    setHistory([]);
  }, [translateService]);

  // Delete from history
  const deleteFromHistory = useCallback((index: number) => {
    translateService.deleteFromHistory(index);
    setHistory(translateService.getHistory());
  }, [translateService]);

  // Get language by code
  const getLanguageByCode = useCallback((code: string): Language | null => {
    return languages.find(lang => lang.code === code) || null;
  }, [languages]);

  // Get provider by ID
  const getProviderById = useCallback((id: string): TranslationProvider | null => {
    return providers.find(provider => provider.id === id) || null;
  }, [providers]);

  // Swap source and target languages
  const swapLanguages = useCallback(() => {
    const newSettings = {
      ...settings,
      defaultSourceLanguage: settings.defaultTargetLanguage,
      defaultTargetLanguage: settings.defaultSourceLanguage
    };
    updateSettings(newSettings);
  }, [settings, updateSettings]);

  // Get favorite language pairs
  const getFavoritePairs = useCallback(() => {
    const pairs = new Set<string>();
    history.forEach(item => {
      const pair = `${item.sourceLanguage}-${item.targetLanguage}`;
      pairs.add(pair);
    });
    return Array.from(pairs);
  }, [history]);

  return {
    // State
    isTranslating,
    error,
    history,
    settings,
    providers,
    languages,

    // Actions
    translate,
    quickTranslate,
    detectLanguage,
    translateSelection,
    translatePage,
    updateSettings,
    clearHistory,
    deleteFromHistory,
    swapLanguages,

    // Utilities
    getLanguageByCode,
    getProviderById,
    getFavoritePairs,

    // Clear error
    clearError: () => setError(null)
  };
}