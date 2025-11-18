import { app, BrowserWindow, ipcMain, Tray, Menu, powerMonitor, Notification } from 'electron';
import Store from 'electron-store';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const store = new Store();
let mainWindow = null;
let tray = null;
let checkinPromptWindow = null;
let screenshotInterval = null;
let heartbeatInterval = null;
let idleCheckInterval = null;

function getApiBaseUrl() {
  return store.get('apiUrl', 'http://localhost:3000');
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

function createCheckinPromptWindow() {
  checkinPromptWindow = new BrowserWindow({
    width: 400,
    height: 200,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    center: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const promptHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          padding: 20px;
          font-family: Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
        }
        h2 { margin: 0 0 20px 0; }
        .buttons {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        button {
          padding: 10px 20px;
          font-size: 14px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
        }
        .mark-in {
          background: #10b981;
          color: white;
        }
        .later {
          background: #6b7280;
          color: white;
        }
        button:hover {
          opacity: 0.9;
        }
      </style>
    </head>
    <body>
      <h2>Mark In for today?</h2>
      <p>Would you like to check in now?</p>
      <div class="buttons">
        <button class="mark-in" onclick="window.electronAPI.markInNow()">Mark In Now</button>
        <button class="later" onclick="window.electronAPI.later()">Later</button>
      </div>
    </body>
    </html>
  `;

  checkinPromptWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(promptHtml)}`);
}

function createTray() {
  const iconPath = path.join(__dirname, '../public/icon.png');
  tray = new Tray(iconPath);
  updateTrayMenu('Not Marked In');
}

function updateTrayMenu(status) {
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Attendance Tracker', enabled: false },
    { type: 'separator' },
    { label: `Status: ${status}`, enabled: false },
    { type: 'separator' },
    { label: 'Mark In', click: () => mainWindow?.webContents.send('action-mark-in') },
    { label: 'Mark Out', click: () => mainWindow?.webContents.send('action-mark-out') },
    { label: 'Lunch Out', click: () => mainWindow?.webContents.send('action-lunch-out') },
    { label: 'Lunch In', click: () => mainWindow?.webContents.send('action-lunch-in') },
    { type: 'separator' },
    { label: 'Open Dashboard', click: () => { mainWindow?.show(); } },
    { label: 'Settings', click: () => { mainWindow?.show(); mainWindow?.webContents.send('navigate-to', '/settings'); } },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } },
  ]);
  tray.setContextMenu(contextMenu);
  tray.setToolTip('Attendance Tracker');
}

async function performAutoCheckout() {
  const token = store.get('jwt_token');
  if (token) {
    try {
      const apiUrl = getApiBaseUrl();
      await axios.post(`${apiUrl}/api/attendance/check-out`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Auto check-out successful');
    } catch (error) {
      console.error('Auto check-out failed:', error.message);
    }
  }
}

function startBackgroundServices() {
  const token = store.get('jwt_token');
  if (!token) return;

  screenshotInterval = setInterval(async () => {
    try {
      const result = await captureScreenshot();
      if (result.success) {
        new Notification({ title: 'Screenshot Captured', body: 'Activity screenshot has been saved' }).show();
      }
    } catch (error) {
      console.error('Screenshot capture error:', error);
    }
  }, (store.get('screenshotInterval', 10)) * 60 * 1000);

  heartbeatInterval = setInterval(async () => {
    try {
      await sendActivityHeartbeat();
    } catch (error) {
      console.error('Heartbeat error:', error);
    }
  }, 30 * 1000);

  idleCheckInterval = setInterval(() => {
    const idleTime = powerMonitor.getSystemIdleTime();
    const idleThreshold = store.get('idleThreshold', 5) * 60;
    
    if (idleTime > idleThreshold) {
      const idleMinutes = Math.floor(idleTime / 60);
      mainWindow?.webContents.send('user-idle', { idleMinutes });
      
      if (store.get('showIdleNotifications', true)) {
        new Notification({
          title: 'Inactive Detected',
          body: `You have been inactive for ${idleMinutes} minutes`
        }).show();
      }
    }
  }, 30 * 1000);
}

function stopBackgroundServices() {
  if (screenshotInterval) clearInterval(screenshotInterval);
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  if (idleCheckInterval) clearInterval(idleCheckInterval);
}

async function captureScreenshot() {
  return { success: false, message: 'Screenshot functionality requires additional setup' };
}

async function sendActivityHeartbeat() {
  const token = store.get('jwt_token');
  if (!token) return;

  const idleTime = powerMonitor.getSystemIdleTime();
  const apiUrl = getApiBaseUrl();
  
  try {
    await axios.post(`${apiUrl}/api/activity/heartbeat`, {
      timestamp: new Date().toISOString(),
      active_window_title: 'Attendance Tracker',
      active_application: 'attendance-tracker',
      mouse_clicks: 0,
      keyboard_strokes: 0,
      is_active: idleTime < 60,
      idle_time_seconds: idleTime
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (error) {
    console.error('Heartbeat failed:', error.message);
  }
}

app.setLoginItemSettings({
  openAtLogin: store.get('autoStart', true)
});

app.on('ready', () => {
  const token = store.get('jwt_token');
  
  if (token) {
    createCheckinPromptWindow();
  } else {
    createMainWindow();
  }
  
  createTray();
});

app.on('window-all-closed', (event) => {
  event.preventDefault();
});

app.on('before-quit', async (event) => {
  if (!app.isQuitting) {
    event.preventDefault();
    app.isQuitting = true;
    
    stopBackgroundServices();
    await performAutoCheckout();
    
    app.exit(0);
  }
});

ipcMain.handle('get-store-value', (event, key) => {
  return store.get(key);
});

ipcMain.handle('set-store-value', (event, key, value) => {
  store.set(key, value);
  return true;
});

ipcMain.handle('get-idle-time', () => {
  return powerMonitor.getSystemIdleTime();
});

ipcMain.on('start-tracking', () => {
  startBackgroundServices();
  updateTrayMenu('Active');
});

ipcMain.on('stop-tracking', () => {
  stopBackgroundServices();
  updateTrayMenu('Not Marked In');
});

ipcMain.on('update-tray-status', (event, status) => {
  updateTrayMenu(status);
});

ipcMain.on('mark-in-now', async () => {
  if (checkinPromptWindow) {
    checkinPromptWindow.close();
    checkinPromptWindow = null;
  }
  createMainWindow();
  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow.webContents.send('auto-mark-in');
  });
});

ipcMain.on('later', () => {
  if (checkinPromptWindow) {
    checkinPromptWindow.close();
    checkinPromptWindow = null;
  }
  createMainWindow();
});

ipcMain.on('show-notification', (event, { title, body }) => {
  new Notification({ title, body }).show();
});

ipcMain.on('login-success', () => {
  if (!mainWindow) {
    createMainWindow();
  }
});
