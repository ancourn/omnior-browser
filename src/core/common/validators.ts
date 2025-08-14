/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

import { z } from 'zod';
import type { Settings } from './models';

export const settingsSchema = z.object({
  homepage: z.string().url().default('about:blank'),
  defaultSearch: z.string().url().default('https://duckduckgo.com/?q={query}'),
  downloadDir: z.string().default('~/Downloads'),
  newTabBehavior: z.enum(['home', 'blank', 'last-session']).default('home'),
  privacy: z.object({
    doNotTrack: z.boolean().default(true),
    blockThirdPartyCookies: z.boolean().default(true),
  }).default({}),
  appearance: z.object({
    theme: z.enum(['system', 'light', 'dark']).default('system'),
    density: z.enum(['compact', 'cozy']).default('cozy'),
  }).default({}),
  security: z.object({
    autoLockMinutes: z.number().min(1).max(1440).default(30),
  }).default({}),
});

export const validateSettings = (data: unknown): Settings => {
  return settingsSchema.parse(data);
};

export const getDefaultSettings = (): Settings => {
  return settingsSchema.parse({});
};