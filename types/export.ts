// types/export.ts
import { Lieu, LieuFormData } from "./lieu";
import { Journee } from "./journee";
import { Virement } from "./virement";

export interface DonneesExport {
  version: string;
  dateExport: string;
  lieux: Lieu[];
  journees: Journee[];
  virements: Virement[];
}

export interface DonneesImport {
  lieux: LieuFormData[];
  journees: Omit<Journee, "id" | "createdAt" | "updatedAt">[];
  virements: Omit<Virement, "id" | "createdAt" | "updatedAt">[];
}
