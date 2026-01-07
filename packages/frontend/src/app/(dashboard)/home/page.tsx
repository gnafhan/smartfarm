'use client';

import { useEffect, useState } from 'react';
import { MdPets, MdWarehouse, MdTrendingUp, MdTrendingDown } from 'react-icons/md';
import { IoMdTime } from 'react-icons/io';
import Widget from '@/components/widget/Widget';
import Card from '@/components/card';
import AlertBanner from '@/components/alerts/AlertBanner';
import api from '@/lib/axios';

/**
 * Dashboard Page
 * 
 * Main dashboard displaying:
 * - Summary statistics widgets
 * - Recent entry/exit logs
 * - Barn occupancy cards
 * - Alert banner integration
 * 
 * Requirements: 9.3, 9.4, 9.5
 */

interface LivestockStatusSummary {
  active: number;
  sold: number;
  deceased: number;
  total: number;
}

interface LivestockSpeciesSummary {
  species: string;
  count: number;
}

interface LivestockSummary {
  byStatus: LivestockStatusSummary;
  bySpecies: LivestockSpeciesSummary[];
}

interface BarnOccupancy {
  id: string;
  name: string;
  code: string;
  capacity: number;
  currentOccupancy: number;
  occupancyPercentage: number;
  status: string;
}

interface EntryExitLog {
  id: string;
  livestockId: string;
  barnId: string;
  eventType: 'entry' | 'exit';
  rfidReaderId: string;
  timestamp: string;
  duration?: number;
  notes?: string;
}

interface DashboardStatistics {
  recentLogs: EntryExitLog[];
  livestockSummary: LivestockSummary;
  barnOccupancy: BarnOccupancy[];
}

const Dashboard = () => {
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/dashboard/statistics');
      setStatistics(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard statistics:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getOccupancyColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 75) return 'text-orange-500';
    if (percentage >= 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getOccupancyBgColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-100 dark:bg-red-900/20';
    if (percentage >= 75) return 'bg-orange-100 dark:bg-orange-900/20';
    if (percentage >= 50) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-green-100 dark:bg-green-900/20';
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-brand-500 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400">Memuat dasbor...</p>
        </div>
      </div>
    );
  }

  if (error || !statistics) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Gagal memuat dasbor'}</p>
          <button
            onClick={fetchStatistics}
            className="rounded-lg bg-brand-500 px-4 py-2 text-white hover:bg-brand-600"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Alert Banner - Requirements: 9.2 */}
      <AlertBanner />

      {/* Summary Statistics Widgets - Requirements: 9.4 */}
      <div className="mt-3 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Widget
          icon={<MdPets className="h-7 w-7" />}
          title="Total Ternak"
          subtitle={statistics.livestockSummary.byStatus.total.toString()}
        />
        <Widget
          icon={<MdPets className="h-7 w-7 text-green-500" />}
          title="Ternak Aktif"
          subtitle={statistics.livestockSummary.byStatus.active.toString()}
        />
        <Widget
          icon={<MdWarehouse className="h-6 w-6" />}
          title="Total Kandang"
          subtitle={statistics.barnOccupancy.length.toString()}
        />
        <Widget
          icon={<IoMdTime className="h-6 w-6" />}
          title="Aktivitas Terkini"
          subtitle={statistics.recentLogs.length.toString()}
        />
      </div>

      {/* Livestock by Species - Requirements: 9.4 */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card extra="p-5">
          <div className="mb-4">
            <h4 className="text-xl font-bold text-navy-700 dark:text-white">
              Ternak Berdasarkan Spesies
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Distribusi berdasarkan jenis spesies
            </p>
          </div>
          <div className="space-y-3">
            {statistics.livestockSummary.bySpecies.map((species) => (
              <div
                key={species.species}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-navy-700"
              >
                <span className="font-medium text-navy-700 dark:text-white capitalize">
                  {species.species}
                </span>
                <span className="text-lg font-bold text-brand-500">
                  {species.count}
                </span>
              </div>
            ))}
            {statistics.livestockSummary.bySpecies.length === 0 && (
              <p className="text-center text-gray-500 py-4">Tidak ada data ternak</p>
            )}
          </div>
        </Card>

        {/* Livestock by Status - Requirements: 9.4 */}
        <Card extra="p-5">
          <div className="mb-4">
            <h4 className="text-xl font-bold text-navy-700 dark:text-white">
              Ternak Berdasarkan Status
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Distribusi status saat ini
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
              <span className="font-medium text-navy-700 dark:text-white">
                Aktif
              </span>
              <span className="text-lg font-bold text-green-500">
                {statistics.livestockSummary.byStatus.active}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
              <span className="font-medium text-navy-700 dark:text-white">
                Terjual
              </span>
              <span className="text-lg font-bold text-blue-500">
                {statistics.livestockSummary.byStatus.sold}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
              <span className="font-medium text-navy-700 dark:text-white">
                Mati
              </span>
              <span className="text-lg font-bold text-gray-500">
                {statistics.livestockSummary.byStatus.deceased}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Barn Occupancy Overview - Requirements: 9.5 */}
      <div className="mt-5">
        <Card extra="p-5">
          <div className="mb-4">
            <h4 className="text-xl font-bold text-navy-700 dark:text-white">
              Ikhtisar Okupansi Kandang
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Kapasitas dan status okupansi saat ini
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {statistics.barnOccupancy.map((barn) => (
              <div
                key={barn.id}
                className={`rounded-lg p-4 ${getOccupancyBgColor(barn.occupancyPercentage)}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <h5 className="font-bold text-navy-700 dark:text-white">
                    {barn.name}
                  </h5>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {barn.code}
                  </span>
                </div>
                <div className="mb-2">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Okupansi</span>
                    <span className={`font-bold ${getOccupancyColor(barn.occupancyPercentage)}`}>
                      {barn.occupancyPercentage}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className={`h-2 rounded-full ${
                        barn.occupancyPercentage >= 90
                          ? 'bg-red-500'
                          : barn.occupancyPercentage >= 75
                          ? 'bg-orange-500'
                          : barn.occupancyPercentage >= 50
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(barn.occupancyPercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {barn.currentOccupancy} / {barn.capacity}
                  </span>
                  <span className={`text-xs font-medium ${
                    barn.status === 'active' ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {barn.status === 'active' ? 'aktif' : 'tidak aktif'}
                  </span>
                </div>
              </div>
            ))}
            {statistics.barnOccupancy.length === 0 && (
              <div className="col-span-full text-center text-gray-500 py-8">
                Tidak ada kandang tersedia
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Entry/Exit Logs - Requirements: 9.3 */}
      <div className="mt-5">
        <Card extra="p-5">
          <div className="mb-4">
            <h4 className="text-xl font-bold text-navy-700 dark:text-white">
              Aktivitas Terkini
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              10 kejadian keluar/masuk terakhir
            </p>
          </div>
          <div className="space-y-2">
            {statistics.recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  {log.eventType === 'entry' ? (
                    <MdTrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <MdTrendingDown className="h-5 w-5 text-blue-500" />
                  )}
                  <div>
                    <p className="font-medium text-navy-700 dark:text-white">
                      {log.eventType === 'entry' ? 'Masuk' : 'Keluar'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      ID Ternak: {log.livestockId.slice(-8)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatTimestamp(log.timestamp)}
                  </p>
                  {log.duration && (
                    <p className="text-xs text-gray-500">
                      Durasi: {formatDuration(log.duration)}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {statistics.recentLogs.length === 0 && (
              <p className="text-center text-gray-500 py-8">Tidak ada aktivitas terkini</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
