// app/rapports/page.tsx
import { RapportsManager } from '@/components/rapports/rapports-manager'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Rapports URSSAF - Suivi Honoraires',
  description: 'Générez vos déclarations trimestrielles URSSAF et rapports annuels',
}

export default function RapportsPage() {
  return <RapportsManager />
}