import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, X, Clock, Trash2, RotateCcw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { initDB } from '../db/idb';

interface HistoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose }) => {
    const [snapshots, setSnapshots] = useState<any[]>([]);
    const setNotes = useStore(state => state.setNotes);
    const setConnections = useStore(state => state.setConnections);

    useEffect(() => {
        if (isOpen) {
            loadSnapshots();
        }
    }, [isOpen]);

    const loadSnapshots = async () => {
        try {
            const db = await initDB();
            const tx = db.transaction('backups', 'readonly');
            // Backups are stored with autoIncrement keys, we need to iterate
            let cursor = await tx.store.openCursor(null, 'prev'); // Get newest first
            const results = [];
            while (cursor) {
                results.push({
                    key: cursor.key,
                    data: cursor.value
                });
                cursor = await cursor.continue();
            }
            setSnapshots(results);
        } catch (e) {
            console.error("Failed to load snapshots", e);
        }
    };

    const handleRestore = async (snapshot: any) => {
        if (confirm('Restore this snapshot? This will overwrite your current canvas.')) {
            setNotes(snapshot.data.notes || []);
            setConnections(snapshot.data.connections || []);
            onClose();
        }
    };

    const handleDelete = async (key: IDBValidKey) => {
        try {
            const db = await initDB();
            await db.delete('backups', key);
            loadSnapshots();
        } catch (e) {
            console.error("Failed to delete snapshot", e);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110]" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="bg-slate-900 border border-white/10 rounded-2xl w-[450px] shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="bg-slate-800/80 px-5 py-4 flex justify-between items-center border-b border-white/5">
                        <h2 className="text-white font-semibold flex items-center gap-2">
                            <History size={18} className="text-slate-400" />
                            Canvas History
                        </h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-4 overflow-y-auto flex-1 bg-slate-900/50">
                        {snapshots.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 text-sm">
                                <Clock size={32} className="mx-auto mb-3 opacity-20" />
                                No snapshots available.
                                <br />Snapshots are saved automatically every 5 minutes.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {snapshots.map((snap) => (
                                    <div key={snap.key as number} className="flex items-center justify-between p-3 rounded-xl bg-slate-800 border border-white/5 hover:border-slate-600 transition-colors group">
                                        <div>
                                            <div className="text-sm font-medium text-slate-200">
                                                {new Date(snap.data.timestamp).toLocaleString()}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">
                                                {snap.data.notes?.length || 0} notes • {snap.data.connections?.length || 0} connections
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleRestore(snap)}
                                                className="p-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-xs"
                                                title="Restore this snapshot"
                                            >
                                                <RotateCcw size={14} /> Restore
                                            </button>
                                            <button
                                                onClick={() => handleDelete(snap.key)}
                                                className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                                                title="Delete snapshot"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
