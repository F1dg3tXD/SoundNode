// deviceSelectorPreload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('deviceSelector', {
  selectDevice: (deviceId) => {
    ipcRenderer.send('device-selected', deviceId);
  }
});
