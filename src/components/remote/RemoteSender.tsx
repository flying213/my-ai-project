import { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';

interface RemoteSenderProps {
    targetId: string;
}

export const RemoteSender = ({ targetId }: RemoteSenderProps) => {
    const [status, setStatus] = useState('Initializing...');
    const videoRef = useRef<HTMLVideoElement>(null);
    const peerRef = useRef<Peer | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment', // Use back camera
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: false
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }

                const peer = new Peer();
                peerRef.current = peer;

                peer.on('open', () => {
                    setStatus(`Connecting to available host...`);
                    const call = peer.call(targetId, stream);

                    call.on('stream', () => {
                        // Usually we don't get a stream back, but just in case
                    });

                    // PeerJS call 'close' event isn't always reliable, but we can monitor
                    setStatus('Connected & Streaming');
                });

                peer.on('error', (err) => {
                    console.error(err);
                    setStatus(`Connection Error: ${err.type}`);
                });

            } catch (err: any) {
                setStatus(`Camera Error: ${err.message}`);
            }
        };

        init();

        return () => {
            peerRef.current?.destroy();
        };
    }, [targetId]);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#000',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{
                position: 'absolute',
                top: 20,
                left: 20,
                padding: '10px',
                background: 'rgba(0,0,0,0.5)',
                borderRadius: '8px',
                zIndex: 10
            }}>
                Status: {status}
            </div>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
        </div>
    );
};
