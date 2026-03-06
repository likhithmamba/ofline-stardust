import React, { useRef, useEffect } from 'react';
import { useGesture } from '@use-gesture/react';
import { useStore, type Note } from '../store/useStore';
import { useNoteStore } from '../store/useNoteStore';
import { NOTE_STYLES, NoteType } from '../constants';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface PlanetNoteProps {
    note: Note;
    isSelected: boolean;
    isFaded?: boolean;
    zoom: number;
    onConnectStart: (id: string, x: number, y: number) => void;
    onDrag?: (id: string, x: number, y: number) => void;
    onDragEnd?: (id: string) => void;
}

const REAL_SIZES: Record<string, number> = {
    [NoteType.Sun]: 320,
    [NoteType.Jupiter]: 160,
    [NoteType.Saturn]: 140,
    [NoteType.Earth]: 64,
    [NoteType.Mars]: 56,
    [NoteType.Asteroid]: 24,
    [NoteType.Nebula]: 600,
    [NoteType.Galaxy]: 500,
};

export const PlanetNote = React.memo(function PlanetNote({ note, isSelected, isFaded, zoom, onConnectStart, onDrag, onDragEnd }: PlanetNoteProps) {
    const updateNote = useStore((state) => state.updateNote);
    const setSelectedId = useStore((state) => state.setSelectedId);
    const scaleMode = useStore((state) => state.scaleMode);

    const editingNoteId = useNoteStore((state) => state.editingNoteId);
    const setEditingNote = useNoteStore((state) => state.setEditingNote);
    const isMinimized = useNoteStore((state) => state.noteMeta[note.id]?.isMinimized ?? false);

    const noteRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const style = NOTE_STYLES[note.type] || NOTE_STYLES[NoteType.Asteroid];
    const isEditing = editingNoteId === note.id;

    // Compute Size
    const size = scaleMode === 'real'
        ? (REAL_SIZES[note.type] || 64)
        : style.width;

    // ─── KEYBOARD CAPTURE PHASE ──────────────────────────────────────────
    // When this note is in edit mode, intercept ALL keydown events in capture phase
    // to prevent canvas shortcuts (Delete, Backspace, etc.) from firing.
    useEffect(() => {
        if (!isEditing) return;

        const handler = (e: KeyboardEvent) => {
            // Allow Escape to exit edit mode, but still stop propagation
            if (e.key === 'Escape') {
                setEditingNote(null);
                e.stopPropagation();
                e.preventDefault();
                return;
            }
            // Stop ALL other keydown events from reaching canvas handlers
            e.stopPropagation();
        };

        document.addEventListener('keydown', handler, true); // capture phase
        return () => document.removeEventListener('keydown', handler, true);
    }, [isEditing, setEditingNote]);

    const bind = useGesture({
        onDrag: ({ delta: [dx, dy], event, last }) => {
            if (isEditing) return;
            event.stopPropagation();
            const newX = note.x + dx / zoom;
            const newY = note.y + dy / zoom;
            updateNote(note.id, {
                x: newX,
                y: newY,
                w: size,
                h: size
            });
            onDrag?.(note.id, newX, newY);
            if (last) {
                onDragEnd?.(note.id);
            }
        },
        onPointerDown: ({ event }) => {
            if (isEditing) return;
            event.stopPropagation();
            setSelectedId(note.id);
        }
    }, {
        drag: { filterTaps: true },
    });

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const event = new CustomEvent('showNoteContextMenu', {
            detail: {
                x: e.clientX,
                y: e.clientY,
                noteId: note.id
            }
        });
        window.dispatchEvent(event);
    };

    const handleBlur = () => {
        if (contentRef.current) {
            updateNote(note.id, { title: contentRef.current.innerText });
        }
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Set this note as being edited — this opens the EditorOverlay with the Lexical editor
        setSelectedId(note.id);
        setEditingNote(note.id);

        // Also focus the inline title for quick edits on the planet itself
        setTimeout(() => {
            if (contentRef.current) {
                contentRef.current.focus();
                const range = document.createRange();
                const sel = window.getSelection();
                if (contentRef.current.childNodes.length > 0) {
                    range.selectNodeContents(contentRef.current);
                    range.collapse(false);
                    sel?.removeAllRanges();
                    sel?.addRange(range);
                }
            }
        }, 50);
    };

    // Connection Handles
    const renderHandle = (position: 'top' | 'right' | 'bottom' | 'left') => {
        if (!isSelected) return null;

        const handleClass = clsx("handle-base", `handle-${position}`);

        return (
            <div
                className={handleClass}
                onPointerDown={(e) => {
                    e.stopPropagation();
                    onConnectStart(note.id, note.x + size / 2, note.y + size / 2);
                }}
            />
        );
    };

    // ─── MINIMIZED PILL STATE ────────────────────────────────────────────
    if (isMinimized) {
        return (
            <motion.div
                ref={noteRef}
                {...(bind() as any)}
                className={clsx(
                    "note-planet minimized-pill",
                    isFaded && "opacity-10 grayscale-[50%] pointer-events-none"
                )}
                style={{
                    position: 'absolute',
                    borderRadius: '9999px',
                    padding: '4px 12px',
                    background: `linear-gradient(135deg, ${style.color}40, ${style.color}20)`,
                    border: `1px solid ${style.color}50`,
                    backdropFilter: 'blur(8px)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                }}
                animate={{
                    x: note.x,
                    y: note.y,
                    scale: 1,
                    opacity: isFaded ? 0.1 : 0.8,
                }}
                transition={{
                    x: { duration: 0 },
                    y: { duration: 0 },
                    scale: { type: 'spring', stiffness: 200, damping: 20 },
                }}
                onDoubleClick={() => {
                    useNoteStore.getState().toggleMinimize(note.id);
                }}
                title={`${note.title || style.label} (minimized — double-click to expand)`}
            >
                <span className="text-white/70 text-xs font-medium">
                    {note.title || style.label}
                </span>
            </motion.div>
        );
    }

    return (
        <motion.div
            ref={noteRef}
            {...(bind() as any)}
            className={clsx(
                "note-planet",
                `planet-${note.type}`,
                style.className,
                isEditing && "ring-2 ring-purple-400/60",
                isFaded && "opacity-10 grayscale-[50%] pointer-events-none transition-opacity duration-300"
            )}
            style={{
                '--planet-size': `${size}px`,
                width: 'var(--planet-size)',
                height: 'var(--planet-size)',
            } as React.CSSProperties}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
                x: note.x,
                y: note.y,
                width: size,
                height: size,
                scale: 1,
                opacity: isFaded ? 0.1 : 1
            }}
            transition={{
                x: { duration: 0 },
                y: { duration: 0 },
                width: { duration: 0.4, type: "spring" },
                height: { duration: 0.4, type: "spring" },
                scale: { type: 'spring', stiffness: 200, damping: 20 },
                opacity: { duration: 0.3 }
            }}
            title={`${style.label}${note.title ? ': ' + note.title : ''}`}
            onContextMenu={handleContextMenu}
            onDoubleClick={handleDoubleClick}
        >
            {/* Selection Pulse Ring */}
            {isSelected && (
                <motion.div
                    className="absolute -inset-4 rounded-full border pointer-events-none z-0"
                    style={{
                        borderColor: `${style.color}60`,
                        boxShadow: `0 0 20px ${style.color}30`,
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                >
                    <div
                        className="absolute inset-0 rounded-full animate-ping opacity-10"
                        style={{ backgroundColor: style.color }}
                    />
                </motion.div>
            )}

            {/* Saturn Ring */}
            {(style as any).hasRings && <div className="saturn-ring" />}

            {/* Content */}
            <div
                ref={contentRef}
                className={clsx(
                    "note-content",
                    "pointer-events-auto flex items-center justify-center text-center leading-tight outline-none"
                )}
                contentEditable={isEditing}
                suppressContentEditableWarning
                onBlur={handleBlur}
                onClick={(e) => {
                    e.stopPropagation();
                    if (isEditing) return; // Already editing, don't re-trigger
                    setSelectedId(note.id);
                }}
                onPointerDown={(e) => isEditing && e.stopPropagation()}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        contentRef.current?.blur();
                    }
                    e.stopPropagation();
                }}
                style={{
                    fontSize: `clamp(10px, calc(${size}px / 12), 48px)`,
                    textShadow: isSelected ? '0 0 10px rgba(255,255,255,0.5)' : '0 1px 2px rgba(0,0,0,0.5)',
                    userSelect: isEditing ? 'text' : 'none',
                    cursor: isEditing ? 'text' : 'pointer',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    minWidth: '50%',
                    caretColor: 'white'
                }}
            >
                {note.title || style.label}
            </div>

            {/* Tags */}
            {note.tags && note.tags.length > 0 && !isEditing && (
                <div className="absolute top-[105%] left-1/2 -translate-x-1/2 flex gap-1 justify-center whitespace-nowrap opacity-70 group-hover:opacity-100 transition-opacity">
                    {note.tags.map((tag, i) => (
                        <span key={i} className="bg-slate-900 border border-slate-700 text-slate-300 text-[9px] px-1.5 py-0.5 rounded-full shadow-lg">
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Connection Handles */}
            {renderHandle('top')}
            {renderHandle('right')}
            {renderHandle('bottom')}
            {renderHandle('left')}
        </motion.div>
    );
});
