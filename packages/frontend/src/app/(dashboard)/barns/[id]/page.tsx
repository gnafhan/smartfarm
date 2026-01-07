'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Card from '@/components/card';
import { api } from '@/lib/axios';
import { MdEdit, MdArrowBack, MdWarning, MdSensors, MdDelete, MdAdd } from 'react-icons/md';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

interface Barn {
  id: string;
  name: string;
  code: string;
  capacity: number;
  currentOccupancy: number;
  sensors: string[];
  status: 'active' | 'inactive';
  farmId: string;
  createdAt: string;
  updatedAt: string;
}

interface Livestock {
  id: string;
  earTagId: string;
  name: string;
  species: string;
  gender: 'male' | 'female';
  status: 'active' | 'sold' | 'deceased';
  weight: number;
}

const columnHelper = createColumnHelper<Livestock>();

export default function BarnDetailPage() {
  const router = useRouter();
  const params = useParams();
  const barnId = params.id as string;

  const [barn, setBarn] = useState<Barn | null>(null);
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);
  const [livestockLoading, setLivestockLoading] = useState(true);
  
  // Sensor assignment state
  const [showSensorForm, setShowSensorForm] = useState(false);
  const [newSensorId, setNewSensorId] = useState('');
  const [sensorLoading, setSensorLoading] = useState(false);

  const fetchBarn = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<Barn>(`/api/barns/${barnId}`);
      setBarn(response.data);
    } catch (error) {
      console.error('Error fetching barn:', error);
      alert('Failed to load barn details');
      router.push('/barns');
    } finally {
      setLoading(false);
    }
  }, [barnId, router]);

  const fetchLivestock = useCallback(async () => {
    try {
      setLivestockLoading(true);
      const response = await api.get<Livestock[]>(`/api/barns/${barnId}/livestock`);
      setLivestock(response.data);
    } catch (error) {
      console.error('Error fetching livestock:', error);
    } finally {
      setLivestockLoading(false);
    }
  }, [barnId]);

  useEffect(() => {
    if (barnId) {
      fetchBarn();
      fetchLivestock();
    }
  }, [barnId, fetchBarn, fetchLivestock]);

  const handleAssignSensor = async () => {
    if (!newSensorId.trim()) {
      alert('Please enter a sensor ID');
      return;
    }

    try {
      setSensorLoading(true);
      await api.post(`/api/barns/${barnId}/sensors`, {
        sensorId: newSensorId.trim(),
      });
      setNewSensorId('');
      setShowSensorForm(false);
      fetchBarn();
    } catch (error: any) {
      console.error('Error assigning sensor:', error);
      alert(error.response?.data?.message || 'Failed to assign sensor');
    } finally {
      setSensorLoading(false);
    }
  };

  const handleRemoveSensor = async (sensorId: string) => {
    if (!confirm(`Are you sure you want to remove sensor ${sensorId}?`)) return;

    try {
      await api.delete(`/api/barns/${barnId}/sensors/${sensorId}`);
      fetchBarn();
    } catch (error: any) {
      console.error('Error removing sensor:', error);
      alert(error.response?.data?.message || 'Failed to remove sensor');
    }
  };

  const getOccupancyPercentage = () => {
    if (!barn) return 0;
    return (barn.currentOccupancy / barn.capacity) * 100;
  };

  const getOccupancyColor = () => {
    const percentage = getOccupancyPercentage();
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const columns = [
    columnHelper.accessor('earTagId', {
      id: 'earTagId',
      header: () => (
        <p className="text-sm font-bold text-gray-600 dark:text-white">EAR TAG</p>
      ),
      cell: (info) => (
        <p className="text-sm font-bold text-navy-700 dark:text-white">
          {info.getValue()}
        </p>
      ),
    }),
    columnHelper.accessor('name', {
      id: 'name',
      header: () => (
        <p className="text-sm font-bold text-gray-600 dark:text-white">NAME</p>
      ),
      cell: (info) => (
        <p className="text-sm font-bold text-navy-700 dark:text-white">
          {info.getValue()}
        </p>
      ),
    }),
    columnHelper.accessor('species', {
      id: 'species',
      header: () => (
        <p className="text-sm font-bold text-gray-600 dark:text-white">SPECIES</p>
      ),
      cell: (info) => (
        <p className="text-sm text-navy-700 dark:text-white capitalize">
          {info.getValue()}
        </p>
      ),
    }),
    columnHelper.accessor('gender', {
      id: 'gender',
      header: () => (
        <p className="text-sm font-bold text-gray-600 dark:text-white">GENDER</p>
      ),
      cell: (info) => (
        <p className="text-sm text-navy-700 dark:text-white capitalize">
          {info.getValue()}
        </p>
      ),
    }),
    columnHelper.accessor('weight', {
      id: 'weight',
      header: () => (
        <p className="text-sm font-bold text-gray-600 dark:text-white">WEIGHT (kg)</p>
      ),
      cell: (info) => (
        <p className="text-sm text-navy-700 dark:text-white">
          {info.getValue()}
        </p>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: () => (
        <p className="text-sm font-bold text-gray-600 dark:text-white">ACTIONS</p>
      ),
      cell: (info) => (
        <button
          onClick={() => router.push(`/livestock/${info.row.original.id}`)}
          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 text-sm"
        >
          View Details
        </button>
      ),
    }),
  ];

  const table = useReactTable({
    data: livestock,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return (
      <div className="mt-5 flex h-96 items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!barn) {
    return (
      <div className="mt-5 flex h-96 items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Barn not found</p>
      </div>
    );
  }

  const isCapacityExceeded = barn.currentOccupancy >= barn.capacity;

  return (
    <div className="mt-5 h-full w-full">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/barns')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <MdArrowBack size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
              {barn.name}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Code: {barn.code}
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push(`/barns/${barnId}/edit`)}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-300"
        >
          <MdEdit size={20} />
          Edit Barn
        </button>
      </div>

      {/* Barn Info Cards */}
      <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Occupancy Card */}
        <Card extra="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Occupancy</p>
              <div className="mt-2 flex items-center gap-2">
                <p className="text-2xl font-bold text-navy-700 dark:text-white">
                  {barn.currentOccupancy} / {barn.capacity}
                </p>
                {isCapacityExceeded && (
                  <MdWarning className="text-red-500" size={24} title="Capacity exceeded" />
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {getOccupancyPercentage().toFixed(0)}% capacity
              </p>
            </div>
          </div>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
            <div
              className={`h-3 rounded-full ${getOccupancyColor()}`}
              style={{ width: `${Math.min(getOccupancyPercentage(), 100)}%` }}
            />
          </div>
          {isCapacityExceeded && (
            <p className="mt-2 text-xs text-red-500">
              Warning: Barn capacity has been exceeded
            </p>
          )}
        </Card>

        {/* Sensors Card */}
        <Card extra="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sensors</p>
              <p className="mt-2 text-2xl font-bold text-navy-700 dark:text-white">
                {barn.sensors.length}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {barn.sensors.length === 0 ? 'No sensors assigned' : 'Active sensors'}
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/10">
              <MdSensors className="text-brand-500" size={28} />
            </div>
          </div>
        </Card>

        {/* Status Card */}
        <Card extra="p-5">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
            <p className="mt-2 text-2xl font-bold text-navy-700 dark:text-white capitalize">
              {barn.status}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Created {new Date(barn.createdAt).toLocaleDateString()}
            </p>
          </div>
        </Card>
      </div>

      {/* Sensors Management */}
      <Card extra="w-full p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-navy-700 dark:text-white">
            Assigned Sensors
          </h2>
          <button
            onClick={() => setShowSensorForm(!showSensorForm)}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-300"
          >
            <MdAdd size={20} />
            Assign Sensor
          </button>
        </div>

        {showSensorForm && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-navy-800 rounded-xl">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter sensor ID (e.g., GAS-001)"
                value={newSensorId}
                onChange={(e) => setNewSensorId(e.target.value)}
                className="flex h-10 flex-1 items-center rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none dark:border-white/10 dark:bg-navy-700 dark:text-white"
              />
              <button
                onClick={handleAssignSensor}
                disabled={sensorLoading}
                className="rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-600 disabled:opacity-50"
              >
                {sensorLoading ? 'Assigning...' : 'Assign'}
              </button>
              <button
                onClick={() => {
                  setShowSensorForm(false);
                  setNewSensorId('');
                }}
                className="rounded-xl bg-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-400 dark:bg-navy-700 dark:text-white dark:hover:bg-navy-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {barn.sensors.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">No sensors assigned to this barn</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {barn.sensors.map((sensorId) => (
              <div
                key={sensorId}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-navy-800"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/10">
                    <MdSensors className="text-brand-500" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-navy-700 dark:text-white">
                      {sensorId}
                    </p>
                    <p className="text-xs text-gray-500">Gas Sensor</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveSensor(sensorId)}
                  className="text-red-500 hover:text-red-700"
                  title="Remove sensor"
                >
                  <MdDelete size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Livestock in Barn */}
      <Card extra="w-full px-6 pb-6 sm:overflow-x-auto">
        <div className="relative flex items-center justify-between pt-4">
          <div className="text-xl font-bold text-navy-700 dark:text-white">
            Livestock in Barn ({livestock.length})
          </div>
        </div>

        <div className="mt-8 overflow-x-scroll xl:overflow-x-hidden">
          {livestockLoading ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Loading livestock...</p>
            </div>
          ) : livestock.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">No livestock in this barn</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="!border-px !border-gray-400">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        className="border-b border-gray-200 pb-2 pr-4 pt-4 text-start dark:border-white/30"
                      >
                        <div className="items-center justify-between text-xs text-gray-200">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="min-w-[100px] border-white/0 py-3 pr-4"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
