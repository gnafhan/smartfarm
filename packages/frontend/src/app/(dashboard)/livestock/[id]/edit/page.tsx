'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Card from '@/components/card';
import InputField from '@/components/fields/InputField';
import { api } from '@/lib/axios';
import { MdArrowBack, MdAdd, MdDelete } from 'react-icons/md';

interface Farm {
  id: string;
  name: string;
}

interface Barn {
  id: string;
  name: string;
  code: string;
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
}

export default function EditLivestockPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [barns, setBarns] = useState<Barn[]>([]);
  const [formData, setFormData] = useState({
    earTagId: '',
    name: '',
    species: 'cattle',
    gender: 'male' as 'male' | 'female',
    dateOfBirth: '',
    weight: '',
    color: '',
    healthStatus: '',
    status: 'active' as 'active' | 'sold' | 'deceased',
    farmId: '',
    currentBarnId: '',
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoInput, setPhotoInput] = useState('');
  const [customFields, setCustomFields] = useState<Array<{ key: string; value: string }>>([]);

  // Fetch farms on mount
  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const response = await api.get('/api/farms');
        const farmsData = response.data?.data || response.data?.items || [];
        setFarms(Array.isArray(farmsData) ? farmsData : []);
      } catch (error) {
        console.error('Error fetching farms:', error);
      }
    };

    fetchFarms();
  }, []);

  // Fetch barns when farm changes
  useEffect(() => {
    const fetchBarns = async () => {
      if (!formData.farmId) {
        setBarns([]);
        return;
      }

      try {
        const response = await api.get(`/api/barns?farmId=${formData.farmId}`);
        const barnsData = response.data?.data || response.data?.items || [];
        setBarns(Array.isArray(barnsData) ? barnsData : []);
      } catch (error) {
        console.error('Error fetching barns:', error);
        setBarns([]);
      }
    };

    fetchBarns();
  }, [formData.farmId]);

  useEffect(() => {
    if (id) {
      fetchLivestock();
    }
  }, [id]);

  const fetchLivestock = async () => {
    try {
      setLoading(true);
      const response = await api.get<Livestock>(`/api/livestock/${id}`);
      const livestock = response.data;
      
      setFormData({
        earTagId: livestock.earTagId || '',
        name: livestock.name,
        species: livestock.species,
        gender: livestock.gender,
        dateOfBirth: livestock.dateOfBirth.split('T')[0],
        weight: livestock.weight.toString(),
        color: livestock.color || '',
        healthStatus: livestock.healthStatus || '',
        status: livestock.status,
        farmId: livestock.farmId || '',
        currentBarnId: livestock.currentBarnId || '',
      });
      setPhotos(livestock.photos);
      
      const customFieldsArray = Object.entries(livestock.customFields).map(([key, value]) => ({
        key,
        value: String(value),
      }));
      setCustomFields(customFieldsArray);
    } catch (error) {
      console.error('Error fetching livestock:', error);
      alert('Failed to load livestock details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      
      const customFieldsObj = customFields.reduce((acc, field) => {
        if (field.key) {
          acc[field.key] = field.value;
        }
        return acc;
      }, {} as Record<string, any>);

      const payload: any = {
        name: formData.name,
        species: formData.species,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        weight: parseFloat(formData.weight),
        color: formData.color,
        healthStatus: formData.healthStatus,
        status: formData.status,
        photos,
        customFields: customFieldsObj,
      };

      // Only include currentBarnId if selected (farmId is not updatable)
      if (formData.currentBarnId) {
        payload.currentBarnId = formData.currentBarnId;
      }

      await api.put(`/api/livestock/${id}`, payload);
      alert('Livestock updated successfully!');
      router.push(`/livestock/${id}`);
    } catch (error: any) {
      console.error('Error updating livestock:', error);
      alert(error.response?.data?.message || 'Failed to update livestock');
    } finally {
      setSaving(false);
    }
  };

  const addPhoto = () => {
    if (photoInput.trim()) {
      setPhotos([...photos, photoInput.trim()]);
      setPhotoInput('');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { key: '', value: '' }]);
  };

  const updateCustomField = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...customFields];
    updated[index][field] = value;
    setCustomFields(updated);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="mt-5 flex h-full w-full items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mt-5 h-full w-full">
      {/* Header */}
      <div className="mb-5 flex items-center gap-4">
        <button
          onClick={() => router.push(`/livestock/${id}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <MdArrowBack size={24} />
        </button>
        <h1 className="text-2xl font-bold text-navy-700 dark:text-white">
          Edit Livestock
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Basic Information */}
          <Card extra="col-span-2 p-6">
            <h2 className="mb-4 text-lg font-bold text-navy-700 dark:text-white">
              Basic Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="ml-3 text-sm font-bold text-navy-700 dark:text-white">
                  Ear Tag ID
                </label>
                <input
                  type="text"
                  value={formData.earTagId}
                  disabled
                  className="mt-2 flex h-12 w-full items-center rounded-xl border border-gray-200 bg-gray-100 px-3 text-sm outline-none dark:border-white/10 dark:bg-navy-700 dark:text-gray-400"
                />
              </div>

              <InputField
                id="name"
                label="Name *"
                placeholder="Enter livestock name"
                value={formData.name}
                onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
              />
              
              <div>
                <label className="ml-3 text-sm font-bold text-navy-700 dark:text-white">
                  Species *
                </label>
                <select
                  value={formData.species}
                  onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                  className="mt-2 flex h-12 w-full items-center rounded-xl border border-gray-200 bg-white/0 px-3 text-sm outline-none dark:border-white/10 dark:text-white"
                >
                  <option value="cattle">Cattle</option>
                  <option value="goat">Goat</option>
                  <option value="sheep">Sheep</option>
                  <option value="pig">Pig</option>
                  <option value="chicken">Chicken</option>
                </select>
              </div>

              <div>
                <label className="ml-3 text-sm font-bold text-navy-700 dark:text-white">
                  Gender *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                  className="mt-2 flex h-12 w-full items-center rounded-xl border border-gray-200 bg-white/0 px-3 text-sm outline-none dark:border-white/10 dark:text-white"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <InputField
                id="dateOfBirth"
                label="Date of Birth *"
                type="date"
                placeholder=""
                value={formData.dateOfBirth}
                onChange={(e: any) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />

              <InputField
                id="weight"
                label="Weight (kg) *"
                type="number"
                placeholder="Enter weight"
                value={formData.weight}
                onChange={(e: any) => setFormData({ ...formData, weight: e.target.value })}
              />

              <InputField
                id="color"
                label="Color"
                placeholder="Enter color"
                value={formData.color}
                onChange={(e: any) => setFormData({ ...formData, color: e.target.value })}
              />

              <InputField
                id="healthStatus"
                label="Health Status"
                placeholder="Enter health status"
                value={formData.healthStatus}
                onChange={(e: any) => setFormData({ ...formData, healthStatus: e.target.value })}
              />

              <div>
                <label className="ml-3 text-sm font-bold text-navy-700 dark:text-white">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="mt-2 flex h-12 w-full items-center rounded-xl border border-gray-200 bg-white/0 px-3 text-sm outline-none dark:border-white/10 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="sold">Sold</option>
                  <option value="deceased">Deceased</option>
                </select>
              </div>

              <div>
                <label className="ml-3 text-sm font-bold text-navy-700 dark:text-white">
                  Farm
                </label>
                <select
                  value={formData.farmId}
                  disabled
                  className="mt-2 flex h-12 w-full items-center rounded-xl border border-gray-200 bg-gray-100 px-3 text-sm outline-none dark:border-white/10 dark:bg-navy-700 dark:text-gray-400"
                >
                  <option value="">Select Farm</option>
                  {farms.map((farm) => (
                    <option key={farm.id} value={farm.id}>
                      {farm.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="ml-3 text-sm font-bold text-navy-700 dark:text-white">
                  Current Barn
                </label>
                <select
                  value={formData.currentBarnId}
                  onChange={(e) => setFormData({ ...formData, currentBarnId: e.target.value })}
                  className="mt-2 flex h-12 w-full items-center rounded-xl border border-gray-200 bg-white/0 px-3 text-sm outline-none dark:border-white/10 dark:text-white"
                  disabled={!formData.farmId || barns.length === 0}
                >
                  <option value="">Select Barn (Optional)</option>
                  {barns.map((barn) => (
                    <option key={barn.id} value={barn.id}>
                      {barn.name} ({barn.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Photos */}
          <Card extra="p-6">
            <h2 className="mb-4 text-lg font-bold text-navy-700 dark:text-white">
              Photos
            </h2>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Photo URL"
                  value={photoInput}
                  onChange={(e) => setPhotoInput(e.target.value)}
                  className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white/0 px-3 text-sm outline-none dark:border-white/10 dark:text-white"
                />
                <button
                  type="button"
                  onClick={addPhoto}
                  className="flex h-10 items-center justify-center rounded-xl bg-brand-500 px-4 text-white hover:bg-brand-600"
                >
                  <MdAdd size={20} />
                </button>
              </div>
              {photos.length > 0 && (
                <div className="space-y-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                      <p className="flex-1 truncate text-sm text-navy-700 dark:text-white">
                        {photo}
                      </p>
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <MdDelete size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Custom Fields */}
          <Card extra="col-span-3 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy-700 dark:text-white">
                Custom Fields
              </h2>
              <button
                type="button"
                onClick={addCustomField}
                className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
              >
                <MdAdd size={20} />
                Add Field
              </button>
            </div>
            {customFields.length > 0 && (
              <div className="space-y-3">
                {customFields.map((field, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Field name"
                      value={field.key}
                      onChange={(e) => updateCustomField(index, 'key', e.target.value)}
                      className="flex h-10 w-1/3 items-center rounded-xl border border-gray-200 bg-white/0 px-3 text-sm outline-none dark:border-white/10 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Field value"
                      value={field.value}
                      onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                      className="flex h-10 flex-1 items-center rounded-xl border border-gray-200 bg-white/0 px-3 text-sm outline-none dark:border-white/10 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeCustomField(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <MdDelete size={24} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Submit Button */}
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push(`/livestock/${id}`)}
            className="rounded-xl bg-gray-100 px-6 py-3 text-sm font-medium text-navy-700 transition hover:bg-gray-200 dark:bg-navy-700 dark:text-white dark:hover:bg-navy-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-brand-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50 dark:bg-brand-400 dark:hover:bg-brand-300"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
