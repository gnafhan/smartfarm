'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/axios';
import { MdSensors, MdNfc, MdCheckCircle, MdError, MdWarning, MdRefresh } from 'react-icons/md';
import Card from '@/components/card';

interface Device {
  _id: string;
  deviceId: string;
  type: 'gas_sensor' | 'rfid_reader';
  status: 'online' | 'offline' | 'error';
  name?: string;
  barnId?: {
    _id: string;
    name: string;
    code: string;
  };
  lastConnectedAt?: string;
  lastDisconnectedAt?: string;
  lastHeartbeatAt?: string;
  lastDisconnectReason?: string;
  lastErrorMessage?: string;
  totalConnections: number;
  totalDisconnections: number;
  errorCount: number;
  createdAt: string;
}

export default function DevicesPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (typeFilter !== 'all') params.type = typeFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await api.get('/api/devices', { params });
      setDevices(response.data);
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchDevices, 10000);
    return () => clearInterval(interval);
  }, [typeFilter, statusFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <MdCheckCircle className="h-6 w-6 text-green-500" />;
      case 'error':
        return <MdError className="h-6 w-6 text-red-500" />;
      case 'offline':
      default:
        return <MdWarning className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'offline':
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'gas_sensor' ? (
      <MdSensors className="h-8 w-8 text-brand-500" />
    ) : (
      <MdNfc className="h-8 w-8 text-brand-500" />
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Tidak pernah';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} hari yang lalu`;
  };

  const filteredDevices = devices;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl">Memuat...</div>
      </div>
    );
  }

  return (
    <div className="mt-3">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
            Manajemen Perangkat
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Pantau status dan kesehatan semua perangkat IoT
          </p>
        </div>
        <button
          onClick={fetchDevices}
          className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-base font-medium text-white transition duration-200 hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-300"
        >
          <MdRefresh className="h-5 w-5" />
          Muat Ulang
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-4">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-navy-800 dark:text-white"
        >
          <option value="all">Semua Tipe</option>
          <option value="gas_sensor">Sensor Gas</option>
          <option value="rfid_reader">Pembaca RFID</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-navy-800 dark:text-white"
        >
          <option value="all">Semua Status</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="error">Error</option>
        </select>
      </div>

      {/* Statistics Cards */}
      <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-4">
        <Card extra="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Perangkat</p>
              <p className="text-2xl font-bold text-navy-700 dark:text-white">
                {devices.length}
              </p>
            </div>
            <MdSensors className="h-10 w-10 text-gray-400" />
          </div>
        </Card>
        <Card extra="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Online</p>
              <p className="text-2xl font-bold text-green-500">
                {devices.filter((d) => d.status === 'online').length}
              </p>
            </div>
            <MdCheckCircle className="h-10 w-10 text-green-500" />
          </div>
        </Card>
        <Card extra="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Offline</p>
              <p className="text-2xl font-bold text-gray-500">
                {devices.filter((d) => d.status === 'offline').length}
              </p>
            </div>
            <MdWarning className="h-10 w-10 text-gray-500" />
          </div>
        </Card>
        <Card extra="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Error</p>
              <p className="text-2xl font-bold text-red-500">
                {devices.filter((d) => d.status === 'error').length}
              </p>
            </div>
            <MdError className="h-10 w-10 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Devices List */}
      {filteredDevices.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <p className="text-gray-500 dark:text-gray-400">Tidak ada perangkat ditemukan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDevices.map((device) => (
            <Card
              key={device._id}
              extra="p-5 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/devices/${device.deviceId}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getTypeIcon(device.type)}
                  <div>
                    <h3 className="text-lg font-bold text-navy-700 dark:text-white">
                      {device.name || device.deviceId}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {device.type === 'gas_sensor' ? 'Sensor Gas' : 'Pembaca RFID'}
                    </p>
                  </div>
                </div>
                {getStatusIcon(device.status)}
              </div>

              <div className="mb-3">
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(device.status)}`}>
                  {device.status === 'online' ? 'Online' : device.status === 'error' ? 'Error' : 'Offline'}
                </span>
              </div>

              {device.barnId && (
                <div className="mb-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Kandang: </span>
                  <span className="font-medium text-navy-700 dark:text-white">
                    {device.barnId.name}
                  </span>
                </div>
              )}

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Terakhir Online:</span>
                  <span className="text-navy-700 dark:text-white">
                    {formatDate(device.lastHeartbeatAt || device.lastConnectedAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Koneksi:</span>
                  <span className="text-navy-700 dark:text-white">
                    {device.totalConnections}
                  </span>
                </div>
                {device.errorCount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Error:</span>
                    <span className="text-red-500 font-medium">{device.errorCount}</span>
                  </div>
                )}
              </div>

              {device.lastErrorMessage && (
                <div className="mt-3 rounded-lg bg-red-50 p-2 dark:bg-red-900/20">
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {device.lastErrorMessage}
                  </p>
                </div>
              )}

              {device.lastDisconnectReason && device.status === 'offline' && (
                <div className="mt-3 rounded-lg bg-gray-50 p-2 dark:bg-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Alasan: {device.lastDisconnectReason}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
