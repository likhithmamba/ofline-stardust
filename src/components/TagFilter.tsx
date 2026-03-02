import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tags, X, Filter } from 'lucide-react';
import { useStore } from '../store/useStore';

interface TagFilterProps {
    isOpen: boolean;
    onClose: () => void;
    selectedTags: string[];
    onToggleTag: (tag: string) => void;
}

export const TagFilter: React.FC<TagFilterProps> = ({
    isOpen, onClose, selectedTags, onToggleTag
}) => {
    const notes = useStore(state => state.notes);

    // Get unique tags across all notes, sorted alphabetically
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        notes.forEach(note => {
            if (note.tags) {
                note.tags.forEach(t => tags.add(t));
            }
        });
        return Array.from(tags).sort();
    }, [notes]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="absolute top-20 left-4 z-40 w-64 bg-slate-900/90 backdrop-blur-md border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden"
            >
                <div className="bg-slate-800/80 px-4 py-3 flex justify-between items-center border-b border-white/5">
                    <h3 className="text-white font-medium text-sm flex items-center gap-2">
                        <Filter size={16} className="text-purple-400" />
                        Filter Canvas
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={14} />
                    </button>
                </div>

                <div className="p-4 max-h-[300px] overflow-y-auto">
                    {allTags.length === 0 ? (
                        <div className="text-center text-slate-500 text-sm py-4">
                            <Tags size={24} className="mx-auto mb-2 opacity-30" />
                            No tags in use.<br />
                            <span className="text-xs">Right-click a note to add tags.</span>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {allTags.map(tag => {
                                const isActive = selectedTags.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        onClick={() => onToggleTag(tag)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${isActive
                                                ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-purple-500/50 hover:bg-slate-700'
                                            }`}
                                    >
                                        #{tag}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {selectedTags.length > 0 && (
                    <div className="p-3 bg-slate-800/50 border-t border-white/5 text-center">
                        <button
                            onClick={() => selectedTags.forEach(t => onToggleTag(t))} // Hacky clear all given the toggle func
                            className="text-xs text-slate-400 hover:text-purple-400 transition-colors"
                        >
                            Clear Filters ({selectedTags.length})
                        </button>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};
