import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MapPin } from 'lucide-react';
import Fuse from 'fuse.js';
import { useStore, type Note } from '../store/useStore';
import { NOTE_STYLES, NoteType } from '../constants';

interface SearchBarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const notes = useStore(s => s.notes);
    const viewport = useStore(s => s.viewport);
    const setViewport = useStore(s => s.setViewport);
    const setSelectedId = useStore(s => s.setSelectedId);

    const fuse = useMemo(() => new Fuse(notes, {
        keys: ['title', 'type'],
        threshold: 0.4,
        includeScore: true,
    }), [notes]);

    const results = query.trim()
        ? fuse.search(query).slice(0, 8).map(r => r.item)
        : notes.slice(0, 8);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery('');
        }
    }, [isOpen]);

    const flyToNote = (note: Note) => {
        const style = NOTE_STYLES[note.type] || NOTE_STYLES[NoteType.Asteroid];
        const centerX = note.x + style.width / 2;
        const centerY = note.y + style.width / 2;
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        setViewport({
            ...viewport,
            x: -(centerX * viewport.zoom - screenW / 2),
            y: -(centerY * viewport.zoom - screenH / 2),
        });
        setSelectedId(note.id);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[15vh] z-[100]" onClick={onClose}>
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="w-[440px] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Search Input */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                            <Search size={16} className="text-slate-400" />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search notes..."
                                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-500"
                            />
                            {query && (
                                <button onClick={() => setQuery('')} className="text-slate-500 hover:text-white">
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Results */}
                        <div className="max-h-[300px] overflow-y-auto">
                            {results.length === 0 ? (
                                <div className="p-6 text-center text-slate-500 text-sm">
                                    {notes.length === 0 ? 'No notes yet — double-click the canvas to create one!' : 'No matching notes found'}
                                </div>
                            ) : (
                                results.map(note => {
                                    const style = NOTE_STYLES[note.type] || NOTE_STYLES[NoteType.Asteroid];
                                    return (
                                        <button
                                            key={note.id}
                                            onClick={() => flyToNote(note)}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                                        >
                                            <div
                                                className="w-6 h-6 rounded-full flex-shrink-0"
                                                style={{
                                                    backgroundColor: style.color,
                                                    boxShadow: `0 0 8px ${style.color}40`,
                                                }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white text-sm truncate">{note.title || 'Untitled'}</div>
                                                <div className="text-slate-500 text-[10px] uppercase tracking-wider">{style.label}</div>
                                            </div>
                                            <MapPin size={12} className="text-slate-600" />
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[10px] text-slate-600">{notes.length} notes total</span>
                            <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-800 border border-slate-700 rounded text-slate-500 font-mono">Esc to close</kbd>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
