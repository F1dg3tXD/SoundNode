const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('audioDevices', {
  getOutputDevices: async () => {
    return await ipcRenderer.invoke('get-audio-output-devices');
  },
  setOutputDevice: async (deviceId) => {
    return await ipcRenderer.invoke('set-audio-output-device', deviceId);
  },
  getSelectedDevice: async () => {
    return await ipcRenderer.invoke('get-selected-audio-device');
  }
});
