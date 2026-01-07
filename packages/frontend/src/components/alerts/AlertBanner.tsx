'use client';

import { useEffect, useCallback } from 'react';
import { useAlertsStore } from '../../stores/useAlertsStore';
import api from '../../lib/axios';
import { MdError, MdClose } from 'react-icons/md';
import { useRouter } from 'next/navigation';

/**
 * AlertBanner Component
 * 
 * Displays active critical alerts in the dashboard header
 * Requirements: 9.2
 */
export default function AlertBanner() {
  const { activeAlerts, setAlerts, updateAlert } = useAlertsStore();
  const router = useRouter();

  const fetchActiveAlerts = useCallback(async () => {
    try {
      const response = await api.get('/api/alerts/active');
      setAlerts(response.data);
    } catch (error) {
      console.error('Error fetching active alerts:', error);
    }
  }, [setAlerts]);

  // Fetch active alerts on mount
  useEffect(() => {
    fetchActiveAlerts();
    
    // Poll for new alerts every 30 seconds
    const interval = setInterval(fetchActiveAlerts, 30000);
    
    return () => clearInterval(interval);
  }, [fetchActiveAlerts]);

  const handleDismiss = async (alertId: string) => {
    try {
      const response = await api.patch(`/api/alerts/${alertId}/acknowledge`);
      updateAlert(alertId, response.data);
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleViewAll = () => {
    router.push('/alerts');
  };

  // Filter for critical alerts only
  const criticalAlerts = activeAlerts.filter(
    (alert) => alert.severity === 'critical'
  );

  if (criticalAlerts.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 space-y-2">
      {criticalAlerts.map((alert) => (
        <div
          key={alert.id}
          className="flex items-center justify-between rounded-lg bg-red-500 p-4 text-white shadow-lg"
        >
          <div className="flex items-center gap-3">
            <MdError className="h-6 w-6 flex-shrink-0" />
            <div>
              <h4 className="font-bold">{alert.title}</h4>
              <p className="text-sm opacity-90">{alert.message}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleViewAll}
              className="rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium hover:bg-white/30"
            >
              Lihat Semua
            </button>
            <button
              onClick={() => handleDismiss(alert.id)}
              className="rounded-lg p-1.5 hover:bg-white/20"
              aria-label="Dismiss alert"
            >
              <MdClose className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
