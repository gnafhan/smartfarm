'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { useRouter } from 'next/navigation';

interface QRScannerProps {
  onScan?: (result: string) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export default function QRScanner({ onScan, onError, className = '' }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Initialize the code reader
    readerRef.current = new BrowserMultiFormatReader();

    return () => {
      // Cleanup on unmount
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, []);

  const startScanning = async () => {
    if (!videoRef.current || !readerRef.current) return;

    try {
      setError(null);
      setIsScanning(true);

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera on mobile
      });

      setHasPermission(true);

      // Start decoding from video stream
      await readerRef.current.decodeFromStream(
        stream,
        videoRef.current,
        (result, err) => {
          if (result) {
            const text = result.getText();
            
            // Extract QR code from URL if it's a full URL
            // Format: {domain}/livestock/public/{qrCode}
            const qrCodeMatch = text.match(/\/livestock\/public\/([^\/\?]+)/);
            const qrCode = qrCodeMatch ? qrCodeMatch[1] : text;

            if (onScan) {
              onScan(qrCode);
            } else {
              // Default behavior: navigate to public livestock page
              router.push(`/livestock/public/${qrCode}`);
            }

            // Stop scanning after successful scan
            stopScanning();
          }

          if (err && !(err instanceof NotFoundException)) {
            console.error('QR Scanner error:', err);
            if (onError) {
              onError(err);
            }
          }
        }
      );
    } catch (err) {
      console.error('Failed to start camera:', err);
      setError('Gagal mengakses kamera. Harap berikan izin kamera.');
      setHasPermission(false);
      setIsScanning(false);
      
      if (onError && err instanceof Error) {
        onError(err);
      }
    }
  };

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current.reset();
    }
    setIsScanning(false);
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="relative w-full max-w-md aspect-square bg-gray-900 rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        
        {!isScanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
            <div className="text-center text-white p-4">
              <p className="mb-4">
                {hasPermission === false
                  ? 'Izin kamera ditolak'
                  : 'Siap memindai kode QR'}
              </p>
            </div>
          </div>
        )}

        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Scanning overlay with corner markers */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-64 h-64 border-2 border-white/50">
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="w-full max-w-md p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors touch-manipulation"
          >
            Mulai Pindai
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors touch-manipulation"
          >
            Berhenti Pindai
          </button>
        )}
      </div>

      <p className="text-sm text-gray-600 text-center max-w-md">
        Point your camera at a livestock QR code to view animal information
      </p>
    </div>
  );
}
