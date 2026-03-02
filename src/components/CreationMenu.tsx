import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NoteType, NOTE_STYLES } from '../constants';

interface CreationMenuProps {
    x: number;
    y: number;
    isOpen: boolean;
    onClose: () => void;
    onSelect: (type: NoteType) => void;
}

export const CreationMenu: React.FC<CreationMenuProps> = ({ x, y, isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;

    const options = Object.values(NoteType);
    const menuRadius = 140;

    return (
        <div
            className="fixed inset-0 z-50"
            onClick={onClose}
            onContextMenu={(e) => { e.preventDefault(); onClose(); }}
        >
            <motion.div
                className="absolute"
                style={{ left: 0, top: 0 }}
                animate={{ x, y }}
                transition={{ duration: 0 }}
            >
                <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* Orbital Ring Visual */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0 }}
                                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5 pointer-events-none"
                                style={{ width: menuRadius * 2 + 60, height: menuRadius * 2 + 60 }}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0 }}
                                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/3 pointer-events-none"
                                style={{ width: menuRadius * 2 + 120, height: menuRadius * 2 + 120 }}
                            />

                            {/* Planet Options */}
                            {options.map((type, index) => {
                                const angle = (index / options.length) * Math.PI * 2 - Math.PI / 2;
                                const itemX = Math.cos(angle) * menuRadius;
                                const itemY = Math.sin(angle) * menuRadius;

                                const style = NOTE_STYLES[type];
                                const previewSize = Math.max(20, Math.min(40, style.width / 20));

                                return (
                                    <motion.button
                                        key={type}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        transition={{ delay: index * 0.03, type: 'spring', stiffness: 300, damping: 20 }}
                                        className="absolute flex flex-col items-center justify-center pointer-events-auto group"
                                        style={{
                                            left: '50%',
                                            top: '50%',
                                            transform: `translate(calc(-50% + ${itemX}px), calc(-50% + ${itemY}px))`,
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelect(type);
                                            onClose();
                                        }}
                                        title={style.label}
                                    >
                                        {/* Planet Preview */}
                                        <div
                                            className="rounded-full transition-transform group-hover:scale-125 mb-1"
                                            style={{
                                                width: previewSize,
                                                height: previewSize,
                                                backgroundColor: style.color,
                                                boxShadow: `0 0 16px ${style.color}80`,
                                            }}
                                        />
                                        {/* Label */}
                                        <span className="text-[9px] text-white/60 group-hover:text-white transition-colors font-medium tracking-wide uppercase whitespace-nowrap">
                                            {style.label}
                                        </span>
                                    </motion.button>
                                );
                            })}
                        </>
                    )}
                </AnimatePresence>

                {/* Center Pulse */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="w-3 h-3 bg-white/60 rounded-full absolute -ml-1.5 -mt-1.5 pointer-events-none"
                    style={{ boxShadow: '0 0 12px rgba(255,255,255,0.4)' }}
                />
            </motion.div>
        </div>
    );
};
