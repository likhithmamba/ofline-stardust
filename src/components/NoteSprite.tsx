import type { Note } from '../store/useStore';

// Helper to get color based on type
const getNoteColor = (type: string) => {
    switch (type) {
        case 'galaxy': return '#a855f7'; // Purple
        case 'system': return '#4f46e5'; // Indigo
        case 'star': return '#f59e0b';   // Amber
        case 'planet': return '#0ea5e9'; // Blue
        case 'moon': return '#10b981';   // Emerald
        case 'comet': return '#14b8a6';  // Teal
        default: return '#64748b';       // Slate (Default)
    }
};

export const drawNote = (ctx: CanvasRenderingContext2D, note: Note, isSelected: boolean, time: number = 0) => {
    const { x, y, w, h, title, type } = note;
    const color = note.color || getNoteColor(type);

    // 1. Glow / Atmosphere
    // Notes emit a soft glow matching their type
    const glowSize = isSelected ? 25 + Math.sin(time / 400) * 5 : 15;

    ctx.shadowColor = color;
    ctx.shadowBlur = glowSize;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 2. Glass Body (The "Tablet")
    // Gradient from top-left to bottom-right for depth
    const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
    gradient.addColorStop(0, `${color}20`); // Slightly more opaque
    gradient.addColorStop(1, `${color}05`); // Very transparent

    // Add a subtle inner shadow/glow
    const innerGlow = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, w);
    innerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.02)');
    innerGlow.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 16);
    ctx.fill();

    ctx.fillStyle = innerGlow;
    ctx.fill();

    // Reset shadow for internal details
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // 3. Stardust Particles (Subtle Texture)
    // Draw random tiny dots inside to simulate "trapped stardust"
    const seed = x + y;
    const particleCount = 8; // Increased count
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < particleCount; i++) {
        const px = x + Math.abs(Math.sin(seed + i * 1.1)) * (w - 16) + 8;
        const py = y + Math.abs(Math.cos(seed + i * 1.2)) * (h - 16) + 8;
        const size = Math.abs(Math.sin(seed * i)) * 1.2 + 0.5;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
    }

    // 4. Glass Border (Rim Light)
    ctx.lineWidth = isSelected ? 1.5 : 0.5; // Thinner, sharper border
    const borderGradient = ctx.createLinearGradient(x, y, x, y + h);
    borderGradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
    borderGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
    borderGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');

    ctx.strokeStyle = isSelected ? color : borderGradient;
    ctx.stroke();

    // 5. Constellation Label (Title)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = '600 15px Inter, sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText(title || 'Untitled', x + 16, y + 28);
    ctx.shadowBlur = 0;

    // Decorative line under title
    ctx.beginPath();
    ctx.moveTo(x + 16, y + 36);
    ctx.lineTo(x + w - 16, y + 36);
    ctx.strokeStyle = `${color}40`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // 6. Content Preview (Floating Ink)
    // Simulate "ink" with a slight glow and blur
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '13px Inter, sans-serif';
    ctx.shadowColor = `${color}80`; // Glow matching note color
    ctx.shadowBlur = 8;
    ctx.fillText('Double-click to edit...', x + 16, y + 60);

    // Simulated lines of text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.shadowBlur = 0;
    ctx.fillRect(x + 16, y + 75, w * 0.6, 2);
    ctx.fillRect(x + 16, y + 85, w * 0.4, 2);

    // 7. Status Indicator (Orbital Dot)
    // Top right corner dot
    ctx.fillStyle = isSelected ? '#ffffff' : color;
    ctx.beginPath();
    ctx.arc(x + w - 12, y + 12, 3, 0, Math.PI * 2);
    ctx.fill();

    // Ring around dot if selected
    if (isSelected) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x + w - 12, y + 12, 6, 0, Math.PI * 2);
        ctx.stroke();
    }
};
