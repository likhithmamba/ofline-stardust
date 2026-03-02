import React, { useState, useEffect } from 'react';
import { checkOllamaStatus, getSelectedModel } from '../utils/ai';
import { useStore } from '../store/useStore';

export const OllamaStatusBar: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const setSettingsOpen = useStore(s => s.setSettingsOpen);

  useEffect(() => {
    const check = async () => {
      const ok = await checkOllamaStatus();
      setIsOnline(ok);
    };
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  if (isOnline === null) return null;

  return (
    <button
      onClick={() => setSettingsOpen(true)}
      className={`absolute top-4 right-4 z-50 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border backdrop-blur-sm transition-colors ${
        isOnline
          ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
          : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
      }`}
      title="AI Status — click to open Settings"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
      {isOnline ? `AI: ${getSelectedModel()}` : 'AI: Offline'}
    </button>
  );
};
