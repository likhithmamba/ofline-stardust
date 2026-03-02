import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { RichTextEditor } from './editor/RichTextEditor';
import { getSelectedModel } from '../utils/ai';

declare global {
    interface Window {
        electronAPI?: any;
    }
}
import { Sparkles, X, Loader, GripHorizontal } from 'lucide-react';

export const EditorOverlay: React.FC = () => {
    const selectedId = useStore((state) => state.selectedId);
    const notes = useStore((state) => state.notes);
    const updateNote = useStore((state) => state.updateNote);
    const setSelectedId = useStore((state) => state.setSelectedId);
    const viewport = useStore((state) => state.viewport);

    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);

    if (!selectedId) return null;

    const note = notes.find((n) => n.id === selectedId);
    if (!note) return null;

    // Calculate screen position
    const screenX = note.x * viewport.zoom + viewport.x;
    const screenY = note.y * viewport.zoom + viewport.y;
    const screenW = note.w * viewport.zoom;
    const screenH = note.h * viewport.zoom;

    const handleSpark = () => {
        if (isAiLoading) return;
        setIsAiLoading(true);
        setAiResponse('');
        const prompt = `Expand on this concept: "${note.title || 'Untitled'}". Keep it concise, creative, and cosmic-themed.`;

        if (window.electronAPI) {
            window.electronAPI.ollama.stream(
                { model: getSelectedModel(), prompt },
                (chunk: string) => {
                    setAiResponse(prev => (prev || '') + chunk);
                },
                () => {
                    setIsAiLoading(false);
                },
                (error: string) => {
                    setAiResponse(`⚠️ ${error}`);
                    setIsAiLoading(false);
                }
            );
        } else {
            // Local fallback simulation (for browser dev)
            setTimeout(() => {
                setAiResponse("Stardust concepts expand beyond the known universe. [Simulated Response in Browser Mode]");
                setIsAiLoading(false);
            }, 1000);
        }
    };

    return (
        <div
            className="absolute bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden origin-top-left z-50"
            style={{
                left: screenX,
                top: screenY,
                width: Math.max(screenW, 360),
                height: Math.max(screenH, 280),
            }}
        >
            {/* Header */}
            <div className="bg-slate-900/80 px-4 py-3 flex justify-between items-center border-b border-white/5">
                <div className="flex items-center gap-2 flex-1">
                    <GripHorizontal size={14} className="text-white/20" />
                    <input
                        value={note.title || ''}
                        onChange={(e) => updateNote(note.id, { title: e.target.value })}
                        className="bg-transparent text-white font-semibold outline-none w-full text-sm placeholder-white/30"
                        placeholder="Untitled Note"
                    />
                </div>
                <div className="flex gap-1.5 items-center">
                    <button
                        onClick={handleSpark}
                        disabled={isAiLoading}
                        className="text-xs bg-purple-600/80 hover:bg-purple-500 disabled:opacity-40 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                    >
                        {isAiLoading ? (
                            <Loader size={12} className="animate-spin" />
                        ) : (
                            <Sparkles size={12} />
                        )}
                        Spark
                    </button>
                    <button
                        onClick={() => {
                            setAiResponse(null);
                            setSelectedId(undefined);
                        }}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* AI Response Panel */}
            {aiResponse && (
                <div className="bg-slate-800/90 border-b border-purple-500/20 p-3 shadow-inner relative max-h-48 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2 sticky top-0 bg-slate-800/90 py-1 z-10">
                        <div className="flex items-center gap-1.5">
                            <Sparkles size={12} className="text-purple-400" />
                            <span className="text-purple-400 text-xs font-semibold tracking-wider flex items-center gap-2">
                                AI SPARK
                                {isAiLoading && <Loader size={10} className="animate-spin opacity-50" />}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(aiResponse);
                                }}
                                className="text-xs text-purple-300 hover:text-white hover:bg-white/10 px-2 py-1 rounded transition-colors"
                            >
                                Copy
                            </button>
                            <button
                                onClick={() => setAiResponse(null)}
                                className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    </div>
                    <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap select-text">
                        {aiResponse}
                    </div>
                </div>
            )}

            {/* Editor */}
            <div className="flex-1 overflow-hidden bg-slate-800 text-slate-200 relative">
                <RichTextEditor
                    key={note.id}
                    initialContent={note.content}
                    onChange={(editorState) => {
                        const jsonString = JSON.stringify(editorState);
                        updateNote(note.id, { content: jsonString });
                    }}
                />
            </div>
        </div>
    );
};
