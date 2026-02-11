// Smart cloud operations wrapper with offline queue support
// Automatically queues operations when offline and executes when online

import { 
  cloudSaveLieu as directCloudSaveLieu, 
  cloudUpdateLieu as directCloudUpdateLieu, 
  cloudDeleteLieu as directCloudDeleteLieu,
  cloudSaveJournee as directCloudSaveJournee, 
  cloudUpdateJournee as directCloudUpdateJournee, 
  cloudDeleteJournee as directCloudDeleteJournee,
  cloudSaveVirement as directCloudSaveVirement, 
  cloudUpdateVirement as directCloudUpdateVirement, 
  cloudDeleteVirement as directCloudDeleteVirement,
  cloudSaveCharge as directCloudSaveCharge, 
  cloudUpdateCharge as directCloudUpdateCharge, 
  cloudDeleteCharge as directCloudDeleteCharge,
  cloudSaveReminder as directCloudSaveReminder, 
  cloudUpdateReminder as directCloudUpdateReminder, 
  cloudDeleteReminder as directCloudDeleteReminder,
  cloudUpdateProfile as directCloudUpdateProfile,
  isCloudEnabled as checkCloudEnabled,
} from './cloudOperations';
import { queueOperation, EntityType, OperationType } from './offlineQueue';
import type { Lieu, Journee, Virement, Charge, Reminder, UserProfile } from './storage';

// Check if we're online
const isOnline = (): boolean => navigator.onLine;

// Generic wrapper that queues on failure or offline
const withOfflineSupport = async <T>(
  operation: () => Promise<boolean>,
  type: OperationType,
  entity: EntityType,
  data: T
): Promise<boolean> => {
  // If offline, queue immediately
  if (!isOnline()) {
    queueOperation(type, entity, data);
    return true; // Return true as it's queued successfully
  }

  try {
    const result = await operation();
    return result;
  } catch (error) {
    // On error, queue for retry
    console.error(`Cloud operation failed, queuing for retry:`, error);
    queueOperation(type, entity, data);
    return true; // Return true as it's queued for later
  }
};

// ============= LIEUX =============
export const cloudSaveLieu = async (lieu: Lieu): Promise<boolean> => {
  return withOfflineSupport(
    () => directCloudSaveLieu(lieu),
    'create',
    'lieu',
    lieu
  );
};

export const cloudUpdateLieu = async (lieu: Lieu): Promise<boolean> => {
  return withOfflineSupport(
    () => directCloudUpdateLieu(lieu),
    'update',
    'lieu',
    lieu
  );
};

export const cloudDeleteLieu = async (id: string): Promise<boolean> => {
  return withOfflineSupport(
    () => directCloudDeleteLieu(id),
    'delete',
    'lieu',
    id
  );
};

// ============= JOURNEES =============
export const cloudSaveJournee = async (journee: Journee): Promise<boolean> => {
  return withOfflineSupport(
    () => directCloudSaveJournee(journee),
    'create',
    'journee',
    journee
  );
};

export const cloudUpdateJournee = async (journee: Journee): Promise<boolean> => {
  return withOfflineSupport(
    () => directCloudUpdateJournee(journee),
    'update',
    'journee',
    journee
  );
};

export const cloudDeleteJournee = async (id: string): Promise<boolean> => {
  return withOfflineSupport(
    () => directCloudDeleteJournee(id),
    'delete',
    'journee',
    id
  );
};

// ============= VIREMENTS =============
export const cloudSaveVirement = async (virement: Virement): Promise<boolean> => {
  return withOfflineSupport(
    () => directCloudSaveVirement(virement),
    'create',
    'virement',
    virement
  );
};

export const cloudUpdateVirement = async (virement: Virement): Promise<boolean> => {
  return withOfflineSupport(
    () => directCloudUpdateVirement(virement),
    'update',
    'virement',
    virement
  );
};

export const cloudDeleteVirement = async (id: string): Promise<boolean> => {
  return withOfflineSupport(
    () => directCloudDeleteVirement(id),
    'delete',
    'virement',
    id
  );
};

// ============= CHARGES =============
export const cloudSaveCharge = async (charge: Charge): Promise<boolean> => {
  return withOfflineSupport(
    () => directCloudSaveCharge(charge),
    'create',
    'charge',
    charge
  );
};

export const cloudUpdateCharge = async (charge: Charge): Promise<boolean> => {
  return withOfflineSupport(
    () => directCloudUpdateCharge(charge),
    'update',
    'charge',
    charge
  );
};

export const cloudDeleteCharge = async (id: string): Promise<boolean> => {
  return withOfflineSupport(
    () => directCloudDeleteCharge(id),
    'delete',
    'charge',
    id
  );
};

// ============= REMINDERS =============
export const cloudSaveReminder = async (reminder: Reminder): Promise<boolean> => {
  return withOfflineSupport(
    () => directCloudSaveReminder(reminder),
    'create',
    'reminder',
    reminder
  );
};

export const cloudUpdateReminder = async (reminder: Reminder): Promise<boolean> => {
  return withOfflineSupport(
    () => directCloudUpdateReminder(reminder),
    'update',
    'reminder',
    reminder
  );
};

export const cloudDeleteReminder = async (id: string): Promise<boolean> => {
  return withOfflineSupport(
    () => directCloudDeleteReminder(id),
    'delete',
    'reminder',
    id
  );
};

// ============= PROFILE =============
export const cloudUpdateProfile = async (profile: UserProfile): Promise<boolean> => {
  return withOfflineSupport(
    () => directCloudUpdateProfile(profile),
    'update',
    'profile',
    profile
  );
};

// Re-export isCloudEnabled
export const isCloudEnabled = checkCloudEnabled;
