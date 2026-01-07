'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/card';
import InputField from '@/components/fields/InputField';
import { api } from '@/lib/axios';
import { MdArrowBack, MdAdd } from 'react-icons/md';

interface Farm {
  id: string;
  name: string;
}

export default function NewBarnPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loadingFarms, setLoadingFarms] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    capacity: 50,
    farmId: '',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    const fetchFarms = async () => {
      try {
        setLoadingFarms(true);
        const response = await api.get('/api/farms', {
          params: { limit: 100 },
        });
        setFarms(response.data.data || []);
        
        // Set first farm as default if available
        if (response.data.data && response.data.data.length > 0) {
          setFormData((prev) => ({ ...prev, farmId: response.data.data[0].id }));
        }
      } catch (error) {
        console.error('Error fetching farms:', error);
      } finally {
        setLoadingFarms(false);
      }
    };

    fetchFarms();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a barn name');
      return;
    }

    if (!formData.code.trim()) {
      alert('Please enter a barn code');
      return;
    }

    if (formData.capacity <= 0) {
      alert('Capacity must be greater than 0');
      return;
    }

    if (!formData.farmId) {
      alert('Please select a farm');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post('/api/barns', formData);
      router.push(`/barns/${response.data.id}`);
    } catch (error: any) {
      console.error('Error creating barn:', error);
      alert(error.response?.data?.message || 'Failed to create barn');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-5 h-full w-full">
      {/* Header */}
      <div className="mb-5 flex items-center gap-4">
        <button
          onClick={() => router.push('/barns')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <MdArrowBack size={24} />
        </button>
        <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
          Add New Barn
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

            {/* Code */}
            <InputField
              label="Barn Code"
              placeholder="Enter unique barn code (e.g., BARN-001)"
              id="code"
              type="text"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
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

            {/* Farm */}
            <div className="mb-3">
              <label
                htmlFor="farmId"
                className="text-sm text-navy-700 dark:text-white ml-1.5 font-medium"
              >
                Farm
              </label>
              <select
                id="farmId"
                value={formData.farmId}
                onChange={(e) =>
                  setFormData({ ...formData, farmId: e.target.value })
                }
                disabled={loadingFarms}
                className="mt-2 flex h-12 w-full items-center justify-center rounded-xl border border-gray-200 bg-white/0 p-3 text-sm outline-none dark:border-white/10 dark:text-white disabled:opacity-50"
              >
                {loadingFarms ? (
                  <option value="">Loading farms...</option>
                ) : farms.length === 0 ? (
                  <option value="">No farms available</option>
                ) : (
                  <>
                    <option value="">Select a farm</option>
                    {farms.map((farm) => (
                      <option key={farm.id} value={farm.id}>
                        {farm.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

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

          {/* Info */}
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> Sensors can be assigned to the barn after creation from the barn detail page.
            </p>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={submitting || loadingFarms}
              className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-base font-medium text-white transition hover:bg-brand-600 disabled:opacity-50 dark:bg-brand-400 dark:hover:bg-brand-300"
            >
              <MdAdd size={20} />
              {submitting ? 'Creating...' : 'Create Barn'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/barns')}
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
