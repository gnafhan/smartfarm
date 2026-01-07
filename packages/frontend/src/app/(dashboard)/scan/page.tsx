'use client';

import { QRScanner } from '@/components/qr-scanner';

export default function ScanPage() {
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Pindai Kode QR
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Pindai kode QR ternak untuk melihat informasi hewan
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <QRScanner />
        </div>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h2 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Cara menggunakan:
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200">
            <li>Klik "Mulai Pindai" untuk mengaktifkan kamera Anda</li>
            <li>Arahkan kamera Anda ke kode QR ternak</li>
            <li>Aplikasi akan secara otomatis mendeteksi dan menavigasi ke informasi hewan</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
