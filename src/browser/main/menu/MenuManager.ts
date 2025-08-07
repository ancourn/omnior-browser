import { app, Menu, MenuItem, BrowserWindow, shell } from 'electron';
import path from 'path';
import { StorageManager } from '../../shared/utils/StorageManager';

export class MenuManager {
  private storageManager: StorageManager;

  constructor() {
    this.storageManager = new StorageManager();
  }

  public setupMenu(): void {
    const template = this.getMenuTemplate();
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private getMenuTemplate(): Electron.MenuItemConstructorOptions[] {
    const isMac = process.platform === 'darwin';

    return [
      // App Menu (macOS only)
      ...(isMac ? [{
        label: app.getName(),
        submenu: [
          { role: 'about' as const, label: 'About Omnior' },
          { type: 'separator' as const },
          { role: 'services' as const, label: 'Services' },
          { type: 'separator' as const },
          { role: 'hide' as const, label: 'Hide Omnior' },
          { role: 'hideOthers' as const, label: 'Hide Others' },
          { role: 'unhide' as const, label: 'Show All' },
          { type: 'separator' as const },
          { role: 'quit' as const, label: 'Quit Omnior' }
        ]
      }] : []),

      // File Menu
      {
        label: 'File',
        submenu: [
          {
            label: 'New Window',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              new BrowserWindow({
                width: 1200,
                height: 800,
                webPreferences: {
                  nodeIntegration: false,
                  contextIsolation: true,
                  preload: path.join(__dirname, '../../renderer/preload.js')
                }
              }).loadFile(path.join(__dirname, '../../renderer/index.html'));
            }
          },
          {
            label: 'New Tab',
            accelerator: 'CmdOrCtrl+T',
            click: () => {
              const window = BrowserWindow.getFocusedWindow();
              if (window) {
                window.webContents.send('menu-new-tab');
              }
            }
          },
          {
            label: 'New Incognito Window',
            accelerator: 'CmdOrCtrl+Shift+N',
            click: () => {
              new BrowserWindow({
                width: 1200,
                height: 800,
                webPreferences: {
                  nodeIntegration: false,
                  contextIsolation: true,
                  sandbox: true,
                  preload: path.join(__dirname, '../../renderer/preload.js')
                }
              }).loadFile(path.join(__dirname, '../../renderer/index.html'));
            }
          },
          { type: 'separator' as const },
          {
            label: 'Open File...',
            accelerator: 'CmdOrCtrl+O',
            click: () => {
              const window = BrowserWindow.getFocusedWindow();
              if (window) {
                window.webContents.send('menu-open-file');
              }
            }
          },
          {
            label: 'Open Location...',
            accelerator: 'CmdOrCtrl+L',
            click: () => {
              const window = BrowserWindow.getFocusedWindow();
              if (window) {
                window.webContents.send('menu-open-location');
              }
            }
          },
          { type: 'separator' as const },
          {
            label: 'Close Window',
            accelerator: 'CmdOrCtrl+Shift+W',
            role: 'close' as const
          },
          {
            label: 'Close Tab',
            accelerator: 'CmdOrCtrl+W',
            click: () => {
              const window = BrowserWindow.getFocusedWindow();
              if (window) {
                window.webContents.send('menu-close-tab');
              }
            }
          },
          { type: 'separator' as const },
          {
            label: 'Save Page As...',
            accelerator: 'CmdOrCtrl+S',
            click: () => {
              const window = BrowserWindow.getFocusedWindow();
              if (window) {
                window.webContents.send('menu-save-page');
              }
            }
          },
          { type: 'separator' as const },
          ...(isMac ? [
            { role: 'quit' as const, label: 'Quit Omnior' }
          ] : [
            {
              label: 'Exit',
              accelerator: process.platform === 'win32' ? 'Alt+F4' : 'Ctrl+Q',
              click: () => {
                app.quit();
              }
            }
          ])
        ]
      },

      // Edit Menu
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' as const, label: 'Undo' },
          { role: 'redo' as const, label: 'Redo' },
          { type: 'separator' as const },
          { role: 'cut' as const, label: 'Cut' },
          { role: 'copy' as const, label: 'Copy' },
          { role: 'paste' as const, label: 'Paste' },
          { role: 'pasteAndMatchStyle' as const, label: 'Paste and Match Style' },
          { role: 'delete' as const, label: 'Delete' },
          { role: 'selectAll' as const, label: 'Select All' },
          { type: 'separator' as const },
          {
            label: 'Find',
            accelerator: 'CmdOrCtrl+F',
            click: () => {
              const window = BrowserWindow.getFocusedWindow();
              if (window) {
                window.webContents.send('menu-find');
              }
            }
          },
          {
            label: 'Find Next',
            accelerator: 'CmdOrCtrl+G',
            click: () => {
              const window = BrowserWindow.getFocusedWindow();
              if (window) {
                window.webContents.send('menu-find-next');
              }
            }
          },
          {
            label: 'Find Previous',
            accelerator: 'CmdOrCtrl+Shift+G',
            click: () => {
              const window = BrowserWindow.getFocusedWindow();
              if (window) {
                window.webContents.send('menu-find-previous');
              }
            }
          },
          { type: 'separator' as const },
          {
            label: 'Preferences...',
            accelerator: 'CmdOrCtrl+,',
            click: () => {
              const window = BrowserWindow.getFocusedWindow();
              if (window) {
                window.webContents.send('menu-preferences');
              }
            }
          }
        ]
      },

