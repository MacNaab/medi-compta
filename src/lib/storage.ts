/* eslint-disable @typescript-eslint/no-explicit-any */
// Local storage utilities for offline-first data management
import { z } from 'zod';
import {
  cloudSaveLieu,
  cloudUpdateLieu,
  cloudDeleteLieu,
  cloudSaveJournee,
  cloudUpdateJournee,
  cloudDeleteJournee,
  cloudSaveVirement,
  cloudUpdateVirement,
  cloudDeleteVirement,
  cloudSaveCharge,
  cloudUpdateCharge,
  cloudDeleteCharge,
  cloudSaveReminder,
  cloudUpdateReminder,
  cloudDeleteReminder,
  cloudUpdateProfile,
  isCloudEnabled,
} from './cloudOperationsWrapper';
export interface Lieu {
  id: string;
  nom: string;
  pourcentageRetrocession: number;
  couleur: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Journee {
  id: string;
  lieuId?: string;
  date: string;
  recettesTotales?: number;
  honorairesTheoriques?: number;
  prime?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Virement {
  id: string;
  lieuId?: string;
  dateDebut?: string;
  dateFin?: string;
  montantRecu?: number;
  dateReception?: string;
  statut: 'en_attente' | 'recu' | 'partiel';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Charge {
  id: string;
  categorie: 'transport' | 'materiel' | 'formation' | 'cotisations' | 'assurance' | 'telephone' | 'autre';
  description: string;
  montant: number;
  date: string;
  deductible: boolean;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  frequency: 'ponctuel' | 'mensuel' | 'trimestriel' | 'annuel';
  dueDate?: string;
  isSystem: boolean;
  completedAt?: string;
  completedForPeriod?: string;
  notificationsEnabled: boolean;
  notifyDaysBefore: number;
  createdAt: string;
  updatedAt?: string;
}

export interface UserProfile {
  fullName: string;
  adresse?: string;
  siren?: string;
  dateCreationEntreprise?: string;
  notificationsEnabled?: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface StorageData {
  profile: UserProfile;
  lieux: Lieu[];
  journees: Journee[];
  virements: Virement[];
  charges: Charge[];
  reminders: Reminder[];
}

const STORAGE_KEY = 'remplacant-data';

const getDefaultData = (): StorageData => ({
  profile: {
    fullName: 'Utilisateur',
    createdAt: new Date().toISOString(),
  },
  lieux: [],
  journees: [],
  virements: [],
  charges: [],
  reminders: [],
});

export const generateId = (): string => {
  return crypto.randomUUID();
};

export const loadData = (): StorageData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
  return getDefaultData();
};

export const saveData = (data: StorageData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

// Lieux operations
export const getLieux = (): Lieu[] => loadData().lieux;

export const getLieuById = (id: string): Lieu | undefined => {
  return getLieux().find(l => l.id === id);
};

export const saveLieu = (lieu: Omit<Lieu, 'id' | 'createdAt'>): Lieu => {
  const data = loadData();
  const newLieu: Lieu = {
    ...lieu,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  data.lieux.push(newLieu);
  saveData(data);
  
  // Sync to cloud if connected
  isCloudEnabled().then(enabled => {
    if (enabled) cloudSaveLieu(newLieu);
  });
  
  return newLieu;
};

export const updateLieu = (id: string, updates: Partial<Lieu>): Lieu | null => {
  const data = loadData();
  const index = data.lieux.findIndex(l => l.id === id);
  if (index === -1) return null;
  
  data.lieux[index] = {
    ...data.lieux[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveData(data);
  
  // Sync to cloud if connected
  const updatedLieu = data.lieux[index];
  isCloudEnabled().then(enabled => {
    if (enabled) cloudUpdateLieu(updatedLieu);
  });
  
  return updatedLieu;
};

export const deleteLieu = (id: string): boolean => {
  const data = loadData();
  const index = data.lieux.findIndex(l => l.id === id);
  if (index === -1) return false;
  
  data.lieux.splice(index, 1);
  saveData(data);
  
  // Sync to cloud if connected
  isCloudEnabled().then(enabled => {
    if (enabled) cloudDeleteLieu(id);
  });
  
  return true;
};

// Journées operations
export const getJournees = (): Journee[] => loadData().journees;

export const getJourneesByMonth = (year: number, month: number): Journee[] => {
  return getJournees().filter(j => {
    const date = new Date(j.date);
    return date.getFullYear() === year && date.getMonth() === month;
  });
};

export const saveJournee = (journee: Omit<Journee, 'id' | 'createdAt'>): Journee => {
  const data = loadData();
  const newJournee: Journee = {
    ...journee,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  data.journees.push(newJournee);
  saveData(data);
  
  // Sync to cloud if connected
  isCloudEnabled().then(enabled => {
    if (enabled) cloudSaveJournee(newJournee);
  });
  
  return newJournee;
};

export const updateJournee = (id: string, updates: Partial<Journee>): Journee | null => {
  const data = loadData();
  const index = data.journees.findIndex(j => j.id === id);
  if (index === -1) return null;
  
  data.journees[index] = {
    ...data.journees[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveData(data);
  
  // Sync to cloud if connected
  const updatedJournee = data.journees[index];
  isCloudEnabled().then(enabled => {
    if (enabled) cloudUpdateJournee(updatedJournee);
  });
  
  return updatedJournee;
};

export const deleteJournee = (id: string): boolean => {
  const data = loadData();
  const index = data.journees.findIndex(j => j.id === id);
  if (index === -1) return false;
  
  data.journees.splice(index, 1);
  saveData(data);
  
  // Sync to cloud if connected
  isCloudEnabled().then(enabled => {
    if (enabled) cloudDeleteJournee(id);
  });
  
  return true;
};

// Virements operations
export const getVirements = (): Virement[] => loadData().virements;

export const getVirementsEnAttente = (): Virement[] => {
  return getVirements().filter(v => v.statut === 'en_attente');
};

export const saveVirement = (virement: Omit<Virement, 'id' | 'createdAt'>): Virement => {
  const data = loadData();
  const newVirement: Virement = {
    ...virement,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  data.virements.push(newVirement);
  saveData(data);
  
  // Sync to cloud if connected
  isCloudEnabled().then(enabled => {
    if (enabled) cloudSaveVirement(newVirement);
  });
  
  return newVirement;
};

export const updateVirement = (id: string, updates: Partial<Virement>): Virement | null => {
  const data = loadData();
  const index = data.virements.findIndex(v => v.id === id);
  if (index === -1) return null;
  
  data.virements[index] = {
    ...data.virements[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveData(data);
  
  // Sync to cloud if connected
  const updatedVirement = data.virements[index];
  isCloudEnabled().then(enabled => {
    if (enabled) cloudUpdateVirement(updatedVirement);
  });
  
  return updatedVirement;
};

export const deleteVirement = (id: string): boolean => {
  const data = loadData();
  const index = data.virements.findIndex(v => v.id === id);
  if (index === -1) return false;
  
  data.virements.splice(index, 1);
  saveData(data);
  
  // Sync to cloud if connected
  isCloudEnabled().then(enabled => {
    if (enabled) cloudDeleteVirement(id);
  });
  
  return true;
};

// Profile operations
export const getProfile = (): UserProfile => loadData().profile;

export const updateProfile = (updates: Partial<UserProfile>): UserProfile => {
  const data = loadData();
  data.profile = {
    ...data.profile,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveData(data);
  
  // Sync to cloud if connected
  const updatedProfile = data.profile;
  isCloudEnabled().then(enabled => {
    if (enabled) cloudUpdateProfile(updatedProfile);
  });
  
  return updatedProfile;
};

// Statistics
export const getStatistics = () => {
  const journees = getJournees();
  const virements = getVirements();
  const lieux = getLieux();
  
  const totalRecettes = journees.reduce((sum, j) => sum + (j.recettesTotales || 0), 0);
  const totalHonoraires = journees.reduce((sum, j) => sum + (j.honorairesTheoriques || 0), 0);
  const totalVirements = virements
    .filter(v => v.statut === 'recu')
    .reduce((sum, v) => sum + (v.montantRecu || 0), 0);
  const enAttente = virements
    .filter(v => v.statut === 'en_attente')
    .reduce((sum, v) => sum + (v.montantRecu || 0), 0);
  
  return {
    totalRecettes,
    totalHonoraires,
    totalVirements,
    enAttente,
    nombreJournees: journees.length,
    nombreLieux: lieux.length,
  };
};

// Export data
export const exportData = (): string => {
  const data = loadData();
  return JSON.stringify(data, null, 2);
};

// Charges operations
export const getCharges = (): Charge[] => loadData().charges || [];

export const getChargesByYear = (year: number): Charge[] => {
  return getCharges().filter(c => {
    const date = new Date(c.date);
    return date.getFullYear() === year;
  });
};

export const saveCharge = (charge: Omit<Charge, 'id' | 'createdAt'>): Charge => {
  const data = loadData();
  const newCharge: Charge = {
    ...charge,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  if (!data.charges) data.charges = [];
  data.charges.push(newCharge);
  saveData(data);
  
  // Sync to cloud if connected
  isCloudEnabled().then(enabled => {
    if (enabled) cloudSaveCharge(newCharge);
  });
  
  return newCharge;
};

export const updateCharge = (id: string, updates: Partial<Charge>): Charge | null => {
  const data = loadData();
  if (!data.charges) data.charges = [];
  const index = data.charges.findIndex(c => c.id === id);
  if (index === -1) return null;
  
  data.charges[index] = {
    ...data.charges[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveData(data);
  
  // Sync to cloud if connected
  const updatedCharge = data.charges[index];
  isCloudEnabled().then(enabled => {
    if (enabled) cloudUpdateCharge(updatedCharge);
  });
  
  return updatedCharge;
};

export const deleteCharge = (id: string): boolean => {
  const data = loadData();
  if (!data.charges) return false;
  const index = data.charges.findIndex(c => c.id === id);
  if (index === -1) return false;
  
  data.charges.splice(index, 1);
  saveData(data);
  
  // Sync to cloud if connected
  isCloudEnabled().then(enabled => {
    if (enabled) cloudDeleteCharge(id);
  });
  
  return true;
};

// Reminders operations
export const getReminders = (): Reminder[] => loadData().reminders || [];

export const saveReminder = (reminder: Omit<Reminder, 'id' | 'createdAt'>): Reminder => {
  const data = loadData();
  const newReminder: Reminder = {
    ...reminder,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  if (!data.reminders) data.reminders = [];
  data.reminders.push(newReminder);
  saveData(data);
  
  // Sync to cloud if connected (non-system reminders only)
  if (!newReminder.isSystem) {
    isCloudEnabled().then(enabled => {
      if (enabled) cloudSaveReminder(newReminder);
    });
  }
  
  return newReminder;
};

export const updateReminder = (id: string, updates: Partial<Reminder>): Reminder | null => {
  const data = loadData();
  if (!data.reminders) data.reminders = [];
  const index = data.reminders.findIndex(r => r.id === id);
  if (index === -1) return null;
  
  data.reminders[index] = {
    ...data.reminders[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveData(data);
  
  // Sync to cloud if connected (non-system reminders only)
  const updatedReminder = data.reminders[index];
  if (!updatedReminder.isSystem) {
    isCloudEnabled().then(enabled => {
      if (enabled) cloudUpdateReminder(updatedReminder);
    });
  }
  
  return updatedReminder;
};

export const deleteReminder = (id: string): boolean => {
  const data = loadData();
  if (!data.reminders) return false;
  const index = data.reminders.findIndex(r => r.id === id);
  if (index === -1) return false;
  
  const reminder = data.reminders[index];
  data.reminders.splice(index, 1);
  saveData(data);
  
  // Sync to cloud if connected (non-system reminders only)
  if (!reminder.isSystem) {
    isCloudEnabled().then(enabled => {
      if (enabled) cloudDeleteReminder(id);
    });
  }
  
  return true;
};

// Zod schemas for data validation
// Using .passthrough() to allow unknown keys from legacy exports (they will be stripped)
// Using .optional() for fields that may not exist in legacy exports

const LieuSchema = z.object({
  id: z.string().min(1),
  nom: z.string().min(1).max(200).trim(),
  pourcentageRetrocession: z.number().min(0).max(100),
  couleur: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  adresse: z.string().max(500).optional(),
  telephone: z.string().max(50).optional(),
  email: z.string().email().max(200).optional().or(z.literal('')),
  notes: z.string().max(2000).optional(),
  createdAt: z.string().optional(), // Optional for legacy exports
  updatedAt: z.string().optional(),
}).passthrough(); // Allow unknown keys from legacy exports

const JourneeSchema = z.object({
  id: z.string().min(1),
  lieuId: z.string().optional(),
  date: z.string(),
  recettesTotales: z.number().min(0).optional(),
  honorairesTheoriques: z.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
  createdAt: z.string().optional(), // Optional for legacy exports
  updatedAt: z.string().optional(),
}).passthrough(); // Allow unknown keys from legacy exports

const VirementSchema = z.object({
  id: z.string().min(1),
  lieuId: z.string().optional(),
  dateDebut: z.string().optional(),
  dateFin: z.string().optional(),
  montantRecu: z.number().min(0).optional(),
  dateReception: z.string().optional(),
  statut: z.enum(['en_attente', 'recu', 'partiel']),
  notes: z.string().max(2000).optional(),
  createdAt: z.string().optional(), // Optional for legacy exports
  updatedAt: z.string().optional(),
}).passthrough(); // Allow unknown keys from legacy exports

const ChargeSchema = z.object({
  id: z.string().min(1),
  categorie: z.enum(['transport', 'materiel', 'formation', 'cotisations', 'assurance', 'telephone', 'autre']),
  description: z.string().min(1).max(500).trim(),
  montant: z.number().min(0),
  date: z.string(),
  deductible: z.boolean(),
  notes: z.string().max(2000).optional(),
  createdAt: z.string().optional(), // Optional for legacy exports
  updatedAt: z.string().optional(),
}).passthrough(); // Allow unknown keys from legacy exports

const ReminderSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(1000),
  frequency: z.enum(['ponctuel', 'mensuel', 'trimestriel', 'annuel']),
  dueDate: z.string().optional(),
  isSystem: z.boolean(),
  completedAt: z.string().optional(),
  completedForPeriod: z.string().optional(),
  notificationsEnabled: z.boolean(),
  notifyDaysBefore: z.number().min(0).max(365),
  createdAt: z.string().optional(), // Optional for legacy exports
  updatedAt: z.string().optional(),
}).passthrough(); // Allow unknown keys from legacy exports

const UserProfileSchema = z.object({
  fullName: z.string().min(1).max(200).trim(),
  adresse: z.string().max(500).optional(),
  siren: z.string().max(20).optional(),
  dateCreationEntreprise: z.string().optional(),
  notificationsEnabled: z.boolean().optional(),
  createdAt: z.string().optional(), // Optional for legacy exports
  updatedAt: z.string().optional(),
}).passthrough(); // Allow unknown keys from legacy exports

const StorageDataSchema = z.object({
  profile: UserProfileSchema.optional(), // Profile may not exist in legacy exports
  lieux: z.array(LieuSchema).default([]),
  journees: z.array(JourneeSchema).default([]),
  virements: z.array(VirementSchema).default([]),
  charges: z.array(ChargeSchema).default([]),
  reminders: z.array(ReminderSchema).default([]),
}).passthrough(); // Allow unknown keys from legacy exports

// Import result type with detailed error information
export interface ImportResult {
  success: boolean;
  errors?: ImportError[];
  warnings?: string[];
}

export interface ImportError {
  path: string;
  message: string;
  code: string;
  received?: unknown;
  expected?: string;
}

// Translate Zod error codes to user-friendly French messages
const translateZodError = (error: z.ZodIssue): ImportError => {
  const path = error.path.length > 0 ? error.path.join('.') : 'racine';
  
  let message: string;
  let expected: string | undefined;
  
  switch (error.code) {
    case 'invalid_type':
      { const typeError = error as z.ZodInvalidTypeIssue;
      expected = translateType(typeError.expected);
      message = `Type invalide : attendu "${expected}", reçu "${translateType(typeError.received)}"`;
      break; }
    case 'invalid_enum_value':
      message = `Valeur non autorisée : "${(error as any).received}"`;
      expected = (error as any).options?.join(', ');
      break;
    case 'too_small':
      { const smallError = error as z.ZodTooSmallIssue;
      if (smallError.type === 'string') {
        message = smallError.minimum === 1 ? 'Ce champ ne peut pas être vide' : `Minimum ${smallError.minimum} caractères requis`;
      } else if (smallError.type === 'number') {
        message = `La valeur doit être au minimum ${smallError.minimum}`;
      } else {
        message = `Taille minimum : ${smallError.minimum}`;
      }
      break; }
    case 'too_big':
      { const bigError = error as z.ZodTooBigIssue;
      if (bigError.type === 'string') {
        message = `Maximum ${bigError.maximum} caractères autorisés`;
      } else if (bigError.type === 'number') {
        message = `La valeur doit être au maximum ${bigError.maximum}`;
      } else {
        message = `Taille maximum : ${bigError.maximum}`;
      }
      break; }
    case 'invalid_string':
      { const stringError = error as z.ZodInvalidStringIssue;
      if (stringError.validation === 'email') {
        message = 'Format email invalide';
      } else if (stringError.validation === 'regex') {
        message = 'Format invalide';
      } else {
        message = `Format de chaîne invalide : ${stringError.validation}`;
      }
      break; }
    case 'invalid_literal':
      message = `Valeur attendue : "${(error as any).expected}"`;
      break;
    case 'unrecognized_keys':
      message = `Clés non reconnues : ${(error as any).keys?.join(', ')}`;
      break;
    case 'invalid_union':
      message = 'Aucun des formats attendus ne correspond';
      break;
    default:
      message = error.message;
  }
  
  return {
    path,
    message,
    code: error.code,
    received: 'received' in error ? error.received : undefined,
    expected,
  };
};

const translateType = (type: string): string => {
  const translations: Record<string, string> = {
    string: 'texte',
    number: 'nombre',
    boolean: 'booléen',
    object: 'objet',
    array: 'tableau',
    undefined: 'non défini',
    null: 'null',
    bigint: 'grand entier',
    symbol: 'symbole',
    function: 'fonction',
  };
  return translations[type] || type;
};

// Translate field paths to user-friendly French labels
const translatePath = (path: string): string => {
  const translations: Record<string, string> = {
    'profile': 'Profil',
    'profile.fullName': 'Profil > Nom complet',
    'profile.dateCreationEntreprise': 'Profil > Date création entreprise',
    'profile.createdAt': 'Profil > Date de création',
    'lieux': 'Cabinets',
    'journees': 'Journées',
    'virements': 'Paiements',
    'charges': 'Charges',
    'reminders': 'Rappels',
    'nom': 'Nom',
    'pourcentageRetrocession': 'Pourcentage de rétrocession',
    'couleur': 'Couleur',
    'adresse': 'Adresse',
    'telephone': 'Téléphone',
    'email': 'Email',
    'notes': 'Notes',
    'date': 'Date',
    'recettesTotales': 'Recettes totales',
    'honorairesTheoriques': 'Honoraires théoriques',
    'montantRecu': 'Montant reçu',
    'dateReception': 'Date de réception',
    'statut': 'Statut',
    'categorie': 'Catégorie',
    'description': 'Description',
    'montant': 'Montant',
    'deductible': 'Déductible',
    'title': 'Titre',
    'frequency': 'Fréquence',
    'dueDate': 'Date d\'échéance',
  };
  
  // Try to translate the full path first
  if (translations[path]) return translations[path];
  
  // Parse array indices and translate parts
  const parts = path.split('.');
  const translatedParts = parts.map((part, index) => {
    // Handle array indices like "lieux.0.nom"
    const arrayMatch = part.match(/^(\d+)$/);
    if (arrayMatch) {
      return `#${parseInt(arrayMatch[1]) + 1}`;
    }
    return translations[part] || part;
  });
  
  return translatedParts.join(' > ');
};

// Normalize ISO date strings (e.g., "2025-08-13T22:00:00.000Z") to YYYY-MM-DD format
// This handles legacy exports that use full ISO timestamps
const normalizeDate = (dateStr: string | undefined): string | undefined => {
  if (!dateStr) return undefined;
  
  // If already in YYYY-MM-DD format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Try to parse ISO date string
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr; // Return original if invalid
    }
    // Extract local date components to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return dateStr; // Return original if parsing fails
  }
};

// Normalize timestamp fields (createdAt, updatedAt) - keep as ISO but ensure valid
const normalizeTimestamp = (dateStr: string | undefined, fallback: string): string => {
  if (!dateStr) return fallback;
  
  // If it's already a valid ISO string, return as-is
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return dateStr;
    }
  } catch {
    // Fall through to return fallback
  }
  return fallback;
};

// Import data with Zod validation and detailed error reporting
export const importData = (jsonString: string): ImportResult => {
  const warnings: string[] = [];
  
  try {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch (jsonError) {
      return {
        success: false,
        errors: [{
          path: 'racine',
          message: 'Le fichier ne contient pas de JSON valide',
          code: 'invalid_json',
          received: jsonString.substring(0, 100),
        }],
      };
    }
    
    // Check if it's an object
    if (typeof parsed !== 'object' || parsed === null) {
      return {
        success: false,
        errors: [{
          path: 'racine',
          message: 'Le fichier doit contenir un objet JSON',
          code: 'invalid_type',
          expected: 'objet',
          received: typeof parsed,
        }],
      };
    }
    
    // Validate with Zod schema
    const result = StorageDataSchema.safeParse(parsed);
    
    if (!result.success) {
      const errors = result.error.errors.map(e => {
        const translatedError = translateZodError(e);
        return {
          ...translatedError,
          path: translatePath(e.path.join('.')),
        };
      });
      
      // Log for debugging
      console.error('Import validation errors:', {
        rawErrors: result.error.errors,
        translatedErrors: errors,
        receivedData: parsed,
      });
      
      return {
        success: false,
        errors,
      };
    }
    
    const validated = result.data;
    
    // Normalize data: add missing timestamps and strip unknown keys
    const now = new Date().toISOString();
    
    // Ensure profile exists with defaults
    const normalizedProfile: UserProfile = {
      fullName: validated.profile?.fullName || 'Utilisateur',
      dateCreationEntreprise: validated.profile?.dateCreationEntreprise,
      notificationsEnabled: validated.profile?.notificationsEnabled,
      createdAt: validated.profile?.createdAt || now,
      updatedAt: validated.profile?.updatedAt,
    };
    
    // Normalize lieux: add missing createdAt, convert timestamps
    const normalizedLieux: Lieu[] = validated.lieux.map(l => ({
      id: l.id,
      nom: l.nom,
      pourcentageRetrocession: l.pourcentageRetrocession,
      couleur: l.couleur,
      adresse: l.adresse,
      telephone: l.telephone,
      email: l.email,
      notes: l.notes,
      createdAt: normalizeTimestamp(l.createdAt, now),
      updatedAt: l.updatedAt ? normalizeTimestamp(l.updatedAt, now) : undefined,
    }));
    
    // Normalize journees: add missing createdAt, convert dates, strip unknown keys
    const normalizedJournees: Journee[] = validated.journees.map(j => ({
      id: j.id,
      lieuId: j.lieuId,
      date: normalizeDate(j.date) || j.date, // Convert ISO to YYYY-MM-DD
      recettesTotales: j.recettesTotales,
      honorairesTheoriques: j.honorairesTheoriques,
      notes: j.notes,
      createdAt: normalizeTimestamp(j.createdAt, now),
      updatedAt: j.updatedAt ? normalizeTimestamp(j.updatedAt, now) : undefined,
    }));
    
    // Normalize virements: add missing createdAt, convert dates
    const normalizedVirements: Virement[] = validated.virements.map(v => ({
      id: v.id,
      lieuId: v.lieuId,
      dateDebut: normalizeDate(v.dateDebut), // Convert ISO to YYYY-MM-DD
      dateFin: normalizeDate(v.dateFin), // Convert ISO to YYYY-MM-DD
      montantRecu: v.montantRecu,
      dateReception: normalizeDate(v.dateReception), // Convert ISO to YYYY-MM-DD
      statut: v.statut,
      notes: v.notes,
      createdAt: normalizeTimestamp(v.createdAt, now),
      updatedAt: v.updatedAt ? normalizeTimestamp(v.updatedAt, now) : undefined,
    }));
    
    // Normalize charges: add missing createdAt, convert dates
    const normalizedCharges: Charge[] = (validated.charges || []).map(c => ({
      id: c.id,
      categorie: c.categorie,
      description: c.description,
      montant: c.montant,
      date: normalizeDate(c.date) || c.date, // Convert ISO to YYYY-MM-DD
      deductible: c.deductible,
      notes: c.notes,
      createdAt: normalizeTimestamp(c.createdAt, now),
      updatedAt: c.updatedAt ? normalizeTimestamp(c.updatedAt, now) : undefined,
    }));
    
    // Normalize reminders: add missing createdAt, convert dates
    const normalizedReminders: Reminder[] = (validated.reminders || []).map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      frequency: r.frequency,
      dueDate: normalizeDate(r.dueDate), // Convert ISO to YYYY-MM-DD
      isSystem: r.isSystem,
      completedAt: r.completedAt ? normalizeTimestamp(r.completedAt, now) : undefined,
      completedForPeriod: r.completedForPeriod,
      notificationsEnabled: r.notificationsEnabled,
      notifyDaysBefore: r.notifyDaysBefore,
      createdAt: normalizeTimestamp(r.createdAt, now),
      updatedAt: r.updatedAt ? normalizeTimestamp(r.updatedAt, now) : undefined,
    }));
    
    // Referential integrity check: ensure lieuId references exist
    const lieuIds = new Set(normalizedLieux.map(l => l.id));
    
    for (const journee of normalizedJournees) {
      if (journee.lieuId && !lieuIds.has(journee.lieuId)) {
        warnings.push(`Journée "${journee.id}" référence un cabinet inexistant - référence supprimée`);
        journee.lieuId = undefined;
      }
    }
    
    for (const virement of normalizedVirements) {
      if (virement.lieuId && !lieuIds.has(virement.lieuId)) {
        warnings.push(`Paiement "${virement.id}" référence un cabinet inexistant - référence supprimée`);
        virement.lieuId = undefined;
      }
    }
    
    // Build final normalized data
    const normalizedData: StorageData = {
      profile: normalizedProfile,
      lieux: normalizedLieux,
      journees: normalizedJournees,
      virements: normalizedVirements,
      charges: normalizedCharges,
      reminders: normalizedReminders,
    };
    
    // Add info about legacy data migration
    if (!validated.profile) {
      warnings.push('Profil utilisateur absent - un profil par défaut a été créé');
    }
    
    saveData(normalizedData);
    
    return {
      success: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    console.error('Unexpected error importing data:', error);
    
    return {
      success: false,
      errors: [{
        path: 'racine',
        message: error instanceof Error ? error.message : 'Erreur inattendue lors de l\'import',
        code: 'unexpected_error',
      }],
    };
  }
};
