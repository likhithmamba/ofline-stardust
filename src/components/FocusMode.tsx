import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Square } from 'lucide-react';
import { useStore } from '../store/useStore';
import { soundManager } from '../utils/sound';

export const FocusMode: React.FC = () => {
    const focusModeId = useStore(state => state.focusModeId);
    const setFocusModeId = useStore(state => state.setFocusModeId);
    const notes = useStore(state => state.notes);
    const updateNote = useStore(state => state.updateNote);

    const activeNote = notes.find(n => n.id === focusModeId);

    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 mins default
    const [isActive, setIsActive] = useState(false);
    const [wordCount, setWordCount] = useState(0);

    // Initial word count setup
    useEffect(() => {
        if (activeNote?.content) {
            setWordCount(activeNote.content.split(/\s+/).filter(w => w.length > 0).length);
        } else {
            setWordCount(0);
        }
    }, [activeNote?.content]);

    // Timer logic
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(l => l - 1), 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            soundManager.playClick(); // Could play a chime here
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    if (!focusModeId || !activeNote) return null;

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        updateNote(focusModeId, { content: val });
        setWordCount(val.split(/\s+/).filter(w => w.length > 0).length);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col"
            >
                {/* Minimal Header */}
                <div className="flex justify-between items-center p-6 text-slate-400">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setFocusModeId(undefined)}
                            className="hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                        <h2 className="text-xl font-light tracking-wide text-white">
                            {activeNote.title || 'Untitled Note'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3 bg-white/5 rounded-full px-4 py-1.5 border border-white/10">
                            <span className="font-mono text-lg text-purple-200 w-16 text-center">
                                {formatTime(timeLeft)}
                            </span>
                            <button
                                onClick={() => setIsActive(!isActive)}
                                className="text-purple-400 hover:text-purple-300 transition-colors"
                            >
                                {isActive ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                            </button>
                        </div>
                        <div className="text-sm font-mono tracking-wider opacity-60">
                            {wordCount} WORDS
                        </div>
                    </div>
                </div>

                {/* Distraction-Free Editor */}
                <div className="flex-1 max-w-4xl w-full mx-auto p-8 pt-12">
                    <textarea
                        autoFocus
                        value={activeNote.content || ''}
                        onChange={handleContentChange}
                        placeholder="Begin..."
                        className="w-full h-full bg-transparent text-xl leading-relaxed text-slate-300 placeholder-slate-700 resize-none outline-none font-sans"
                        style={{
                            scrollbarWidth: 'none',
                        }}
                    />
                </div>

            </motion.div>
        </AnimatePresence>
    );
};
