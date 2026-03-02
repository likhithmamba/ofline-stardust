export class SoundManager {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;

    constructor() {
        try {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3; // Master volume
            this.masterGain.connect(this.ctx.destination);
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    private ensureContext() {
        if (this.ctx?.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playHover() {
        if (!this.ctx || !this.masterGain) return;
        this.ensureContext();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    playClick() {
        if (!this.ctx || !this.masterGain) return;
        this.ensureContext();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(55, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playConnect() {
        if (!this.ctx || !this.masterGain) return;
        this.ensureContext();

        // Play a major chord
        const freqs = [440, 554.37, 659.25]; // A4, C#5, E5
        freqs.forEach((f, i) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();

            osc.type = 'sine';
            osc.frequency.value = f;

            gain.gain.setValueAtTime(0, this.ctx!.currentTime);
            gain.gain.linearRampToValueAtTime(0.05, this.ctx!.currentTime + 0.1 + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 1.5);

            osc.connect(gain);
            gain.connect(this.masterGain!);

            osc.start();
            osc.stop(this.ctx!.currentTime + 1.5);
        });
    }

    playWarp() {
        if (!this.ctx || !this.masterGain) return;
        this.ensureContext();

        // White noise buffer
        const bufferSize = this.ctx.sampleRate * 1.0; // 1 second
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(100, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(5000, this.ctx.currentTime + 0.5);
        filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 1.0);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.5);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.0);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start();
        noise.stop(this.ctx.currentTime + 1.0);
    }
}

export const soundManager = new SoundManager();
