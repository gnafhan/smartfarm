'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Card from '@/components/card';
import { api } from '@/lib/axios';
import { MdEdit, MdArrowBack, MdQrCode } from 'react-icons/md';
import LivestockHealthHistory from '@/components/livestock/LivestockHealthHistory';
import AddHealthEventForm from '@/components/livestock/AddHealthEventForm';
import WeightHistoryTable from '@/components/livestock/WeightHistoryTable';
import AddWeightEntryForm from '@/components/livestock/AddWeightEntryForm';
import WeightChart from '@/components/livestock/WeightChart';

interface Farm {
  id: string;
  name: string;
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
  barnId: string;
  barnName?: string;
  rfidReaderId: string;
}

interface WeightEntry {
  id: string;
  livestockId: string;
  weight: number;
  measurementDate: string;
  notes?: string;
}

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
  farmId?: string;
  currentBarnId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function LivestockDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [livestock, setLivestock] = useState<Livestock | null>(null);
  const [loading, setLoading] = useState(true);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [barn, setBarn] = useState<Barn | null>(null);
  const [latestLog, setLatestLog] = useState<EntryExitLog | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'health' | 'weight'>('details');
  const [showAddEventForm, setShowAddEventForm] = useState(false);
  const [healthHistoryKey, setHealthHistoryKey] = useState(0);
  const [showAddWeightForm, setShowAddWeightForm] = useState(false);
  const [editingWeightEntry, setEditingWeightEntry] = useState<WeightEntry | null>(null);
  const [weightTableKey, setWeightTableKey] = useState(0);
  const [weightChartKey, setWeightChartKey] = useState(0);

  useEffect(() => {
    if (id) {
      fetchLivestock();
    }
  }, [id]);

  const fetchLivestock = async () => {
    try {
      setLoading(true);
      const response = await api.get<Livestock>(`/api/livestock/${id}`);
      const livestockData = response.data;
      setLivestock(livestockData);
      
      // Fetch farm if farmId exists
      if (livestockData.farmId) {
        try {
          const farmResponse = await api.get<Farm>(`/api/farms/${livestockData.farmId}`);
          setFarm(farmResponse.data);
        } catch (error) {
          console.error('Error fetching farm:', error);
        }
      }
      
      // Fetch barn if currentBarnId exists
      if (livestockData.currentBarnId) {
        try {
          const barnResponse = await api.get<Barn>(`/api/barns/${livestockData.currentBarnId}`);
          setBarn(barnResponse.data);
        } catch (error) {
          console.error('Error fetching barn:', error);
        }
      }
      
      // Fetch latest entry/exit log
      try {
        const logsResponse = await api.get(`/api/logs/livestock/${id}?limit=1&page=1`);
        const logs = logsResponse.data?.data || logsResponse.data?.items || [];
        if (logs.length > 0) {
          setLatestLog(logs[0]);
        }
      } catch (error) {
        console.error('Error fetching logs:', error);
      }
    } catch (error) {
      console.error('Error fetching livestock:', error);
      alert('Failed to load livestock details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500 bg-green-100 dark:bg-green-900/30';
      case 'sold':
        return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
      case 'deceased':
        return 'text-red-500 bg-red-100 dark:bg-red-900/30';
      default:
        return 'text-gray-500 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const handleHealthEventSuccess = () => {
    setShowAddEventForm(false);
    // Force refresh of health history by updating key
    setHealthHistoryKey(prev => prev + 1);
  };

  const handleWeightEntrySuccess = () => {
    setShowAddWeightForm(false);
    setEditingWeightEntry(null);
    // Force refresh of weight table and chart
    setWeightTableKey(prev => prev + 1);
    setWeightChartKey(prev => prev + 1);
  };

  const handleEditWeightEntry = (entry: WeightEntry) => {
    setEditingWeightEntry(entry);
    setShowAddWeightForm(true);
  };

  const handleWeightRefresh = () => {
    // Refresh chart when table data changes
    setWeightChartKey(prev => prev + 1);
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

  return (
    <div className="mt-5 h-full w-full">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/livestock')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <MdArrowBack size={24} />
          </button>
          <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
            {livestock.name}
          </h1>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(livestock.status)}`}>
            {livestock.status}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/livestock/${id}/qr`)}
            className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
          >
            <MdQrCode size={20} />
            View QR Code
          </button>
          <button
            onClick={() => router.push(`/livestock/${id}/edit`)}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-300"
          >
            <MdEdit size={20} />
            Edit
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-2 border-b border-gray-200 dark:border-white/10">
        <button
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === 'details'
              ? 'border-b-2 border-brand-500 text-brand-500 dark:border-brand-400 dark:text-brand-400'
              : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab('health')}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === 'health'
              ? 'border-b-2 border-brand-500 text-brand-500 dark:border-brand-400 dark:text-brand-400'
              : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Health History
        </button>
        <button
          onClick={() => setActiveTab('weight')}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === 'weight'
              ? 'border-b-2 border-brand-500 text-brand-500 dark:border-brand-400 dark:text-brand-400'
              : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Weight Tracking
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">{/* Details content */}
        {/* Main Info */}
        <Card extra="col-span-2 p-6">
          <h2 className="mb-4 text-lg font-bold text-navy-700 dark:text-white">
            Basic Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ear Tag ID</p>
              <p className="mt-1 font-semibold text-navy-700 dark:text-white">
                {livestock.earTagId}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Species</p>
              <p className="mt-1 font-semibold text-navy-700 dark:text-white capitalize">
                {livestock.species}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Gender</p>
              <p className="mt-1 font-semibold text-navy-700 dark:text-white capitalize">
                {livestock.gender}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Date of Birth</p>
              <p className="mt-1 font-semibold text-navy-700 dark:text-white">
                {new Date(livestock.dateOfBirth).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Weight</p>
              <p className="mt-1 font-semibold text-navy-700 dark:text-white">
                {livestock.weight} kg
              </p>
            </div>
            {livestock.color && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Color</p>
                <p className="mt-1 font-semibold text-navy-700 dark:text-white">
                  {livestock.color}
                </p>
              </div>
            )}
            {livestock.healthStatus && (
              <div className="col-span-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Health Status</p>
                <p className="mt-1 font-semibold text-navy-700 dark:text-white">
                  {livestock.healthStatus}
                </p>
              </div>
            )}
            {farm && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Farm</p>
                <p className="mt-1 font-semibold text-navy-700 dark:text-white">
                  {farm.name}
                </p>
              </div>
            )}
            {barn && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current Barn</p>
                <p className="mt-1 font-semibold text-navy-700 dark:text-white">
                  {barn.name} ({barn.code})
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Latest Entry/Exit Log */}
        <Card extra="p-6">
          <h2 className="mb-4 text-lg font-bold text-navy-700 dark:text-white">
            Latest Activity
          </h2>
          {latestLog ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Event Type</p>
                <p className={`mt-1 font-semibold ${latestLog.eventType === 'entry' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                  {latestLog.eventType === 'entry' ? '→ Entry' : '← Exit'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Timestamp</p>
                <p className="mt-1 text-sm text-navy-700 dark:text-white">
                  {new Date(latestLog.timestamp).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">RFID Reader</p>
                <p className="mt-1 text-sm text-navy-700 dark:text-white">
                  {latestLog.rfidReaderId}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No activity recorded</p>
          )}
        </Card>

        {/* Photos */}
        <Card extra="p-6">
          <h2 className="mb-4 text-lg font-bold text-navy-700 dark:text-white">
            Photos
          </h2>
          {livestock.photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {livestock.photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`${livestock.name} photo ${index + 1}`}
                  className="h-24 w-full rounded-lg object-cover"
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No photos available</p>
          )}
        </Card>

        {/* Custom Fields */}
        {Object.keys(livestock.customFields).length > 0 && (
          <Card extra="col-span-2 p-6">
            <h2 className="mb-4 text-lg font-bold text-navy-700 dark:text-white">
              Custom Fields
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(livestock.customFields).map(([key, value]) => (
                <div key={key}>
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="mt-1 font-semibold text-navy-700 dark:text-white">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Metadata */}
        <Card extra="p-6">
          <h2 className="mb-4 text-lg font-bold text-navy-700 dark:text-white">
            Metadata
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">QR Code</p>
              <p className="mt-1 font-mono text-xs text-navy-700 dark:text-white">
                {livestock.qrCode}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Created At</p>
              <p className="mt-1 text-sm text-navy-700 dark:text-white">
                {new Date(livestock.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
              <p className="mt-1 text-sm text-navy-700 dark:text-white">
                {new Date(livestock.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
        </div>
      ) : activeTab === 'health' ? (
        <div>
          <LivestockHealthHistory 
            key={healthHistoryKey}
            livestockId={id} 
            onAddEvent={() => setShowAddEventForm(true)}
          />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Weight Chart */}
          <WeightChart 
            key={weightChartKey}
            livestockId={id}
            barnId={livestock.currentBarnId}
          />
          
          {/* Add Weight Entry Button */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingWeightEntry(null);
                setShowAddWeightForm(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-300 touch-manipulation min-h-[44px]"
            >
              <MdEdit size={20} />
              Add Weight Entry
            </button>
          </div>
          
          {/* Weight History Table */}
          <WeightHistoryTable 
            key={weightTableKey}
            livestockId={id}
            onEdit={handleEditWeightEntry}
            onRefresh={handleWeightRefresh}
          />
        </div>
      )}

      {/* Add Health Event Form Modal */}
      {showAddEventForm && (
        <AddHealthEventForm
          livestockId={id}
          onSuccess={handleHealthEventSuccess}
          onCancel={() => setShowAddEventForm(false)}
        />
      )}

      {/* Add/Edit Weight Entry Form Modal */}
      {showAddWeightForm && (
        <AddWeightEntryForm
          livestockId={id}
          existingEntry={editingWeightEntry || undefined}
          onSuccess={handleWeightEntrySuccess}
          onCancel={() => {
            setShowAddWeightForm(false);
            setEditingWeightEntry(null);
          }}
        />
      )}
    </div>
  );
}
