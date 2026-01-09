'use client';

import { useState } from 'react';
import { api } from '@/lib/axios';
import { MdClose } from 'react-icons/md';

interface WeightEntry {
  id: string;
  livestockId: string;
  weight: number;
  measurementDate: string;
  notes?: string;
}

interface AddWeightEntryFormProps {
  livestockId: string;
  existingEntry?: WeightEntry;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddWeightEntryForm({ 
  livestockId, 
  existingEntry,
  onSuccess, 
  onCancel 
}: AddWeightEntryFormProps) {
  const [weight, setWeight] = useState(existingEntry?.weight.toString() || '');
  const [measurementDate, setMeasurementDate] = useState(
    existingEntry?.measurementDate.split('T')[0] || ''
  );
  const [notes, setNotes] = useState(existingEntry?.notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateFutureDate = (date: string): boolean => {
    if (!date) return true; // Empty is valid (will be caught by required validation)
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate <= today;
  };

  const validatePositiveWeight = (weightValue: string): boolean => {
    const numWeight = parseFloat(weightValue);
    return !isNaN(numWeight) && numWeight > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate weight is positive
    if (!validatePositiveWeight(weight)) {
      setError('Weight must be a positive number');
      return;
    }

    // Validate measurement date is not in future
    if (!validateFutureDate(measurementDate)) {
      setError('Measurement date cannot be in the future');
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        weight: parseFloat(weight),
        measurementDate,
        notes: notes || undefined,
      };

      if (existingEntry) {
        // Update existing entry
        await api.patch(
          `/api/livestock/${livestockId}/weight-entries/${existingEntry.id}`,
          payload
        );
      } else {
        // Create new entry
        await api.post(`/api/livestock/${livestockId}/weight-entries`, payload);
      }
      
      onSuccess();
    } catch (err: any) {
      console.error('Error saving weight entry:', err);
      setError(err.response?.data?.message || 'Failed to save weight entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-navy-800">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-navy-700 dark:text-white">
            {existingEntry ? 'Edit Weight Entry' : 'Add Weight Entry'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Weight */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Weight (kg) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none dark:border-white/10 dark:bg-navy-900 dark:text-white"
              placeholder="Enter weight in kilograms"
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Weight must be a positive number
            </p>
          </div>

          {/* Measurement Date */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Measurement Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={measurementDate}
              onChange={(e) => setMeasurementDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none dark:border-white/10 dark:bg-navy-900 dark:text-white"
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Measurement date cannot be in the future
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="flex w-full items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-navy-900 dark:text-white"
              placeholder="Add any additional notes about this measurement"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl bg-gray-100 px-6 py-2 text-sm font-medium text-navy-700 transition hover:bg-gray-200 dark:bg-navy-700 dark:text-white dark:hover:bg-navy-600 touch-manipulation min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-brand-500 px-6 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-brand-400 dark:hover:bg-brand-300 touch-manipulation min-h-[44px]"
            >
              {loading ? 'Saving...' : existingEntry ? 'Update Entry' : 'Add Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
