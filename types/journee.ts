// types/journee.ts
export interface Journee {
  id: string
  date: Date
  lieuId: string
  recettesTotales: number
  honorairesTheoriques: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface JourneeAvecLieu extends Journee {
  lieu: {
    nom: string
    pourcentageRetrocession: number
    couleur: string
  }
}

export interface JourneeFormData {
  date: Date
  lieuId: string
  recettesTotales: number
  notes?: string
}