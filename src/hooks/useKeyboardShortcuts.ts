import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export const useKeyboardShortcuts = () => {
    const selectedId = useStore(state => state.selectedId);
    const deleteNote = useStore(state => state.deleteNote);
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

    // Derived setter for zoom
    const setZoom = (newZoom: number) => {
        setViewport({ ...viewport, zoom: newZoom });
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in input/textarea (except Cmd/Ctrl combos)
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
                                alert("Please select a note first to enter Focus Mode.");
                            }
                        }
                        break;
                }
            } else {
                // Non-modifier shortcuts
                switch (e.key) {
                    case '?':
                        if (!isTyping) {
                            e.preventDefault();
                            setHelpOpen(!isHelpOpen);
                        }
                        break;
                    case 'Delete':
                    case 'Backspace':
                        if (!isTyping && selectedId) {
                            e.preventDefault();
                            deleteNote(selectedId);
                        }
                        break;
                    case 'Escape':
                        e.preventDefault();
                        if (focusModeId) {
                            setFocusModeId(undefined);
                        } else {
                            setSelectedId(undefined);
                            // Also close modals if open
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
        viewport.zoom, setZoom, selectedId, focusModeId, setFocusModeId, deleteNote, setSelectedId,
        isExportOpen, setExportOpen,
        isSearchOpen, setSearchOpen,
        isHelpOpen, setHelpOpen
    ]);
};
