// types/acte.ts
export interface Acte {
  id: string
  code: string
  libelle: string
  montantTotal: number
  montantPatient: number
  modePaiementParDefaut: 'carte' | 'cheque' | 'especes' | "100%"
  couleur?: string
  createdAt: Date
  updatedAt: Date
}

export interface ActeFormData {
  code: string
  libelle: string
  montantTotal: number
  montantPatient: number
  modePaiementParDefaut: Acte['modePaiementParDefaut']
  couleur?: string
}