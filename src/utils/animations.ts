export const Easing = {
    linear: (t: number) => t,
    easeInQuad: (t: number) => t * t,
    easeOutQuad: (t: number) => t * (2 - t),
    easeInOutQuad: (t: number) => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: (t: number) => t * t * t,
    easeOutCubic: (t: number) => (--t) * t * t + 1,
    easeInOutCubic: (t: number) => t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeInQuart: (t: number) => t * t * t * t,
    easeOutQuart: (t: number) => 1 - (--t) * t * t * t,
    easeInOutQuart: (t: number) => t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
    easeOutCirc: (t: number) => Math.sqrt(1 - (t - 1) * t),
    softSpring: (t: number) => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0
            ? 0
            : t === 1
                ? 1
                : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }
};

export class ParticleSystem {
    particles: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; color: string }[] = [];

    count: number;
    bounds: { w: number; h: number };

    constructor(count: number, bounds: { w: number; h: number }) {
        this.count = count;
        this.bounds = bounds;
        this.init();
    }

    init() {
        for (let i = 0; i < this.count; i++) {
            this.particles.push(this.createParticle());
        }
    }

    createParticle() {
        return {
            x: Math.random() * this.bounds.w,
            y: Math.random() * this.bounds.h,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            life: Math.random(),
            maxLife: 1.0,
            size: Math.random() * 2 + 0.5,
            color: `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1})`
        };
    }

    update(dt: number) {
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= dt * 0.001; // Decay

            if (p.life <= 0) {
                Object.assign(p, this.createParticle());
            }
        });
    }

    draw(ctx: CanvasRenderingContext2D) {
        this.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }
}
