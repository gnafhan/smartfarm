import { create } from 'zustand';

export interface GasSensorReading {
  _id: string;
  sensorId: string;
  barnId: string;
  methanePpm: number;
  co2Ppm: number;
  nh3Ppm: number;
  temperature: number;
  humidity: number;
  alertLevel: 'normal' | 'warning' | 'danger';
  timestamp: string;
}

interface MonitoringState {
  readings: Record<string, GasSensorReading>; // keyed by sensorId
  isConnected: boolean;
  lastUpdated: string | null;

  // Actions
  updateReading: (reading: GasSensorReading) => void;
  setConnected: (isConnected: boolean) => void;
  clearReadings: () => void;
}

export const useMonitoringStore = create<MonitoringState>((set) => ({
  readings: {},
  isConnected: false,
  lastUpdated: null,

  updateReading: (reading) =>
    set((state) => ({
      readings: {
        ...state.readings,
        [reading.sensorId]: reading,
      },
      lastUpdated: new Date().toISOString(),
    })),

  setConnected: (isConnected) => set({ isConnected }),

  clearReadings: () => set({ readings: {}, lastUpdated: null }),
}));
