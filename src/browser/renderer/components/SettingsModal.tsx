import React from 'react';
import { X, Settings as SettingsIcon } from 'lucide-react';
import { BrowserSettings } from '../../types';

interface SettingsModalProps {
  settings: BrowserSettings;
  onSave: (settings: Partial<BrowserSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSave,
  onClose
}) => {
  const [localSettings, setLocalSettings] = React.useState(settings);

  const handleSave = () => {
    onSave(localSettings);
  };

  const updateSetting = <K extends keyof BrowserSettings>(
    key: K,
    value: BrowserSettings[K]
  ) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Settings
          </h2>
          <button onClick={onClose} className="btn btn-ghost p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="settings-section">
            <h3 className="text-lg font-medium mb-4">Appearance</h3>
            <div className="settings-group">
              <label className="settings-label">Theme</label>
              <select
                value={localSettings.theme}
                onChange={(e) => updateSetting('theme', e.target.value as BrowserSettings['theme'])}
                className="input w-full"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>

          <div className="settings-section">
            <h3 className="text-lg font-medium mb-4">Startup</h3>
            <div className="settings-group">
              <label className="settings-label">On startup</label>
              <select
                value={localSettings.startupBehavior}
                onChange={(e) => updateSetting('startupBehavior', e.target.value as BrowserSettings['startupBehavior'])}
                className="input w-full"
              >
                <option value="newTab">Open new tab</option>
                <option value="continue">Continue where you left off</option>
                <option value="specificPages">Open specific pages</option>
              </select>
            </div>
          </div>

          <div className="settings-section">
            <h3 className="text-lg font-medium mb-4">Search Engine</h3>
            <div className="settings-group">
              <label className="settings-label">Search engine used in address bar</label>
              <select
                value={localSettings.searchEngine}
                onChange={(e) => updateSetting('searchEngine', e.target.value as BrowserSettings['searchEngine'])}
                className="input w-full"
              >
                <option value="google">Google</option>
                <option value="bing">Bing</option>
                <option value="duckduckgo">DuckDuckGo</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <div className="settings-section">
            <h3 className="text-lg font-medium mb-4">Privacy and Security</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="settings-label">Block ads</label>
                  <p className="settings-description">Block intrusive ads on websites</p>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.blockAds}
                  onChange={(e) => updateSetting('blockAds', e.target.checked)}
                  className="w-4 h-4"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="settings-label">Block trackers</label>
                  <p className="settings-description">Prevent websites from tracking you</p>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.blockTrackers}
                  onChange={(e) => updateSetting('blockTrackers', e.target.checked)}
                  className="w-4 h-4"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="settings-label">Enable JavaScript</label>
                  <p className="settings-description">Allow websites to run JavaScript</p>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.enableJavaScript}
                  onChange={(e) => updateSetting('enableJavaScript', e.target.checked)}
                  className="w-4 h-4"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="settings-label">Enable cookies</label>
                  <p className="settings-description">Allow websites to store cookies</p>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.enableCookies}
                  onChange={(e) => updateSetting('enableCookies', e.target.checked)}
                  className="w-4 h-4"
                />
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3 className="text-lg font-medium mb-4">Appearance</h3>
            <div className="flex items-center justify-between">
              <div>
                <label className="settings-label">Show bookmarks bar</label>
                <p className="settings-description">Always show the bookmarks bar</p>
              </div>
              <input
                type="checkbox"
                checked={localSettings.alwaysShowBookmarksBar}
                onChange={(e) => updateSetting('alwaysShowBookmarksBar', e.target.checked)}
                className="w-4 h-4"
              />
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn btn-primary">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};