
import { useEffect, useState } from 'react';
import { CanvasViewport } from './components/CanvasViewport';
import { useStore } from './store/useStore';
import { useNoteStore } from './store/useNoteStore';
import { AutoConnectModal } from './components/AutoConnectModal';
import { HistoryPanel } from './components/HistoryPanel';

function App() {
    const isAutoConnectOpen = useStore(s => s.isAutoConnectOpen);
    const setAutoConnectOpen = useStore(s => s.setAutoConnectOpen);

    const isHistoryOpen = useStore(s => s.isHistoryOpen);
    const setHistoryOpen = useStore(s => s.setHistoryOpen);

    const isLoaded = useNoteStore(s => s.isLoaded);
    const [initDone, setInitDone] = useState(false);

    // App init sequence: load note metadata from IndexedDB once on mount
    useEffect(() => {
        useNoteStore.getState().loadFromDB().then(() => {
            setInitDone(true);
        });
    }, []);

    // Show loading state while notes hydrate from IndexedDB
    if (!initDone || !isLoaded) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-slate-950">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white/40 text-sm tracking-widest uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        Loading Stardust...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <CanvasViewport />
            <AutoConnectModal isOpen={isAutoConnectOpen} onClose={() => setAutoConnectOpen(false)} />
            <HistoryPanel isOpen={isHistoryOpen} onClose={() => setHistoryOpen(false)} />
        </>
    );
}

export default App;
