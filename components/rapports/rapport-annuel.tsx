// components/rapports/rapport-annuel.tsx
import { RapportAnnuel } from '@/types/rapport'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Euro, Calendar, TrendingUp, BarChart3 } from 'lucide-react'

interface RapportAnnuelProps {
  rapport: RapportAnnuel
}

export function RapportAnnuelView({ rapport }: RapportAnnuelProps) {
  // Calculer les moyennes
  const moyenneMensuelleHonoraires = rapport.totalHonoraires / 12
  const moyenneParJour = rapport.totalJours > 0 ? rapport.totalHonoraires / rapport.totalJours : 0

  return (
    <div className="space-y-6">
      {/* En-tête du rapport */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Rapport Annuel {rapport.annee}
              </h1>
              <p className="text-slate-600 mt-1">
                Synthèse complète de votre activité sur l&apos;année {rapport.annee}
              </p>
            </div>
            
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-lg px-4 py-2">
              {rapport.totalJours} jour{rapport.totalJours > 1 ? 's' : ''} travaillé{rapport.totalJours > 1 ? 's' : ''}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Recettes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {rapport.totalRecettes.toFixed(2)} €
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Euro className="h-4 w-4" />
              Total Honoraires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {rapport.totalHonoraires.toFixed(2)} €
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Jours travaillés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {rapport.totalJours}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Moyenne/jour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {moyenneParJour.toFixed(2)} €
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vue par trimestre */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Analyse par trimestre
          </CardTitle>
          <CardDescription>
            Évolution de votre activité au cours de l&apos;année
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {rapport.trimestres.map((trimestre) => (
              <div key={trimestre.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {trimestre.annee} - T{trimestre.trimestre}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {trimestre.dateDebut.toLocaleDateString('fr-FR', { month: 'short' })} - {trimestre.dateFin.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {trimestre.totalHonoraires.toFixed(2)} €
                    </div>
                    <div className="text-sm text-slate-600">
                      {trimestre.nombreJours} jour{trimestre.nombreJours > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Recettes :</span>
                      <span className="font-medium">{trimestre.totalRecettes.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Honoraires :</span>
                      <span className="font-medium text-green-600">{trimestre.totalHonoraires.toFixed(2)} €</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Lieux :</span>
                      <span className="font-medium">{trimestre.donneesParLieu.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Moyenne/jour :</span>
                      <span className="font-medium">
                        {(trimestre.totalHonoraires / trimestre.nombreJours).toFixed(2)} €
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded p-2">
                    <div className="text-xs text-slate-600 mb-1">Part de l&apos;année</div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                        style={{ 
                          width: `${(trimestre.totalHonoraires / rapport.totalHonoraires) * 100}%`
                        }}
                      />
                    </div>
                    <div className="text-xs text-slate-600 mt-1 text-right">
                      {((trimestre.totalHonoraires / rapport.totalHonoraires) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statistiques avancées */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Performance mensuelle moyenne */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">
              Performance mensuelle moyenne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {moyenneMensuelleHonoraires.toFixed(2)} €
            </div>
            <p className="text-sm text-slate-600 mt-2">
              Honoraires moyens par mois sur {rapport.annee}
            </p>
          </CardContent>
        </Card>

        {/* Taux d'activité */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">
              Taux d&apos;activité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {((rapport.totalJours / 365) * 100).toFixed(1)}%
            </div>
            <p className="text-sm text-slate-600 mt-2">
              {rapport.totalJours} jours sur 365
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Notes pour la déclaration fiscale */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center gap-2">
            📊 Synthèse Annuelle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-green-800 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Chiffre d&apos;affaires annuel :</strong> {rapport.totalRecettes.toFixed(2)} €</p>
                <p><strong>Honoraires perçus :</strong> {rapport.totalHonoraires.toFixed(2)} €</p>
              </div>
              <div>
                <p><strong>Jours d&apos;activité :</strong> {rapport.totalJours}</p>
                <p><strong>Moyenne quotidienne :</strong> {moyenneParJour.toFixed(2)} €</p>
              </div>
            </div>
            <p className="text-xs mt-3 border-t border-green-200 pt-3">
              💡 Ces données vous serviront pour votre déclaration de revenus et votre comptabilité annuelle.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}