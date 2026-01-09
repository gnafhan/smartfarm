'use client';

import { useEffect, useState } from 'react';
import { useMonitoringStore, GasSensorReading } from '@/stores/useMonitoringStore';
import { getSocket, connectSocket, disconnectSocket } from '@/lib/socket';
import { api } from '@/lib/axios';
import { MdSensors, MdWarning, MdCheckCircle, MdError, MdShowChart } from 'react-icons/md';
import Link from 'next/link';

interface Barn {
  id: string;
  name: string;
  code: string;
}

export default function MonitoringPage() {
  const { readings, isConnected, updateReading, setConnected } = useMonitoringStore();
  const [barns, setBarns] = useState<Barn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch barns on mount
  useEffect(() => {
    const fetchBarns = async () => {
      try {
        const response = await api.get('/api/barns');
        // Backend returns PaginatedResponse with data property
        const barnsData = response.data?.data || response.data;
        setBarns(Array.isArray(barnsData) ? barnsData : []);
      } catch (err) {
        console.error('Error fetching barns:', err);
        setError('Failed to load barns');
      } finally {
        setLoading(false);
      }
    };

    fetchBarns();
  }, []);

  // Setup WebSocket connection
  useEffect(() => {
    const socket = getSocket();

    // Connect socket
    connectSocket();

    // Setup event listeners
    socket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    // Listen to global sensor readings (for dashboard overview)
    socket.on('sensor:reading:global', (data: any) => {
      console.log('Received sensor reading:', data);
      // Transform SensorReadingEvent to GasSensorReading format
      const reading: GasSensorReading = {
        _id: data.sensorId + '-' + Date.now(), // Generate unique ID
        sensorId: data.sensorId,
        barnId: data.barnId,
        methanePpm: data.reading.methanePpm,
        co2Ppm: data.reading.co2Ppm,
        nh3Ppm: data.reading.nh3Ppm,
        temperature: data.reading.temperature,
        humidity: data.reading.humidity,
        alertLevel: data.alertLevel,
        timestamp: data.reading.timestamp,
      };
      updateReading(reading);
    });

    // Also listen to barn-specific readings
    socket.on('sensor:reading', (data: any) => {
      console.log('Received barn sensor reading:', data);
      const reading: GasSensorReading = {
        _id: data.sensorId + '-' + Date.now(),
        sensorId: data.sensorId,
        barnId: data.barnId,
        methanePpm: data.reading.methanePpm,
        co2Ppm: data.reading.co2Ppm,
        nh3Ppm: data.reading.nh3Ppm,
        temperature: data.reading.temperature,
        humidity: data.reading.humidity,
        alertLevel: data.alertLevel,
        timestamp: data.reading.timestamp,
      };
      updateReading(reading);
    });

    // Cleanup on unmount
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('sensor:reading');
      socket.off('sensor:reading:global');
      disconnectSocket();
    };
  }, [setConnected, updateReading]);

  // Fetch latest readings on mount
  useEffect(() => {
    const fetchLatestReadings = async () => {
      try {
        const response = await api.get('/api/monitoring/latest');
        const latestReadings = response.data;
        
        // Update store with latest readings
        latestReadings.forEach((item: any) => {
          if (item.reading) {
            updateReading(item.reading);
          }
        });
      } catch (err) {
        console.error('Error fetching latest readings:', err);
      }
    };

    fetchLatestReadings();
  }, [updateReading]);

  const getAlertLevelColor = (level: string) => {
    switch (level) {
      case 'danger':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'normal':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getAlertLevelIcon = (level: string) => {
    switch (level) {
      case 'danger':
        return <MdError className="text-red-500" size={24} />;
      case 'warning':
        return <MdWarning className="text-yellow-500" size={24} />;
      case 'normal':
        return <MdCheckCircle className="text-green-500" size={24} />;
      default:
        return <MdSensors className="text-gray-500" size={24} />;
    }
  };

  const getAlertLevelText = (level: string) => {
    switch (level) {
      case 'danger':
        return 'Kritis';
      case 'warning':
        return 'Peringatan';
      case 'normal':
        return 'Normal';
      default:
        return 'Tidak Diketahui';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Memuat data pemantauan...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  const readingsArray = Object.values(readings);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Pemantauan Methane Real-time
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Pantau level methane secara real-time di semua kandang
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/monitoring/history"
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <MdShowChart size={20} />
              <span>View Historical Charts</span>
            </Link>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sensor Cards Grid */}
      {readingsArray.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <MdSensors className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600 dark:text-gray-400">
            No sensor data available. Waiting for sensor readings...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {readingsArray.map((reading) => {
            const barn = barns.find((b) => b.id === reading.barnId);
            
            return (
              <div
                key={reading.sensorId}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
              >
                {/* Card Header */}
                <div className={`${getAlertLevelColor(reading.alertLevel)} p-4`}>
                  <div className="flex items-center justify-between text-white">
                    <div>
                      <h3 className="font-semibold text-lg">
                        Sensor {reading.sensorId}
                      </h3>
                      <p className="text-sm opacity-90">
                        {barn?.name || 'Unknown Barn'}
                      </p>
                    </div>
                    {getAlertLevelIcon(reading.alertLevel)}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  {/* Alert Level Badge */}
                  <div className="mb-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        reading.alertLevel === 'danger'
                          ? 'bg-red-100 text-red-800'
                          : reading.alertLevel === 'warning'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {getAlertLevelText(reading.alertLevel)}
                    </span>
                  </div>

                  {/* Gas Readings - Methane Only */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Methane (CH₄)
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {reading.methanePpm.toFixed(1)} ppm
                      </span>
                    </div>
                  </div>

                  {/* Environmental Readings */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Temperature
                        </span>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {reading.temperature.toFixed(1)}°C
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Humidity
                        </span>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {reading.humidity.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                    Last updated: {new Date(reading.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
