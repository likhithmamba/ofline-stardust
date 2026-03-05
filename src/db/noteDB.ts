// ─── Note Persistence Layer ──────────────────────────────────────────────────
// Dedicated IndexedDB wrapper for enhanced note metadata (styles, minimized state, etc.)
// The core note CRUD still goes through the existing idb.ts — this layer handles
// the extended note properties that the new NoteStore manages.

import { openDB as openIDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'stardust-notes';
const STORE_NAME = 'note_meta';
const VERSION = 1;

export interface NoteMetadata {
    id: string;
    style: {
        theme: 'ghost' | 'obsidian' | 'paper' | 'neon' | 'chalk' | 'terminal';
        fontFamily: 'sans' | 'serif' | 'mono';
        fontSize: number;
        accentColor: string;
    };
    isMinimized: boolean;
    createdAt: number;
    updatedAt: number;
}

let dbInstance: IDBPDatabase | null = null;
let dbFailed = false;
const fallbackMap = new Map<string, NoteMetadata>();

async function getDB(): Promise<IDBPDatabase | null> {
    if (dbInstance) return dbInstance;
    if (dbFailed) return null;

    try {
        dbInstance = await openIDB(DB_NAME, VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            }
        });
        return dbInstance;
    } catch (e) {
        console.warn('[noteDB] IndexedDB unavailable, falling back to in-memory Map:', e);
        dbFailed = true;
        return null;
    }
}

export async function saveNoteMeta(meta: NoteMetadata): Promise<void> {
    const db = await getDB();
    if (db) {
        await db.put(STORE_NAME, meta);
    } else {
        fallbackMap.set(meta.id, meta);
    }
}

export async function loadAllNoteMeta(): Promise<NoteMetadata[]> {
    const db = await getDB();
    if (db) {
        return db.getAll(STORE_NAME);
    }
    return Array.from(fallbackMap.values());
}

export async function deleteNoteMeta(id: string): Promise<void> {
    const db = await getDB();
    if (db) {
        await db.delete(STORE_NAME, id);
    } else {
        fallbackMap.delete(id);
    }
}

// Initialize the DB connection on import
getDB();
