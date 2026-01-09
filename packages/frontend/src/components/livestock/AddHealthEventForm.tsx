'use client';

import { useState } from 'react';
import { api } from '@/lib/axios';
import { MdClose } from 'react-icons/md';

interface AddHealthEventFormProps {
  livestockId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddHealthEventForm({ livestockId, onSuccess, onCancel }: AddHealthEventFormProps) {
  const [eventType, setEventType] = useState<'vaccination' | 'examination' | 'disease'>('vaccination');
  const [eventDate, setEventDate] = useState('');
  const [description, setDescription] = useState('');
  
  // Vaccination fields
  const [vaccineName, setVaccineName] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  
  // Examination fields
  const [veterinarianName, setVeterinarianName] = useState('');
  const [findings, setFindings] = useState('');
  
  // Disease fields
  const [diseaseName, setDiseaseName] = useState('');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('mild');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateFutureDate = (date: string): boolean => {
    if (!date) return true; // Empty is valid (will be caught by required validation)
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate <= today;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate event date is not in future
    if (!validateFutureDate(eventDate)) {
      setError('Event date cannot be in the future');
      return;
    }

    // Validate event-type-specific required fields
    if (eventType === 'vaccination' && !vaccineName) {
      setError('Vaccine name is required for vaccination events');
      return;
    }
    if (eventType === 'examination' && !veterinarianName) {
      setError('Veterinarian name is required for examination events');
      return;
    }
    if (eventType === 'disease' && !diseaseName) {
      setError('Disease name is required for disease events');
      return;
    }

    // Validate next due date is not in past (if provided)
    if (nextDueDate) {
      const nextDue = new Date(nextDueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (nextDue < today) {
        setError('Next due date cannot be in the past');
        return;
      }
    }

    try {
      setLoading(true);
      
      const payload: any = {
        eventType,
        eventDate,
        description,
      };

      // Add event-type-specific fields
      if (eventType === 'vaccination') {
        payload.vaccineName = vaccineName;
        if (nextDueDate) payload.nextDueDate = nextDueDate;
      } else if (eventType === 'examination') {
        payload.veterinarianName = veterinarianName;
        if (findings) payload.findings = findings;
      } else if (eventType === 'disease') {
        payload.diseaseName = diseaseName;
        payload.severity = severity;
        if (treatmentPlan) payload.treatmentPlan = treatmentPlan;
      }

      await api.post(`/api/livestock/${livestockId}/health-events`, payload);
      onSuccess();
    } catch (err: any) {
      console.error('Error creating health event:', err);
      setError(err.response?.data?.message || 'Failed to create health event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 dark:bg-navy-800">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-navy-700 dark:text-white">
            Add Health Event
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
          {/* Event Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Event Type <span className="text-red-500">*</span>
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as 'vaccination' | 'examination' | 'disease')}
              className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none dark:border-white/10 dark:bg-navy-900 dark:text-white"
              required
            >
              <option value="vaccination">Vaccination</option>
              <option value="examination">Examination</option>
              <option value="disease">Disease</option>
            </select>
          </div>

          {/* Event Date */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Event Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none dark:border-white/10 dark:bg-navy-900 dark:text-white"
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Event date cannot be in the future
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="flex w-full items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-navy-900 dark:text-white"
              required
            />
          </div>

          {/* Vaccination-Specific Fields */}
          {eventType === 'vaccination' && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Vaccine Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={vaccineName}
                  onChange={(e) => setVaccineName(e.target.value)}
                  className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none dark:border-white/10 dark:bg-navy-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Next Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none dark:border-white/10 dark:bg-navy-900 dark:text-white"
                />
              </div>
            </>
          )}

          {/* Examination-Specific Fields */}
          {eventType === 'examination' && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Veterinarian Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={veterinarianName}
                  onChange={(e) => setVeterinarianName(e.target.value)}
                  className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none dark:border-white/10 dark:bg-navy-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Findings (Optional)
                </label>
                <textarea
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  rows={3}
                  className="flex w-full items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-navy-900 dark:text-white"
                />
              </div>
            </>
          )}

          {/* Disease-Specific Fields */}
          {eventType === 'disease' && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Disease Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={diseaseName}
                  onChange={(e) => setDiseaseName(e.target.value)}
                  className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none dark:border-white/10 dark:bg-navy-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Severity <span className="text-red-500">*</span>
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as 'mild' | 'moderate' | 'severe')}
                  className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none dark:border-white/10 dark:bg-navy-900 dark:text-white"
                  required
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Treatment Plan (Optional)
                </label>
                <textarea
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  rows={3}
                  className="flex w-full items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-navy-900 dark:text-white"
                />
              </div>
            </>
          )}

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
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
