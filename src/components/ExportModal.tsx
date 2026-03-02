import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileJson, FileText, Download } from 'lucide-react';
import { useStore } from '../store/useStore';
import { exportJSON, exportMarkdown } from '../utils/exportImport';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
    const notes = useStore(state => state.notes);
    const connections = useStore(state => state.connections);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110]" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="bg-slate-900 border border-white/10 rounded-2xl w-[400px] shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 px-5 py-4 flex justify-between items-center border-b border-white/5">
                        <h2 className="text-white font-semibold flex items-center gap-2">
                            <Download size={18} className="text-purple-400" />
                            Export Universe
                        </h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-5 space-y-3">
                        <p className="text-slate-400 text-sm mb-4">
                            Export your {notes.length} notes and {connections.length} connections.
                        </p>

                        <button
                            onClick={() => {
                                exportJSON(notes, connections);
                                onClose();
                            }}
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-white/5 hover:border-purple-500/50 hover:bg-white/5 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                                    <FileJson size={20} className="text-blue-400" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-white text-sm font-medium">Stardust JSON</h3>
                                    <p className="text-slate-500 text-xs mt-0.5">Best for backups. Preserves canvas positions.</p>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => {
                                exportMarkdown(notes);
                                onClose();
                            }}
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-white/5 hover:border-purple-500/50 hover:bg-white/5 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-500/10 rounded-lg group-hover:bg-slate-500/20 transition-colors">
                                    <FileText size={20} className="text-slate-400" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-white text-sm font-medium">Markdown document</h3>
                                    <p className="text-slate-500 text-xs mt-0.5">Extracts all text for use in other apps.</p>
                                </div>
                            </div>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
