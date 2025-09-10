const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

const SERVER_PORT = process.env.PORT || 3000;
let serverProcess = null;

function startServer() {
  // Spawn server.js as a child Node process
  const serverPath = path.join(__dirname, 'server.js');
  serverProcess = spawn(process.execPath, [serverPath], {
    cwd: __dirname,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  serverProcess.stdout.on('data', data => {
    const text = data.toString();
    console.log('[server]', text);
    // When server logs the ready message, resolve to load the window
  });
  serverProcess.stderr.on('data', data => console.error('[server][err]', data.toString()));
  serverProcess.on('exit', (code) => console.log(`Server exited with ${code}`));

  return new Promise((resolve) => {
    const check = () => {
      const http = require('http');
      const req = http.request({ method: 'GET', host: '127.0.0.1', port: SERVER_PORT, path: '/' }, res => {
        resolve();
      });
      req.on('error', () => setTimeout(check, 200));
      req.end();
    };
    check();
  });
}

async function createWindow() {
  await startServer();

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
    // shutdown server when window closes
    if (serverProcess) {
      serverProcess.kill();
      serverProcess = null;
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
