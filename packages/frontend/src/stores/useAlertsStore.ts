import { create } from 'zustand';

export interface Alert {
  id: string;
  type: 'gas_level' | 'system' | 'livestock';
  severity: 'info' | 'warning' | 'critical';
  barnId?: string;
  livestockId?: string;
  title: string;
  message: string;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  farmId: string;
  createdAt: string;
}

interface AlertsState {
  alerts: Alert[];
  activeAlerts: Alert[];
  isLoading: boolean;

  // Actions
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  updateAlert: (alertId: string, updates: Partial<Alert>) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAlertsStore = create<AlertsState>((set) => ({
  alerts: [],
  activeAlerts: [],
  isLoading: false,

  setAlerts: (alerts) =>
    set({
      alerts,
      activeAlerts: alerts.filter((a) => a.status === 'active'),
    }),

  addAlert: (alert) =>
    set((state) => {
      const newAlerts = [alert, ...state.alerts];
      return {
        alerts: newAlerts,
        activeAlerts: newAlerts.filter((a) => a.status === 'active'),
      };
    }),

  updateAlert: (alertId, updates) =>
    set((state) => {
      const newAlerts = state.alerts.map((a) =>
        a.id === alertId ? { ...a, ...updates } : a
      );
      return {
        alerts: newAlerts,
        activeAlerts: newAlerts.filter((a) => a.status === 'active'),
      };
    }),

  setLoading: (isLoading) => set({ isLoading }),
}));
