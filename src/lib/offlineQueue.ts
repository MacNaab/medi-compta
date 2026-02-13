// Offline operation queue with automatic sync on reconnection

import { 
  cloudSaveLieu, cloudUpdateLieu, cloudDeleteLieu,
  cloudSaveJournee, cloudUpdateJournee, cloudDeleteJournee,
  cloudSaveVirement, cloudUpdateVirement, cloudDeleteVirement,
  cloudSaveCharge, cloudUpdateCharge, cloudDeleteCharge,
  cloudSaveReminder, cloudUpdateReminder, cloudDeleteReminder,
  cloudUpdateProfile
} from './cloudOperations';
import type { Lieu, Journee, Virement, Charge, Reminder, UserProfile } from './storage';

export type OperationType = 'create' | 'update' | 'delete';
export type EntityType = 'lieu' | 'journee' | 'virement' | 'charge' | 'reminder' | 'profile';

export interface QueuedOperation {
  id: string;
  type: OperationType;
  entity: EntityType;
  data: unknown;
  timestamp: Date;
  retryCount: number;
  lastError?: string;
}

const QUEUE_STORAGE_KEY = 'offline_operations_queue';
const MAX_RETRIES = 3;

// Get queue from localStorage
export const getQueue = (): QueuedOperation[] => {
  try {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return parsed.map((op: QueuedOperation) => ({
      ...op,
      timestamp: new Date(op.timestamp),
    }));
  } catch {
    return [];
  }
};

// Save queue to localStorage
const saveQueue = (queue: QueuedOperation[]): void => {
  localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
};

// Add operation to queue
export const queueOperation = (
  type: OperationType,
  entity: EntityType,
  data: unknown
): QueuedOperation => {
  const operation: QueuedOperation = {
    id: crypto.randomUUID(),
    type,
    entity,
    data,
    timestamp: new Date(),
    retryCount: 0,
  };

  const queue = getQueue();
  queue.push(operation);
  saveQueue(queue);

  notifyQueueChange();
  return operation;
};

// Remove operation from queue
export const removeFromQueue = (operationId: string): void => {
  const queue = getQueue();
  const filtered = queue.filter(op => op.id !== operationId);
  saveQueue(filtered);
  notifyQueueChange();
};

// Clear all queued operations
export const clearQueue = (): void => {
  saveQueue([]);
  notifyQueueChange();
};

// Update operation with error info
const updateOperationError = (operationId: string, error: string): void => {
  const queue = getQueue();
  const index = queue.findIndex(op => op.id === operationId);
  if (index !== -1) {
    queue[index].retryCount++;
    queue[index].lastError = error;
    saveQueue(queue);
  }
};

// Execute a single operation
const executeOperation = async (operation: QueuedOperation): Promise<boolean> => {
  const { type, entity, data } = operation;

  try {
    switch (entity) {
      case 'lieu':
        if (type === 'create') return await cloudSaveLieu(data as Lieu);
        if (type === 'update') return await cloudUpdateLieu(data as Lieu);
        if (type === 'delete') return await cloudDeleteLieu(data as string);
        break;
      case 'journee':
        if (type === 'create') return await cloudSaveJournee(data as Journee);
        if (type === 'update') return await cloudUpdateJournee(data as Journee);
        if (type === 'delete') return await cloudDeleteJournee(data as string);
        break;
      case 'virement':
        if (type === 'create') return await cloudSaveVirement(data as Virement);
        if (type === 'update') return await cloudUpdateVirement(data as Virement);
        if (type === 'delete') return await cloudDeleteVirement(data as string);
        break;
      case 'charge':
        if (type === 'create') return await cloudSaveCharge(data as Charge);
        if (type === 'update') return await cloudUpdateCharge(data as Charge);
        if (type === 'delete') return await cloudDeleteCharge(data as string);
        break;
      case 'reminder':
        if (type === 'create') return await cloudSaveReminder(data as Reminder);
        if (type === 'update') return await cloudUpdateReminder(data as Reminder);
        if (type === 'delete') return await cloudDeleteReminder(data as string);
        break;
      case 'profile':
        if (type === 'update') return await cloudUpdateProfile(data as UserProfile);
        break;
    }
    return false;
  } catch (error) {
    console.error('Operation execution failed:', error);
    throw error;
  }
};

// Process entire queue
export const processQueue = async (): Promise<{ 
  success: number; 
  failed: number; 
  remaining: QueuedOperation[] 
}> => {
  const queue = getQueue();
  if (queue.length === 0) {
    return { success: 0, failed: 0, remaining: [] };
  }

  let successCount = 0;
  let failedCount = 0;
  const remainingOperations: QueuedOperation[] = [];

  // Sort by timestamp to process in order
  const sortedQueue = [...queue].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  for (const operation of sortedQueue) {
    try {
      const success = await executeOperation(operation);
      if (success) {
        successCount++;
        removeFromQueue(operation.id);
      } else {
        throw new Error('Opération échouée');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      updateOperationError(operation.id, errorMessage);
      
      // Check if max retries exceeded
      if (operation.retryCount >= MAX_RETRIES) {
        failedCount++;
        // Keep in queue but mark as failed for user intervention
      }
      
      remainingOperations.push({
        ...operation,
        retryCount: operation.retryCount + 1,
        lastError: errorMessage,
      });
    }
  }

  return { success: successCount, failed: failedCount, remaining: getQueue() };
};

// Queue change notification system
type QueueChangeCallback = (queue: QueuedOperation[]) => void;
let queueChangeCallback: QueueChangeCallback | null = null;

export const setQueueChangeCallback = (callback: QueueChangeCallback | null) => {
  queueChangeCallback = callback;
};

const notifyQueueChange = () => {
  queueChangeCallback?.(getQueue());
};

// Get queue count
export const getQueueCount = (): number => {
  return getQueue().length;
};
