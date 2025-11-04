// types/rapport.ts
export interface RapportTrimestriel {
  id: string
  annee: number
  trimestre: 1 | 2 | 3 | 4
  dateDebut: Date
  dateFin: Date
  totalRecettes: number
  totalHonoraires: number
  nombreJours: number
  donneesParLieu: DonneesLieu[]
  createdAt: Date
}

export interface DonneesLieu {
  lieuId: string
  nomLieu: string
  couleurLieu: string
  pourcentageRetrocession: number
  totalRecettes: number
  totalHonoraires: number
  nombreJours: number
}

export interface RapportAnnuel {
  annee: number
  trimestres: RapportTrimestriel[]
  totalRecettes: number
  totalHonoraires: number
  totalJours: number
}