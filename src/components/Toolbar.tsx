
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
    Plus, Trash2, Upload, Download, Map, Search,
    Share2, HelpCircle, Layout, Sparkles, Settings, Network, History, Filter
} from 'lucide-react';
import { NoteType } from '../constants';


interface ToolbarProps {
    onAIChatToggle: () => void;
    isAIChatOpen: boolean;
    onHelpToggle: () => void;
    onSearchToggle: () => void;
    isTagFilterOpen: boolean;
    onTagFilterToggle: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onAIChatToggle, isAIChatOpen, onHelpToggle, onSearchToggle,
    isTagFilterOpen, onTagFilterToggle
}) => {
    const addNote = useStore((state) => state.addNote);
    const notes = useStore((state) => state.notes);
    const setNotes = useStore((state) => state.setNotes);
    const viewport = useStore((state) => state.viewport);
    const setConnections = useStore((state) => state.setConnections);

    const setSettingsOpen = useStore((state) => state.setSettingsOpen);
    const setExportOpen = useStore((state) => state.setExportOpen);
    const setAutoConnectOpen = useStore((state) => state.setAutoConnectOpen);
    const setHistoryOpen = useStore((state) => state.setHistoryOpen);

    const showMinimap = useStore((state) => state.showMinimap);
    const setShowMinimap = useStore((state) => state.setShowMinimap);
    const showConnections = useStore((state) => state.showConnections);
    const setShowConnections = useStore((state) => state.setShowConnections);
    const scaleMode = useStore((state) => state.scaleMode);
    const setScaleMode = useStore((state) => state.setScaleMode);

    const [importStatus, setImportStatus] = useState('');

    const handleAddDefault = () => {
        const x = -viewport.x / viewport.zoom + window.innerWidth / (2 * viewport.zoom) - 100;
        const y = -viewport.y / viewport.zoom + window.innerHeight / (2 * viewport.zoom) - 50;
        addNote({
            id: Math.random().toString(36).substr(2, 9),
            x, y, w: 240, h: 120,
            type: NoteType.Earth,
            title: 'New Planet',
            color: '#0ea5e9'
        });
    };

    const handleClear = () => {
        if (confirm('Clear the canvas? This cannot be undone.')) {
            setNotes([]);
            setConnections([]);
        }
    };

    const handleExport = () => {
        if (notes.length === 0) return;
        setExportOpen(true);
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            try {
                const text = await file.text();
                const data = JSON.parse(text);

                // Support both formats: { notes, connections } or just notes array
                if (Array.isArray(data)) {
                    setNotes(data);
                    setImportStatus(`Imported ${data.length} notes`);
                } else if (data.notes) {
                    setNotes(data.notes);
                    if (data.connections) setConnections(data.connections);
                    setImportStatus(`Imported ${data.notes.length} notes, ${data.connections?.length || 0} connections`);
                } else {
                    setImportStatus('Invalid file format');
                }
                setTimeout(() => setImportStatus(''), 3000);
            } catch {
                setImportStatus('Failed to parse file');
                setTimeout(() => setImportStatus(''), 3000);
            }
        };
        input.click();
    };

    const Button = ({ onClick, icon: Icon, title, active, badge }: any) => (
        <button
            onClick={onClick}
            className={`p - 2 rounded - lg transition - all hover: bg - white / 10 relative ${active ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'} `}
            title={title}
        >
            <Icon size={18} />
            {badge && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full text-[8px] flex items-center justify-center text-white">
                    {badge}
                </span>
            )}
        </button>
    );

    return (
        <>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 p-2 rounded-full z-50" style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Button onClick={onSearchToggle} icon={Search} title="Search Notes (Ctrl+K)" />

                <div className="w-px h-4 bg-white/10 mx-1" />

                <Button onClick={handleAddDefault} icon={Plus} title="New Planet (Default)" />
                <Button onClick={handleClear} icon={Trash2} title="Clear Canvas" />

                <div className="w-px h-4 bg-white/10 mx-1" />

                <Button onClick={handleImport} icon={Upload} title="Import Notes" />
                <Button onClick={handleExport} icon={Download} title="Export Notes" badge={notes.length > 0 ? undefined : undefined} />

                <div className="w-px h-4 bg-white/10 mx-1" />

                <Button onClick={() => setShowMinimap(!showMinimap)} icon={Map} active={showMinimap} title="Toggle Minimap" />
                <Button onClick={() => setShowConnections(!showConnections)} icon={Share2} active={showConnections} title="Toggle Connections" />
                <Button onClick={() => setScaleMode(scaleMode === 'real' ? 'compact' : 'real')} icon={Layout} active={scaleMode === 'real'} title={`Scale Mode: ${scaleMode} `} />

                {/* Actions */}
                <div className="flex items-center gap-1 border-r border-white/5 pr-2 mr-2">
                    <button
                        onClick={onTagFilterToggle}
                        className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${isTagFilterOpen ? 'text-purple-400 bg-white/10' : 'text-slate-400 hover:text-purple-400 hover:bg-white/5'
                            }`}
                        title="Filter by Tags"
                    >
                        <Filter size={18} />
                    </button>
                    <button
                        onClick={() => setHistoryOpen(true)}
                        className="p-2 text-slate-400 hover:text-purple-400 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
                        title="Canvas History (Snapshots)"
                    >
                        <History size={18} />
                    </button>
                    <button
                        onClick={() => setAutoConnectOpen(true)}
                        className="p-2 text-slate-400 hover:text-purple-400 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2 group relative"
                        title="AI Semantic Connect"
                    >
                        <Network size={18} className="group-hover:animate-pulse" />
                        <span className="hidden lg:inline text-sm font-medium">Auto-Connect</span>
                        <div className="absolute top-0 right-1 w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping" />
                    </button>
                    <button
                        onClick={onAIChatToggle}
                        className={`p - 2 rounded - lg transition - all ${isAIChatOpen ? 'bg-purple-600 text-white' : 'text-purple-400 hover:bg-purple-600/20 hover:text-purple-300'} `}
                        title="AI Chat (local Ollama)"
                    >
                        <Sparkles size={18} />
                    </button>
                </div>

                {/* Settings */}
                <Button onClick={() => setSettingsOpen(true)} icon={Settings} title="Settings & AI Model" />

                <div className="w-px h-4 bg-white/10 mx-1" />
                <Button onClick={onHelpToggle} icon={HelpCircle} title="Help & Shortcuts" />
            </div>

            {/* Import Status Toast */}
            {importStatus && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-green-500/20 border border-green-500/30 text-green-300 text-xs px-4 py-2 rounded-full z-50 backdrop-blur-md">
                    {importStatus}
                </div>
            )}
        </>
    );
};
