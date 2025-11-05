// types/virement.ts
export interface Virement {
  id: string
  lieuId: string
  dateDebut: Date
  dateFin: Date
  montantRecu: number
  dateReception: Date
  statut: 'recu' | 'attente' | 'partiel' | 'manquant'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface VirementAvecLieu extends Virement {
  lieu: {
    nom: string
    couleur: string
  }
  montantTheorique: number
  difference: number
}

export interface VirementFormData {
  lieuId: string
  dateDebut: Date
  dateFin: Date
  montantRecu: number
  dateReception: Date
  statut: Virement['statut']
  notes?: string
}