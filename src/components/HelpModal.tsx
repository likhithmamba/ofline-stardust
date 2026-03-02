import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard, Mouse, Sparkles, Globe, Trash2, Link2 } from 'lucide-react';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const shortcuts = [
        { keys: ['Double-click'], action: 'Create new note on canvas', icon: Mouse },
        { keys: ['Click'], action: 'Select a note', icon: Mouse },
        { keys: ['Drag'], action: 'Move note / pan canvas', icon: Mouse },
        { keys: ['Ctrl', 'Scroll'], action: 'Zoom in/out', icon: Mouse },
        { keys: ['Scroll'], action: 'Pan canvas', icon: Mouse },
        { keys: ['Delete'], action: 'Delete selected note', icon: Keyboard },
        { keys: ['Escape'], action: 'Deselect / close panels', icon: Keyboard },
    ];

    const features = [
        { icon: Sparkles, title: 'AI Spark', desc: 'Click Spark on any note to get AI-generated expansions via Ollama' },
        { icon: Globe, title: 'AI Chat', desc: 'Open the sidebar chat to brainstorm with your local AI' },
        { icon: Trash2, title: 'Black Hole Delete', desc: 'Drag any note to the spinning black hole in the bottom-right to delete it' },
        { icon: Link2, title: 'Connections', desc: 'Select a note → drag from the white handles to another note to create links' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={onClose}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="bg-slate-900 border border-white/10 rounded-2xl w-[520px] max-h-[80vh] shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 px-6 py-4 flex justify-between items-center border-b border-white/5">
                            <div>
                                <h2 className="text-white font-bold text-lg">🌌 Stardust Guide</h2>
                                <p className="text-slate-400 text-xs mt-0.5">Your cosmic canvas — all features</p>
                            </div>
                            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
                            {/* Keyboard Shortcuts */}
                            <div>
                                <h3 className="text-white/80 text-sm font-semibold mb-3 uppercase tracking-wider">Controls</h3>
                                <div className="space-y-1.5">
                                    {shortcuts.map((s, i) => (
                                        <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-white/5 transition-colors">
                                            <span className="text-slate-300 text-sm">{s.action}</span>
                                            <div className="flex gap-1">
                                                {s.keys.map(k => (
                                                    <kbd key={k} className="px-2 py-0.5 text-xs bg-slate-800 border border-slate-600 rounded text-slate-300 font-mono">{k}</kbd>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Features */}
                            <div>
                                <h3 className="text-white/80 text-sm font-semibold mb-3 uppercase tracking-wider">Features</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {features.map((f, i) => (
                                        <div key={i} className="p-3 bg-slate-800/50 border border-white/5 rounded-xl">
                                            <div className="flex items-center gap-2 mb-1">
                                                <f.icon size={14} className="text-purple-400" />
                                                <span className="text-white font-medium text-xs">{f.title}</span>
                                            </div>
                                            <p className="text-slate-400 text-[11px] leading-relaxed">{f.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* About */}
                            <div className="bg-slate-800/30 border border-white/5 rounded-xl p-3">
                                <p className="text-slate-500 text-xs leading-relaxed">
                                    <span className="text-slate-300 font-medium">Stardust v2.0</span> — Space-themed infinite canvas powered by local AI via Ollama.
                                    No internet required. No API keys. Your data stays on your machine.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
