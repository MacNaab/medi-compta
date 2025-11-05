// app/sauvegarde/page.tsx
import { ExportImportManager } from '@/components/export-import/export-import-manager'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sauvegarde - Suivi Honoraires',
  description: 'Exportez et importez vos données de suivi d\'honoraires',
}

export default function SauvegardePage() {
  return <ExportImportManager />
}