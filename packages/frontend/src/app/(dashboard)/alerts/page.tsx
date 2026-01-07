'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAlertsStore, Alert } from '@/stores/useAlertsStore';
import api from '@/lib/axios';
import { MdCheckCircle, MdWarning, MdError, MdInfo } from 'react-icons/md';

export default function AlertsPage() {
  const { alerts, setAlerts, updateAlert, setLoading, isLoading } = useAlertsStore();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/alerts');
      // Backend returns PaginatedResponse with data property
      const alertsData = response.data?.data || response.data;
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  }, [setAlerts, setLoading]);

  // Fetch alerts on mount
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Apply filters whenever alerts or filters change
  useEffect(() => {
    let filtered = [...alerts];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((alert) => alert.status === statusFilter);
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter((alert) => alert.severity === severityFilter);
    }

    setFilteredAlerts(filtered);
  }, [alerts, statusFilter, severityFilter]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      const response = await api.patch(`/api/alerts/${alertId}/acknowledge`);
      updateAlert(alertId, response.data);
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      const response = await api.patch(`/api/alerts/${alertId}/resolve`);
      updateAlert(alertId, response.data);
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <MdError className="h-6 w-6 text-red-500" />;
      case 'warning':
        return <MdWarning className="h-6 w-6 text-yellow-500" />;
      case 'info':
        return <MdInfo className="h-6 w-6 text-blue-500" />;
      default:
        return <MdInfo className="h-6 w-6 text-gray-500" />;
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'acknowledged':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="mt-3 h-full">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-navy-700 dark:text-white">
          Peringatan
        </h1>
        <button
          onClick={fetchAlerts}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-300"
        >
          Muat Ulang
        </button>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-4 rounded-lg bg-white p-4 shadow-md dark:bg-navy-800">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-navy-700 dark:text-white">
            Status:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-navy-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-navy-900 dark:text-white"
          >
            <option value="all">Semua</option>
            <option value="active">Aktif</option>
            <option value="acknowledged">Diakui</option>
            <option value="resolved">Diselesaikan</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-navy-700 dark:text-white">
            Tingkat Keparahan:
          </label>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-navy-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-navy-900 dark:text-white"
          >
            <option value="all">Semua</option>
            <option value="critical">Kritis</option>
            <option value="warning">Peringatan</option>
            <option value="info">Info</option>
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span>Total: {filteredAlerts.length}</span>
        </div>
      </div>

      {/* Alerts List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-lg text-gray-600 dark:text-gray-400">
            Memuat peringatan...
          </div>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg bg-white shadow-md dark:bg-navy-800">
          <div className="text-center">
            <MdCheckCircle className="mx-auto mb-2 h-12 w-12 text-green-500" />
            <p className="text-lg font-medium text-navy-700 dark:text-white">
              Tidak ada peringatan ditemukan
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {statusFilter !== 'all' || severityFilter !== 'all'
                ? 'Coba sesuaikan filter Anda'
                : 'Semua sistem berjalan lancar'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-lg bg-white p-5 shadow-md dark:bg-navy-800"
            >
              <div className="flex items-start gap-4">
                {/* Severity Icon */}
                <div className="flex-shrink-0">
                  {getSeverityIcon(alert.severity)}
                </div>

                {/* Alert Content */}
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-navy-700 dark:text-white">
                      {alert.title}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getSeverityBadgeClass(
                        alert.severity
                      )}`}
                    >
                      {alert.severity.toUpperCase()}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(
                        alert.status
                      )}`}
                    >
                      {alert.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="mb-3 text-sm text-gray-700 dark:text-gray-300">
                    {alert.message}
                  </p>

                  <div className="mb-3 flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
                    <span>Type: {alert.type}</span>
                    <span>Created: {formatDate(alert.createdAt)}</span>
                    {alert.acknowledgedAt && (
                      <span>
                        Acknowledged: {formatDate(alert.acknowledgedAt)}
                      </span>
                    )}
                    {alert.resolvedAt && (
                      <span>Resolved: {formatDate(alert.resolvedAt)}</span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {alert.status === 'active' && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700"
                      >
                        Acknowledge
                      </button>
                    )}
                    {(alert.status === 'active' ||
                      alert.status === 'acknowledged') && (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
