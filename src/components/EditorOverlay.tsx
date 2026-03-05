import React, { useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { useNoteStore } from '../store/useNoteStore';
import { useAIActions, type AIActionType } from '../hooks/useAIActions';
import { NoteEditor } from './editor/NoteEditor';

import { Sparkles, X, Loader, GripHorizontal, Minimize2, ChevronDown } from 'lucide-react';

export const EditorOverlay: React.FC = () => {
    const selectedId = useStore((state) => state.selectedId);
    const notes = useStore((state) => state.notes);
    const updateNote = useStore((state) => state.updateNote);
    const setSelectedId = useStore((state) => state.setSelectedId);
    const viewport = useStore((state) => state.viewport);

    const editingNoteId = useNoteStore((state) => state.editingNoteId);
    const setEditingNote = useNoteStore((state) => state.setEditingNote);
    const toggleMinimize = useNoteStore((state) => state.toggleMinimize);

    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [showAIMenu, setShowAIMenu] = useState(false);
    const [streamedText, setStreamedText] = useState('');

    // Use the editing note ID if available, otherwise fall back to selected
    const activeId = editingNoteId || selectedId;

    if (!activeId) return null;

    const note = notes.find((n) => n.id === activeId);
    if (!note) return null;

    // Calculate screen position
    const screenX = note.x * viewport.zoom + viewport.x;
    const screenY = note.y * viewport.zoom + viewport.y;
    const screenW = note.w * viewport.zoom;
    const screenH = note.h * viewport.zoom;

    return (
        <EditorOverlayInner
            key={activeId}
            noteId={activeId}
            note={note}
            screenX={screenX}
            screenY={screenY}
            screenW={screenW}
            screenH={screenH}
            aiResponse={aiResponse}
            setAiResponse={setAiResponse}
            streamedText={streamedText}
            setStreamedText={setStreamedText}
            showAIMenu={showAIMenu}
            setShowAIMenu={setShowAIMenu}
            updateNote={updateNote}
            setSelectedId={setSelectedId}
            setEditingNote={setEditingNote}
            toggleMinimize={toggleMinimize}
        />
    );
};

// Inner component that can use hooks conditionally
const EditorOverlayInner: React.FC<{
    noteId: string;
    note: any;
    screenX: number;
    screenY: number;
    screenW: number;
    screenH: number;
    aiResponse: string | null;
    setAiResponse: (v: string | null) => void;
    streamedText: string;
    setStreamedText: (v: string | ((prev: string) => string)) => void;
    showAIMenu: boolean;
    setShowAIMenu: (v: boolean) => void;
    updateNote: (id: string, patch: any) => void;
    setSelectedId: (id: string | undefined) => void;
    setEditingNote: (id: string | null) => void;
    toggleMinimize: (id: string) => void;
}> = ({
    noteId, note, screenX, screenY, screenW, screenH,
    aiResponse, setAiResponse, streamedText, setStreamedText, showAIMenu, setShowAIMenu,
    updateNote, setSelectedId, setEditingNote, toggleMinimize,
}) => {
        const { runAction, isStreaming, error } = useAIActions(noteId);

        const handleAIAction = useCallback(async (action: AIActionType) => {
            setShowAIMenu(false);
            setStreamedText('');
            setAiResponse('');
            await runAction(
                action,
                (token) => {
                    setStreamedText((prev: string) => prev + token);
                },
                () => {
                    // Done streaming
                }
            );
        }, [runAction, setAiResponse, setShowAIMenu, setStreamedText]);

        const handleClose = () => {
            setAiResponse(null);
            setEditingNote(null);
            setSelectedId(undefined);
        };

        const handleMinimize = () => {
            toggleMinimize(noteId);
            handleClose();
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
                            onChange={(e) => updateNote(noteId, { title: e.target.value })}
                            className="bg-transparent text-white font-semibold outline-none w-full text-sm placeholder-white/30"
                            placeholder="Untitled Note"
                        />
                    </div>
                    <div className="flex gap-1.5 items-center">
                        {/* AI Actions Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowAIMenu(!showAIMenu)}
                                disabled={isStreaming}
                                className="text-xs bg-purple-600/80 hover:bg-purple-500 disabled:opacity-40 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                            >
                                {isStreaming ? (
                                    <Loader size={12} className="animate-spin" />
                                ) : (
                                    <Sparkles size={12} />
                                )}
                                AI
                                <ChevronDown size={10} />
                            </button>
                            {showAIMenu && (
                                <div className="absolute right-0 top-full mt-1 bg-slate-900/95 border border-white/10 rounded-lg py-1 min-w-[140px] z-[60] backdrop-blur-md shadow-xl">
                                    {(['continue', 'summarize', 'rewrite', 'expand', 'tags'] as AIActionType[]).map((action) => (
                                        <button
                                            key={action}
                                            onClick={() => handleAIAction(action)}
                                            className="w-full text-left px-3 py-1.5 text-xs text-white/70 hover:text-white hover:bg-white/10 transition-colors capitalize"
                                        >
                                            {action}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleMinimize}
                            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                            title="Minimize note"
                        >
                            <Minimize2 size={14} />
                        </button>
                        <button
                            onClick={handleClose}
                            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {/* AI Response Panel */}
                {(streamedText || aiResponse || error) && (
                    <div className="bg-slate-800/90 border-b border-purple-500/20 p-3 shadow-inner relative max-h-48 overflow-y-auto">
                        <div className="flex items-center justify-between mb-2 sticky top-0 bg-slate-800/90 py-1 z-10">
                            <div className="flex items-center gap-1.5">
                                <Sparkles size={12} className="text-purple-400" />
                                <span className="text-purple-400 text-xs font-semibold tracking-wider flex items-center gap-2">
                                    AI SPARK
                                    {isStreaming && <Loader size={10} className="animate-spin opacity-50" />}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                {(streamedText || aiResponse) && (
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(streamedText || aiResponse || '');
                                        }}
                                        className="text-xs text-purple-300 hover:text-white hover:bg-white/10 px-2 py-1 rounded transition-colors"
                                    >
                                        Copy
                                    </button>
                                )}
                                <button
                                    onClick={() => { setAiResponse(null); setStreamedText(''); }}
                                    className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        </div>
                        <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap select-text">
                            {error ? (
                                <span className="text-red-400">⚠️ {error}</span>
                            ) : (
                                streamedText || aiResponse
                            )}
                        </div>
                    </div>
                )}

                {/* Editor */}
                <div className="flex-1 overflow-hidden bg-slate-800 text-slate-200 relative">
                    <NoteEditor
                        key={noteId}
                        noteId={noteId}
                        initialContent={note.content}
                    />
                </div>
            </div>
        );
    };
