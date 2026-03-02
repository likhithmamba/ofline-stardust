
import { CanvasViewport } from './components/CanvasViewport';
import { useStore } from './store/useStore';
import { AutoConnectModal } from './components/AutoConnectModal';
import { HistoryPanel } from './components/HistoryPanel';

function App() {
    const isAutoConnectOpen = useStore(s => s.isAutoConnectOpen);
    const setAutoConnectOpen = useStore(s => s.setAutoConnectOpen);

    const isHistoryOpen = useStore(s => s.isHistoryOpen);
    const setHistoryOpen = useStore(s => s.setHistoryOpen);

    return (
        <>
            <CanvasViewport />
            <AutoConnectModal isOpen={isAutoConnectOpen} onClose={() => setAutoConnectOpen(false)} />
            <HistoryPanel isOpen={isHistoryOpen} onClose={() => setHistoryOpen(false)} />
        </>
    );
}

export default App;
