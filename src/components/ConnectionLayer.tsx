import React from 'react';
import { useStore, type Connection, type Note } from '../store/useStore';
import { NOTE_STYLES, NoteType } from '../constants';

interface ConnectionLayerProps {
    connections: Connection[];
    notes: Note[];
    tempConnection: { startId: string, endX: number, endY: number } | null;
    zoom: number;
}

const REAL_SIZES: Record<string, number> = {
    [NoteType.Sun]: 320,
    [NoteType.Jupiter]: 160,
    [NoteType.Saturn]: 140,
    [NoteType.Earth]: 64,
    [NoteType.Mars]: 56,
    [NoteType.Asteroid]: 24,
    [NoteType.Nebula]: 600,
    [NoteType.Galaxy]: 500,
};

export const ConnectionLayer: React.FC<ConnectionLayerProps> = ({ connections, notes, tempConnection }) => {
    const scaleMode = useStore((state) => state.scaleMode);
    const showConnections = useStore((state) => state.showConnections);
    const removeConnection = useStore((state) => state.removeConnection);

    if (!showConnections) return null;

    const getNoteSize = (type: NoteType) => {
        if (scaleMode === 'real') {
            return REAL_SIZES[type] || 64;
        }
        return (NOTE_STYLES[type] || NOTE_STYLES[NoteType.Asteroid]).width;
    };

    const getNoteCenter = (note: Note) => {
        const size = getNoteSize(note.type);
        return {
            x: note.x + size / 2,
            y: note.y + size / 2
        };
    };

    const handleConnectionClick = (e: React.MouseEvent, connId: string) => {
        e.stopPropagation();
        if (confirm('Delete this connection?')) {
            removeConnection(connId);
        }
    };

    const renderConnection = (x1: number, y1: number, x2: number, y2: number, isTemp: boolean = false, connId?: string) => {
        const cp1x = x1 + (x2 - x1) * 0.5;
        const cp1y = y1;
        const cp2x = x2 - (x2 - x1) * 0.5;
        const cp2y = y2;

        const path = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;

        return (
            <g key={isTemp ? 'temp' : connId || `${x1}-${y1}`}>
                {/* Glow */}
                <path
                    d={path}
                    fill="none"
                    stroke={isTemp ? "rgba(255, 255, 255, 0.5)" : "rgba(139, 92, 246, 0.3)"}
                    strokeWidth={isTemp ? 4 : 3}
                    style={{ filter: 'blur(4px)' }}
                />
                {/* Core Line */}
                <path
                    d={path}
                    fill="none"
                    stroke={isTemp ? "white" : "rgba(255, 255, 255, 0.25)"}
                    strokeWidth={isTemp ? 2 : 1}
                    strokeDasharray={isTemp ? "5,5" : "none"}
                />
                {/* Clickable hitarea for deletion */}
                {!isTemp && connId && (
                    <path
                        d={path}
                        fill="none"
                        stroke="transparent"
                        strokeWidth={12}
                        className="pointer-events-auto cursor-pointer"
                        style={{ pointerEvents: 'stroke' }}
                        onClick={(e) => handleConnectionClick(e, connId)}
                    >
                        <title>Click to delete connection</title>
                    </path>
                )}
                {/* End dot */}
                {!isTemp && (
                    <circle cx={x2} cy={y2} r={3} fill="rgba(139, 92, 246, 0.6)" />
                )}
                {/* Start dot */}
                {!isTemp && (
                    <circle cx={x1} cy={y1} r={3} fill="rgba(139, 92, 246, 0.6)" />
                )}
            </g>
        );
    };

    return (
        <svg
            className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible z-0"
        >
            {connections.map(conn => {
                const from = notes.find(n => n.id === conn.from);
                const to = notes.find(n => n.id === conn.to);
                if (!from || !to) return null;

                const start = getNoteCenter(from);
                const end = getNoteCenter(to);

                return (
                    <React.Fragment key={conn.id}>
                        {renderConnection(start.x, start.y, end.x, end.y, false, conn.id)}
                    </React.Fragment>
                );
            })}

            {tempConnection && (() => {
                const from = notes.find(n => n.id === tempConnection.startId);
                if (!from) return null;
                const start = getNoteCenter(from);
                return renderConnection(start.x, start.y, tempConnection.endX, tempConnection.endY, true);
            })()}
        </svg>
    );
};
