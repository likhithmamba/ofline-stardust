
const { app, BrowserWindow, ipcMain, shell, dialog, session } = require('electron');
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
      // ✅ SENTINEL FIX: sandbox must be false when preload uses require('electron')
      // contextBridge + ipcRenderer work correctly without sandbox.
      // If you migrate preload to ESM / no-require, set this to true.
      sandbox: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    if (process.env.DEVTOOLS === '1') {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => { mainWindow = null; });

  // ✅ SENTINEL FIX: Only open safe protocols in external browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsedUrl = new URL(url);
      const safeProtocols = ['http:', 'https:', 'mailto:'];
      if (safeProtocols.includes(parsedUrl.protocol)) {
        shell.openExternal(url);
      }
    } catch {
      // Ignore malformed URLs
    }
    return { action: 'deny' };
  });

  // ✅ SENTINEL FIX: Validate URL before opening in shell throughout the app
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    // In production, block navigation away from file:// or localhost
    if (!isDev && parsedUrl.protocol !== 'file:') {
      event.preventDefault();
    }
  });

  // Notify renderer that we're in Electron (for title bar spacing)
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.executeJavaScript(
      `document.body.classList.add('electron-app')`
    );
  });
}

// ─── Ollama Helpers ───────────────────────────────────────────────────────────
function isOllamaRunning() {
  return new Promise((resolve) => {
    const req = http.get(`${OLLAMA_BASE_URL}/api/tags`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => { req.destroy(); resolve(false); });
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

    req.on('error', (err) => resolve({ text: '', error: `Ollama connection error: ${err.message}` }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ text: '', error: 'Ollama request timed out (2 min)' });
    });
    req.write(body);
    req.end();
  });
});

ipcMain.handle('ollama:chat', async (_event, { model, messages }) => {
  return new Promise((resolve) => {
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
          resolve({ text: '', error: 'Failed to parse Ollama chat response' });
        }
      });
    });

    req.on('error', (err) => resolve({ text: '', error: `Ollama connection error: ${err.message}` }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ text: '', error: 'Ollama chat request timed out (2 min)' });
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
    let buffer = '';
    res.on('data', chunk => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          const text = isChat ? (json.message?.content || '') : (json.response || '');
          if (text) _event.sender.send(`${channel}:chunk`, text);
          if (json.done) {
            _event.sender.send(`${channel}:done`, { success: true });
          }
        } catch {
          // Ignore partial JSON parse errors
        }
      }
    });

    res.on('end', () => {
      // Flush any remaining buffer
      if (buffer.trim()) {
        try {
          const json = JSON.parse(buffer);
          const text = isChat ? (json.message?.content || '') : (json.response || '');
          if (text) _event.sender.send(`${channel}:chunk`, text);
        } catch { }
      }
      _event.sender.send(`${channel}:done`, { success: true });
    });
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

// ✅ SENTINEL FIX: Validate URL before opening external links via IPC
ipcMain.handle('app:openOllamaDownload', () => {
  // Hardcoded safe URL — no user input involved
  shell.openExternal('https://ollama.com/download');
});

ipcMain.handle('app:showDialog', async (_event, options) => {
  if (!mainWindow) return;
  return dialog.showMessageBox(mainWindow, options);
});

// ─── App Lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // P3: Content Security Policy header
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self'; " +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
          "font-src 'self' https://fonts.gstatic.com; " +
          "img-src 'self' data: blob:; " +
          "connect-src 'self' http://localhost:11434 ws://localhost:*; " +
          "worker-src 'self' blob:;"
        ],
      },
    });
  });

  createWindow();

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
