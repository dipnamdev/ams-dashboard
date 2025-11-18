import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getStoreValue: (key) => ipcRenderer.invoke('get-store-value', key),
  setStoreValue: (key, value) => ipcRenderer.invoke('set-store-value', key, value),
  
  getIdleTime: () => ipcRenderer.invoke('get-idle-time'),
  
  startTracking: () => ipcRenderer.send('start-tracking'),
  stopTracking: () => ipcRenderer.send('stop-tracking'),
  updateTrayStatus: (status) => ipcRenderer.send('update-tray-status', status),
  
  markInNow: () => ipcRenderer.send('mark-in-now'),
  later: () => ipcRenderer.send('later'),
  
  showNotification: (title, body) => ipcRenderer.send('show-notification', { title, body }),
  
  onUserIdle: (callback) => ipcRenderer.on('user-idle', (event, data) => callback(data)),
  onAutoMarkIn: (callback) => ipcRenderer.on('auto-mark-in', callback),
  onActionMarkIn: (callback) => ipcRenderer.on('action-mark-in', callback),
  onActionMarkOut: (callback) => ipcRenderer.on('action-mark-out', callback),
  onActionLunchOut: (callback) => ipcRenderer.on('action-lunch-out', callback),
  onActionLunchIn: (callback) => ipcRenderer.on('action-lunch-in', callback),
  onNavigateTo: (callback) => ipcRenderer.on('navigate-to', (event, path) => callback(path)),
  
  loginSuccess: () => ipcRenderer.send('login-success'),
});
