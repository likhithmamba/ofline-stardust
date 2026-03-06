import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useGesture } from '@use-gesture/react';
import { useStore } from '../store/useStore';
import { useNoteStore } from '../store/useNoteStore';
import { EditorOverlay } from './EditorOverlay';
import { MiniMap } from './MiniMap';
import { SettingsPanel } from './SettingsPanel';
import { soundManager } from '../utils/sound';
import { PlanetNote } from './PlanetNote';
import { ConnectionLayer } from './ConnectionLayer';
import { CreationMenu } from './CreationMenu';
import { BlackHole } from './BlackHole';
import { NoteContextMenu } from './NoteContextMenu';
import { AIChatPanel } from './AIChatPanel';
import { OllamaStatusBar } from './OllamaStatusBar';
import { HelpModal } from './HelpModal';
import { SearchBar } from './SearchBar';
import { NOTE_STYLES, NoteType } from '../constants';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { TagFilter } from './TagFilter';
import { FocusMode } from './FocusMode';
import { Toolbar } from './Toolbar';

export const CanvasViewport: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const notes = useStore((state) => state.notes);
    const connections = useStore((state) => state.connections);
    const viewport = useStore((state) => state.viewport);
    const setViewport = useStore((state) => state.setViewport);
    const addNote = useStore((state) => state.addNote);
    const addConnection = useStore((state) => state.addConnection);
    const selectedId = useStore((state) => state.selectedId);
    const setSelectedId = useStore((state) => state.setSelectedId);
    const isHelpOpen = useStore((state) => state.isHelpOpen);
    const setHelpOpen = useStore((state) => state.setHelpOpen);
    const isSearchOpen = useStore((state) => state.isSearchOpen);
    const setSearchOpen = useStore((state) => state.setSearchOpen);

    // Note Store
    const editingNoteId = useNoteStore((state) => state.editingNoteId);
    const setEditingNote = useNoteStore((state) => state.setEditingNote);
    const toastMessage = useNoteStore((state) => state.toastMessage);
    const pendingDeletion = useNoteStore((state) => state.pendingDeletion);
    const undoDelete = useNoteStore((state) => state.undoDelete);
    const safeDeleteNote = useNoteStore((state) => state.safeDeleteNote);

    // Interaction State
    const [creationMenu, setCreationMenu] = useState<{ isOpen: boolean; x: number; y: number; worldX: number; worldY: number } | null>(null);
    const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; x: number; y: number; noteId: string } | null>(null);
    // Tag Filter State
    const [isTagFilterOpen, setIsTagFilterOpen] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const handleToggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };
    const [connectionStart, setConnectionStart] = useState<{ id: string; x: number; y: number } | null>(null);
    const [tempConnectionEnd, setTempConnectionEnd] = useState<{ x: number; y: number } | null>(null);
    const [blackHoleActive, setBlackHoleActive] = useState(false);
    const [isAIChatOpen, setIsAIChatOpen] = useState(false);

    // Starfield & Background
    const stars = useRef<{ x: number; y: number; size: number; opacity: number; speed: number }[]>([]);
    const nebulas = useRef<{ x: number; y: number; size: number; color: string; speed: number }[]>([]);

    useEffect(() => {
        // Generate stars
        stars.current = Array.from({ length: 400 }, () => ({
            x: Math.random() * window.innerWidth * 3,
            y: Math.random() * window.innerHeight * 3,
            size: Math.random() * 2 + 0.3,
            opacity: Math.random() * 0.8 + 0.2,
            speed: Math.random() * 0.2 + 0.05
        }));

        // Generate nebulas
        const nebulaColors = ['#4c1d95', '#312e81', '#0f172a', '#581c87', '#1e1b4b'];
        nebulas.current = Array.from({ length: 8 }, () => ({
            x: Math.random() * window.innerWidth * 2,
            y: Math.random() * window.innerHeight * 2,
            size: Math.random() * 500 + 250,
            color: nebulaColors[Math.floor(Math.random() * nebulaColors.length)],
            speed: Math.random() * 0.05 + 0.01
        }));
    }, []);

    // Render Loop (Background Only)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let time = 0;

        const render = () => {
            time += 0.01;
            const { width, height } = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);

            // 1. Background
            const bgGradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height));
            bgGradient.addColorStop(0, '#1e1b4b');
            bgGradient.addColorStop(0.4, '#0f172a');
            bgGradient.addColorStop(1, '#020617');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, width, height);

            // 2. Nebulas
            ctx.globalCompositeOperation = 'screen';
            nebulas.current.forEach(nebula => {
                const parallaxX = (nebula.x - viewport.x * nebula.speed) % (width * 2);
                const parallaxY = (nebula.y - viewport.y * nebula.speed) % (height * 2);
                const drawX = parallaxX < -nebula.size ? parallaxX + width * 2 : parallaxX;
                const drawY = parallaxY < -nebula.size ? parallaxY + height * 2 : parallaxY;

                const grad = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, nebula.size);
                grad.addColorStop(0, `${nebula.color}30`);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(drawX, drawY, nebula.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalCompositeOperation = 'source-over';

            // 3. Stars with twinkling
            stars.current.forEach(star => {
                const x = (star.x - viewport.x * star.speed) % (width * 3);
                const y = (star.y - viewport.y * star.speed) % (height * 3);
                const drawX = x < 0 ? x + width * 3 : x;
                const drawY = y < 0 ? y + height * 3 : y;

                // Twinkling effect
                const twinkle = Math.sin(time * 2 + star.x * 0.1) * 0.3 + 0.7;
                ctx.globalAlpha = star.opacity * twinkle;
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(drawX, drawY, star.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;

            // 4. Grid
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
            ctx.lineWidth = 1;
            const gridSize = 100 * viewport.zoom;
            if (gridSize > 20) { // Don't draw grid at very low zoom
                const offsetX = (viewport.x % gridSize);
                const offsetY = (viewport.y % gridSize);
                ctx.beginPath();
                for (let x = offsetX; x < width; x += gridSize) {
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, height);
                }
                for (let y = offsetY; y < height; y += gridSize) {
                    ctx.moveTo(0, y);
                    ctx.lineTo(width, y);
                }
                ctx.stroke();
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [viewport]);

    // Keyboard shortcuts
    useKeyboardShortcuts();


    // Gestures for Viewport
    useGesture({
        onDrag: ({ delta: [dx, dy], event }) => {
            // Only pan if clicking on background (canvas)
            if ((event.target as HTMLElement).tagName === 'CANVAS') {
                setViewport({ ...viewport, x: viewport.x + dx, y: viewport.y + dy });
            }

            // Handle Connection Dragging
            if (connectionStart) {
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) {
                    const clientX = (event as any).clientX;
                    const clientY = (event as any).clientY;
                    const worldX = (clientX - rect.left - viewport.x) / viewport.zoom;
                    const worldY = (clientY - rect.top - viewport.y) / viewport.zoom;
                    setTempConnectionEnd({ x: worldX, y: worldY });
                }
            }
        },
        onWheel: ({ delta: [_dx, dy], ctrlKey }) => {
            if (ctrlKey) {
                const zoomFactor = dy > 0 ? 0.9 : 1.1;
                const newZoom = Math.max(0.1, Math.min(5, viewport.zoom * zoomFactor));
                setViewport({ ...viewport, zoom: newZoom });
            } else {
                setViewport({ ...viewport, x: viewport.x - _dx, y: viewport.y - dy });
            }
        },
        onPointerDown: ({ event }) => {
            if ((event.target as HTMLElement).tagName === 'CANVAS') {
                setSelectedId(undefined);
                // Clear editing state when clicking on canvas background
                if (editingNoteId) {
                    setEditingNote(null);
                }
            }
        },
        onDoubleClick: ({ event }) => {
            const target = event.target as HTMLElement;
            const isNote = target.closest('.note-planet');
            const isUI = target.closest('.stardust-toolbar, .stardust-minimap, button');

            if (!isNote && !isUI) {
                const e = event as any;
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) {
                    const clickX = e.clientX - rect.left;
                    const clickY = e.clientY - rect.top;
                    const worldX = (clickX - viewport.x) / viewport.zoom;
                    const worldY = (clickY - viewport.y) / viewport.zoom;

                    setCreationMenu({
                        isOpen: true,
                        x: clickX,
                        y: clickY,
                        worldX,
                        worldY
                    });
                    soundManager.playClick();
                }
            }
        }
    }, {
        target: containerRef,
        eventOptions: { passive: false },
        drag: { filterTaps: true }
    });

    // Handle Note Drag for Black Hole detection
    const handleNoteDrag = useCallback((_id: string, x: number, y: number) => {
        const currentViewport = useStore.getState().viewport;
        const screenX = x * currentViewport.zoom + currentViewport.x;
        const screenY = y * currentViewport.zoom + currentViewport.y;

        const bhX = window.innerWidth - 100;
        const bhY = window.innerHeight - 100;

        const dist = Math.sqrt(Math.pow(screenX - bhX, 2) + Math.pow(screenY - bhY, 2));
        setBlackHoleActive(dist < 200);
    }, []);

    const handleNoteDragEnd = useCallback((id: string) => {
        if (blackHoleActive) {
            soundManager.playWarp();
            // Use safe delete with undo toast instead of immediate deletion
            safeDeleteNote(id);
            setBlackHoleActive(false);
        }
    }, [blackHoleActive, safeDeleteNote]);

    const handleConnectStart = useCallback((id: string, x: number, y: number) => {
        setConnectionStart({ id, x, y });
        setTempConnectionEnd({ x, y });
    }, []);

    // Global pointer up for connections
    useEffect(() => {
        const handleUp = (e: PointerEvent) => {
            if (!connectionStart) return;

            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;

            const worldX = (e.clientX - rect.left - viewport.x) / viewport.zoom;
            const worldY = (e.clientY - rect.top - viewport.y) / viewport.zoom;

            // Find hit note
            const hitNote = notes.find(n => {
                const style = NOTE_STYLES[n.type] || NOTE_STYLES[NoteType.Asteroid];
                return (
                    worldX >= n.x && worldX <= n.x + style.width &&
                    worldY >= n.y && worldY <= n.y + style.height
                );
            });

            if (hitNote && hitNote.id !== connectionStart.id) {
                addConnection({
                    id: Math.random().toString(36).substr(2, 9),
                    from: connectionStart.id,
                    to: hitNote.id
                });
                soundManager.playConnect();
            }

            setConnectionStart(null);
            setTempConnectionEnd(null);
        };

        window.addEventListener('pointerup', handleUp);
        return () => window.removeEventListener('pointerup', handleUp);
    }, [connectionStart, notes, viewport, addConnection]);

    // Global keyboard and context menu listeners
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isSearchOpen || isHelpOpen) return;

            if (e.key === 'Escape') {
                setSelectedId(undefined);
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedId && !editingNoteId) {
                    // Use safe delete with undo toast
                    safeDeleteNote(selectedId);
                    setSelectedId(undefined);
                }
            } else if (e.key === 'f' || e.key === 'F') {
                setSearchOpen(true);
            } else if (e.key === '?') {
                setHelpOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        const handleContextMenuEvent = (e: any) => {
            setContextMenu({
                isOpen: true,
                x: e.detail.x,
                y: e.detail.y,
                noteId: e.detail.noteId
            });
        };
        window.addEventListener('showNoteContextMenu', handleContextMenuEvent);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('showNoteContextMenu', handleContextMenuEvent);
        };
    }, [selectedId, editingNoteId, isSearchOpen, isHelpOpen, safeDeleteNote, setSelectedId, setSearchOpen, setHelpOpen]);


    return (
        <div ref={containerRef} className="w-full h-screen overflow-hidden relative bg-slate-950 touch-none select-none">
            {/* 1. Canvas Background */}
            <canvas ref={canvasRef} className="block w-full h-full absolute top-0 left-0 z-0 canvas-bg" />

            {/* 2. World Container (Transforms with Viewport) */}
            <motion.div
                className="absolute top-0 left-0 w-full h-full pointer-events-none origin-top-left"
                animate={{
                    x: viewport.x,
                    y: viewport.y,
                    scale: viewport.zoom
                }}
                transition={{ duration: 0 }}
            >
                {/* Connections Layer */}
                <ConnectionLayer
                    connections={connections}
                    notes={notes}
                    tempConnection={connectionStart && tempConnectionEnd ? { startId: connectionStart.id, endX: tempConnectionEnd.x, endY: tempConnectionEnd.y } : null}
                    zoom={viewport.zoom}
                />

                {/* Notes Layer */}
                <div className="pointer-events-auto">
                    {notes.map(note => {
                        // Check if note matches active tag filters
                        const isFaded = selectedTags.length > 0 &&
                            (!note.tags || !selectedTags.some(t => note.tags!.includes(t)));

                        return (
                            <PlanetNote
                                key={note.id}
                                note={note}
                                isSelected={selectedId === note.id}
                                isFaded={isFaded}
                                zoom={viewport.zoom}
                                onConnectStart={handleConnectStart}
                                onDrag={handleNoteDrag}
                                onDragEnd={handleNoteDragEnd}
                            />
                        );
                    })}
                </div>
            </motion.div>

            {/* 3. UI Overlays */}
            <BlackHole isActive={blackHoleActive} />

            <CreationMenu
                isOpen={!!creationMenu?.isOpen}
                x={creationMenu?.x || 0}
                y={creationMenu?.y || 0}
                onClose={() => setCreationMenu(null)}
                onSelect={(type) => {
                    if (creationMenu) {
                        const style = NOTE_STYLES[type];
                        addNote({
                            id: Math.random().toString(36).substr(2, 9),
                            x: creationMenu.worldX - style.width / 2,
                            y: creationMenu.worldY - style.height / 2,
                            w: style.width,
                            h: style.height,
                            type: type,
                            title: '',
                        });
                        soundManager.playClick();
                    }
                }}
            />

            {contextMenu?.isOpen && (
                <NoteContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    noteId={contextMenu.noteId}
                    onClose={() => setContextMenu(null)}
                />
            )}

            <EditorOverlay />
            <MiniMap />
            <SettingsPanel />
            <AIChatPanel isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
            <OllamaStatusBar />
            <HelpModal isOpen={isHelpOpen} onClose={() => setHelpOpen(false)} />
            <SearchBar isOpen={isSearchOpen} onClose={() => setSearchOpen(false)} />
            <TagFilter
                isOpen={isTagFilterOpen}
                onClose={() => setIsTagFilterOpen(false)}
                selectedTags={selectedTags}
                onToggleTag={handleToggleTag}
            />
            <FocusMode />
            <Toolbar
                onAIChatToggle={() => setIsAIChatOpen(!isAIChatOpen)}
                isAIChatOpen={isAIChatOpen}
                onHelpToggle={() => setHelpOpen(true)}
                onSearchToggle={() => setSearchOpen(true)}
                isTagFilterOpen={isTagFilterOpen}
                onTagFilterToggle={() => setIsTagFilterOpen(!isTagFilterOpen)}
                noteId={editingNoteId || undefined}
            />

            {/* App Label */}
            <div className="absolute top-4 left-4 text-white/20 pointer-events-none font-light tracking-[0.2em] text-xs uppercase z-50" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Stardust <span className="text-[10px] opacity-40">v2.0</span>
            </div>

            {/* Toast Notification (for deletion undo) */}
            {toastMessage && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl border border-white/10"
                    style={{ background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(16px)' }}>
                    <span className="text-white/80 text-sm">{toastMessage}</span>
                    {pendingDeletion && (
                        <button
                            onClick={undoDelete}
                            className="text-purple-400 hover:text-purple-300 text-sm font-semibold px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            Undo
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
