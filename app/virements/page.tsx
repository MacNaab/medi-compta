// app/virements/page.tsx
import { VirementsManager } from '@/components/virements/virements-manager'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Virements - Suivi Honoraires',
  description: 'Suivez vos virements réels et comparez avec les honoraires théoriques',
}

export default function VirementsPage() {
  return <VirementsManager />
}