import { forwardRef } from 'react';
import { HandLandmarkerResult } from "@mediapipe/tasks-vision";

// Particle System Logic
class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
        this.size = Math.random() * 3 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // Gravity
        this.life -= 0.02; // Decay
        this.size *= 0.95; // Shrink
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

class ParticleSystem {
    particles: Particle[] = [];

    emit(x: number, y: number) {
        // Emit multiple particles per frame for explosion effect
        for (let i = 0; i < 5; i++) {
            this.particles.push(new Particle(x, y));
        }
    }

    updateAndDraw(ctx: CanvasRenderingContext2D) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update();
            p.draw(ctx);
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
}

const particleSystem = new ParticleSystem();

// Component
interface CanvasOverlayProps {
}

export const CanvasOverlay = forwardRef<HTMLCanvasElement, CanvasOverlayProps>((_, ref) => {
    return (
        <canvas
            ref={ref}
            className="canvas-overlay"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                transform: 'scaleX(-1)' // Match video mirror
            }}
        />
    );
});

export function drawResults(ctx: CanvasRenderingContext2D, results: HandLandmarkerResult | null) {
    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // If hands detected, emit particles from Index Finger Tip (Landmark 8)
    if (results && results.landmarks) {
        for (const landmarks of results.landmarks) {
            const indexTip = landmarks[8];
            if (indexTip) {
                const x = indexTip.x * ctx.canvas.width;
                const y = indexTip.y * ctx.canvas.height;
                particleSystem.emit(x, y);
            }
        }
    }

    // Always update and draw particles
    particleSystem.updateAndDraw(ctx);
}
