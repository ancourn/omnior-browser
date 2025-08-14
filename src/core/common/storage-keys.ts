/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

import type { ProfileId } from './models';

export class StorageKeys {
  static bookmarks(profileId: ProfileId): string {
    return `profile:${profileId}:bookmarks`;
  }

  static history(profileId: ProfileId, dayKey?: string): string {
    if (dayKey) {
      return `profile:${profileId}:history:${dayKey}`;
    }
    return `profile:${profileId}:history`;
  }

  static tabs(profileId: ProfileId): string {
    return `profile:${profileId}:tabs`;
  }

  static settings(profileId: ProfileId): string {
    return `profile:${profileId}:settings`;
  }

  static downloads(profileId: ProfileId): string {
    return `profile:${profileId}:downloads:index`;
  }

  static closedTabs(profileId: ProfileId): string {
    return `profile:${profileId}:closed-tabs`;
  }
}