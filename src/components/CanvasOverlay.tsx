import { forwardRef } from 'react';
import { HandLandmarkerResult } from "@mediapipe/tasks-vision";

// Particle System Logic
// Particle System Logic
class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
    scale: number;
    canvasWidth: number;
    canvasHeight: number;

    constructor(x: number, y: number, canvasWidth: number, canvasHeight: number) {
        this.x = x;
        this.y = y;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.scale = canvasWidth / 1000; // Base scale reference (e.g. 1.0 at 1000px width)

        const angle = Math.random() * Math.PI * 2;
        const speed = (Math.random() * 3 + 1) * this.scale; // Faster for better visibility
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        this.life = 1.0;
        // Elegant palette: Cyan, Pink, Gold, White
        const hues = [180, 300, 45, 0];
        const hue = hues[Math.floor(Math.random() * hues.length)];
        const sat = hue === 0 ? 0 : 100;
        this.color = `hsla(${hue}, ${sat}%, 70%,`; // Alpha handled in draw

        this.size = (Math.random() * 5 + 2) * this.scale; // Larger particles
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95; // Friction
        this.vy *= 0.95;
        this.vy += 0.05 * this.scale; // Slightly stronger gravity for "falling dust" feel
        this.life -= 0.02; // Slower decay
        this.size *= 0.96;

        // Strict Boundary Check: Kill immediately if out of bounds
        // Allow a small buffer (size) so they don't pop out instantly at the edge
        if (this.x < 0 || this.x > this.canvasWidth || this.y < 0 || this.y > this.canvasHeight) {
            this.life = 0;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.life <= 0) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color + this.life + ')';

        // Glow effect
        ctx.shadowBlur = 15 * this.scale; // Stronger glow
        ctx.shadowColor = this.color + '0.8)'; // Stronger glow opacity

        ctx.fill();
        ctx.shadowBlur = 0; // Reset
    }
}

class ParticleSystem {
    particles: Particle[] = [];

    emit(x: number, y: number, canvasWidth: number, canvasHeight: number) {
        // More particles for "obvious" effect
        for (let i = 0; i < 8; i++) {
            this.particles.push(new Particle(x, y, canvasWidth, canvasHeight));
        }
    }

    updateAndDraw(ctx: CanvasRenderingContext2D) {
        // Use additive blending for glowing effect
        ctx.globalCompositeOperation = 'lighter';

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update();
            p.draw(ctx);
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Reset blend mode
        ctx.globalCompositeOperation = 'source-over';
    }
}

const particleSystem = new ParticleSystem();

// Component
interface CanvasOverlayProps {
    isMirrored?: boolean;
}

export const CanvasOverlay = forwardRef<HTMLCanvasElement, CanvasOverlayProps>(({ isMirrored = true }, ref) => {
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
                transform: isMirrored ? 'scaleX(-1)' : 'none' // Match video mirror conditionally
            }}
        />
    );
});

export function drawResults(ctx: CanvasRenderingContext2D, results: HandLandmarkerResult | null) {
    // Clear canvas transparently
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // If hands detected, emit particles from Index Finger Tip (Landmark 8)
    if (results && results.landmarks) {
        for (const landmarks of results.landmarks) {
            const indexTip = landmarks[8];
            if (indexTip) {
                const x = indexTip.x * ctx.canvas.width;
                const y = indexTip.y * ctx.canvas.height;

                // Only emit if within bounds (clean edges)
                if (x >= 0 && x <= ctx.canvas.width && y >= 0 && y <= ctx.canvas.height) {
                    particleSystem.emit(x, y, ctx.canvas.width, ctx.canvas.height);
                }
            }
        }
    }

    // Always update and draw particles
    particleSystem.updateAndDraw(ctx);
}
