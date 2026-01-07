'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/axios';
import { MdArrowBack, MdSensors, MdNfc, MdCheckCircle, MdError, MdWarning } from 'react-icons/md';
import Card from '@/components/card';

interface DeviceLog {
  _id: string;
  eventType: 'connected' | 'disconnected' | 'heartbeat' | 'error' | 'status_change';
  status?: string;
  previousStatus?: string;
  disconnectReason?: string;
  message?: string;
  errorCode?: string;
  timestamp: string;
}

interface DeviceStatistics {
  device: any;
  statistics: {
    totalConnections: number;
    totalDisconnections: number;
    errorCount: number;
    uptimePercentage: number;
    lastConnectedAt?: string;
    lastDisconnectedAt?: string;
    lastHeartbeatAt?: string;
    lastErrorAt?: string;
  };
  recentEvents: {
    connections: number;
    disconnections: number;
    errors: number;
  };
}

export default function DeviceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const deviceId = params.deviceId as string;

  const [statistics, setStatistics] = useState<DeviceStatistics | null>(null);
  const [logs, setLogs] = useState<DeviceLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (deviceId) {
      fetchDeviceData();
    }
  }, [deviceId]);

  const fetchDeviceData = async () => {
    try {
      setLoading(true);
      const [statsResponse, logsResponse] = await Promise.all([
        api.get(`/api/devices/${deviceId}/statistics`),
        api.get(`/api/devices/${deviceId}/logs?limit=50`),
      ]);

      setStatistics(statsResponse.data);
      setLogs(logsResponse.data);
    } catch (error) {
      console.error('Error fetching device data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Tidak pernah';
    return new Date(dateString).toLocaleString('id-ID');
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'connected':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'disconnected':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const getEventTypeText = (eventType: string) => {
    switch (eventType) {
      case 'connected':
        return 'Terhubung';
      case 'disconnected':
        return 'Terputus';
      case 'error':
        return 'Error';
      case 'heartbeat':
        return 'Heartbeat';
      case 'status_change':
        return 'Perubahan Status';
      default:
        return eventType;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl">Memuat...</div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Perangkat tidak ditemukan</p>
        </div>
      </div>
    );
  }

  const { device, statistics: stats, recentEvents } = statistics;

  return (
    <div className="mt-3">
      {/* Header */}
      <div className="mb-5 flex items-center gap-4">
        <button
          onClick={() => router.push('/devices')}
          className="flex items-center justify-center rounded-lg bg-white p-2 shadow-md dark:bg-navy-800"
        >
          <MdArrowBack className="h-6 w-6 text-gray-600 dark:text-white" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
            {device.name || device.deviceId}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {device.type === 'gas_sensor' ? 'Sensor Gas' : 'Pembaca RFID'}
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Card extra="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Uptime (24j)</p>
              <p className="text-2xl font-bold text-navy-700 dark:text-white">
                {stats.uptimePercentage.toFixed(1)}%
              </p>
            </div>
            <MdCheckCircle className="h-10 w-10 text-green-500" />
          </div>
        </Card>
        <Card extra="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Koneksi</p>
              <p className="text-2xl font-bold text-navy-700 dark:text-white">
                {stats.totalConnections}
              </p>
            </div>
            <MdSensors className="h-10 w-10 text-blue-500" />
          </div>
        </Card>
        <Card extra="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Diskoneksi</p>
              <p className="text-2xl font-bold text-navy-700 dark:text-white">
                {stats.totalDisconnections}
              </p>
            </div>
            <MdWarning className="h-10 w-10 text-yellow-500" />
          </div>
        </Card>
        <Card extra="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Error</p>
              <p className="text-2xl font-bold text-navy-700 dark:text-white">
                {stats.errorCount}
              </p>
            </div>
            <MdError className="h-10 w-10 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Device Info */}
      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card extra="p-5">
          <h3 className="mb-4 text-xl font-bold text-navy-700 dark:text-white">
            Informasi Perangkat
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">ID Perangkat:</span>
              <span className="font-medium text-navy-700 dark:text-white">
                {device.deviceId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                device.status === 'online'
                  ? 'bg-green-100 text-green-800'
                  : device.status === 'error'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {device.status === 'online' ? 'Online' : device.status === 'error' ? 'Error' : 'Offline'}
              </span>
            </div>
            {device.barnId && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Kandang:</span>
                <span className="font-medium text-navy-700 dark:text-white">
                  {device.barnId.name}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Terakhir Online:</span>
              <span className="font-medium text-navy-700 dark:text-white">
                {formatDate(stats.lastHeartbeatAt || stats.lastConnectedAt)}
              </span>
            </div>
            {stats.lastDisconnectedAt && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Terakhir Offline:</span>
                <span className="font-medium text-navy-700 dark:text-white">
                  {formatDate(stats.lastDisconnectedAt)}
                </span>
              </div>
            )}
          </div>
        </Card>

        <Card extra="p-5">
          <h3 className="mb-4 text-xl font-bold text-navy-700 dark:text-white">
            Aktivitas Terkini
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Koneksi:</span>
              <span className="font-medium text-green-600">{recentEvents.connections}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Diskoneksi:</span>
              <span className="font-medium text-gray-600">{recentEvents.disconnections}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Error:</span>
              <span className="font-medium text-red-600">{recentEvents.errors}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Event Logs */}
      <Card extra="p-5">
        <h3 className="mb-4 text-xl font-bold text-navy-700 dark:text-white">
          Log Kejadian
        </h3>
        <div className="space-y-2">
          {logs.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Tidak ada log</p>
          ) : (
            logs.map((log) => (
              <div
                key={log._id}
                className="flex items-start justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${getEventTypeColor(log.eventType)}`}>
                      {getEventTypeText(log.eventType)}
                    </span>
                    {log.disconnectReason && (
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        ({log.disconnectReason})
                      </span>
                    )}
                  </div>
                  {log.message && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{log.message}</p>
                  )}
                  {log.errorCode && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Kode Error: {log.errorCode}
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                  {formatDate(log.timestamp)}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
