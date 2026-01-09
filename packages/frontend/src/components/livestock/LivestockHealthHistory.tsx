'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import Card from '@/components/card';
import { MdAdd, MdFilterList } from 'react-icons/md';

interface HealthEvent {
  id: string;
  livestockId: string;
  eventType: 'vaccination' | 'examination' | 'disease';
  eventDate: string;
  description: string;
  vaccineName?: string;
  nextDueDate?: string;
  veterinarianName?: string;
  findings?: string;
  diseaseName?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  treatmentPlan?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse {
  data: HealthEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface LivestockHealthHistoryProps {
  livestockId: string;
  onAddEvent?: () => void;
}

export default function LivestockHealthHistory({ livestockId, onAddEvent }: LivestockHealthHistoryProps) {
  const [events, setEvents] = useState<HealthEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filter state
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchHealthEvents();
  }, [livestockId, page, eventTypeFilter, startDate, endDate]);

  const fetchHealthEvents = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
      };
      
      if (eventTypeFilter) params.eventType = eventTypeFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get<PaginatedResponse>(
        `/api/livestock/${livestockId}/health-events`,
        { params }
      );
      
      setEvents(response.data.data);
      setTotal(response.data.total);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching health events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeBadgeColor = (eventType: string) => {
    switch (eventType) {
      case 'vaccination':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'examination':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'disease':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'mild':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'moderate':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'severe':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const clearFilters = () => {
    setEventTypeFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <Card extra="w-full h-full p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-navy-700 dark:text-white">
          Health History
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-navy-700 transition hover:bg-gray-200 dark:bg-navy-700 dark:text-white dark:hover:bg-navy-600 touch-manipulation min-h-[44px]"
            aria-label="Toggle filters"
          >
            <MdFilterList size={20} />
            Filters
          </button>
          {onAddEvent && (
            <button
              onClick={onAddEvent}
              className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-300 touch-manipulation min-h-[44px]"
              aria-label="Add health event"
            >
              <MdAdd size={20} />
              Add Event
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-4 rounded-xl bg-gray-50 p-4 dark:bg-navy-900">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Event Type
              </label>
              <select
                value={eventTypeFilter}
                onChange={(e) => {
                  setEventTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none dark:border-white/10 dark:bg-navy-800 dark:text-white"
              >
                <option value="">All Types</option>
                <option value="vaccination">Vaccination</option>
                <option value="examination">Examination</option>
                <option value="disease">Disease</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none dark:border-white/10 dark:bg-navy-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none dark:border-white/10 dark:bg-navy-800 dark:text-white"
              />
            </div>
          </div>
          {(eventTypeFilter || startDate || endDate) && (
            <button
              onClick={clearFilters}
              className="mt-3 text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Timeline/List View */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Loading...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">No health events recorded</p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-navy-900"
            >
              {/* Event Header */}
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getEventTypeBadgeColor(event.eventType)}`}>
                    {event.eventType}
                  </span>
                  {event.severity && (
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getSeverityBadgeColor(event.severity)}`}>
                      {event.severity}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(event.eventDate).toLocaleDateString()}
                </p>
              </div>

              {/* Event Description */}
              <p className="mb-3 text-sm text-navy-700 dark:text-white">
                {event.description}
              </p>

              {/* Event-Specific Fields */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {/* Vaccination Fields */}
                {event.eventType === 'vaccination' && (
                  <>
                    {event.vaccineName && (
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Vaccine Name</p>
                        <p className="mt-1 text-sm font-medium text-navy-700 dark:text-white">
                          {event.vaccineName}
                        </p>
                      </div>
                    )}
                    {event.nextDueDate && (
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Next Due Date</p>
                        <p className="mt-1 text-sm font-medium text-navy-700 dark:text-white">
                          {new Date(event.nextDueDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Examination Fields */}
                {event.eventType === 'examination' && (
                  <>
                    {event.veterinarianName && (
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Veterinarian</p>
                        <p className="mt-1 text-sm font-medium text-navy-700 dark:text-white">
                          {event.veterinarianName}
                        </p>
                      </div>
                    )}
                    {event.findings && (
                      <div className="md:col-span-2">
                        <p className="text-xs text-gray-600 dark:text-gray-400">Findings</p>
                        <p className="mt-1 text-sm font-medium text-navy-700 dark:text-white">
                          {event.findings}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Disease Fields */}
                {event.eventType === 'disease' && (
                  <>
                    {event.diseaseName && (
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Disease Name</p>
                        <p className="mt-1 text-sm font-medium text-navy-700 dark:text-white">
                          {event.diseaseName}
                        </p>
                      </div>
                    )}
                    {event.treatmentPlan && (
                      <div className="md:col-span-2">
                        <p className="text-xs text-gray-600 dark:text-gray-400">Treatment Plan</p>
                        <p className="mt-1 text-sm font-medium text-navy-700 dark:text-white">
                          {event.treatmentPlan}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && events.length > 0 && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} events
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-navy-700 transition hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-navy-700 dark:text-white dark:hover:bg-navy-600 touch-manipulation min-h-[44px]"
              aria-label="Previous page"
            >
              Previous
            </button>
            <span className="flex items-center px-4 text-sm text-navy-700 dark:text-white">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-navy-700 transition hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-navy-700 dark:text-white dark:hover:bg-navy-600 touch-manipulation min-h-[44px]"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
