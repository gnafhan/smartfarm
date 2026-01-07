'use client';

import { useEffect, useState, useCallback } from 'react';
import Card from '@/components/card';
import { api } from '@/lib/axios';
import { MdFilterList, MdRefresh } from 'react-icons/md';

interface Livestock {
  id: string;
  name: string;
  earTagId: string;
}

interface Barn {
  id: string;
  name: string;
  code: string;
}

interface EntryExitLog {
  id: string;
  livestockId: string;
  barnId: string;
  eventType: 'entry' | 'exit';
  rfidReaderId: string;
  timestamp: string;
  duration?: number;
  notes?: string;
  livestock?: Livestock;
  barn?: Barn;
}

interface PaginatedResponse {
  data: EntryExitLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<EntryExitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filter state
  const [livestockFilter, setLivestockFilter] = useState('');
  const [livestockSearch, setLivestockSearch] = useState('');
  const [barnFilter, setBarnFilter] = useState('');
  const [barnSearch, setBarnSearch] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Dropdown data
  const [livestockList, setLivestockList] = useState<Livestock[]>([]);
  const [barnList, setBarnList] = useState<Barn[]>([]);

  // Filtered lists for search
  const filteredLivestock = livestockList.filter((l) =>
    `${l.name} ${l.earTagId}`.toLowerCase().includes(livestockSearch.toLowerCase())
  );
  const filteredBarns = barnList.filter((b) =>
    `${b.name} ${b.code}`.toLowerCase().includes(barnSearch.toLowerCase())
  );

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
        sortBy: 'timestamp',
        sortOrder: 'desc',
      };

      if (livestockFilter) params.livestockId = livestockFilter;
      if (barnFilter) params.barnId = barnFilter;
      if (eventTypeFilter) params.eventType = eventTypeFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get<PaginatedResponse>('/api/logs', { params });
      
      // Fetch livestock and barn details for each log
      const logsWithDetails = await Promise.all(
        response.data.data.map(async (log) => {
          try {
            const [livestockRes, barnRes] = await Promise.all([
              api.get(`/api/livestock/${log.livestockId}`),
              api.get(`/api/barns/${log.barnId}`),
            ]);
            return {
              ...log,
              livestock: livestockRes.data,
              barn: barnRes.data,
            };
          } catch (error) {
            console.error('Error fetching details for log:', log.id, error);
            return log;
          }
        })
      );

      setLogs(logsWithDetails);
      setTotal(response.data.total);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, livestockFilter, barnFilter, eventTypeFilter, startDate, endDate]);

  const fetchDropdownData = async () => {
    try {
      const [livestockRes, barnRes] = await Promise.all([
        api.get('/api/livestock', { params: { limit: 100 } }),
        api.get('/api/barns', { params: { limit: 100 } }),
      ]);
      const livestockData = livestockRes.data.data || livestockRes.data.items || [];
      const barnData = barnRes.data.data || barnRes.data.items || [];
      setLivestockList(Array.isArray(livestockData) ? livestockData : []);
      setBarnList(Array.isArray(barnData) ? barnData : []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleClearFilters = () => {
    setLivestockFilter('');
    setLivestockSearch('');
    setBarnFilter('');
    setBarnSearch('');
    setEventTypeFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getEventTypeColor = (eventType: string) => {
    return eventType === 'entry'
      ? 'text-green-500 bg-green-100 dark:bg-green-900/30'
      : 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
  };

  const getEventTypeIcon = (eventType: string) => {
    return eventType === 'entry' ? '→' : '←';
  };

  return (
    <div className="mt-5 h-full w-full">
      <Card extra="w-full h-full px-6 pb-6">
        {/* Header */}
        <div className="relative flex items-center justify-between pt-4">
          <div className="text-xl font-bold text-navy-700 dark:text-white">
            Entry/Exit Logs
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-navy-700 transition hover:bg-gray-200 dark:bg-navy-700 dark:text-white dark:hover:bg-navy-600"
            >
              <MdFilterList size={20} />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <button
              onClick={() => fetchLogs()}
              className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-300"
            >
              <MdRefresh size={20} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 rounded-xl border border-gray-200 p-4 dark:border-white/10">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Livestock Filter */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                  Livestock
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={livestockSearch}
                    onChange={(e) => setLivestockSearch(e.target.value)}
                    placeholder="Search livestock..."
                    className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white/0 px-3 text-sm outline-none dark:border-white/10 dark:text-white"
                  />
                  <select
                    value={livestockFilter}
                    onChange={(e) => {
                      setLivestockFilter(e.target.value);
                      setPage(1);
                    }}
                    className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white/0 px-3 text-sm outline-none dark:border-white/10 dark:text-white"
                  >
                    <option value="">All Livestock</option>
                    {filteredLivestock.map((livestock) => (
                      <option key={livestock.id} value={livestock.id}>
                        {livestock.name} ({livestock.earTagId})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Barn Filter */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                  Barn
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={barnSearch}
                    onChange={(e) => setBarnSearch(e.target.value)}
                    placeholder="Search barn..."
                    className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white/0 px-3 text-sm outline-none dark:border-white/10 dark:text-white"
                  />
                  <select
                    value={barnFilter}
                    onChange={(e) => {
                      setBarnFilter(e.target.value);
                      setPage(1);
                    }}
                    className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white/0 px-3 text-sm outline-none dark:border-white/10 dark:text-white"
                  >
                    <option value="">All Barns</option>
                    {filteredBarns.map((barn) => (
                      <option key={barn.id} value={barn.id}>
                        {barn.name} ({barn.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Event Type Filter */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                  Event Type
                </label>
                <select
                  value={eventTypeFilter}
                  onChange={(e) => {
                    setEventTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white/0 px-3 text-sm outline-none dark:border-white/10 dark:text-white"
                >
                  <option value="">All Events</option>
                  <option value="entry">Entry</option>
                  <option value="exit">Exit</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white/0 px-3 text-sm outline-none dark:border-white/10 dark:text-white"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-white/0 px-3 text-sm outline-none dark:border-white/10 dark:text-white"
                />
              </div>

              {/* Clear Filters Button */}
              <div className="flex items-end">
                <button
                  onClick={handleClearFilters}
                  className="h-10 w-full rounded-xl bg-gray-100 px-4 text-sm font-medium text-navy-700 transition hover:bg-gray-200 dark:bg-navy-700 dark:text-white dark:hover:bg-navy-600"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Timeline View */}
        <div className="mt-8">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Loading logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">No logs found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log, index) => (
                <div
                  key={log.id}
                  className="relative flex gap-4 rounded-xl border border-gray-200 p-4 transition hover:shadow-md dark:border-white/10 dark:hover:border-white/20"
                >
                  {/* Timeline indicator */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${getEventTypeColor(log.eventType)}`}
                    >
                      {getEventTypeIcon(log.eventType)}
                    </div>
                    {index < logs.length - 1 && (
                      <div className="h-full w-0.5 bg-gray-200 dark:bg-white/10" />
                    )}
                  </div>

                  {/* Log details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${getEventTypeColor(log.eventType)}`}
                          >
                            {log.eventType.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                        <h3 className="mt-2 text-lg font-semibold text-navy-700 dark:text-white">
                          {log.livestock?.name || 'Unknown Livestock'} (
                          {log.livestock?.earTagId || log.livestockId})
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {log.eventType === 'entry' ? 'Entered' : 'Exited'}{' '}
                          <span className="font-medium">
                            {log.barn?.name || 'Unknown Barn'} ({log.barn?.code || log.barnId})
                          </span>
                        </p>
                      </div>

                      {/* Duration badge for exit events */}
                      {log.eventType === 'exit' && log.duration !== undefined && (
                        <div className="rounded-xl bg-purple-100 px-3 py-2 dark:bg-purple-900/30">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
                          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                            {formatDuration(log.duration)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Additional info */}
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>RFID Reader: {log.rfidReaderId}</span>
                      {log.notes && <span>Notes: {log.notes}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && logs.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}{' '}
              logs
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-navy-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-navy-700 dark:text-white dark:hover:bg-navy-600"
              >
                Previous
              </button>
              <span className="flex items-center px-4 text-sm text-navy-700 dark:text-white">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-navy-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-navy-700 dark:text-white dark:hover:bg-navy-600"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
