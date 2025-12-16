import { forwardRef, useEffect, useState, useRef, useImperativeHandle } from 'react';
import Peer from 'peerjs';
import { QRCodeCanvas } from 'qrcode.react';

interface RemoteCameraViewProps {
    onStreamReady: (video: HTMLVideoElement) => void | (() => void);
}

export const RemoteCameraView = forwardRef<HTMLVideoElement, RemoteCameraViewProps>(({ onStreamReady }, ref) => {
    const [peerId, setPeerId] = useState('');
    const [connected, setConnected] = useState(false);
    const internalVideoRef = useRef<HTMLVideoElement>(null);
    const peerRef = useRef<Peer | null>(null);

    // Expose internal ref to parent
    useImperativeHandle(ref, () => internalVideoRef.current!);

    useEffect(() => {
        let cleanupFn: (() => void) | void;
        // Create Peer instance
        // Note: In strict mode, this might fire twice, causing ID issues. 
        // In prod it's fine. For robustness, we could persist ID but random is fine.
        const peer = new Peer();
        peerRef.current = peer;

        peer.on('open', (id) => {
            setPeerId(id);
        });

        peer.on('call', (call) => {
            call.answer(); // Answer the call, no stream needed from us

            call.on('stream', (remoteStream) => {
                if (internalVideoRef.current) {
                    internalVideoRef.current.srcObject = remoteStream;
                    // Play is required to trigger data flow
                    internalVideoRef.current.play().then(() => {
                        // Notify parent that we have a 'ready' video element
                        cleanupFn = onStreamReady(internalVideoRef.current!);
                        setConnected(true);
                    }).catch(console.error);
                }
            });
        });

        return () => {
            if (typeof cleanupFn === 'function') cleanupFn();
            peer.destroy();
        };
    }, [onStreamReady]);

    const connectionUrl = peerId ? `${window.location.protocol}//${window.location.host}/?mode=sender&target=${peerId}` : '';

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', minHeight: '100%' }}>
            <video
                ref={internalVideoRef}
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: connected ? 'block' : 'none' }}
            />

            {!connected && (
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    color: 'white', textAlign: 'center',
                    padding: 20
                }}>
                    <h3 style={{ marginBottom: 20 }}>Scan to Connect Camera</h3>
                    {peerId ? (
                        <>
                            <div style={{ background: 'white', padding: 16, borderRadius: 8 }}>
                                <QRCodeCanvas value={connectionUrl} size={200} />
                            </div>
                            <p style={{ marginTop: 20, zIndex: 100 }}>Open camera on your mobile device and scan.</p>
                        </>
                    ) : (
                        <p>Initializing P2P Network...</p>
                    )}
                </div>
            )}
        </div>
    );
});
