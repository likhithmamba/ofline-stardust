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
    stream: (params, onChunk, onDone, onError) => {
      const channel = `ollama-stream-${Date.now()}-${Math.random()}`;

      const chunkListener = (event, chunk) => onChunk(chunk);
      const doneListener = (event, result) => {
        cleanup();
        onDone(result);
      };
      const errorListener = (event, error) => {
        cleanup();
        if (onError) onError(error);
      };

      const cleanup = () => {
        ipcRenderer.removeListener(`${channel}:chunk`, chunkListener);
        ipcRenderer.removeListener(`${channel}:done`, doneListener);
        ipcRenderer.removeListener(`${channel}:error`, errorListener);
      };

      ipcRenderer.on(`${channel}:chunk`, chunkListener);
      ipcRenderer.on(`${channel}:done`, doneListener);
      ipcRenderer.on(`${channel}:error`, errorListener);

      ipcRenderer.send('ollama:stream', { ...params, channel });
    }
  },
  // App utilities
  app: {
    openOllamaDownload: () => ipcRenderer.invoke('app:openOllamaDownload'),
    showDialog: (options) => ipcRenderer.invoke('app:showDialog', options),
  },
  // Check if we're running in Electron
  isElectron: true,
});
