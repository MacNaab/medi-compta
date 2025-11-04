// components/rapports/rapport-selector.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, Download, Calendar, BarChart3 } from 'lucide-react'

interface RapportSelectorProps {
  anneesDisponibles: number[]
  onRapportSelect: (annee: number, trimestre?: number) => void
  onExport: (annee: number, trimestre?: number) => void
}

export function RapportSelector({ 
  anneesDisponibles, 
  onRapportSelect, 
  onExport 
}: RapportSelectorProps) {
  const [selectedAnnee, setSelectedAnnee] = useState<number>(anneesDisponibles[0])
  const [selectedType, setSelectedType] = useState<'annuel' | 'trimestriel'>('annuel')
  const [selectedTrimestre, setSelectedTrimestre] = useState<number>(1)

  const trimestres = [
    { numero: 1, nom: 'T1 - Janvier à Mars' },
    { numero: 2, nom: 'T2 - Avril à Juin' },
    { numero: 3, nom: 'T3 - Juillet à Septembre' },
    { numero: 4, nom: 'T4 - Octobre à Décembre' }
  ]

  const handleGenererRapport = () => {
    if (selectedType === 'annuel') {
      onRapportSelect(selectedAnnee)
    } else {
      onRapportSelect(selectedAnnee, selectedTrimestre)
    }
  }

  const handleExport = () => {
    if (selectedType === 'annuel') {
      onExport(selectedAnnee)
    } else {
      onExport(selectedAnnee, selectedTrimestre)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Génération de rapports
        </CardTitle>
        <CardDescription>
          Générez vos rapports URSSAF trimestriels et annuels
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Sélection du type de rapport */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Type de rapport</label>
            <Select value={selectedType} onValueChange={(value: 'annuel' | 'trimestriel') => setSelectedType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annuel">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Rapport annuel
                  </div>
                </SelectItem>
                <SelectItem value="trimestriel">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Rapport trimestriel
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sélection de l'année */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Année</label>
            <Select value={selectedAnnee.toString()} onValueChange={(value) => setSelectedAnnee(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {anneesDisponibles.map(annee => (
                  <SelectItem key={annee} value={annee.toString()}>
                    {annee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sélection du trimestre (uniquement pour rapport trimestriel) */}
        {selectedType === 'trimestriel' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Trimestre</label>
            <Select value={selectedTrimestre.toString()} onValueChange={(value) => setSelectedTrimestre(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {trimestres.map(trimestre => (
                  <SelectItem key={trimestre.numero} value={trimestre.numero.toString()}>
                    {trimestre.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button onClick={handleGenererRapport} className="flex-1">
            <FileText className="h-4 w-4 mr-2" />
            Générer le rapport
          </Button>
          
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}