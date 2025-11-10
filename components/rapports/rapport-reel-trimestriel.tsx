// components/rapports/rapport-reel-trimestriel.tsx
import { RapportReelTrimestriel } from '@/services/rapport-reel-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, AlertTriangle, CheckCircle2, TrendingUp, Euro, Calendar } from 'lucide-react'

interface RapportReelTrimestrielProps {
  rapport: RapportReelTrimestriel
}

export function RapportReelTrimestrielView({ rapport }: RapportReelTrimestrielProps) {
  // Calculs des statuts pour ce trimestre
  const virementsComplets = rapport.donneesParLieu.reduce(
    (sum, lieu) => sum + (lieu.virementsComplets || 0), 0
  );
  
  const virementsPartiels = rapport.donneesParLieu.reduce(
    (sum, lieu) => sum + (lieu.virementsPartiels || 0), 0
  );

  const deficitTotal = rapport.donneesParLieu.reduce(
    (sum, lieu) => sum + (lieu.totalVirementsManquants || 0), 0
  );

  // Taux de complétion pour le trimestre
  const totalTheoriqueTrimestre = rapport.donneesParLieu.reduce(
    (sum, lieu) => sum + lieu.totalVirementsTheoriques, 0
  );
  const tauxCompletion = totalTheoriqueTrimestre > 0 
    ? (rapport.totalVirements / totalTheoriqueTrimestre) * 100 
    : 0;

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
      {/* En-tête amélioré */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Rapport Réel {rapport.annee} T{rapport.trimestre}
              </h1>
              <p className="text-slate-600 mt-1">
                {rapport.dateDebut.toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'long',
                  year: 'numeric'
                })} au {rapport.dateFin.toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <Badge 
                variant="secondary" 
                className={`text-lg px-4 py-2 border ${
                  tauxCompletion >= 95
                    ? "bg-green-100 text-green-800 border-green-200"
                    : tauxCompletion >= 80
                    ? "bg-amber-100 text-amber-800 border-amber-200"
                    : "bg-red-100 text-red-800 border-red-200"
                }`}
              >
                Taux : {tauxCompletion.toFixed(1)}%
              </Badge>
              <div className="text-sm text-slate-600">
                {rapport.nombreVirements} virement{rapport.nombreVirements > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques principales améliorées */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Euro className="h-4 w-4" />
              Total Trimestre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {rapport.totalVirements.toFixed(2)} €
            </div>
            <div className="text-sm text-slate-600 mt-1">
              {(rapport.totalVirements / 3).toFixed(2)} €/mois
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Virements complets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {virementsComplets}
            </div>
            <div className="text-sm text-slate-600 mt-1">Différence ≥ 0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Virements partiels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {virementsPartiels}
            </div>
            <div className="text-sm text-slate-600 mt-1">Différence &lt; 0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Déficit total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {deficitTotal.toFixed(2)} €
            </div>
            <div className="text-sm text-slate-600 mt-1">Montants manquants</div>
          </CardContent>
        </Card>
      </div>

      {/* Section Analyse et Recommandations pour le trimestre */}
      {(virementsPartiels > 0 || rapport.virementsEnAttente > 0) && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Analyse du Trimestre T{rapport.trimestre}
            </CardTitle>
            <CardDescription className="text-blue-700">
              Situation détaillée et actions recommandées
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-6">
              {/* Virements partiels détaillés */}
              {virementsPartiels > 0 && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {virementsPartiels} Virement(s) Partiel(s) ce trimestre
                  </h4>
                  
                  <div className="space-y-3 mb-3">
                    {rapport.donneesParLieu
                      .filter(lieu => lieu.virementsPartiels > 0)
                      .map(lieu => (
                        <div key={lieu.lieuId} 
                             className="flex items-center justify-between p-3 bg-white rounded border border-amber-200">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: lieu.couleurLieu }}
                            />
                            <div>
                              <div className="font-medium text-slate-800">{lieu.nomLieu}</div>
                              <div className="text-xs text-slate-600">
                                {lieu.virementsPartiels} virement(s) partiel(s)
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-amber-700">
                              -{(lieu.totalVirementsManquants || 0).toFixed(2)} €
                            </div>
                            <div className="text-xs text-slate-600">manquant</div>
                          </div>
                        </div>
                      ))
                    }
                  </div>

                  <div className="p-3 bg-amber-100 rounded border border-amber-300">
                    <p className="text-sm text-amber-800 font-semibold mb-2">
                      💡 Actions Immédiates pour T{rapport.trimestre} :
                    </p>
                    <ul className="text-xs text-amber-700 space-y-1">
                      <li>• Relance des cabinets avec déficit supérieur à 200€</li>
                      <li>• Vérification des justificatifs sous 48h</li>
                      <li>• Mise à jour des virements dans le système après régularisation</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Performance du trimestre */}
              <div className="p-4 bg-slate-100 rounded-lg border border-slate-300">
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  📊 Performance Trimestrielle
                </h4>
                
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-2xl font-bold text-green-600">{virementsComplets}</div>
                    <div className="text-xs text-slate-600">Complets</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-2xl font-bold text-amber-600">{virementsPartiels}</div>
                    <div className="text-xs text-slate-600">Partiels</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-2xl font-bold text-blue-600">{rapport.donneesParLieu.length}</div>
                    <div className="text-xs text-slate-600">Lieux actifs</div>
                  </div>
                </div>

                <div className={`p-2 rounded text-center text-sm font-semibold ${
                  tauxCompletion >= 95 
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : tauxCompletion >= 80
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {tauxCompletion >= 95 
                    ? '✅ Excellent trimestre - Taux optimal'
                    : tauxCompletion >= 80
                    ? '⚠️ Bon trimestre - Quelques points de vigilance'
                    : '❌ Trimestre difficile - Actions correctives nécessaires'
                  }
                </div>
              </div>

              {/* Conseil trésorerie */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  💰 Impact Trésorerie
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-600">Reçu ce trimestre</div>
                    <div className="font-bold text-green-700">{rapport.totalVirements.toFixed(2)} €</div>
                  </div>
                  <div>
                    <div className="text-slate-600">Déficit à combler</div>
                    <div className="font-bold text-red-700">{deficitTotal.toFixed(2)} €</div>
                  </div>
                </div>
                {deficitTotal > 0 && (
                  <div className="mt-3 p-2 bg-amber-100 rounded border border-amber-300">
                    <p className="text-xs text-amber-800 text-center">
                      <strong>Attention :</strong> Ce déficit impacte directement votre trésorerie du trimestre
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Détail par lieu amélioré */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Analyse par Cabinet - T{rapport.trimestre}
          </CardTitle>
          <CardDescription>
            Performance détaillée de chaque cabinet avec statuts automatiques
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {rapport.donneesParLieu.map((donnees) => {
              const statutConfig = getStatutConfig(donnees.statutMoyen)
              const StatutIcon = statutConfig.icon

              // Calculs pour ce lieu
              const tauxCompletionLieu = donnees.totalVirementsTheoriques > 0
                ? (donnees.totalVirements / donnees.totalVirementsTheoriques) * 100
                : 0;

              return (
                <div key={donnees.lieuId} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: donnees.couleurLieu }}
                      />
                      <div>
                        <h3 className="font-semibold text-slate-800">{donnees.nomLieu}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={statutConfig.color}>
                            <StatutIcon className="h-3 w-3 mr-1" />
                            {statutConfig.label}
                          </Badge>
                          <span className={`text-xs font-medium ${
                            tauxCompletionLieu >= 95 ? 'text-green-600' :
                            tauxCompletionLieu >= 80 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {tauxCompletionLieu.toFixed(1)}% complété
                          </span>
                        </div>
                      </div>
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Virements complets :</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {donnees.virementsComplets || 0}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Virements partiels :</span>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700">
                          {donnees.virementsPartiels || 0}
                        </Badge>
                      </div>
                      {donnees.totalVirementsManquants > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Déficit :</span>
                          <span className="font-bold text-red-600">
                            -{donnees.totalVirementsManquants.toFixed(2)} €
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Moyenne/virement :</span>
                        <span className="font-medium">
                          {(donnees.totalVirements / donnees.nombreVirements).toFixed(2)} €
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Taux de fiabilité :</span>
                        <span className="font-medium">{tauxCompletionLieu.toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded p-2">
                      <div className="text-xs text-slate-600 mb-1">Part du trimestre</div>
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

                  {/* Conseil spécifique au lieu */}
                  {donnees.virementsPartiels > 0 && (
                    <div className="mt-3 p-2 bg-amber-100 rounded border border-amber-200">
                      <p className="text-xs text-amber-800">
                        💡 <strong>Action recommandée :</strong> Relance du cabinet pour régularisation du déficit de {(donnees.totalVirementsManquants || 0).toFixed(2)} €
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Bilan du trimestre */}
      <Card className={
        tauxCompletion >= 95
          ? "bg-green-50 border-green-200"
          : tauxCompletion >= 80
          ? "bg-amber-50 border-amber-200"
          : "bg-red-50 border-red-200"
      }>
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className={`text-lg font-semibold ${
              tauxCompletion >= 95
                ? "text-green-800"
                : tauxCompletion >= 80
                ? "text-amber-800"
                : "text-red-800"
            }`}>
              Bilan du Trimestre T{rapport.trimestre} {rapport.annee}
            </h3>
            <p className={`mt-4 ${
              tauxCompletion >= 95
                ? "text-green-700"
                : tauxCompletion >= 80
                ? "text-amber-700"
                : "text-red-700"
            }`}>
              {tauxCompletion >= 95
                ? "✅ Excellent trimestre ! Tous les indicateurs sont au vert avec une trésorerie saine."
                : tauxCompletion >= 80
                ? "⚠️ Bon trimestre globalement. Quelques points de vigilance à surveiller pour le prochain trimestre."
                : "❌ Trimestre difficile nécessitant une attention particulière sur le suivi des paiements et relances."}
            </p>
            <div className="mt-3 text-sm text-slate-600">
              Rapport généré le {new Date().toLocaleDateString("fr-FR")}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}