      // View Menu
      {
        label: 'View',
        submenu: [
          {
            label: 'Reload',
            accelerator: 'CmdOrCtrl+R',
            click: () => {
              const window = BrowserWindow.getFocusedWindow();
              if (window) {
                window.webContents.reload();
              }
            }
          },
          {
            label: 'Force Reload',
            accelerator: 'CmdOrCtrl+Shift+R',
            click: () => {
              const window = BrowserWindow.getFocusedWindow();
              if (window) {
                window.webContents.reloadIgnoringCache();
              }
            }
          },
          { type: 'separator' as const },
          { role: 'resetZoom' as const, label: 'Actual Size' },
          { role: 'zoomIn' as const, label: 'Zoom In' },
          { role: 'zoomOut' as const, label: 'Zoom Out' },
          { type: 'separator' as const },
          { role: 'togglefullscreen' as const, label: 'Full Screen' },
          { type: 'separator' as const },
          {
            label: 'Developer',
            submenu: [
              {
                label: 'Toggle Developer Tools',
                accelerator: 'CmdOrCtrl+Shift+I',
                click: () => {
                  const window = BrowserWindow.getFocusedWindow();
                  if (window) {
                    window.webContents.toggleDevTools();
                  }
                }
              },
              {
                label: 'Developer Tools',
                accelerator: 'Alt+CmdOrCtrl+I',
                click: () => {
                  const window = BrowserWindow.getFocusedWindow();
                  if (window) {
                    window.webContents.openDevTools();
                  }
                }
              },
              {
                label: 'Omnior DevConsole',
                accelerator: 'CmdOrCtrl+Shift+D',
                click: () => {
                  const window = BrowserWindow.getFocusedWindow();
                  if (window) {
                    window.webContents.send('omnior:openDevConsole');
                  }
                }
              }
            ]
          }
        ]
      },

