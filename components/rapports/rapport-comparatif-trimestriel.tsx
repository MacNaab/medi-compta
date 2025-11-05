// components/rapports/rapport-comparatif-trimestriel.tsx
import { RapportComparatifTrimestriel } from '@/services/rapport-comparatif-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

interface RapportComparatifTrimestrielProps {
  rapport: RapportComparatifTrimestriel
}

export function RapportComparatifTrimestrielView({ rapport }: RapportComparatifTrimestrielProps) {
  const getStatutConfig = (statut: string) => {
    switch (statut) {
      case 'conforme':
        return { label: 'Conforme', color: 'text-green-600 bg-green-100 border-green-200', icon: CheckCircle2 }
      case 'surplus':
        return { label: 'Surplus', color: 'text-blue-600 bg-blue-100 border-blue-200', icon: TrendingUp }
      case 'deficit':
        return { label: 'Déficit', color: 'text-amber-600 bg-amber-100 border-amber-200', icon: AlertTriangle }
      case 'manquant':
        return { label: 'Manquant', color: 'text-red-600 bg-red-100 border-red-200', icon: XCircle }
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
                Rapport Comparatif {rapport.annee} T{rapport.trimestre}
              </h1>
              <p className="text-slate-600 mt-1">
                Comparaison théorie vs réalité - {rapport.dateDebut.toLocaleDateString('fr-FR')} au {rapport.dateFin.toLocaleDateString('fr-FR')}
              </p>
            </div>
            
            <Badge variant="secondary" className={`
              text-lg px-4 py-2
              ${rapport.difference === 0 ? 'bg-green-100 text-green-800' :
                rapport.difference > 0 ? 'bg-blue-100 text-blue-800' :
                'bg-amber-100 text-amber-800'
              }
            `}>
              {rapport.difference > 0 ? '+' : ''}{rapport.difference.toFixed(2)} €
              {rapport.pourcentageDifference !== 0 && (
                <span className="ml-2">
                  ({rapport.pourcentageDifference > 0 ? '+' : ''}{rapport.pourcentageDifference.toFixed(1)}%)
                </span>
              )}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">
              Honoraires Théoriques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {rapport.totalTheorique.toFixed(2)} €
            </div>
            <div className="text-sm text-slate-600 mt-1">Calculés sur les journées travaillées</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">
              Virements Réels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {rapport.totalReel.toFixed(2)} €
            </div>
            <div className="text-sm text-slate-600 mt-1">Montants effectivement reçus</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">
              Écart
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              rapport.difference === 0 ? 'text-slate-600' :
              rapport.difference > 0 ? 'text-green-600' : 'text-amber-600'
            }`}>
              {rapport.difference > 0 ? '+' : ''}{rapport.difference.toFixed(2)} €
            </div>
            <div className="text-sm text-slate-600 mt-1">
              {rapport.difference === 0 ? 'Parfaitement conforme' :
               rapport.difference > 0 ? 'Surplus' : 'Déficit à investiguer'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Détail par lieu */}
      <Card>
        <CardHeader>
          <CardTitle>Analyse détaillée par lieu</CardTitle>
          <CardDescription>
            Comparaison pour chaque cabinet entre les honoraires théoriques et les virements réels
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {rapport.donneesParLieu.map((donnees) => {
              const statutConfig = getStatutConfig(donnees.statut)
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
                    
                    <div className={`text-sm font-semibold ${
                      donnees.difference === 0 ? 'text-slate-600' :
                      donnees.difference > 0 ? 'text-green-600' : 'text-amber-600'
                    }`}>
                      {donnees.difference > 0 ? '+' : ''}{donnees.difference.toFixed(2)} €
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Théorique :</span>
                        <span className="font-medium">{donnees.theorique.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Reçu :</span>
                        <span className="font-medium text-green-600">{donnees.reel.toFixed(2)} €</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Écart :</span>
                        <span className={`font-medium ${
                          donnees.difference === 0 ? 'text-slate-600' :
                          donnees.difference > 0 ? 'text-green-600' : 'text-amber-600'
                        }`}>
                          {donnees.difference > 0 ? '+' : ''}{donnees.difference.toFixed(2)} €
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Pourcentage :</span>
                        <span className={`font-medium ${
                          donnees.pourcentageDifference === 0 ? 'text-slate-600' :
                          donnees.pourcentageDifference > 0 ? 'text-green-600' : 'text-amber-600'
                        }`}>
                          {donnees.pourcentageDifference > 0 ? '+' : ''}{donnees.pourcentageDifference.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded p-2">
                      <div className="text-xs text-slate-600 mb-1">Progression</div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${Math.min(100, (donnees.reel / Math.max(donnees.theorique, donnees.reel)) * 100)}%`,
                            backgroundColor: donnees.difference >= 0 ? '#10b981' : '#f59e0b'
                          }}
                        />
                      </div>
                      <div className="text-xs text-slate-600 mt-1 text-right">
                        {donnees.theorique > 0 ? ((donnees.reel / donnees.theorique) * 100).toFixed(1) : '0'}%
                      </div>
                    </div>
                  </div>

                  {/* Message d'alerte pour les cas problématiques */}
                  {donnees.statut === 'manquant' && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                      ⚠️ Aucun virement enregistré pour ce lieu sur cette période malgré {donnees.theorique.toFixed(2)} € d&apos;honoraires théoriques.
                    </div>
                  )}
                  {donnees.statut === 'deficit' && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                      ⚠️ Déficit significatif détecté. Vérifier si un virement est manquant ou en attente.
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommandations */}
      {(rapport.difference < 0 || rapport.donneesParLieu.some(d => d.statut === 'manquant' || d.statut === 'deficit')) && (
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Actions recommandées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-amber-800 text-sm">
              {rapport.donneesParLieu
                .filter(d => d.statut === 'manquant')
                .map(donnees => (
                  <p key={donnees.lieuId}>
                    • <strong>{donnees.nomLieu}</strong> : Aucun virement pour {donnees.theorique.toFixed(2)} € d&apos;honoraires théoriques
                  </p>
                ))
              }
              {rapport.donneesParLieu
                .filter(d => d.statut === 'deficit')
                .map(donnees => (
                  <p key={donnees.lieuId}>
                    • <strong>{donnees.nomLieu}</strong> : Déficit de {Math.abs(donnees.difference).toFixed(2)} € à investiguer
                  </p>
                ))
              }
              {rapport.difference < -100 && (
                <p>• <strong>Écart global</strong> : Déficit total de {Math.abs(rapport.difference).toFixed(2)} € nécessite une investigation</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}