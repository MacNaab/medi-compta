// types/lieu.ts
export interface Lieu {
  id: string;
  nom: string;
  pourcentageRetrocession: number;
  couleur: string; // Nouveau champ
  adresse?: string;
  telephone?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type LieuFormData = Omit<Lieu, "id" | "createdAt" | "updatedAt">;
