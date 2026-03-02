const { contextBridge, ipcRenderer } = require('electron');

// Expose Ollama API to the renderer process safely
contextBridge.exposeInMainWorld('electronAPI', {
  // Ollama
  ollama: {
    status: () => ipcRenderer.invoke('ollama:status'),
    models: () => ipcRenderer.invoke('ollama:models'),
    start: () => ipcRenderer.invoke('ollama:start'),
    generate: (params) => ipcRenderer.invoke('ollama:generate', params),
    chat: (params) => ipcRenderer.invoke('ollama:chat', params),
    pull: (params) => ipcRenderer.invoke('ollama:pull', params),
  },
  // App utilities
  app: {
    openOllamaDownload: () => ipcRenderer.invoke('app:openOllamaDownload'),
    showDialog: (options) => ipcRenderer.invoke('app:showDialog', options),
  },
  // Check if we're running in Electron
  isElectron: true,
});
