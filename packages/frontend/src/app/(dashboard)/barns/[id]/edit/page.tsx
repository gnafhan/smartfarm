'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Card from '@/components/card';
import InputField from '@/components/fields/InputField';
import { api } from '@/lib/axios';
import { MdArrowBack, MdSave } from 'react-icons/md';

interface Barn {
  id: string;
  name: string;
  code: string;
  capacity: number;
  currentOccupancy: number;
  sensors: string[];
  status: 'active' | 'inactive';
  farmId: string;
}

export default function EditBarnPage() {
  const router = useRouter();
  const params = useParams();
  const barnId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    capacity: 0,
    status: 'active' as 'active' | 'inactive',
  });

  const fetchBarn = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<Barn>(`/api/barns/${barnId}`);
      setFormData({
        name: response.data.name,
        capacity: response.data.capacity,
        status: response.data.status,
      });
    } catch (error) {
      console.error('Error fetching barn:', error);
      alert('Failed to load barn details');
      router.push('/barns');
    } finally {
      setLoading(false);
    }
  }, [barnId, router]);

  useEffect(() => {
    if (barnId) {
      fetchBarn();
    }
  }, [barnId, fetchBarn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a barn name');
      return;
    }

    if (formData.capacity <= 0) {
      alert('Capacity must be greater than 0');
      return;
    }

    try {
      setSubmitting(true);
      await api.put(`/api/barns/${barnId}`, formData);
      router.push(`/barns/${barnId}`);
    } catch (error: any) {
      console.error('Error updating barn:', error);
      alert(error.response?.data?.message || 'Failed to update barn');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-5 flex h-96 items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mt-5 h-full w-full">
      {/* Header */}
      <div className="mb-5 flex items-center gap-4">
        <button
          onClick={() => router.push(`/barns/${barnId}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <MdArrowBack size={24} />
        </button>
        <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
          Edit Barn
        </h1>
      </div>

      <Card extra="w-full p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Name */}
            <InputField
              label="Barn Name"
              placeholder="Enter barn name"
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              extra="mb-3"
            />

            {/* Capacity */}
            <InputField
              label="Capacity"
              placeholder="Enter capacity"
              id="capacity"
              type="number"
              value={formData.capacity.toString()}
              onChange={(e) =>
                setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })
              }
              extra="mb-3"
            />

            {/* Status */}
            <div className="mb-3">
              <label
                htmlFor="status"
                className="text-sm text-navy-700 dark:text-white ml-1.5 font-medium"
              >
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as 'active' | 'inactive',
                  })
                }
                className="mt-2 flex h-12 w-full items-center justify-center rounded-xl border border-gray-200 bg-white/0 p-3 text-sm outline-none dark:border-white/10 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Note about code */}
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> Barn code cannot be changed after creation. Sensors can be managed from the barn detail page.
            </p>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-base font-medium text-white transition hover:bg-brand-600 disabled:opacity-50 dark:bg-brand-400 dark:hover:bg-brand-300"
            >
              <MdSave size={20} />
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/barns/${barnId}`)}
              className="rounded-xl bg-gray-200 px-5 py-3 text-base font-medium text-navy-700 transition hover:bg-gray-300 dark:bg-navy-700 dark:text-white dark:hover:bg-navy-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
