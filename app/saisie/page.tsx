// app/saisie/page.tsx
import { SaisieManager } from '@/components/saisie/saisie-manager'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Saisie Quotidienne - Suivi Honoraires',
  description: 'Saisissez vos revenus journaliers et calculez vos honoraires',
}

export default function SaisiePage() {
  return <SaisieManager />
}