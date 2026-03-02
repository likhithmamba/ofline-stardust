import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { RichTextEditor } from './editor/RichTextEditor';
import { generateContent } from '../utils/ai';
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

    const handleSpark = async () => {
        if (isAiLoading) return;
        setIsAiLoading(true);
        setAiResponse(null);
        try {
            const result = await generateContent(
                `Expand on this concept: "${note.title || 'Untitled'}". Keep it concise, creative, and cosmic-themed.`
            );
            setAiResponse(result);
        } catch (e: any) {
            setAiResponse(`⚠️ ${e.message || 'AI error'}. Make sure Ollama is running (check Settings).`);
        } finally {
            setIsAiLoading(false);
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

            {/* AI Response */}
            {aiResponse && (
                <div className="mx-3 mt-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-sm text-purple-100 leading-relaxed max-h-40 overflow-y-auto">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles size={10} className="text-purple-400" />
                        <span className="text-purple-400 text-[10px] uppercase font-semibold tracking-wider">AI Insight</span>
                        <button
                            onClick={() => setAiResponse(null)}
                            className="ml-auto text-purple-400/60 hover:text-purple-300"
                        >
                            <X size={10} />
                        </button>
                    </div>
                    {aiResponse}
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
