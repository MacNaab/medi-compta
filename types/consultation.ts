// types/consultation.ts
export interface Consultation {
  id: string
  date: Date
  heure: string // Format "HH:MM"
  nomPatient: string
  motif: string
  acteCode: string
  modePaiement: 'carte' | 'cheque' | 'especes' | '100%'
  montantPatient: number
  montantTotal: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface ConsultationFormData {
  date: Date
  heure: string
  nomPatient: string
  motif: string
  acteCode: string
  modePaiement: Consultation['modePaiement']
  montantPatient: number
  montantTotal: number
  notes?: string
}

export interface ResumeJournee {
  date: Date
  totalCarte: number
  totalCheque: number
  totalEspeces: number
  totalPrisEnCharge: number
  totalGeneral: number
  nombreConsultations: number
}