      // History Menu
      {
        label: 'History',
        submenu: [
          {
            label: 'Back',
            accelerator: 'Alt+LeftArrow',
            click: () => {
              const window = BrowserWindow.getFocusedWindow();
              if (window) {
                window.webContents.goBack();
              }
            }
          },
          {
            label: 'Forward',
            accelerator: 'Alt+RightArrow',
            click: () => {
              const window = BrowserWindow.getFocusedWindow();
              if (window) {
                window.webContents.goForward();
              }
            }
          },
          { type: 'separator' as const },
          {
            label: 'Show Full History',
            accelerator: 'CmdOrCtrl+Y',
            click: () => {
              const window = BrowserWindow.getFocusedWindow();
              if (window) {
                window.webContents.send('menu-show-history');
              }
            }
          },
          {
            label: 'Clear Browsing Data...',
            click: () => {
              const window = BrowserWindow.getFocusedWindow();
              if (window) {
                window.webContents.send('menu-clear-data');
              }
            }
          }
        ]
      },

      // Bookmarks Menu
      {
        label: 'Bookmarks',
        submenu: [
          {
            label: 'Bookmark This Page...',
            accelerator: 'CmdOrCtrl+D',
            click: () => {
              const window = BrowserWindow.getFocusedWindow();
              if (window) {
                window.webContents.send('menu-bookmark-page');
              }
            }
          },
          {
            label: 'Bookmark All Tabs...',
            click: () => {
              const window = BrowserWindow.getFocusedWindow();
              if (window) {
                window.webContents.send('menu-bookmark-all-tabs');
              }
            }
          },
          { type: 'separator' as const },
          {
            label: 'Show Bookmarks Bar',
            type: 'checkbox',
            checked: false,
            click: () => {
              const window = BrowserWindow.getFocusedWindow();
              if (window) {
                window.webContents.send('menu-toggle-bookmarks-bar');
              }
            }
          },
          {
            label: 'Show All Bookmarks',
            accelerator: 'CmdOrCtrl+Shift+B',
            click: () => {
              const window = BrowserWindow.getFocusedWindow();
              if (window) {
                window.webContents.send('menu-show-bookmarks');
              }
            }
          },
          { type: 'separator' as const },
          {
            label: 'Import Bookmarks and Settings...',
            click: () => {
              const window = BrowserWindow.getFocusedWindow();
              if (window) {
                window.webContents.send('menu-import-bookmarks');
              }
            }
          },
          {
            label: 'Export Bookmarks...',
            click: () => {
              const window = BrowserWindow.getFocusedWindow();
              if (window) {
                window.webContents.send('menu-export-bookmarks');
              }
            }
          }
        ]
      },

      // Window Menu
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' as const, label: 'Minimize' },
          { role: 'zoom' as const, label: 'Zoom' },
          { type: 'separator' as const },
          { role: 'front' as const, label: 'Bring All to Front' },
          { type: 'separator' as const },
          {
            label: 'Select Next Tab',
            accelerator: 'Ctrl+Tab',
            click: () => {
              const window = BrowserWindow.getFocusedWindow();
              if (window) {
                window.webContents.send('menu-next-tab');
              }
            }
          },
          {
            label: 'Select Previous Tab',
            accelerator: 'Ctrl+Shift+Tab',
            click: () => {
              const window = BrowserWindow.getFocusedWindow();
              if (window) {
                window.webContents.send('menu-previous-tab');
              }
            }
          }
        ]
      },

      // Help Menu
      {
        label: 'Help',
        submenu: [
          {
            label: 'Visit Omnior Website',
            click: () => {
              shell.openExternal('https://omnior.browser');
            }
          },
          {
            label: 'Documentation',
            click: () => {
              shell.openExternal('https://docs.omnior.browser');
            }
          },
          {
            label: 'Report Issue',
            click: () => {
              shell.openExternal('https://github.com/ancourn/omnior-browser/issues');
            }
          },
          { type: 'separator' as const },
          {
            label: 'Check for Updates...',
            click: () => {
              const window = BrowserWindow.getFocusedWindow();
              if (window) {
                window.webContents.send('menu-check-updates');
              }
            }
          },
          { type: 'separator' as const },
          { role: 'about' as const, label: 'About Omnior' }
        ]
      }
    ];
  }
}