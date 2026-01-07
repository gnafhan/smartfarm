'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';

interface Livestock {
  id: string;
  earTagId: string;
  qrCode: string;
  name: string;
  species: string;
  gender: 'male' | 'female';
  status: 'active' | 'sold' | 'deceased';
  weight: number;
  dateOfBirth: string;
  color?: string;
  healthStatus?: string;
  photos: string[];
  customFields: Record<string, any>;
}

interface Barn {
  id: string;
  name: string;
  code: string;
}

interface EntryExitLog {
  id: string;
  eventType: 'entry' | 'exit';
  timestamp: string;
  duration?: number;
}

interface PublicLivestockData {
  livestock: Livestock;
  barn: Barn | null;
  recentLogs: EntryExitLog[];
}

export default function PublicLivestockPage() {
  const params = useParams();
  const qrCode = params.qrCode as string;
  
  const [data, setData] = useState<PublicLivestockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (qrCode) {
      fetchLivestockData();
    }
  }, [qrCode]);

  const fetchLivestockData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await axios.get<PublicLivestockData>(
        `${API_URL}/api/livestock/qr/${qrCode}`
      );
      
      setData(response.data);
    } catch (err: any) {
      console.error('Error fetching livestock data:', err);
      setError(err.response?.data?.message || 'Failed to load livestock information');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      case 'deceased':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-blue-200 rounded-full mb-4"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-16 w-16 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Livestock Not Found
          </h1>
          <p className="text-gray-600">
            {error || 'The QR code you scanned is invalid or the livestock record does not exist.'}
          </p>
        </div>
      </div>
    );
  }

  const { livestock, barn, recentLogs } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
            <div className="flex-1 mb-4 sm:mb-0">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                {livestock.name}
              </h1>
              <p className="text-gray-600">
                Ear Tag: <span className="font-semibold">{livestock.earTagId}</span>
              </p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(livestock.status)}`}>
              {livestock.status.toUpperCase()}
            </span>
          </div>

          {/* Photos */}
          {livestock.photos.length > 0 && (
            <div className="mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {livestock.photos.slice(0, 3).map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`${livestock.name} photo ${index + 1}`}
                    className="w-full h-32 sm:h-40 object-cover rounded-lg shadow-md"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Basic Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Species</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {livestock.species}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Gender</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {livestock.gender}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Date of Birth</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(livestock.dateOfBirth).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Weight</p>
              <p className="text-lg font-semibold text-gray-900">
                {livestock.weight} kg
              </p>
            </div>
            {livestock.color && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Color</p>
                <p className="text-lg font-semibold text-gray-900">
                  {livestock.color}
                </p>
              </div>
            )}
            {livestock.healthStatus && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Health Status</p>
                <p className="text-lg font-semibold text-gray-900">
                  {livestock.healthStatus}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Current Location */}
        {barn && (
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Current Location
            </h2>
            <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
              <p className="text-sm text-blue-600 mb-1">Barn</p>
              <p className="text-lg font-semibold text-blue-900">
                {barn.name} ({barn.code})
              </p>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {recentLogs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Recent Activity
            </h2>
            <div className="space-y-3">
              {recentLogs.map((log, index) => (
                <div
                  key={log.id || index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      log.eventType === 'entry' ? 'bg-green-500' : 'bg-orange-500'
                    }`}></div>
                    <div>
                      <p className="font-semibold text-gray-900 capitalize">
                        {log.eventType}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {log.eventType === 'exit' && log.duration && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="font-semibold text-gray-900">
                        {formatDuration(log.duration)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Fields */}
        {Object.keys(livestock.customFields).length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Additional Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(livestock.customFields).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1 capitalize">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Livestock Monitoring System</p>
          <p className="mt-1">Scan QR code for instant access to livestock information</p>
        </div>
      </div>
    </div>
  );
}
