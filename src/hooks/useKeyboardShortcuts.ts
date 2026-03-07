// ─── Keyboard Shortcuts Hook ─────────────────────────────────────────────────
// BUG-02 FIX: The original hook called deleteNote() (permanent, instant),
// while CanvasViewport also called safeDeleteNote() (4-second undo).
// Both fired simultaneously, bypassing the undo toast.
// Solution: this hook now calls safeDeleteNote and the duplicate handler
// in CanvasViewport has been removed.

import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useNoteStore } from '../store/useNoteStore';

export const useKeyboardShortcuts = () => {
    const selectedId = useStore(state => state.selectedId);
    const setSelectedId = useStore(state => state.setSelectedId);
    const viewport = useStore(state => state.viewport);
    const setViewport = useStore(state => state.setViewport);
    const focusModeId = useStore(state => state.focusModeId);
    const setFocusModeId = useStore(state => state.setFocusModeId);

    const isExportOpen = useStore(state => state.isExportOpen);
    const setExportOpen = useStore(state => state.setExportOpen);
    const isSearchOpen = useStore(state => state.isSearchOpen);
    const setSearchOpen = useStore(state => state.setSearchOpen);
    const isHelpOpen = useStore(state => state.isHelpOpen);
    const setHelpOpen = useStore(state => state.setHelpOpen);

    // ✅ BUG-02 FIX: use safeDeleteNote (with undo toast) instead of deleteNote
    const safeDeleteNote = useNoteStore(state => state.safeDeleteNote);
    const editingNoteId = useNoteStore(state => state.editingNoteId);

    const setZoom = (newZoom: number) => {
        setViewport({ ...viewport, zoom: newZoom });
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeTag = document.activeElement?.tagName.toLowerCase();
            const isTyping = activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.hasAttribute('contenteditable');

            if (isTyping && !e.ctrlKey && !e.metaKey && e.key !== 'Escape') {
                return;
            }

            // Ctrl/Cmd shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'e':
                        e.preventDefault();
                        setExportOpen(!isExportOpen);
                        break;
                    case 'k':
                        e.preventDefault();
                        setSearchOpen(!isSearchOpen);
                        break;
                    case '=':
                    case '+':
                        e.preventDefault();
                        setZoom(Math.min(5, viewport.zoom * 1.2));
                        break;
                    case '-':
                        e.preventDefault();
                        setZoom(Math.max(0.1, viewport.zoom / 1.2));
                        break;
                    case '0':
                        e.preventDefault();
                        setZoom(1);
                        break;
                    case 'f':
                        if (e.shiftKey) {
                            e.preventDefault();
                            if (selectedId) {
                                setFocusModeId(focusModeId ? undefined : selectedId);
                            } else {
                                alert('Please select a note first to enter Focus Mode.');
                            }
                        }
                        break;
                }
            } else {
                switch (e.key) {
                    case '?':
                        if (!isTyping) {
                            e.preventDefault();
                            setHelpOpen(!isHelpOpen);
                        }
                        break;
                    case 'Delete':
                    case 'Backspace':
                        // ✅ BUG-02 FIX: guard against editing state AND use safeDeleteNote
                        if (!isTyping && selectedId && !editingNoteId) {
                            e.preventDefault();
                            safeDeleteNote(selectedId);
                            setSelectedId(undefined);
                        }
                        break;
                    case 'Escape':
                        e.preventDefault();
                        if (focusModeId) {
                            setFocusModeId(undefined);
                        } else {
                            setSelectedId(undefined);
                            if (isExportOpen) setExportOpen(false);
                            if (isSearchOpen) setSearchOpen(false);
                            if (isHelpOpen) setHelpOpen(false);
                        }
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        viewport.zoom, setZoom, selectedId, focusModeId, setFocusModeId,
        safeDeleteNote, setSelectedId, editingNoteId,
        isExportOpen, setExportOpen,
        isSearchOpen, setSearchOpen,
        isHelpOpen, setHelpOpen
    ]);
};
