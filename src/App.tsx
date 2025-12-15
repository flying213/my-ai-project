import { useRef, useEffect, useState } from 'react';
import { CameraView } from './components/CameraView';
import { CanvasOverlay, drawResults } from './components/CanvasOverlay';
import { handDetection } from './utils/handDetection';

function App() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        handDetection.initialize()
            .then(() => {
                console.log("Hand Detection Model Loaded");
                setIsLoaded(true);
            })
            .catch((err) => {
                console.error("Failed to load model", err);
                setError("Failed to load hand detection model.");
            });
    }, []);

    const handleStreamReady = (video: HTMLVideoElement) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Match canvas size to video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const loop = () => {
            if (video.readyState >= 2 && isLoaded) { // HAVE_CURRENT_DATA
                const startTimeMs = performance.now();
                const results = handDetection.detectForVideo(video, startTimeMs);

                // Always draw, passing results if available, or null if not
                drawResults(ctx, results);
            }
            animationFrameId = requestAnimationFrame(loop);
        };

        loop();

        return () => {
            cancelAnimationFrame(animationFrameId);
        }
    };

    return (
        <div className="app-container">
            <h1>Finger Detection</h1>
            <div className="camera-container">
                {!isLoaded && !error && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>Loading Model...</div>}
                {error && <div style={{ color: 'red', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>{error}</div>}

                <CameraView ref={videoRef} onStreamReady={handleStreamReady} />
                <CanvasOverlay ref={canvasRef} />
            </div>
            <p className="instruction-text">
                Show your hand to the camera to detect fingers.
            </p>
        </div>
    )
}

export default App
