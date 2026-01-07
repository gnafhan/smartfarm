'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Card from '@/components/card';
import { api } from '@/lib/axios';
import { MdArrowBack, MdDownload, MdPrint } from 'react-icons/md';
import { QRCodeSVG } from 'qrcode.react';

interface Livestock {
  id: string;
  earTagId: string;
  qrCode: string;
  name: string;
  species: string;
}

export default function LivestockQRPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const qrRef = useRef<HTMLDivElement>(null);
  
  const [livestock, setLivestock] = useState<Livestock | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchLivestock();
    }
  }, [id]);

  const fetchLivestock = async () => {
    try {
      setLoading(true);
      const response = await api.get<Livestock>(`/api/livestock/${id}`);
      setLivestock(response.data);
    } catch (error) {
      console.error('Error fetching livestock:', error);
      alert('Failed to load livestock details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!livestock) return;

    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 512;
    canvas.height = 512;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `${livestock.earTagId}-qr-code.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="mt-5 flex h-full w-full items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!livestock) {
    return (
      <div className="mt-5 flex h-full w-full items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Livestock not found</p>
      </div>
    );
  }

  const qrUrl = `${window.location.origin}/livestock/public/${livestock.qrCode}`;

  return (
    <div className="mt-5 h-full w-full">
      {/* Header - Hidden when printing */}
      <div className="mb-5 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/livestock/${id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <MdArrowBack size={24} />
          </button>
          <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
            QR Code - {livestock.name}
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
          >
            <MdDownload size={20} />
            Download
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-300"
          >
            <MdPrint size={20} />
            Print
          </button>
        </div>
      </div>

      {/* QR Code Card */}
      <div className="flex justify-center">
        <Card extra="w-full max-w-2xl p-8">
          <div className="flex flex-col items-center">
            {/* QR Code */}
            <div ref={qrRef} className="mb-6 rounded-lg bg-white p-8">
              <QRCodeSVG
                value={qrUrl}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>

            {/* Livestock Info */}
            <div className="w-full space-y-3 text-center">
              <h2 className="text-2xl font-bold text-navy-700 dark:text-white">
                {livestock.name}
              </h2>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ear Tag: <span className="font-semibold text-navy-700 dark:text-white">{livestock.earTagId}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Species: <span className="font-semibold text-navy-700 dark:text-white capitalize">{livestock.species}</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 font-mono mt-4">
                  {livestock.qrCode}
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-8 w-full rounded-lg bg-gray-50 p-4 dark:bg-navy-900">
              <h3 className="mb-2 text-sm font-bold text-navy-700 dark:text-white">
                How to use:
              </h3>
              <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <li>• Scan this QR code with any smartphone camera</li>
                <li>• View livestock information without logging in</li>
                <li>• Access recent entry/exit history</li>
                <li>• Print and attach to livestock housing</li>
              </ul>
            </div>

            {/* URL for reference */}
            <div className="mt-4 w-full">
              <p className="text-xs text-gray-500 dark:text-gray-500 break-all">
                URL: {qrUrl}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
}
