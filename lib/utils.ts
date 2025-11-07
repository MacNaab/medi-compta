import { Acte } from "@/types/acte";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Actes par défaut
export const ACTES_PAR_DEFAUT: Omit<Acte, "id">[] = [
  {
    code: "G",
    libelle: "Consultation",
    montantTotal: 30,
    montantPatient: 30,
    modePaiementParDefaut: "carte",
    couleur: "#3b82f6",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    code: "G",
    libelle: "Consultation + 1/3 payant",
    montantTotal: 30,
    montantPatient: 9,
    modePaiementParDefaut: "carte",
    couleur: "#8b5cf6",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    code: "G+MEG",
    libelle: "Consultation + Majoration enfant généraliste",
    montantTotal: 35,
    montantPatient: 35,
    modePaiementParDefaut: "carte",
    couleur: "#ef4444",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    code: "COD",
    libelle: "Consultation obligatoire du nourrisson",
    montantTotal: 35,
    montantPatient: 0,
    modePaiementParDefaut: "100%",
    couleur: "#10b981",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    code: "COB",
    libelle: "Consultation obligatoire de l'enfant",
    montantTotal: 30,
    montantPatient: 0,
    modePaiementParDefaut: "100%",
    couleur: "#13f07e",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    code: "CCP",
    libelle: "1re consultation contraception avant 26 ans",
    montantTotal: 47.5,
    montantPatient: 0,
    modePaiementParDefaut: "100%",
    couleur: "#df0056",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    code: "G+DEQP003",
    libelle: "ECG",
    montantTotal: 44.52,
    montantPatient: 44.52,
    modePaiementParDefaut: "carte",
    couleur: "#ce6944",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    code: "MPH",
    libelle: "Premier remplissage du dossier MDPH",
    montantTotal: 60,
    montantPatient: 60,
    modePaiementParDefaut: "carte",
    couleur: "#ad85ad",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];