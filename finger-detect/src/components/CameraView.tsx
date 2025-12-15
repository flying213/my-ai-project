import { forwardRef, useEffect } from 'react';

interface CameraViewProps {
    onStreamReady: (video: HTMLVideoElement) => void;
}

export const CameraView = forwardRef<HTMLVideoElement, CameraViewProps>(({ onStreamReady }, ref) => {
    useEffect(() => {
        async function setupCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: 1280,
                        height: 720
                    },
                    audio: false
                });

                if (ref && 'current' in ref && ref.current) {
                    ref.current.srcObject = stream;
                    ref.current.onloadeddata = () => {
                        onStreamReady(ref.current!);
                    };
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                alert("Unable to access camera. Please allow camera permissions.");
            }
        }

        setupCamera();
    }, [onStreamReady, ref]);

    return (
        <video
            ref={ref}
            autoPlay
            playsInline
            className="camera-view"
            style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)' // Mirror effect
            }}
        />
    );
});
