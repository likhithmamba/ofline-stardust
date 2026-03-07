
const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

// ─── Config ───────────────────────────────────────────────────────────────────
const OLLAMA_BASE_URL = 'http://localhost:11434';
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow = null;
let ollamaProcess = null;

// ─── Window ───────────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Stardust — Offline AI Canvas',
    icon: path.join(__dirname, '../build/icon.png'),
    backgroundColor: '#020617',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f172a',
      symbolColor: '#94a3b8',
      height: 32,
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Only open devtools if explicitly requested
    if (process.env.DEVTOOLS === '1') {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => { mainWindow = null; });

  // Open external links in real browser (with security validation)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
        shell.openExternal(url);
      } else {
        console.warn(`[Security] Blocked attempt to open unsafe URL: ${url}`);
      }
    } catch (e) {
      console.warn(`[Security] Blocked attempt to open invalid URL: ${url}`);
    }
    return { action: 'deny' };
  });

  // Notify renderer that we're in Electron (for title bar spacing)
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(
      `document.body.classList.add('electron-app')`
    );
  });
}

// ─── Ollama Helpers ───────────────────────────────────────────────────────────
function isOllamaRunning() {
  return new Promise((resolve) => {
    http.get(`${OLLAMA_BASE_URL}/api/tags`, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
  });
}

function getOllamaModels() {
  return new Promise((resolve, reject) => {
    http.get(`${OLLAMA_BASE_URL}/api/tags`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.models || []);
        } catch {
          resolve([]);
        }
      });
    }).on('error', reject);
  });
}

function startOllama() {
  return new Promise((resolve) => {
    // Try to find ollama in common locations
    const locations = [
      'ollama',
      'C:\\Program Files\\Ollama\\ollama.exe',
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Ollama', 'ollama.exe'),
      path.join(process.env.USERPROFILE || '', 'AppData', 'Local', 'Programs', 'Ollama', 'ollama.exe'),
    ];

    const tryNext = (i) => {
      if (i >= locations.length) {
        console.log('Ollama not found in PATH or common locations');
        resolve(false);
        return;
      }
      try {
        ollamaProcess = spawn(locations[i], ['serve'], {
          detached: false,
          stdio: 'ignore',
          windowsHide: true,
        });

        ollamaProcess.on('error', () => tryNext(i + 1));
        ollamaProcess.on('spawn', () => {
          console.log('Ollama started via:', locations[i]);
          // Wait for it to be ready
          let attempts = 0;
          const check = setInterval(async () => {
            attempts++;
            if (await isOllamaRunning()) {
              clearInterval(check);
              resolve(true);
            } else if (attempts > 30) {
              clearInterval(check);
              resolve(false);
            }
          }, 500);
        });
      } catch {
        tryNext(i + 1);
      }
    };

    tryNext(0);
  });
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────
ipcMain.handle('ollama:status', async () => {
  const running = await isOllamaRunning();
  return { running };
});

ipcMain.handle('ollama:models', async () => {
  try {
    const models = await getOllamaModels();
    return { models };
  } catch {
    return { models: [] };
  }
});

ipcMain.handle('ollama:start', async () => {
  const already = await isOllamaRunning();
  if (already) return { started: true };
  const started = await startOllama();
  return { started };
});

ipcMain.handle('ollama:generate', async (_event, { model, prompt }) => {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model,
      prompt,
      stream: false,
      options: { temperature: 0.7, num_predict: 600 }
    });

    const req = http.request({
      hostname: 'localhost',
      port: 11434,
      path: '/api/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 120000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ text: json.response || '', error: null });
        } catch {
          reject(new Error('Failed to parse Ollama response'));
        }
      });
    });

    req.on('error', (err) => reject(new Error(`Ollama connection error: ${err.message}`)));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Ollama request timed out (2 min)'));
    });
    req.write(body);
    req.end();
  });
});

ipcMain.handle('ollama:chat', async (_event, { model, messages }) => {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model,
      messages,
      stream: false,
      options: { temperature: 0.7, num_predict: 800 }
    });

    const req = http.request({
      hostname: 'localhost',
      port: 11434,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 120000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ text: json.message?.content || '', error: null });
        } catch {
          reject(new Error('Failed to parse Ollama chat response'));
        }
      });
    });

    req.on('error', (err) => reject(new Error(`Ollama connection error: ${err.message}`)));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Ollama chat request timed out (2 min)'));
    });
    req.write(body);
    req.end();
  });
});

ipcMain.on('ollama:stream', (_event, { model, prompt, messages, channel }) => {
  const isChat = !!messages;
  const endpoint = isChat ? '/api/chat' : '/api/generate';
  const body = JSON.stringify({
    model,
    ...(isChat ? { messages } : { prompt }),
    stream: true,
    options: { temperature: 0.7, num_predict: 800 }
  });

  const req = http.request({
    hostname: 'localhost',
    port: 11434,
    path: endpoint,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
    timeout: 120000,
  }, (res) => {
    res.on('data', chunk => {
      try {
        const lines = chunk.toString().split('\n').filter(l => l.trim().length > 0);
        for (const line of lines) {
          const json = JSON.parse(line);
          const text = isChat ? (json.message?.content || '') : (json.response || '');
          _event.sender.send(`${channel}:chunk`, text);
          if (json.done) {
            _event.sender.send(`${channel}:done`, { success: true });
          }
        }
      } catch (e) {
        // Ignore partial chunk parsing errors, NdJSON safe line split above is robust
      }
    });

    res.on('end', () => { });
  });

  req.on('error', (err) => {
    _event.sender.send(`${channel}:error`, `Ollama stream error: ${err.message}`);
  });

  req.on('timeout', () => {
    req.destroy();
    _event.sender.send(`${channel}:error`, 'Ollama stream request timed out');
  });

  req.write(body);
  req.end();
});

ipcMain.handle('ollama:pull', async (_event, { model }) => {
  return new Promise((resolve) => {
    const body = JSON.stringify({ name: model, stream: false });
    const req = http.request({
      hostname: 'localhost',
      port: 11434,
      path: '/api/pull',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout: 600000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ success: true }));
    });
    req.on('error', () => resolve({ success: false }));
    req.write(body);
    req.end();
  });
});

ipcMain.handle('app:openOllamaDownload', () => {
  // Hardcoded HTTPS URL is safe
  shell.openExternal('https://ollama.com/download');
});

ipcMain.handle('app:showDialog', async (_event, options) => {
  return dialog.showMessageBox(mainWindow, options);
});

// ─── App Lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  createWindow();

  // Try to auto-start Ollama
  const running = await isOllamaRunning();
  if (!running) {
    console.log('Ollama not running, attempting auto-start...');
    await startOllama();
  } else {
    console.log('Ollama already running');
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (ollamaProcess) {
    try { ollamaProcess.kill(); } catch { }
  }
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (ollamaProcess) {
    try { ollamaProcess.kill(); } catch { }
  }
});
