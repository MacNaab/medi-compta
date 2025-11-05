// components/rapports/rapport-reel-trimestriel.tsx
import { RapportReelTrimestriel } from '@/services/rapport-reel-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react'

interface RapportReelTrimestrielProps {
  rapport: RapportReelTrimestriel
}

export function RapportReelTrimestrielView({ rapport }: RapportReelTrimestrielProps) {
  const getStatutConfig = (statut: string) => {
    switch (statut) {
      case 'recu':
        return { label: 'Reçu', color: 'text-green-600 bg-green-100 border-green-200', icon: CheckCircle2 }
      case 'attente':
        return { label: 'En attente', color: 'text-amber-600 bg-amber-100 border-amber-200', icon: Clock }
      case 'partiel':
        return { label: 'Partiel', color: 'text-blue-600 bg-blue-100 border-blue-200', icon: TrendingUp }
      case 'manquant':
        return { label: 'Manquant', color: 'text-red-600 bg-red-100 border-red-200', icon: AlertTriangle }
      default:
        return { label: 'Inconnu', color: 'text-gray-600 bg-gray-100 border-gray-200', icon: AlertTriangle }
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Rapport Réel {rapport.annee} T{rapport.trimestre}
              </h1>
              <p className="text-slate-600 mt-1">
                Virements effectivement reçus - {rapport.dateDebut.toLocaleDateString('fr-FR')} au {rapport.dateFin.toLocaleDateString('fr-FR')}
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800 text-lg px-4 py-2">
                {rapport.totalVirements.toFixed(2)} €
              </Badge>
              <div className="text-sm text-slate-600">
                {rapport.nombreVirements} virement{rapport.nombreVirements > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Virements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {rapport.totalVirements.toFixed(2)} €
            </div>
            <div className="text-sm text-slate-600 mt-1">Montants effectivement reçus</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {rapport.virementsEnAttente}
            </div>
            <div className="text-sm text-slate-600 mt-1">Virements non reçus</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Partiels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {rapport.virementsPartiels}
            </div>
            <div className="text-sm text-slate-600 mt-1">Virements incomplets</div>
          </CardContent>
        </Card>
      </div>

      {/* Détail par lieu */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par lieu</CardTitle>
          <CardDescription>
            Virements reçus pour chaque cabinet avec leur statut
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {rapport.donneesParLieu.map((donnees) => {
              const statutConfig = getStatutConfig(donnees.statutMoyen)
              const StatutIcon = statutConfig.icon

              return (
                <div key={donnees.lieuId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: donnees.couleurLieu }}
                      />
                      <h3 className="font-semibold text-slate-800">{donnees.nomLieu}</h3>
                      <Badge className={statutConfig.color}>
                        <StatutIcon className="h-3 w-3 mr-1" />
                        {statutConfig.label}
                      </Badge>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {donnees.totalVirements.toFixed(2)} €
                      </div>
                      <div className="text-sm text-slate-600">
                        {donnees.nombreVirements} virement{donnees.nombreVirements > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Moyenne par virement :</span>
                        <span className="font-medium">
                          {(donnees.totalVirements / donnees.nombreVirements).toFixed(2)} €
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Statut dominant :</span>
                        <span className="font-medium">{statutConfig.label}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded p-2">
                      <div className="text-xs text-slate-600 mb-1">Performance</div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-500 bg-green-500"
                          style={{ 
                            width: `${Math.min(100, (donnees.totalVirements / rapport.totalVirements) * 100)}%`
                          }}
                        />
                      </div>
                      <div className="text-xs text-slate-600 mt-1 text-right">
                        {((donnees.totalVirements / rapport.totalVirements) * 100).toFixed(1)}% du total
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Alertes pour les virements en attente/partiels */}
      {(rapport.virementsEnAttente > 0 || rapport.virementsPartiels > 0) && (
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Points d&apos;attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-amber-800 text-sm">
              {rapport.virementsEnAttente > 0 && (
                <p>• <strong>{rapport.virementsEnAttente} virement(s) en attente</strong> de réception</p>
              )}
              {rapport.virementsPartiels > 0 && (
                <p>• <strong>{rapport.virementsPartiels} virement(s) partiel(s)</strong> nécessitent un complément</p>
              )}
              <p className="text-xs mt-2">
                💡 Ces situations peuvent impacter votre trésorerie. Pensez à relancer les cabinets concernés.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}