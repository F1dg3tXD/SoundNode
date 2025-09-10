const { app, BrowserWindow } = require('electron');
const path = require('path');

// Start the Express server in-process
require(path.join(__dirname, 'server.js'));

const SERVER_PORT = process.env.PORT || 3000;

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  win.loadURL(`http://localhost:${SERVER_PORT}`);

  win.on('closed', () => {
    app.quit();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
