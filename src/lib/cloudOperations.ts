/* eslint-disable @typescript-eslint/no-explicit-any */
// Cloud operations for real-time synchronization
// These functions directly interact with the cloud database when user is authenticated

import { supabase } from '@/integrations/supabase/client';
import { notifyGlobalSyncStart, notifyGlobalSyncEnd } from '@/hooks/use-cloud-sync';
import type { Lieu, Journee, Virement, Charge, Reminder, UserProfile } from './storage';

// Helper to get current user ID
const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

// Wrapper for cloud operations with sync notification
const withSyncNotification = async <T>(operation: () => Promise<T>): Promise<T> => {
  notifyGlobalSyncStart();
  try {
    const result = await operation();
    notifyGlobalSyncEnd();
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    notifyGlobalSyncEnd(message);
    throw error;
  }
};

// ============= LIEUX OPERATIONS =============

export const cloudSaveLieu = async (lieu: Lieu): Promise<boolean> => {
  return withSyncNotification(async () => {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { error } = await (supabase.from('lieuxv2' as any) as any).insert({
      id: lieu.id,
      user_id: userId,
      name: lieu.nom,
      color: lieu.couleur,
      retrocession_percentage: lieu.pourcentageRetrocession,
      adresse: lieu.adresse || null,
      telephone: lieu.telephone || null,
      email: lieu.email || null,
      titulaire: lieu.notes || null,
      created_at: lieu.createdAt,
      updated_at: lieu.updatedAt || lieu.createdAt,
    });

    if (error) {
      console.error('Cloud save lieu error:', error);
      return false;
    }
    return true;
  });
};

export const cloudUpdateLieu = async (lieu: Lieu): Promise<boolean> => {
  return withSyncNotification(async () => {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { error } = await (supabase.from('lieuxv2' as any) as any).update({
      name: lieu.nom,
      color: lieu.couleur,
      retrocession_percentage: lieu.pourcentageRetrocession,
      adresse: lieu.adresse || null,
      telephone: lieu.telephone || null,
      email: lieu.email || null,
      titulaire: lieu.notes || null,
      updated_at: lieu.updatedAt || new Date().toISOString(),
    }).eq('id', lieu.id).eq('user_id', userId);

    if (error) {
      console.error('Cloud update lieu error:', error);
      return false;
    }
    return true;
  });
};

export const cloudDeleteLieu = async (id: string): Promise<boolean> => {
  return withSyncNotification(async () => {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { error } = await (supabase.from('lieuxv2' as any) as any).delete().eq('id', id).eq('user_id', userId);

    if (error) {
      console.error('Cloud delete lieu error:', error);
      return false;
    }
    return true;
  });
};

// ============= JOURNEES OPERATIONS =============

export const cloudSaveJournee = async (journee: Journee): Promise<boolean> => {
  return withSyncNotification(async () => {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { error } = await (supabase.from('journeesv2' as any) as any).insert({
      id: journee.id,
      user_id: userId,
      date: journee.date,
      lieu_id: journee.lieuId || null,
      recettes: journee.recettesTotales || 0,
      honoraires_theoriques: journee.honorairesTheoriques || null,
      prime: journee.prime || 0,
      notes: journee.notes || null,
      created_at: journee.createdAt,
      updated_at: journee.updatedAt || journee.createdAt,
    });

    if (error) {
      console.error('Cloud save journee error:', error);
      return false;
    }
    return true;
  });
};

export const cloudUpdateJournee = async (journee: Journee): Promise<boolean> => {
  return withSyncNotification(async () => {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { error } = await (supabase.from('journeesv2' as any) as any).update({
      date: journee.date,
      lieu_id: journee.lieuId || null,
      recettes: journee.recettesTotales || 0,
      honoraires_theoriques: journee.honorairesTheoriques || null,
      prime: journee.prime || 0,
      notes: journee.notes || null,
      updated_at: journee.updatedAt || new Date().toISOString(),
    }).eq('id', journee.id).eq('user_id', userId);

    if (error) {
      console.error('Cloud update journee error:', error);
      return false;
    }
    return true;
  });
};

export const cloudDeleteJournee = async (id: string): Promise<boolean> => {
  return withSyncNotification(async () => {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { error } = await (supabase.from('journeesv2' as any) as any).delete().eq('id', id).eq('user_id', userId);

    if (error) {
      console.error('Cloud delete journee error:', error);
      return false;
    }
    return true;
  });
};

// ============= VIREMENTS OPERATIONS =============

const statutToStatus = (statut: string): string => {
  switch (statut) {
    case 'en_attente': return 'pending';
    case 'recu': return 'received';
    case 'partiel': return 'partial';
    default: return 'pending';
  }
};

export const cloudSaveVirement = async (virement: Virement): Promise<boolean> => {
  return withSyncNotification(async () => {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { error } = await (supabase.from('virementsv2' as any) as any).insert({
      id: virement.id,
      user_id: userId,
      lieu_id: virement.lieuId || null,
      montant: virement.montantRecu || 0,
      date_reception: virement.dateReception || null,
      date_debut: virement.dateDebut || null,
      date_fin: virement.dateFin || null,
      status: statutToStatus(virement.statut),
      notes: virement.notes || null,
      created_at: virement.createdAt,
      updated_at: virement.updatedAt || virement.createdAt,
    });

    if (error) {
      console.error('Cloud save virement error:', error);
      return false;
    }
    return true;
  });
};

