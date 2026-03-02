import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import {
  checkOllamaStatus,
  getOllamaModels,
  startOllama,
  pullOllamaModel,
  saveSelectedModel,
  getSelectedModel,
} from '../utils/ai';

type OllamaStatus = 'checking' | 'running' | 'stopped' | 'starting';

const RECOMMENDED_MODELS = [
  { id: 'llama3.2', label: 'Llama 3.2 (3B) — Fast, great for notes' },
  { id: 'llama3.2:1b', label: 'Llama 3.2 (1B) — Lightest, very fast' },
  { id: 'llama3.1', label: 'Llama 3.1 (8B) — Smarter, slower' },
  { id: 'mistral', label: 'Mistral 7B — Creative writing' },
  { id: 'gemma2:2b', label: 'Gemma 2 (2B) — Balanced' },
  { id: 'phi3.5', label: 'Phi 3.5 Mini — Microsoft, efficient' },
];

export const SettingsPanel: React.FC = () => {
  const isSettingsOpen = useStore((state) => state.isSettingsOpen);
  const setSettingsOpen = useStore((state) => state.setSettingsOpen);

  const [status, setStatus] = useState<OllamaStatus>('checking');
  const [installedModels, setInstalledModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState(getSelectedModel());
  const [isPulling, setIsPulling] = useState(false);
  const [pullModel, setPullModel] = useState('llama3.2');
  const [pullStatus, setPullStatus] = useState('');
  const [saveMsg, setSaveMsg] = useState('');

  const refreshStatus = useCallback(async () => {
    setStatus('checking');
    const running = await checkOllamaStatus();
    setStatus(running ? 'running' : 'stopped');
    if (running) {
      const models = await getOllamaModels();
      setInstalledModels(models);
    }
  }, []);

  useEffect(() => {
    if (isSettingsOpen) refreshStatus();
  }, [isSettingsOpen, refreshStatus]);

  const handleStartOllama = async () => {
    setStatus('starting');
    const started = await startOllama();
    if (started) {
      await refreshStatus();
    } else {
      setStatus('stopped');
      if ((window as any).electronAPI) {
        await (window as any).electronAPI.app.openOllamaDownload();
      } else {
        window.open('https://ollama.com/download', '_blank');
      }
    }
  };

  const handleSaveModel = () => {
    saveSelectedModel(selectedModel);
    setSaveMsg('Model saved!');
    setTimeout(() => setSaveMsg(''), 2000);
  };

  const handlePull = async () => {
    if (!pullModel.trim()) return;
    setIsPulling(true);
    setPullStatus(`Downloading ${pullModel}... (this may take a few minutes)`);
    const ok = await pullOllamaModel(pullModel.trim());
    setIsPulling(false);
    if (ok) {
      setPullStatus(`✅ ${pullModel} downloaded!`);
      await refreshStatus();
    } else {
      setPullStatus(`❌ Failed to download ${pullModel}`);
    }
    setTimeout(() => setPullStatus(''), 4000);
  };

  if (!isSettingsOpen) return null;

  const statusColor = {
    checking: 'text-yellow-400',
    running: 'text-green-400',
    stopped: 'text-red-400',
    starting: 'text-blue-400',
  }[status];

  const statusLabel = {
    checking: '⟳ Checking...',
    running: '● Running',
    stopped: '○ Not running',
    starting: '⟳ Starting...',
  }[status];

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-[480px] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-800 px-6 py-4 flex justify-between items-center border-b border-slate-700">
          <div>
            <h2 className="text-white font-bold text-lg">AI Settings</h2>
            <p className="text-slate-400 text-xs mt-0.5">Powered by Ollama — 100% offline</p>
          </div>
          <button onClick={() => setSettingsOpen(false)} className="text-slate-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Ollama Status */}
          <div className="bg-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-slate-300 text-sm font-medium">Ollama Status</p>
              <p className={`text-sm font-mono mt-1 ${statusColor}`}>{statusLabel}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={refreshStatus}
                className="px-3 py-1.5 text-xs text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg"
              >
                Refresh
              </button>
              {status === 'stopped' && (
                <button
                  onClick={handleStartOllama}
                  className="px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-500 rounded-lg"
                >
                  Start / Install
                </button>
              )}
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Active Model</label>
            {installedModels.length > 0 ? (
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500"
              >
                {installedModels.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            ) : (
              <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-500 text-sm">
                {status === 'running' ? 'No models installed yet' : 'Start Ollama to see installed models'}
              </div>
            )}
            <div className="flex justify-between items-center mt-2">
              <span className="text-green-400 text-xs">{saveMsg}</span>
              <button
                onClick={handleSaveModel}
                disabled={installedModels.length === 0}
                className="px-4 py-1.5 text-xs bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-lg"
              >
                Apply Model
              </button>
            </div>
          </div>

          {/* Download New Model */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Download a Model</label>
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {RECOMMENDED_MODELS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setPullModel(m.id)}
                  className={`text-left px-2.5 py-2 rounded-lg text-xs border transition-colors ${
                    pullModel === m.id
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                  }`}
                >
                  <div className="font-medium text-white/90 truncate">{m.id}</div>
                  <div className="text-slate-500 mt-0.5 text-[10px] leading-tight line-clamp-1">{m.label.split('—')[1]}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={pullModel}
                onChange={e => setPullModel(e.target.value)}
                placeholder="Custom model (e.g. mixtral)"
                className="flex-1 bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500 placeholder-slate-500"
              />
              <button
                onClick={handlePull}
                disabled={isPulling || status !== 'running'}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm rounded-lg whitespace-nowrap"
              >
                {isPulling ? '↓ Pulling...' : '↓ Download'}
              </button>
            </div>
            {pullStatus && (
              <p className="text-xs mt-2 text-slate-400">{pullStatus}</p>
            )}
          </div>

          {/* Help */}
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <p className="text-slate-500 text-xs leading-relaxed">
              <span className="text-slate-300 font-medium">New to Ollama?</span> Download it free from{' '}
              <button
                onClick={() => (window as any).electronAPI?.app.openOllamaDownload() || window.open('https://ollama.com/download', '_blank')}
                className="text-blue-400 hover:underline"
              >
                ollama.com
              </button>
              {' '}and install it. Then press "Start" above. All AI runs locally — no cloud, no API keys, no data sent anywhere.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
