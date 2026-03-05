import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Copy, Trash2, Link2, Tag, Palette, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useNoteStore } from '../store/useNoteStore';
import { NoteType, NOTE_STYLES } from '../constants';

interface NoteContextMenuProps {
    x: number;
    y: number;
    noteId: string;
    onClose: () => void;
}

export const NoteContextMenu: React.FC<NoteContextMenuProps> = ({ x, y, noteId, onClose }) => {
    const note = useStore(state => state.notes.find(n => n.id === noteId));
    const setSelectedId = useStore(state => state.setSelectedId);
    const addNote = useStore(state => state.addNote);
    const updateNote = useStore(state => state.updateNote);

    const setEditingNote = useNoteStore(state => state.setEditingNote);
    const safeDeleteNote = useNoteStore(state => state.safeDeleteNote);
    const toggleMinimize = useNoteStore(state => state.toggleMinimize);

    const [showTypeMenu, setShowTypeMenu] = React.useState(false);
    const [showTagMenu, setShowTagMenu] = React.useState(false);
    const [tagInput, setTagInput] = React.useState('');

    if (!note) return null;

    const handleEdit = () => {
        setSelectedId(noteId);
        setEditingNote(noteId);
        onClose();
    };

    const handleDuplicate = () => {
        addNote({
            ...note,
            id: Math.random().toString(36).substr(2, 9),
            x: note.x + 40,
            y: note.y + 40
        });
        onClose();
    };

    const handleDelete = () => {
        safeDeleteNote(noteId);
        onClose();
    };

    const handleAddTag = (e: React.FormEvent) => {
        e.preventDefault();
        if (!tagInput.trim()) return;
        const currentTags = note.tags || [];
        if (!currentTags.includes(tagInput.trim())) {
            updateNote(noteId, { tags: [...currentTags, tagInput.trim()] });
        }
        setTagInput('');
        setShowTagMenu(false);
    };

    const MenuItem = ({ icon: Icon, label, onClick, className = '' }: { icon: any, label: string, onClick: () => void, className?: string }) => (
        <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition-colors ${className}`}
        >
            <Icon size={14} />
            <span>{label}</span>
        </button>
    );

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="fixed z-[100] bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl rounded-xl p-1 w-48"
                style={{ left: x, top: y }}
                onClick={(e) => e.stopPropagation()}
                onContextMenu={(e) => e.preventDefault()}
            >
                {!showTypeMenu && !showTagMenu ? (
                    <>
                        <MenuItem icon={Edit2} label="Edit" onClick={handleEdit} />
                        <MenuItem icon={Copy} label="Duplicate" onClick={handleDuplicate} />

                        <div className="h-px bg-slate-700/50 my-1 mx-2" />

                        <MenuItem icon={Link2} label="Connect from here" onClick={() => {
                            // Temporary: connection logic needs to trigger connectionStart state from CanvasViewport
                            // We can select the note and then instruct the user, or lift the trigger global.
                            // For now, selecting it helps.
                            setSelectedId(noteId);
                            onClose();
                        }} />
                        <MenuItem icon={Palette} label="Change Type" onClick={() => setShowTypeMenu(true)} />
                        <MenuItem icon={Tag} label="Add Tag" onClick={() => setShowTagMenu(true)} />

                        <div className="h-px bg-slate-700/50 my-1 mx-2" />

                        <MenuItem icon={Copy} label="Minimize" onClick={() => { toggleMinimize(noteId); onClose(); }} />
                        <MenuItem icon={Trash2} label="Delete" onClick={handleDelete} className="text-red-400 hover:text-red-300 hover:bg-red-400/10" />
                    </>
                ) : showTypeMenu ? (
                    <div className="p-1">
                        <button onClick={() => setShowTypeMenu(false)} className="w-full text-left px-2 py-1 text-xs text-slate-400 hover:text-white mb-1">← Back</button>
                        {Object.values(NoteType).map((type) => (
                            <button
                                key={type}
                                onClick={() => { updateNote(noteId, { type }); onClose(); }}
                                className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-white/10 rounded-md text-sm text-slate-300"
                            >
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: NOTE_STYLES[type].color }} />
                                {NOTE_STYLES[type].label}
                            </button>
                        ))}
                    </div>
                ) : showTagMenu ? (
                    <div className="p-2">
                        <button onClick={() => setShowTagMenu(false)} className="w-full text-left px-1 py-1 text-xs text-slate-400 hover:text-white mb-2">← Back</button>

                        {/* Existing Tags */}
                        {note.tags && note.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                                {note.tags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => {
                                            updateNote(noteId, { tags: note.tags!.filter(t => t !== tag) });
                                        }}
                                        className="bg-purple-500/20 text-purple-300 hover:bg-red-500/20 hover:text-red-300 border border-purple-500/30 hover:border-red-500/30 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 transition-colors"
                                        title="Click to remove"
                                    >
                                        {tag} <X size={8} />
                                    </button>
                                ))}
                            </div>
                        )}

                        <form onSubmit={handleAddTag}>
                            <input
                                autoFocus
                                type="text"
                                placeholder="Enter tag name..."
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-sm text-white outline-none focus:border-purple-500"
                            />
                            <button type="submit" className="mt-2 w-full bg-purple-600 hover:bg-purple-500 text-white text-xs py-1.5 rounded-md transition-colors">
                                Add Tag
                            </button>
                        </form>
                    </div>
                ) : null}
            </motion.div>
        </AnimatePresence>
    );
};
