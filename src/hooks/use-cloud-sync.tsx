/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { getQueue, setQueueChangeCallback, QueuedOperation } from '@/lib/offlineQueue';
import { useOnlineStatus } from './use-online-status';

interface FailedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'lieu' | 'journee' | 'virement' | 'charge' | 'reminder' | 'profile';
  data: unknown;
  error: string;
  timestamp: Date;
}

interface SyncState {
  isSyncing: boolean;
  pendingOperations: number;
  lastSyncTime: Date | null;
  error: string | null;
  failedOperations: FailedOperation[];
  queuedOperations: QueuedOperation[];
  isOnline: boolean;
}

interface CloudSyncContextType extends SyncState {
  startSync: () => void;
  endSync: (success?: boolean, errorMessage?: string) => void;
  addFailedOperation: (operation: Omit<FailedOperation, 'id' | 'timestamp'>) => void;
  clearFailedOperations: () => void;
  retryAllFailed: () => Promise<void>;
  clearError: () => void;
  refreshQueue: () => void;
}

const CloudSyncContext = createContext<CloudSyncContextType | undefined>(undefined);

export function CloudSyncProvider({ children }: { children: ReactNode }) {
  const isOnline = useOnlineStatus();
  
  const [state, setState] = useState<SyncState>({
    isSyncing: false,
    pendingOperations: 0,
    lastSyncTime: null,
    error: null,
    failedOperations: [],
    queuedOperations: getQueue(),
    isOnline: navigator.onLine,
  });

  // Update online status
  useEffect(() => {
    setState(prev => ({ ...prev, isOnline }));
  }, [isOnline]);

  // Listen to queue changes
  useEffect(() => {
    setQueueChangeCallback((queue) => {
      setState(prev => ({ ...prev, queuedOperations: queue }));
    });
    return () => setQueueChangeCallback(null);
  }, []);

  const startSync = useCallback(() => {
    setState(prev => ({
      ...prev,
      isSyncing: true,
      pendingOperations: prev.pendingOperations + 1,
      error: null,
    }));
  }, []);

  const endSync = useCallback((success = true, errorMessage?: string) => {
    setState(prev => {
      const newPending = Math.max(0, prev.pendingOperations - 1);
      return {
        ...prev,
        isSyncing: newPending > 0,
        pendingOperations: newPending,
        lastSyncTime: success ? new Date() : prev.lastSyncTime,
        error: success ? null : errorMessage || 'Erreur de synchronisation',
      };
    });
  }, []);

  const addFailedOperation = useCallback((operation: Omit<FailedOperation, 'id' | 'timestamp'>) => {
    setState(prev => ({
      ...prev,
      failedOperations: [
        ...prev.failedOperations,
        {
          ...operation,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        },
      ],
    }));
  }, []);

  const clearFailedOperations = useCallback(() => {
    setState(prev => ({
      ...prev,
      failedOperations: [],
      error: null,
    }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  const refreshQueue = useCallback(() => {
    setState(prev => ({ ...prev, queuedOperations: getQueue() }));
  }, []);

  const retryAllFailed = useCallback(async () => {
    // This will be implemented by the CloudSyncIndicator component
    // which has access to the retry functions
  }, []);

  return (
    <CloudSyncContext.Provider value={{ 
      ...state, 
      startSync, 
      endSync, 
      addFailedOperation,
      clearFailedOperations,
      retryAllFailed,
      clearError,
      refreshQueue,
    }}>
      {children}
    </CloudSyncContext.Provider>
  );
}

export function useCloudSync() {
  const context = useContext(CloudSyncContext);
  if (context === undefined) {
    throw new Error('useCloudSync must be used within a CloudSyncProvider');
  }
  return context;
}

// Global sync notifier for use in non-React code (storage.ts)
type SyncCallback = (syncing: boolean, error?: string) => void;
let globalSyncCallback: SyncCallback | null = null;

export const setGlobalSyncCallback = (callback: SyncCallback | null) => {
  globalSyncCallback = callback;
};

export const notifyGlobalSyncStart = () => {
  globalSyncCallback?.(true);
};

export const notifyGlobalSyncEnd = (error?: string) => {
  globalSyncCallback?.(false, error);
};
