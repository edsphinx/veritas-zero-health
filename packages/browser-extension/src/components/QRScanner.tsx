import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

interface VoucherData {
  type: string;
  version: string;
  data: {
    patientAddress: string;
    nillionDID: string;
    expiresAt: number;
    voucherNonce: number;
    signature: string;
    providerAddress: string;
    sbtContractAddress: string;
    chainId: number;
  };
}

interface QRScannerProps {
  onScan: (data: VoucherData) => void;
  onCancel: () => void;
}

export function QRScanner({ onScan, onCancel }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let animationFrame: number;

    async function startScanning() {
      try {
        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }, // Use back camera if available
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();

          // Start scanning loop
          const scanFrame = () => {
            if (!scanning || !videoRef.current || !canvasRef.current) {
              return;
            }

            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
              // Set canvas size to match video
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;

              // Draw video frame to canvas
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

              // Get image data
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

              // Scan for QR code
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
              });

              if (code) {
                try {
                  // Parse QR data
                  const voucherData: VoucherData = JSON.parse(code.data);

                  // Validate structure
                  if (voucherData.type === 'HEALTH_IDENTITY_SBT_CLAIM' && voucherData.data) {
                    // Check if expired
                    const now = Math.floor(Date.now() / 1000);
                    if (voucherData.data.expiresAt < now) {
                      setError('QR code has expired. Please request a new one.');
                      return;
                    }

                    // Success! Pass data to parent
                    setScanning(false);
                    stopCamera();
                    onScan(voucherData);
                    return;
                  } else {
                    setError('Invalid QR code format. This is not a VZH Health Identity voucher.');
                  }
                } catch (e) {
                  setError('Failed to parse QR code data.');
                }
              }
            }

            // Continue scanning
            animationFrame = requestAnimationFrame(scanFrame);
          };

          // Start scanning
          scanFrame();
        }
      } catch (err) {
        console.error('Camera error:', err);
        setError('Failed to access camera. Please grant camera permissions.');
      }
    }

    startScanning();

    // Cleanup
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      stopCamera();
    };
  }, [scanning, onScan]);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  function handleCancel() {
    setScanning(false);
    stopCamera();
    onCancel();
  }

  return (
    <div className="qr-scanner-overlay">
      <div className="qr-scanner-modal">
        {/* Header */}
        <div className="qr-scanner-header">
          <h2>Scan QR Code</h2>
          <button onClick={handleCancel} className="close-button">
            ×
          </button>
        </div>

        {/* Video Preview */}
        <div className="qr-scanner-preview">
          <video ref={videoRef} className="qr-video" playsInline muted />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Scanning overlay */}
          <div className="qr-scanner-overlay-frame">
            <div className="qr-corner top-left"></div>
            <div className="qr-corner top-right"></div>
            <div className="qr-corner bottom-left"></div>
            <div className="qr-corner bottom-right"></div>
          </div>
        </div>

        {/* Instructions */}
        <div className="qr-scanner-instructions">
          {error ? (
            <div className="qr-scanner-error">
              <p>⚠️ {error}</p>
              <button onClick={handleCancel} className="btn-secondary">
                Close
              </button>
            </div>
          ) : (
            <div className="qr-scanner-help">
              <p>📱 Point your camera at the QR code displayed by your medical provider</p>
              <p className="text-sm">Make sure the entire QR code is visible in the frame</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .qr-scanner-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.9);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .qr-scanner-modal {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          overflow: hidden;
        }

        .qr-scanner-header {
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .qr-scanner-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #6b7280;
          padding: 0;
          width: 32px;
          height: 32px;
          line-height: 1;
        }

        .close-button:hover {
          color: #111827;
        }

        .qr-scanner-preview {
          position: relative;
          background: #000;
          aspect-ratio: 1;
          overflow: hidden;
        }

        .qr-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .qr-scanner-overlay-frame {
          position: absolute;
          inset: 20%;
          pointer-events: none;
        }

        .qr-corner {
          position: absolute;
          width: 40px;
          height: 40px;
          border: 3px solid #10b981;
        }

        .qr-corner.top-left {
          top: 0;
          left: 0;
          border-right: none;
          border-bottom: none;
        }

        .qr-corner.top-right {
          top: 0;
          right: 0;
          border-left: none;
          border-bottom: none;
        }

        .qr-corner.bottom-left {
          bottom: 0;
          left: 0;
          border-right: none;
          border-top: none;
        }

        .qr-corner.bottom-right {
          bottom: 0;
          right: 0;
          border-left: none;
          border-top: none;
        }

        .qr-scanner-instructions {
          padding: 16px;
        }

        .qr-scanner-help {
          text-align: center;
        }

        .qr-scanner-help p {
          margin: 8px 0;
          color: #374151;
        }

        .qr-scanner-help .text-sm {
          font-size: 14px;
          color: #6b7280;
        }

        .qr-scanner-error {
          text-align: center;
        }

        .qr-scanner-error p {
          color: #dc2626;
          margin-bottom: 12px;
          font-weight: 500;
        }

        .btn-secondary {
          background: #e5e7eb;
          color: #374151;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-secondary:hover {
          background: #d1d5db;
        }
      `}</style>
    </div>
  );
}
