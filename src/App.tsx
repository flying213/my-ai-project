import { useRef, useEffect, useState } from 'react';
import { CameraView } from './components/CameraView';
import { RemoteCameraView } from './components/remote/RemoteCameraView';
import { RemoteSender } from './components/remote/RemoteSender';
import { CanvasOverlay, drawResults } from './components/CanvasOverlay';
import { handDetection } from './utils/handDetection';

function App() {
    // Check for "Sender" mode (Mobile Device)
    const params = new URLSearchParams(window.location.search);
    const isSender = params.get('mode') === 'sender';
    const targetId = params.get('target');

    if (isSender && targetId) {
        return <RemoteSender targetId={targetId} />;
    }

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [useRemote, setUseRemote] = useState(false);

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
        const stage = stageRef.current;
        if (!canvas || !stage) return;

        // Calculate aspect ratio
        const videoRatio = video.videoWidth / video.videoHeight;

        // Apply to stage to force correct sizing
        // We set aspect-ratio so CSS max-width/max-height logic works
        stage.style.aspectRatio = `${videoRatio}`;

        // Match canvas logical size to video resolution
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

            <button
                onClick={() => setUseRemote(!useRemote)}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    zIndex: 100,
                    padding: '8px 16px',
                    borderRadius: 20,
                    border: 'none',
                    background: '#007bff',
                    color: 'white',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
            >
                {useRemote ? "📷 Switch to Local" : "📱 Connect Phone"}
            </button>

            <div className="camera-stage" ref={stageRef}>
                {!isLoaded && !error && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, color: 'white' }}>Loading Model...</div>}
                {error && <div style={{ color: 'red', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>{error}</div>}

                {useRemote ? (
                    <RemoteCameraView ref={videoRef} onStreamReady={handleStreamReady} />
                ) : (
                    <CameraView ref={videoRef} onStreamReady={handleStreamReady} />
                )}

                <CanvasOverlay ref={canvasRef} isMirrored={!useRemote} />
            </div>
            <p className="instruction-text">
                {useRemote ? "Scan QR with phone" : "Show hand to camera"}
            </p>
        </div>
    )
}

export default App
