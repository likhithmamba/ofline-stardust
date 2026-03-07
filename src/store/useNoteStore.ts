// ─── Note Enhancement Store ──────────────────────────────────────────────────
// Manages editing state, note styles, minimized state, and AI interaction.
// Delegates core CRUD to the existing useStore for backward compatibility.
// This store adds: editingNoteId, note metadata, deletion safety, keyboard guards.

import { create } from 'zustand';
import { useStore } from './useStore';
import {
    saveNoteMeta,
    loadAllNoteMeta,
    deleteNoteMeta,
    type NoteMetadata,
} from '../db/noteDB';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NoteStyle {
    theme: 'ghost' | 'obsidian' | 'paper' | 'neon' | 'chalk' | 'terminal';
    fontFamily: 'sans' | 'serif' | 'mono';
    fontSize: number;
    accentColor: string;
}

const DEFAULT_STYLE: NoteStyle = {
    theme: 'obsidian',
    fontFamily: 'sans',
    fontSize: 14,
    accentColor: '#8b5cf6',
};

// ─── Store Interface ─────────────────────────────────────────────────────────

interface NoteStoreState {
    // Editing state
    editingNoteId: string | null;

    // Note metadata (keyed by note ID)
    noteMeta: Record<string, NoteMetadata>;

    // Deletion undo
    pendingDeletion: { id: string; timeout: ReturnType<typeof setTimeout> } | null;

    // Toast messages
    toastMessage: string | null;

    // Loading state
    isLoaded: boolean;

    // Actions
    setEditingNote: (id: string | null) => void;

    // Metadata CRUD
    getNoteMeta: (id: string) => NoteMetadata;
    updateNoteMeta: (id: string, patch: Partial<NoteMetadata>) => void;
    updateNoteStyle: (id: string, stylePatch: Partial<NoteStyle>) => void;

    // Minimize
    toggleMinimize: (id: string) => void;

    // Safe delete (with undo toast)
    safeDeleteNote: (id: string) => void;
    undoDelete: () => void;

    // Toast
    showToast: (message: string, duration?: number) => void;
    clearToast: () => void;

    // Persistence
    loadFromDB: () => Promise<void>;

    // Connection helpers (bidirectional)
    addBidirectionalConnection: (fromId: string, toId: string) => void;
}

// ─── Debounced Save ──────────────────────────────────────────────────────────

const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

function debouncedSaveMeta(meta: NoteMetadata) {
    const existing = saveTimers.get(meta.id);
    if (existing) clearTimeout(existing);

    saveTimers.set(
        meta.id,
        setTimeout(() => {
            saveNoteMeta(meta).catch((e) =>
                console.error('[useNoteStore] Failed to save meta:', e)
            );
            saveTimers.delete(meta.id);
        }, 500)
    );
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useNoteStore = create<NoteStoreState>((set, get) => ({
    editingNoteId: null,
    noteMeta: {},
    pendingDeletion: null,
    toastMessage: null,
    isLoaded: false,

    setEditingNote: (id) => set({ editingNoteId: id }),

    getNoteMeta: (id) => {
        const existing = get().noteMeta[id];
        if (existing) return existing;
        // Return default metadata if none exists yet
        return {
            id,
            style: { ...DEFAULT_STYLE },
            isMinimized: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
    },

    updateNoteMeta: (id, patch) => {
        set((state) => {
            const existing = state.noteMeta[id] || {
                id,
                style: { ...DEFAULT_STYLE },
                isMinimized: false,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            const updated: NoteMetadata = {
                ...existing,
                ...patch,
                id, // never overwrite id
                updatedAt: Date.now(),
            };
            const newMeta = { ...state.noteMeta, [id]: updated };
            debouncedSaveMeta(updated);
            return { noteMeta: newMeta };
        });
    },

    updateNoteStyle: (id, stylePatch) => {
        const current = get().getNoteMeta(id);
        get().updateNoteMeta(id, {
            style: { ...current.style, ...stylePatch },
        });
    },

    toggleMinimize: (id) => {
        const current = get().getNoteMeta(id);
        get().updateNoteMeta(id, { isMinimized: !current.isMinimized });
    },

    safeDeleteNote: (id) => {
        // Cancel any existing pending deletion
        const existing = get().pendingDeletion;
        if (existing) {
            clearTimeout(existing.timeout);
            // Execute the previous pending deletion immediately
            const mainStore = useStore.getState();
            mainStore.deleteNote(existing.id);
            deleteNoteMeta(existing.id);
        }

        // Set up the new pending deletion with 4-second undo window
        const timeout = setTimeout(() => {
            const mainStore = useStore.getState();
            mainStore.deleteNote(id);
            deleteNoteMeta(id);
            set({ pendingDeletion: null, toastMessage: null });
        }, 4000);

        set({
            pendingDeletion: { id, timeout },
            toastMessage: `Note deleted. Undo?`,
        });

        // If this note was being edited, clear editing state
        if (get().editingNoteId === id) {
            set({ editingNoteId: null });
        }
    },

    undoDelete: () => {
        const pending = get().pendingDeletion;
        if (pending) {
            clearTimeout(pending.timeout);
            set({ pendingDeletion: null, toastMessage: null });
        }
    },

    showToast: (message, duration = 3000) => {
        set({ toastMessage: message });
        setTimeout(() => {
            set((state) => {
                if (state.toastMessage === message) {
                    return { toastMessage: null };
                }
                return {};
            });
        }, duration);
    },

    clearToast: () => set({ toastMessage: null }),

    loadFromDB: async () => {
        try {
            const allMeta = await loadAllNoteMeta();
            const metaRecord: Record<string, NoteMetadata> = {};
            for (const m of allMeta) {
                metaRecord[m.id] = m;
            }
            set({ noteMeta: metaRecord, isLoaded: true });

            // P3: Orphan cleanup — remove metadata for notes that no longer exist
            // Wait a tick for useStore to finish loading its notes
            setTimeout(() => {
                const mainNotes = useStore.getState().notes;
                const noteIds = new Set(mainNotes.map(n => n.id));
                const orphanIds = allMeta
                    .filter(m => !noteIds.has(m.id))
                    .map(m => m.id);

                if (orphanIds.length > 0) {
                    console.log(`[useNoteStore] Cleaning up ${orphanIds.length} orphaned metadata entries`);
                    for (const id of orphanIds) {
                        deleteNoteMeta(id);
                    }
                    // Remove from state too
                    set(state => {
                        const cleaned = { ...state.noteMeta };
                        for (const id of orphanIds) {
                            delete cleaned[id];
                        }
                        return { noteMeta: cleaned };
                    });
                }
            }, 1500); // Wait for main store to hydrate
        } catch (e) {
            console.error('[useNoteStore] Failed to load from DB:', e);
            set({ isLoaded: true }); // Still mark as loaded so UI renders
        }
    },

    addBidirectionalConnection: (fromId, toId) => {
        const mainStore = useStore.getState();
        // Check if connection already exists
        const exists = mainStore.connections.some(
            (c) =>
                (c.from === fromId && c.to === toId) ||
                (c.from === toId && c.to === fromId)
        );
        if (exists) return;

        mainStore.addConnection({
            id: crypto.randomUUID?.() || Math.random().toString(36).substr(2, 9),
            from: fromId,
            to: toId,
        });
    },
}));
