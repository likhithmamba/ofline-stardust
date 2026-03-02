import { create } from 'zustand';
import { initDB } from '../db/idb';
import type { NoteType } from '../constants';

export type Note = {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    type: NoteType;
    title?: string;
    parentId?: string;
    contentId?: string;
    content?: string; // Serialized Lexical state
    tags?: string[];
    color?: string;
};

export type Connection = {
    id: string;
    from: string;
    to: string;
};

type State = {
    notes: Note[];
    connections: Connection[];
    viewport: { x: number; y: number; zoom: number };
    selectedId?: string;
    isSettingsOpen: boolean;
    isHelpOpen: boolean;
    isSearchOpen: boolean;
    isExportOpen: boolean;
    isAutoConnectOpen: boolean;
    isHistoryOpen: boolean;
    addNote: (n: Note) => void;
    updateNote: (id: string, patch: Partial<Note>) => void;
    deleteNote: (id: string) => void;
    addConnection: (c: Connection) => void;
    removeConnection: (id: string) => void;
    setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
    setSelectedId: (id: string | undefined) => void;
    setSettingsOpen: (isOpen: boolean) => void;
    setHelpOpen: (isOpen: boolean) => void;
    setSearchOpen: (isOpen: boolean) => void;
    setExportOpen: (isOpen: boolean) => void;
    setAutoConnectOpen: (isOpen: boolean) => void;
    setHistoryOpen: (isOpen: boolean) => void;
    setNotes: (notes: Note[]) => void;
    setConnections: (connections: Connection[]) => void;
    focusModeId?: string;
    setFocusModeId: (id: string | undefined) => void;

    // UI State
    scaleMode: 'real' | 'compact';
    showMinimap: boolean;
    showConnections: boolean;
    setScaleMode: (mode: 'real' | 'compact') => void;
    setShowMinimap: (show: boolean) => void;
    setShowConnections: (show: boolean) => void;
};

export const useStore = create<State>((set, get) => ({
    notes: [],
    connections: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    selectedId: undefined,
    focusModeId: undefined,
    isSettingsOpen: false,
    isHelpOpen: false,
    isSearchOpen: false,
    isExportOpen: false,
    isAutoConnectOpen: false,
    isHistoryOpen: false,
    addNote: (n) => {
        set((s) => ({ notes: [...s.notes, n] }));
        saveDataToDB(get().notes, get().connections);
    },
    updateNote: (id, patch) => {
        set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch } : n)) }));
        saveDataToDB(get().notes, get().connections);
    },
    deleteNote: (id) => {
        set((s) => ({
            notes: s.notes.filter((n) => n.id !== id),
            connections: s.connections.filter((c) => c.from !== id && c.to !== id),
            selectedId: s.selectedId === id ? undefined : s.selectedId,
        }));
        saveDataToDB(get().notes, get().connections);
    },
    addConnection: (c) => {
        // Prevent duplicate connections
        const exists = get().connections.some(
            (conn) => (conn.from === c.from && conn.to === c.to) || (conn.from === c.to && conn.to === c.from)
        );
        if (exists) return;
        set((s) => ({ connections: [...s.connections, c] }));
        saveDataToDB(get().notes, get().connections);
    },
    removeConnection: (id) => {
        set((s) => ({ connections: s.connections.filter((c) => c.id !== id) }));
        saveDataToDB(get().notes, get().connections);
    },
    setViewport: (viewport) => set({ viewport }),
    setSelectedId: (id) => set({ selectedId: id }),
    setFocusModeId: (id) => set({ focusModeId: id }),
    setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
    setHelpOpen: (isOpen) => set({ isHelpOpen: isOpen }),
    setSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),
    setExportOpen: (isOpen) => set({ isExportOpen: isOpen }),
    setAutoConnectOpen: (isOpen) => set({ isAutoConnectOpen: isOpen }),
    setHistoryOpen: (isOpen) => set({ isHistoryOpen: isOpen }),
    setNotes: (notes) => {
        set({ notes });
        saveDataToDB(notes, get().connections);
    },
    setConnections: (connections) => {
        set({ connections });
        saveDataToDB(get().notes, connections);
    },

    // UI State
    scaleMode: 'compact',
    showMinimap: true,
    showConnections: true,
    setScaleMode: (mode) => set({ scaleMode: mode }),
    setShowMinimap: (show) => set({ showMinimap: show }),
    setShowConnections: (show) => set({ showConnections: show }),
}));

// Debounce save
let saveTimeout: ReturnType<typeof setTimeout>;
let lastBackupTime = 0;
const BACKUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

const saveDataToDB = (notes: Note[], connections: Connection[]) => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
        try {
            const db = await initDB();
            const tx = db.transaction(['notes', 'connections', 'backups'], 'readwrite');

            const noteStore = tx.objectStore('notes');
            await noteStore.clear();
            for (const note of notes) {
                await noteStore.put(note);
            }

            const connStore = tx.objectStore('connections');
            await connStore.clear();
            for (const conn of connections) {
                await connStore.put(conn);
            }

            // Create a snapshot backup every 5 minutes
            const now = Date.now();
            if (now - lastBackupTime > BACKUP_INTERVAL && notes.length > 0) {
                const backupStore = tx.objectStore('backups');
                await backupStore.add({
                    timestamp: now,
                    notes: JSON.parse(JSON.stringify(notes)), // Deep copy to prevent mutation issues
                    connections: JSON.parse(JSON.stringify(connections))
                });
                lastBackupTime = now;
            }

            await tx.done;
        } catch (e) {
            console.error('Failed to save to IndexedDB:', e);
        }
    }, 800);
};

// Load on init
const loadFromDB = async () => {
    try {
        const db = await initDB();
        const notes = await db.getAll('notes');
        const connections = await db.getAll('connections');
        useStore.getState().setNotes(notes);
        useStore.getState().setConnections(connections);
    } catch (e) {
        console.error('Failed to load from IndexedDB:', e);
    }
};

loadFromDB();
