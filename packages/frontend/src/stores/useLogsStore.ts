import { create } from 'zustand';

export interface EntryExitLog {
  _id: string;
  livestockId: string;
  barnId: string;
  eventType: 'entry' | 'exit';
  rfidReaderId: string;
  timestamp: string;
  duration?: number;
  notes?: string;
  // Populated fields
  livestock?: {
    _id: string;
    name: string;
    earTagId: string;
  };
  barn?: {
    _id: string;
    name: string;
    code: string;
  };
}

interface LogsState {
  logs: EntryExitLog[];
  recentLogs: EntryExitLog[];
  isLoading: boolean;

  // Actions
  setLogs: (logs: EntryExitLog[]) => void;
  addLog: (log: EntryExitLog) => void;
  setRecentLogs: (logs: EntryExitLog[]) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useLogsStore = create<LogsState>((set) => ({
  logs: [],
  recentLogs: [],
  isLoading: false,

  setLogs: (logs) => set({ logs }),

  addLog: (log) =>
    set((state) => ({
      logs: [log, ...state.logs],
      recentLogs: [log, ...state.recentLogs].slice(0, 10),
    })),

  setRecentLogs: (logs) => set({ recentLogs: logs }),

  setLoading: (isLoading) => set({ isLoading }),
}));
