import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, Link as LinkIcon, Loader } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Connection } from '../store/useStore';
import { suggestConnections } from '../utils/semanticLinks';
import type { SemanticLink } from '../utils/semanticLinks';

interface AutoConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AutoConnectModal: React.FC<AutoConnectModalProps> = ({ isOpen, onClose }) => {
    const notes = useStore(state => state.notes);
    const existingConnections = useStore(state => state.connections);
    const addConnection = useStore(state => state.addConnection);

    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<SemanticLink[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setSuggestions([]);
            setError(null);
            return;
        }

        const fetchSuggestions = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const links = await suggestConnections(notes);
                // Filter out links that already exist
                const newLinks = links.filter(link => {
                    const exists = existingConnections.some(c =>
                        (c.from === link.from && c.to === link.to) ||
                        (c.from === link.to && c.to === link.from)
                    );
                    return !exists;
                });

                if (newLinks.length === 0) {
                    setError(links.length > 0 ? "All suggested connections already exist." : "No new connections found.");
                } else {
                    setSuggestions(newLinks);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to analyze connections.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchSuggestions();
    }, [isOpen, notes, existingConnections]);

    const handleAccept = (link: SemanticLink) => {
        const newConnection: Connection = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            from: link.from,
            to: link.to,
        };
        addConnection(newConnection);
        setSuggestions(prev => prev.filter(s => s !== link));
        if (suggestions.length === 1) onClose(); // Close if it was the last one
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110]" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="bg-slate-900 border border-purple-500/30 rounded-2xl w-[500px] max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="bg-gradient-to-r from-purple-900/40 to-slate-900/40 px-5 py-4 flex justify-between items-center border-b border-white/5">
                        <h2 className="text-white font-semibold flex items-center gap-2">
                            <Sparkles size={18} className="text-purple-400" />
                            AI Semantic Connections
                        </h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-5 overflow-y-auto flex-1">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-10 space-y-4">
                                <Loader size={32} className="text-purple-500 animate-spin" />
                                <p className="text-slate-400 text-sm animate-pulse">Analyzing canvas semantics...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-8">
                                <p className="text-slate-400 text-sm">{error}</p>
                                <button onClick={onClose} className="mt-4 text-purple-400 hover:text-purple-300 text-sm">Close</button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-slate-400 text-sm mb-4">
                                    Found {suggestions.length} potential relationship{suggestions.length !== 1 && 's'}. Review and connect them.
                                </p>

                                {suggestions.map((link, i) => {
                                    const sourceNote = notes.find(n => n.id === link.from);
                                    const targetNote = notes.find(n => n.id === link.to);

                                    if (!sourceNote || !targetNote) return null;

                                    return (
                                        <div key={i} className="bg-slate-800/50 border border-white/5 rounded-xl p-4 flex flex-col gap-3 group hover:border-purple-500/30 transition-colors">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 text-sm text-slate-200 mb-1">
                                                        <span className="font-medium truncate">{sourceNote.title || 'Untitled'}</span>
                                                        <LinkIcon size={12} className="text-slate-500 shrink-0" />
                                                        <span className="font-medium truncate">{targetNote.title || 'Untitled'}</span>
                                                    </div>
                                                    <p className="text-xs text-purple-300/80 leading-relaxed italic">
                                                        "{link.reason}"
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleAccept(link)}
                                                    className="p-2 bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white rounded-lg transition-all shrink-0"
                                                    title="Accept Connection"
                                                >
                                                    <Check size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
