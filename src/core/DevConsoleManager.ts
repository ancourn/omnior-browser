import { BrowserWindow, ipcMain } from 'electron';

let devConsoleWindow: BrowserWindow | null = null;

export const createDevConsole = (parent: BrowserWindow) => {
  if (devConsoleWindow) {
    devConsoleWindow.focus();
    return;
  }

  devConsoleWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'Omnior DevConsole',
    parent,
    modal: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Load the DevConsole HTML file
  devConsoleWindow.loadFile(`${__dirname}/../../ui/devconsole/index.html`);
  
  devConsoleWindow.on('closed', () => {
    devConsoleWindow = null;
  });
};

export const closeDevConsole = () => {
  if (devConsoleWindow) {
    devConsoleWindow.close();
    devConsoleWindow = null;
  }
};

export const toggleDevConsole = (parent: BrowserWindow) => {
  if (devConsoleWindow) {
    closeDevConsole();
  } else {
    createDevConsole(parent);
  }
};

// Set up IPC handler for opening DevConsole
ipcMain.handle('omnior:openDevConsole', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    createDevConsole(window);
  }
});