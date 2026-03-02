import React from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';

interface BlackHoleProps {
    isActive: boolean;
}

export const BlackHole: React.FC<BlackHoleProps> = ({ isActive }) => {
    return (
        <div className="fixed bottom-8 right-8 w-32 h-32 pointer-events-none z-40 flex items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center">
                {/* Event Horizon */}
                <motion.div
                    className="absolute w-24 h-24 bg-black rounded-full"
                    style={{ boxShadow: '0 0 50px #000, 0 0 80px rgba(0,0,0,0.5)' }}
                    animate={{
                        scale: isActive ? 1.5 : 1,
                        rotate: 360
                    }}
                    transition={{
                        rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                        scale: { duration: 0.3 }
                    }}
                />

                {/* Accretion Disk */}
                <motion.div
                    className="absolute w-32 h-32 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-orange-500 border-l-transparent opacity-80"
                    style={{ filter: 'blur(2px)' }}
                    animate={{ rotate: -360 }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                    className="absolute w-40 h-40 rounded-full border-2 border-t-transparent border-r-white border-b-transparent border-l-white opacity-30"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                />

                {/* Delete Label */}
                <motion.div
                    className="absolute -top-8 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap"
                    animate={{
                        opacity: isActive ? 1 : 0.4,
                        scale: isActive ? 1.1 : 1,
                        y: isActive ? -4 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                    style={{
                        background: isActive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(0,0,0,0.4)',
                        border: isActive ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255,255,255,0.05)',
                        color: isActive ? '#fca5a5' : 'rgba(255,255,255,0.3)',
                        backdropFilter: 'blur(4px)',
                    }}
                >
                    <Trash2 size={8} />
                    {isActive ? 'Release to delete' : 'Drop to delete'}
                </motion.div>
            </div>
        </div>
    );
};
