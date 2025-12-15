import { forwardRef } from 'react';
import { HandLandmarkerResult } from "@mediapipe/tasks-vision";

// We define our own connections map because importing from mediapipe sometimes causes issues in Vite if not configured perfectly
// But DrawingUtils handles it if we pass it correctly. However, simpler to draw manually or use defaults.
// Actually, let's try to do custom drawing for a "premium" feel.

interface CanvasOverlayProps {
    // no specific props needed for now, controlled by parent via ref
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

export function drawResults(ctx: CanvasRenderingContext2D, results: HandLandmarkerResult) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (results.landmarks) {
        for (const landmarks of results.landmarks) {
            // Draw connections
            drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
            // Draw landmarks
            drawLandmarks(ctx, landmarks, { color: '#FF0000', lineWidth: 2, radius: 4 });
        }
    }
}

// Simple helpers to avoid heavy dependency on DrawingUtils which might fail if not tree shaken correctly
function drawLandmarks(ctx: CanvasRenderingContext2D, landmarks: any[], style: any) {
    for (const landmark of landmarks) {
        const x = landmark.x * ctx.canvas.width;
        const y = landmark.y * ctx.canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, style.radius || 3, 0, 2 * Math.PI);
        ctx.fillStyle = style.color || 'white';
        ctx.fill();
    }
}

function drawConnectors(ctx: CanvasRenderingContext2D, landmarks: any[], connections: number[][], style: any) {
    ctx.beginPath();
    for (const connection of connections) {
        const start = landmarks[connection[0]];
        const end = landmarks[connection[1]];
        if (start && end) {
            ctx.moveTo(start.x * ctx.canvas.width, start.y * ctx.canvas.height);
            ctx.lineTo(end.x * ctx.canvas.width, end.y * ctx.canvas.height);
        }
    }
    ctx.strokeStyle = style.color || 'white';
    ctx.lineWidth = style.lineWidth || 2;
    ctx.stroke();
}

const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8], // Index
    [0, 9], [9, 10], [10, 11], [11, 12], // Middle
    [0, 13], [13, 14], [14, 15], [15, 16], // Ring
    [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
    [5, 9], [9, 13], [13, 17], [0, 17] // Palm
];
