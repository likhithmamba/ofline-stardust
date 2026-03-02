import React, { useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Minus } from 'lucide-react';
import { NOTE_STYLES, NoteType } from '../constants';

export const MiniMap: React.FC = () => {
    const notes = useStore((state) => state.notes);
    const viewport = useStore((state) => state.viewport);
    const setViewport = useStore((state) => state.setViewport);
    const showMinimap = useStore((state) => state.showMinimap);
    const scaleMode = useStore((state) => state.scaleMode);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Compute bounds for all notes
    const getBounds = useCallback(() => {
        if (notes.length === 0) return null;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        notes.forEach(n => {
            const style = NOTE_STYLES[n.type] || NOTE_STYLES[NoteType.Asteroid];
            const w = scaleMode === 'real' ? (REAL_SIZES[n.type] || 64) : style.width;
            const h = w;
            minX = Math.min(minX, n.x);
            minY = Math.min(minY, n.y);
            maxX = Math.max(maxX, n.x + w);
            maxY = Math.max(maxY, n.y + h);
        });
        const padding = 2000;
        return { minX: minX - padding, minY: minY - padding, maxX: maxX + padding, maxY: maxY + padding };
    }, [notes, scaleMode]);

    useEffect(() => {
        if (!showMinimap) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Background circle
        ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, width / 2, 0, Math.PI * 2);
        ctx.fill();

        const bounds = getBounds();
        if (!bounds) return;

        const { minX, minY, maxX, maxY } = bounds;
        const mapW = maxX - minX;
        const mapH = maxY - minY;
        const scale = Math.min(width / mapW, height / mapH);

        // Draw notes
        notes.forEach(n => {
            const style = NOTE_STYLES[n.type] || NOTE_STYLES[NoteType.Asteroid];
            ctx.fillStyle = style.color || n.color || '#3b82f6';
            const nw = scaleMode === 'real' ? (REAL_SIZES[n.type] || 64) : style.width;
            const x = (n.x - minX) * scale;
            const y = (n.y - minY) * scale;
            const w = Math.max(2, nw * scale);

            ctx.beginPath();
            ctx.arc(x + w / 2, y + w / 2, Math.max(2, w / 2), 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw viewport rect
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const vx = (-viewport.x / viewport.zoom - minX) * scale;
        const vy = (-viewport.y / viewport.zoom - minY) * scale;
        const vw = (screenW / viewport.zoom) * scale;
        const vh = (screenH / viewport.zoom) * scale;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(vx, vy, vw, vh);
    }, [notes, viewport, showMinimap, getBounds, scaleMode]);

    const handleZoom = (delta: number) => {
        const newZoom = Math.max(0.1, Math.min(5, viewport.zoom + delta));
        setViewport({ ...viewport, zoom: newZoom });
    };

    const handleMinimapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const bounds = getBounds();
        if (!bounds) return;

        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const { minX, minY, maxX, maxY } = bounds;
        const mapW = maxX - minX;
        const mapH = maxY - minY;
        const scale = Math.min(canvas.width / mapW, canvas.height / mapH);

        // Convert click to world coordinates
        const worldX = clickX / scale + minX;
        const worldY = clickY / scale + minY;

        // Center viewport on that world position
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        setViewport({
            ...viewport,
            x: -(worldX * viewport.zoom - screenW / 2),
            y: -(worldY * viewport.zoom - screenH / 2),
        });
    };

    // Hooks are all called above, now safe to conditionally return
    if (!showMinimap) return null;

    return (
        <div className="stardust-minimap flex flex-col items-center justify-center">
            <canvas
                ref={canvasRef}
                width={140}
                height={140}
                className="w-full h-full cursor-crosshair opacity-80 hover:opacity-100 transition-opacity absolute inset-0"
                onClick={handleMinimapClick}
            />
            <div className="absolute bottom-2 flex gap-1 z-10">
                <button onClick={() => handleZoom(-0.1)} className="p-1 hover:bg-white/20 rounded-full text-white/50 hover:text-white transition-colors" title="Zoom Out">
                    <Minus size={12} />
                </button>
                <button onClick={() => handleZoom(0.1)} className="p-1 hover:bg-white/20 rounded-full text-white/50 hover:text-white transition-colors" title="Zoom In">
                    <Plus size={12} />
                </button>
            </div>
        </div>
    );
};

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
