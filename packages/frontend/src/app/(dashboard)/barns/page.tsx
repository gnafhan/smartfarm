'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';

interface Barn {
  id: string;
  name: string;
  code: string;
  capacity: number;
  currentOccupancy: number;
  status: string;
  sensors: string[];
}

export default function BarnsPage() {
  const router = useRouter();
  const [barns, setBarns] = useState<Barn[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchBarns();
  }, []);

  const fetchBarns = async () => {
    try {
      const response = await axios.get('/api/barns');
      // Backend returns PaginatedResponse with data property
      const barnsData = response.data?.data || response.data;
      setBarns(Array.isArray(barnsData) ? barnsData : []);
    } catch (error) {
      console.error('Error fetching barns:', error);
      setBarns([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const filteredBarns = barns.filter((barn) => {
    const matchesSearch =
      barn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      barn.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || barn.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl">Memuat...</div>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
          Manajemen Kandang
        </h1>
        <button
          onClick={() => router.push('/barns/new')}
          className="linear rounded-lg bg-brand-500 px-4 py-2 text-base font-medium text-white transition duration-200 hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-400 dark:text-white dark:hover:bg-brand-300 dark:active:bg-brand-200"
        >
          + Tambah Kandang
        </button>
      </div>

      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="Cari berdasarkan nama atau kode..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-navy-800 dark:text-white"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-navy-800 dark:text-white"
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Tidak Aktif</option>
        </select>
      </div>

      {filteredBarns.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <p className="text-gray-500 dark:text-gray-400">Tidak ada kandang ditemukan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBarns.map((barn) => (
            <div
              key={barn.id}
              onClick={() => router.push(`/barns/${barn.id}`)}
              className="cursor-pointer rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-navy-800"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-navy-700 dark:text-white">
                    {barn.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Kode: {barn.code}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    barn.status === 'active'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {barn.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Okupansi:
                  </span>
                  <span className="font-semibold text-navy-700 dark:text-white">
                    {barn.currentOccupancy} / {barn.capacity}
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className={`h-full transition-all ${
                      barn.currentOccupancy / barn.capacity > 0.9
                        ? 'bg-red-500'
                        : barn.currentOccupancy / barn.capacity > 0.7
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min((barn.currentOccupancy / barn.capacity) * 100, 100)}%`,
                    }}
                  />
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Sensor:
                  </span>
                  <span className="font-semibold text-navy-700 dark:text-white">
                    {barn.sensors.length}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