export const cloudUpdateVirement = async (virement: Virement): Promise<boolean> => {
  return withSyncNotification(async () => {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { error } = await (supabase.from('virementsv2' as any) as any).update({
      lieu_id: virement.lieuId || null,
      montant: virement.montantRecu || 0,
      date_reception: virement.dateReception || null,
      date_debut: virement.dateDebut || null,
      date_fin: virement.dateFin || null,
      status: statutToStatus(virement.statut),
      notes: virement.notes || null,
      updated_at: virement.updatedAt || new Date().toISOString(),
    }).eq('id', virement.id).eq('user_id', userId);

    if (error) {
      console.error('Cloud update virement error:', error);
      return false;
    }
    return true;
  });
};

export const cloudDeleteVirement = async (id: string): Promise<boolean> => {
  return withSyncNotification(async () => {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { error } = await (supabase.from('virementsv2' as any) as any).delete().eq('id', id).eq('user_id', userId);

    if (error) {
      console.error('Cloud delete virement error:', error);
      return false;
    }
    return true;
  });
};

// ============= CHARGES OPERATIONS =============

export const cloudSaveCharge = async (charge: Charge): Promise<boolean> => {
  return withSyncNotification(async () => {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { error } = await supabase.from('charges').insert({
      id: charge.id,
      user_id: userId,
      description: charge.description,
      montant: charge.montant,
      date: charge.date,
      categorie: charge.categorie,
      deductible: charge.deductible,
      recurrente: false,
      frequence: null,
      created_at: charge.createdAt,
      updated_at: charge.updatedAt || charge.createdAt,
    });

    if (error) {
      console.error('Cloud save charge error:', error);
      return false;
    }
    return true;
  });
};

export const cloudUpdateCharge = async (charge: Charge): Promise<boolean> => {
  return withSyncNotification(async () => {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { error } = await supabase.from('charges').update({
      description: charge.description,
      montant: charge.montant,
      date: charge.date,
      categorie: charge.categorie,
      deductible: charge.deductible,
      updated_at: charge.updatedAt || new Date().toISOString(),
    }).eq('id', charge.id).eq('user_id', userId);

    if (error) {
      console.error('Cloud update charge error:', error);
      return false;
    }
    return true;
  });
};

export const cloudDeleteCharge = async (id: string): Promise<boolean> => {
  return withSyncNotification(async () => {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { error } = await supabase.from('charges').delete().eq('id', id).eq('user_id', userId);

    if (error) {
      console.error('Cloud delete charge error:', error);
      return false;
    }
    return true;
  });
};

// ============= REMINDERS OPERATIONS =============

export const cloudSaveReminder = async (reminder: Reminder): Promise<boolean> => {
  // Don't sync system reminders
  if (reminder.isSystem) return true;

  return withSyncNotification(async () => {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { error } = await supabase.from('reminders').insert({
      id: reminder.id,
      user_id: userId,
      title: reminder.title,
      description: reminder.description || null,
      due_date: reminder.dueDate || null,
      completed: !!reminder.completedAt,
      priority: 'medium',
      created_at: reminder.createdAt,
      updated_at: reminder.updatedAt || reminder.createdAt,
    });

    if (error) {
      console.error('Cloud save reminder error:', error);
      return false;
    }
    return true;
  });
};

export const cloudUpdateReminder = async (reminder: Reminder): Promise<boolean> => {
  // Don't sync system reminders
  if (reminder.isSystem) return true;

  return withSyncNotification(async () => {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { error } = await supabase.from('reminders').update({
      title: reminder.title,
      description: reminder.description || null,
      due_date: reminder.dueDate || null,
      completed: !!reminder.completedAt,
      updated_at: reminder.updatedAt || new Date().toISOString(),
    }).eq('id', reminder.id).eq('user_id', userId);

    if (error) {
      console.error('Cloud update reminder error:', error);
      return false;
    }
    return true;
  });
};

export const cloudDeleteReminder = async (id: string): Promise<boolean> => {
  return withSyncNotification(async () => {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { error } = await supabase.from('reminders').delete().eq('id', id).eq('user_id', userId);

    if (error) {
      console.error('Cloud delete reminder error:', error);
      return false;
    }
    return true;
  });
};

// ============= PROFILE OPERATIONS =============

interface ProfileUpdate {
  fullName: string;
  adresse?: string;
  siren?: string;
  dateCreationEntreprise?: string;
  updatedAt?: string;
}

export const cloudUpdateProfile = async (profile: ProfileUpdate): Promise<boolean> => {
  return withSyncNotification(async () => {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { error } = await (supabase.from('profilesv2' as any) as any).update({
      full_name: profile.fullName,
      adresse: profile.adresse || null,
      siren: profile.siren || null,
      date_creation_entreprise: profile.dateCreationEntreprise || null,
      updated_at: profile.updatedAt || new Date().toISOString(),
    }).eq('user_id', userId);

    if (error) {
      console.error('Cloud update profile error:', error);
      return false;
    }
    return true;
  });
};

// ============= UTILITY =============

export const isCloudEnabled = async (): Promise<boolean> => {
  const userId = await getCurrentUserId();
  return userId !== null;
};
