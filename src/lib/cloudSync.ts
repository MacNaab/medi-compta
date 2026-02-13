/* eslint-disable @typescript-eslint/no-explicit-any */
// Cloud synchronization utilities for syncing local data with Lovable Cloud
import { supabase } from '@/integrations/supabase/client';
import type { 
  Lieu, 
  Journee, 
  Virement, 
  Charge, 
  Reminder, 
  UserProfile 
} from './storage';
import { loadData, saveData, generateId } from './storage';

// Types for cloud data (matching database schema)
interface CloudProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  adresse: string | null;
  siren: string | null;
  date_creation_entreprise: string | null;
  created_at: string;
  updated_at: string;
}

interface CloudLieu {
  id: string;
  user_id: string;
  name: string;
  color: string;
  titulaire: string | null;
  adresse: string | null;
  email: string | null;
  telephone: string | null;
  retrocession_percentage: number | null;
  created_at: string;
  updated_at: string;
}

interface CloudJournee {
  id: string;
  user_id: string;
  date: string;
  lieu_id: string | null;
  recettes: number;
  retrocession_percentage: number | null;
  honoraires_theoriques: number | null;
  prime: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface CloudVirement {
  id: string;
  user_id: string;
  lieu_id: string | null;
  montant: number;
  date_reception: string | null;
  date_debut: string | null;
  date_fin: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface CloudCharge {
  id: string;
  user_id: string;
  description: string;
  montant: number;
  date: string;
  categorie: string | null;
  deductible: boolean;
  recurrente: boolean;
  frequence: string | null;
  created_at: string;
  updated_at: string;
}

interface CloudReminder {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
  priority: string;
  created_at: string;
  updated_at: string;
}

// Helper to parse date string for comparison
const parseDate = (dateStr: string | undefined): Date => {
  if (!dateStr) return new Date(0);
  return new Date(dateStr);
};

// Determine which item is more recent
const isMoreRecent = (localUpdated: string | undefined, cloudUpdated: string): boolean => {
  const localDate = parseDate(localUpdated);
  const cloudDate = new Date(cloudUpdated);
  return localDate > cloudDate;
};

// Convert local Lieu to cloud format
const lieuToCloud = (lieu: Lieu, userId: string): Omit<CloudLieu, 'created_at' | 'updated_at'> => ({
  id: lieu.id,
  user_id: userId,
  name: lieu.nom,
  color: lieu.couleur,
  titulaire: lieu.notes || null, // Using notes for titulaire as legacy mapping
  adresse: lieu.adresse || null,
  email: lieu.email || null,
  telephone: lieu.telephone || null,
  retrocession_percentage: lieu.pourcentageRetrocession,
});

// Convert cloud Lieu to local format
const cloudToLieu = (cloud: CloudLieu): Lieu => ({
  id: cloud.id,
  nom: cloud.name,
  couleur: cloud.color,
  pourcentageRetrocession: cloud.retrocession_percentage || 70,
  adresse: cloud.adresse || undefined,
  telephone: cloud.telephone || undefined,
  email: cloud.email || undefined,
  notes: cloud.titulaire || undefined,
  createdAt: cloud.created_at,
  updatedAt: cloud.updated_at,
});

// Convert local Journee to cloud format
const journeeToCloud = (journee: Journee, userId: string, lieuIdMap: Map<string, string>): Omit<CloudJournee, 'created_at' | 'updated_at'> => ({
  id: journee.id,
  user_id: userId,
  date: journee.date,
  lieu_id: journee.lieuId ? (lieuIdMap.get(journee.lieuId) || journee.lieuId) : null,
  recettes: journee.recettesTotales || 0,
  retrocession_percentage: null,
  prime: journee.prime || 0,
  honoraires_theoriques: journee.honorairesTheoriques || null,
  notes: journee.notes || null,
});

// Convert cloud Journee to local format
const cloudToJournee = (cloud: CloudJournee): Journee => ({
  id: cloud.id,
  lieuId: cloud.lieu_id || undefined,
  date: cloud.date,
  recettesTotales: cloud.recettes,
  honorairesTheoriques: cloud.honoraires_theoriques || undefined,
  prime: cloud.prime || undefined,
  notes: cloud.notes || undefined,
  createdAt: cloud.created_at,
  updatedAt: cloud.updated_at,
});

// Convert local Virement to cloud format
const virementToCloud = (virement: Virement, userId: string, lieuIdMap: Map<string, string>): Omit<CloudVirement, 'created_at' | 'updated_at'> => ({
  id: virement.id,
  user_id: userId,
  lieu_id: virement.lieuId ? (lieuIdMap.get(virement.lieuId) || virement.lieuId) : null,
  montant: virement.montantRecu || 0,
  date_reception: virement.dateReception || null,
  date_debut: virement.dateDebut || null,
  date_fin: virement.dateFin || null,
  status: virement.statut === 'en_attente' ? 'pending' : virement.statut === 'recu' ? 'received' : 'partial',
  notes: virement.notes || null,
});

// Convert cloud Virement to local format
const cloudToVirement = (cloud: CloudVirement): Virement => ({
  id: cloud.id,
  lieuId: cloud.lieu_id || undefined,
  montantRecu: cloud.montant,
  dateReception: cloud.date_reception || undefined,
  dateDebut: cloud.date_debut || undefined,
  dateFin: cloud.date_fin || undefined,
  statut: cloud.status === 'pending' ? 'en_attente' : cloud.status === 'received' ? 'recu' : 'partiel',
  notes: cloud.notes || undefined,
  createdAt: cloud.created_at,
  updatedAt: cloud.updated_at,
});

// Convert local Charge to cloud format
const chargeToCloud = (charge: Charge, userId: string): Omit<CloudCharge, 'created_at' | 'updated_at'> => ({
  id: charge.id,
  user_id: userId,
  description: charge.description,
  montant: charge.montant,
  date: charge.date,
  categorie: charge.categorie,
  deductible: charge.deductible,
  recurrente: false,
  frequence: null,
});

// Convert cloud Charge to local format
const cloudToCharge = (cloud: CloudCharge): Charge => ({
  id: cloud.id,
  categorie: (cloud.categorie as Charge['categorie']) || 'autre',
  description: cloud.description,
  montant: cloud.montant,
  date: cloud.date,
  deductible: cloud.deductible,
  notes: undefined,
  createdAt: cloud.created_at,
  updatedAt: cloud.updated_at,
});

// Convert local Reminder to cloud format (simplified - cloud has less fields)
const reminderToCloud = (reminder: Reminder, userId: string): Omit<CloudReminder, 'created_at' | 'updated_at'> => ({
  id: reminder.id,
  user_id: userId,
  title: reminder.title,
  description: reminder.description || null,
  due_date: reminder.dueDate || null,
  completed: !!reminder.completedAt,
  priority: 'medium',
});

// Convert cloud Reminder to local format
const cloudToReminder = (cloud: CloudReminder): Reminder => ({
  id: cloud.id,
  title: cloud.title,
  description: cloud.description || '',
  frequency: 'ponctuel',
  dueDate: cloud.due_date || undefined,
  isSystem: false,
  completedAt: cloud.completed ? new Date().toISOString() : undefined,
  notificationsEnabled: false,
  notifyDaysBefore: 7,
  createdAt: cloud.created_at,
  updatedAt: cloud.updated_at,
});

export interface SyncResult {
  success: boolean;
  error?: string;
  stats?: {
    lieuxSynced: number;
    journeesSynced: number;
    virementsSynced: number;
    chargesSynced: number;
    remindersSynced: number;
  };
}

// Fetch all cloud data
export async function fetchCloudData(userId: string) {
  const [
    { data: profile },
    { data: lieux },
    { data: journees },
    { data: virements },
    { data: charges },
    { data: reminders },
  ] = await Promise.all([
    (supabase.from('profilesv2' as any) as any).select('*').eq('user_id', userId).maybeSingle(),
    (supabase.from('lieuxv2' as any) as any).select('*').eq('user_id', userId),
    (supabase.from('journeesv2' as any) as any).select('*').eq('user_id', userId),
    (supabase.from('virementsv2' as any) as any).select('*').eq('user_id', userId),
    supabase.from('charges').select('*').eq('user_id', userId),
    supabase.from('reminders').select('*').eq('user_id', userId),
  ]);

  return {
    profile: profile as CloudProfile | null,
    lieux: (lieux || []) as CloudLieu[],
    journees: (journees || []) as CloudJournee[],
    virements: (virements || []) as CloudVirement[],
    charges: (charges || []) as CloudCharge[],
    reminders: (reminders || []) as CloudReminder[],
  };
}

// Clear local data before cloud sync
export function clearLocalData(): void {
  localStorage.removeItem('remplacant-data');
}

// Sync local data with cloud (merge strategy: most recent wins)
export async function syncWithCloud(userId: string, clearLocalFirst = false): Promise<SyncResult> {
  try {
    // Optionally clear local data first
    if (clearLocalFirst) {
      clearLocalData();
    }

    // Load local and cloud data
    const localData = loadData();
    const cloudData = await fetchCloudData(userId);

    // Create ID mapping for lieux (in case IDs differ between local and cloud)
    const lieuIdMap = new Map<string, string>();

    // Merge lieux
    const cloudLieuxMap = new Map(cloudData.lieux.map(l => [l.id, l]));
    const mergedLieux: Lieu[] = [];
    const lieuxToUpsert: Array<Omit<CloudLieu, 'created_at' | 'updated_at'>> = [];

    // Process local lieux
    for (const localLieu of localData.lieux) {
      const cloudLieu = cloudLieuxMap.get(localLieu.id);
      
      if (!cloudLieu) {
        // Local only - push to cloud
        lieuxToUpsert.push(lieuToCloud(localLieu, userId));
        mergedLieux.push(localLieu);
        lieuIdMap.set(localLieu.id, localLieu.id);
      } else {
        // Exists in both - compare dates
        if (isMoreRecent(localLieu.updatedAt || localLieu.createdAt, cloudLieu.updated_at)) {
          // Local is more recent
          lieuxToUpsert.push(lieuToCloud(localLieu, userId));
          mergedLieux.push(localLieu);
        } else {
          // Cloud is more recent
          mergedLieux.push(cloudToLieu(cloudLieu));
        }
        lieuIdMap.set(localLieu.id, localLieu.id);
        cloudLieuxMap.delete(localLieu.id);
      }
    }

    // Add remaining cloud-only lieux
    for (const cloudLieu of cloudLieuxMap.values()) {
      mergedLieux.push(cloudToLieu(cloudLieu));
    }

    // Merge journees
    const cloudJourneesMap = new Map(cloudData.journees.map(j => [j.id, j]));
    const mergedJournees: Journee[] = [];
    const journeesToUpsert: Array<Omit<CloudJournee, 'created_at' | 'updated_at'>> = [];

    for (const localJournee of localData.journees) {
      const cloudJournee = cloudJourneesMap.get(localJournee.id);
      
      if (!cloudJournee) {
        journeesToUpsert.push(journeeToCloud(localJournee, userId, lieuIdMap));
        mergedJournees.push(localJournee);
      } else {
        if (isMoreRecent(localJournee.updatedAt || localJournee.createdAt, cloudJournee.updated_at)) {
          journeesToUpsert.push(journeeToCloud(localJournee, userId, lieuIdMap));
          mergedJournees.push(localJournee);
        } else {
          mergedJournees.push(cloudToJournee(cloudJournee));
        }
        cloudJourneesMap.delete(localJournee.id);
      }
    }

    for (const cloudJournee of cloudJourneesMap.values()) {
      mergedJournees.push(cloudToJournee(cloudJournee));
    }

    // Merge virements
    const cloudVirementsMap = new Map(cloudData.virements.map(v => [v.id, v]));
    const mergedVirements: Virement[] = [];
    const virementsToUpsert: Array<Omit<CloudVirement, 'created_at' | 'updated_at'>> = [];

    for (const localVirement of localData.virements) {
      const cloudVirement = cloudVirementsMap.get(localVirement.id);
      
      if (!cloudVirement) {
        virementsToUpsert.push(virementToCloud(localVirement, userId, lieuIdMap));
        mergedVirements.push(localVirement);
      } else {
        if (isMoreRecent(localVirement.updatedAt || localVirement.createdAt, cloudVirement.updated_at)) {
          virementsToUpsert.push(virementToCloud(localVirement, userId, lieuIdMap));
          mergedVirements.push(localVirement);
        } else {
          mergedVirements.push(cloudToVirement(cloudVirement));
        }
        cloudVirementsMap.delete(localVirement.id);
      }
    }

    for (const cloudVirement of cloudVirementsMap.values()) {
      mergedVirements.push(cloudToVirement(cloudVirement));
    }

    // Merge charges
    const cloudChargesMap = new Map(cloudData.charges.map(c => [c.id, c]));
    const mergedCharges: Charge[] = [];
    const chargesToUpsert: Array<Omit<CloudCharge, 'created_at' | 'updated_at'>> = [];

    for (const localCharge of localData.charges) {
      const cloudCharge = cloudChargesMap.get(localCharge.id);
      
      if (!cloudCharge) {
        chargesToUpsert.push(chargeToCloud(localCharge, userId));
        mergedCharges.push(localCharge);
      } else {
        if (isMoreRecent(localCharge.updatedAt || localCharge.createdAt, cloudCharge.updated_at)) {
          chargesToUpsert.push(chargeToCloud(localCharge, userId));
          mergedCharges.push(localCharge);
        } else {
          mergedCharges.push(cloudToCharge(cloudCharge));
        }
        cloudChargesMap.delete(localCharge.id);
      }
    }

    for (const cloudCharge of cloudChargesMap.values()) {
      mergedCharges.push(cloudToCharge(cloudCharge));
    }

    // Merge reminders (only non-system ones)
    const cloudRemindersMap = new Map(cloudData.reminders.map(r => [r.id, r]));
    const mergedReminders: Reminder[] = [];
    const remindersToUpsert: Array<Omit<CloudReminder, 'created_at' | 'updated_at'>> = [];

    for (const localReminder of localData.reminders) {
      if (localReminder.isSystem) {
        // Keep system reminders local only
        mergedReminders.push(localReminder);
        continue;
      }
      
      const cloudReminder = cloudRemindersMap.get(localReminder.id);
      
      if (!cloudReminder) {
        remindersToUpsert.push(reminderToCloud(localReminder, userId));
        mergedReminders.push(localReminder);
      } else {
        if (isMoreRecent(localReminder.updatedAt || localReminder.createdAt, cloudReminder.updated_at)) {
          remindersToUpsert.push(reminderToCloud(localReminder, userId));
          mergedReminders.push(localReminder);
        } else {
          mergedReminders.push(cloudToReminder(cloudReminder));
        }
        cloudRemindersMap.delete(localReminder.id);
      }
    }

    for (const cloudReminder of cloudRemindersMap.values()) {
      mergedReminders.push(cloudToReminder(cloudReminder));
    }

    // Update profile
    const mergedProfile: UserProfile = {
      fullName: localData.profile.fullName || cloudData.profile?.full_name || 'Utilisateur',
      adresse: localData.profile.adresse || cloudData.profile?.adresse || undefined,
      siren: localData.profile.siren || cloudData.profile?.siren || undefined,
      dateCreationEntreprise: localData.profile.dateCreationEntreprise || cloudData.profile?.date_creation_entreprise || undefined,
      notificationsEnabled: localData.profile.notificationsEnabled,
      createdAt: localData.profile.createdAt,
      updatedAt: new Date().toISOString(),
    };

    // Execute cloud upserts
    const upsertPromises = [];

    if (lieuxToUpsert.length > 0) {
      upsertPromises.push(
        (supabase.from('lieuxv2' as any) as any).upsert(lieuxToUpsert.map(l => ({
          ...l,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))).select().then((res: any) => res)
      );
    }

    if (journeesToUpsert.length > 0) {
      upsertPromises.push(
        (supabase.from('journeesv2' as any) as any).upsert(journeesToUpsert.map(j => ({
          ...j,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))).select().then((res: any) => res)
      );
    }

    if (virementsToUpsert.length > 0) {
      upsertPromises.push(
        (supabase.from('virementsv2' as any) as any).upsert(virementsToUpsert.map(v => ({
          ...v,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))).select().then((res: any) => res)
      );
    }

    if (chargesToUpsert.length > 0) {
      upsertPromises.push(
        supabase.from('charges').upsert(chargesToUpsert.map(c => ({
          ...c,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))).select().then(res => res)
      );
    }

    if (remindersToUpsert.length > 0) {
      upsertPromises.push(
        supabase.from('reminders').upsert(remindersToUpsert.map(r => ({
          ...r,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))).select().then(res => res)
      );
    }

    // Update profile in cloud
    upsertPromises.push(
      (supabase.from('profilesv2' as any) as any).update({
        full_name: mergedProfile.fullName,
        adresse: mergedProfile.adresse || null,
        siren: mergedProfile.siren || null,
        date_creation_entreprise: mergedProfile.dateCreationEntreprise || null,
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId).select().then((res: any) => res)
    );

    await Promise.all(upsertPromises);

    // Save merged data locally
    saveData({
      profile: mergedProfile,
      lieux: mergedLieux,
      journees: mergedJournees,
      virements: mergedVirements,
      charges: mergedCharges,
      reminders: mergedReminders,
    });

    return {
      success: true,
      stats: {
        lieuxSynced: mergedLieux.length,
        journeesSynced: mergedJournees.length,
        virementsSynced: mergedVirements.length,
        chargesSynced: mergedCharges.length,
        remindersSynced: mergedReminders.filter(r => !r.isSystem).length,
      },
    };
  } catch (error) {
    console.error('Sync error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur de synchronisation',
    };
  }
}

// Push all local data to cloud (for initial upload)
export async function pushLocalToCloud(userId: string): Promise<SyncResult> {
  try {
    const localData = loadData();
    const lieuIdMap = new Map<string, string>();

    // Prepare lieux
    const lieuxToInsert = localData.lieux.map(l => {
      lieuIdMap.set(l.id, l.id);
      return {
        ...lieuToCloud(l, userId),
        created_at: l.createdAt || new Date().toISOString(),
        updated_at: l.updatedAt || new Date().toISOString(),
      };
    });

    // Prepare journees
    const journeesToInsert = localData.journees.map(j => ({
      ...journeeToCloud(j, userId, lieuIdMap),
      created_at: j.createdAt || new Date().toISOString(),
      updated_at: j.updatedAt || new Date().toISOString(),
    }));

    // Prepare virements
    const virementsToInsert = localData.virements.map(v => ({
      ...virementToCloud(v, userId, lieuIdMap),
      created_at: v.createdAt || new Date().toISOString(),
      updated_at: v.updatedAt || new Date().toISOString(),
    }));

    // Prepare charges
    const chargesToInsert = localData.charges.map(c => ({
      ...chargeToCloud(c, userId),
      created_at: c.createdAt || new Date().toISOString(),
      updated_at: c.updatedAt || new Date().toISOString(),
    }));

    // Prepare reminders (non-system only)
    const remindersToInsert = localData.reminders
      .filter(r => !r.isSystem)
      .map(r => ({
        ...reminderToCloud(r, userId),
        created_at: r.createdAt || new Date().toISOString(),
        updated_at: r.updatedAt || new Date().toISOString(),
      }));

    // Execute inserts
    const promises = [];

    if (lieuxToInsert.length > 0) {
      promises.push((supabase.from('lieuxv2' as any) as any).upsert(lieuxToInsert).select().then((res: any) => res));
    }
    if (journeesToInsert.length > 0) {
      promises.push((supabase.from('journeesv2' as any) as any).upsert(journeesToInsert).select().then((res: any) => res));
    }
    if (virementsToInsert.length > 0) {
      promises.push((supabase.from('virementsv2' as any) as any).upsert(virementsToInsert).select().then((res: any) => res));
    }
    if (chargesToInsert.length > 0) {
      promises.push(supabase.from('charges').upsert(chargesToInsert).select().then(res => res));
    }
    if (remindersToInsert.length > 0) {
      promises.push(supabase.from('reminders').upsert(remindersToInsert).select().then(res => res));
    }

    // Update profile
    promises.push(
      (supabase.from('profilesv2' as any) as any).update({
        full_name: localData.profile.fullName,
        adresse: localData.profile.adresse || null,
        siren: localData.profile.siren || null,
        date_creation_entreprise: localData.profile.dateCreationEntreprise || null,
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId).select().then((res: any) => res)
    );

    await Promise.all(promises);

    return {
      success: true,
      stats: {
        lieuxSynced: lieuxToInsert.length,
        journeesSynced: journeesToInsert.length,
        virementsSynced: virementsToInsert.length,
        chargesSynced: chargesToInsert.length,
        remindersSynced: remindersToInsert.length,
      },
    };
  } catch (error) {
    console.error('Push error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de l\'envoi des données',
    };
  }
}

// Pull cloud data only (overwrites local)
export async function pullFromCloud(userId: string): Promise<SyncResult> {
  try {
    const cloudData = await fetchCloudData(userId);

    // Convert cloud data to local format
    const localData = {
      profile: {
        fullName: cloudData.profile?.full_name || 'Utilisateur',
        adresse: cloudData.profile?.adresse || undefined,
        siren: cloudData.profile?.siren || undefined,
        dateCreationEntreprise: cloudData.profile?.date_creation_entreprise || undefined,
        createdAt: cloudData.profile?.created_at || new Date().toISOString(),
        updatedAt: cloudData.profile?.updated_at,
      },
      lieux: cloudData.lieux.map(cloudToLieu),
      journees: cloudData.journees.map(cloudToJournee),
      virements: cloudData.virements.map(cloudToVirement),
      charges: cloudData.charges.map(cloudToCharge),
      reminders: cloudData.reminders.map(cloudToReminder),
    };

    // Save to local storage
    saveData(localData);

    return {
      success: true,
      stats: {
        lieuxSynced: localData.lieux.length,
        journeesSynced: localData.journees.length,
        virementsSynced: localData.virements.length,
        chargesSynced: localData.charges.length,
        remindersSynced: localData.reminders.length,
      },
    };
  } catch (error) {
    console.error('Pull error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération des données',
    };
  }
}
