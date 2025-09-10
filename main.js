const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Start the Express server in-process
require(path.join(__dirname, 'server.js'));

const SERVER_PORT = process.env.PORT || 3000;
const configPath = path.join(app.getPath('userData'), 'config.json');
let selectedDeviceId = null;

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(data);
      selectedDeviceId = config.audioDeviceId || null;
    }
  } catch (e) { selectedDeviceId = null; }
}

function saveConfig() {
  fs.writeFileSync(configPath, JSON.stringify({ audioDeviceId: selectedDeviceId }));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  win.loadURL(`http://localhost:${SERVER_PORT}`);

  // // Open DevTools by default
  // win.webContents.openDevTools({ mode: 'detach' });

  // Add right-click context menu for Inspect Element
  // win.webContents.on('context-menu', (event, params) => {
  //   win.webContents.inspectElement(params.x, params.y);
  // });

  win.on('closed', () => {
    app.quit();
  });

  // Add menu for audio device selection

  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            win.reload();
          }
        },
        { role: 'quit' }
      ]
    },
    {
      label: 'Audio',
      submenu: [
        {
          label: 'Select Output Device',
          click: async () => {
            // Open device selector window
            const selectorWin = new BrowserWindow({
              width: 400,
              height: 600,
              parent: win,
              modal: true,
              webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'deviceSelectorPreload.js'),
              }
            });
            selectorWin.loadFile(path.join(__dirname, 'deviceSelector.html'));

            // Listen for device-selected from picker window
            const { ipcMain } = require('electron');
            ipcMain.once('device-selected', (event, deviceId) => {
              win.webContents.send('set-device', deviceId);
              selectedDeviceId = deviceId;
              saveConfig();
              selectorWin.close();
            });
          }
        }
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);

  // Listen for device list from renderer and show dialog
  const { dialog } = require('electron');
  const { ipcMain } = require('electron');
  ipcMain.removeAllListeners('device-list');
  ipcMain.on('device-list', async (event, devices) => {
    if (!devices || devices.length === 0) {
      await dialog.showMessageBox(win, {
        type: 'info',
        buttons: ['OK'],
        title: 'No Devices Found',
        message: 'No audio output devices were found.'
      });
      return;
    }
    const deviceNames = devices.map(d => d.label || d.deviceId);
    const result = await dialog.showMessageBox(win, {
      type: 'question',
      buttons: deviceNames,
      title: 'Select Audio Output Device',
      message: 'Choose an audio output device for SoundBox:',
      noLink: true
    });
    const selectedIndex = result.response;
    if (devices[selectedIndex]) {
      win.webContents.send('set-device', devices[selectedIndex].deviceId);
      selectedDeviceId = devices[selectedIndex].deviceId;
      saveConfig();
    }
  });
}

// IPC handlers for device management
ipcMain.handle('get-audio-output-devices', async () => {
  // Use Chromium API in renderer, so just proxy
  return null;
});
ipcMain.handle('set-audio-output-device', async (event, deviceId) => {
  selectedDeviceId = deviceId;
  saveConfig();
  return true;
});
ipcMain.handle('get-selected-audio-device', async () => {
  return selectedDeviceId;
});

app.whenReady().then(() => {
  loadConfig();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
