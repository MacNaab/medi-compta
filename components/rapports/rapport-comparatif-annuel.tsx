// components/rapports/rapport-comparatif-annuel.tsx
import { RapportComparatifAnnuel } from "@/services/rapport-comparatif-service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Euro,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Calendar,
} from "lucide-react";

interface RapportComparatifAnnuelProps {
  rapport: RapportComparatifAnnuel;
}

export function RapportComparatifAnnuelView({
  rapport,
}: RapportComparatifAnnuelProps) {
  // Calculer les statistiques avancées
  const moyenneMensuelleTheorique = rapport.totalTheorique / 12;
  const moyenneMensuelleReelle = rapport.totalReel / 12;
  const tauxRealisation =
    rapport.totalTheorique > 0
      ? (rapport.totalReel / rapport.totalTheorique) * 100
      : 0;

  // Trouver le meilleur et pire trimestre
  const trimestrePerformance = rapport.trimestres
    .map((t) => ({
      trimestre: t.trimestre,
      taux: t.totalTheorique > 0 ? (t.totalReel / t.totalTheorique) * 100 : 0,
      difference: t.difference,
    }))
    .sort((a, b) => b.taux - a.taux);

  const meilleurTrimestre = trimestrePerformance[0];
  const pireTrimestre = trimestrePerformance[trimestrePerformance.length - 1];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Rapport Comparatif Annuel {rapport.annee}
              </h1>
              <p className="text-slate-600 mt-1">
                Analyse complète théorie vs réalité sur l&apos;année{" "}
                {rapport.annee}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Badge
                variant="secondary"
                className={`
                text-lg px-4 py-2
                ${
                  rapport.difference === 0
                    ? "bg-green-100 text-green-800"
                    : rapport.difference > 0
                    ? "bg-blue-100 text-blue-800"
                    : "bg-amber-100 text-amber-800"
                }
              `}
              >
                Écart annuel : {rapport.difference > 0 ? "+" : ""}
                {rapport.difference.toFixed(2)} €
              </Badge>
              <div className="text-sm text-slate-600">
                Taux de réalisation :{" "}
                <strong>{tauxRealisation.toFixed(1)}%</strong>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Théorique Annuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {rapport.totalTheorique.toFixed(2)} €
            </div>
            <div className="text-sm text-slate-600 mt-1">
              {moyenneMensuelleTheorique.toFixed(2)} €/mois
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Euro className="h-4 w-4" />
              Réel Annuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {rapport.totalReel.toFixed(2)} €
            </div>
            <div className="text-sm text-slate-600 mt-1">
              {moyenneMensuelleReelle.toFixed(2)} €/mois
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Écart Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                rapport.difference === 0
                  ? "text-slate-600"
                  : rapport.difference > 0
                  ? "text-green-600"
                  : "text-amber-600"
              }`}
            >
              {rapport.difference > 0 ? "+" : ""}
              {rapport.difference.toFixed(2)} €
            </div>
            <div className="text-sm text-slate-600 mt-1">
              {rapport.pourcentageDifference > 0 ? "+" : ""}
              {rapport.pourcentageDifference.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Réalisation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                tauxRealisation >= 95
                  ? "text-green-600"
                  : tauxRealisation >= 80
                  ? "text-amber-600"
                  : "text-red-600"
              }`}
            >
              {tauxRealisation.toFixed(1)}%
            </div>
            <div className="text-sm text-slate-600 mt-1">
              {tauxRealisation >= 95
                ? "Excellent"
                : tauxRealisation >= 80
                ? "Correct"
                : "À améliorer"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analyse par trimestre */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Performance par trimestre
          </CardTitle>
          <CardDescription>
            Évolution de la correspondance théorie/réalité au cours de
            l&apos;année
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {rapport.trimestres.map((trimestre) => {
              const tauxTrimestre =
                trimestre.totalTheorique > 0
                  ? (trimestre.totalReel / trimestre.totalTheorique) * 100
                  : 0;

              return (
                <div
                  key={trimestre.trimestre}
                  className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-800 text-lg">
                        {rapport.annee} - T{trimestre.trimestre}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {trimestre.dateDebut.toLocaleDateString("fr-FR", {
                          month: "short",
                        })}{" "}
                        -{" "}
                        {trimestre.dateFin.toLocaleDateString("fr-FR", {
                          month: "short",
                        })}
                      </p>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${
                          tauxTrimestre >= 95
                            ? "text-green-600"
                            : tauxTrimestre >= 80
                            ? "text-amber-600"
                            : "text-red-600"
                        }`}
                      >
                        {tauxTrimestre.toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-600">
                        {trimestre.difference > 0 ? "+" : ""}
                        {trimestre.difference.toFixed(2)} €
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Théorique :</span>
                        <span className="font-medium">
                          {trimestre.totalTheorique.toFixed(2)} €
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Reçu :</span>
                        <span className="font-medium text-green-600">
                          {trimestre.totalReel.toFixed(2)} €
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Écart :</span>
                        <span
                          className={`font-medium ${
                            trimestre.difference === 0
                              ? "text-slate-600"
                              : trimestre.difference > 0
                              ? "text-green-600"
                              : "text-amber-600"
                          }`}
                        >
                          {trimestre.difference > 0 ? "+" : ""}
                          {trimestre.difference.toFixed(2)} €
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Lieux :</span>
                        <span className="font-medium">
                          {trimestre.donneesParLieu.length}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded p-2">
                      <div className="text-xs text-slate-600 mb-1">
                        Progression
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, tauxTrimestre)}%`,
                            backgroundColor:
                              tauxTrimestre >= 95
                                ? "#10b981"
                                : tauxTrimestre >= 80
                                ? "#f59e0b"
                                : "#ef4444",
                          }}
                        />
                      </div>
                      <div className="text-xs text-slate-600 mt-1 text-right">
                        {tauxTrimestre.toFixed(1)}%
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Conforme :</span>
                        <span>
                          {
                            trimestre.donneesParLieu.filter(
                              (d) => d.statut === "conforme"
                            ).length
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Problèmes :</span>
                        <span>
                          {
                            trimestre.donneesParLieu.filter(
                              (d) => d.statut !== "conforme"
                            ).length
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Résumé des problèmes du trimestre */}
                  {trimestre.donneesParLieu.some(
                    (d) => d.statut !== "conforme"
                  ) && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <div className="text-xs text-slate-600">
                        <strong>Points d&apos;attention :</strong>{" "}
                        {trimestre.donneesParLieu
                          .filter((d) => d.statut !== "conforme")
                          .map((d) => `${d.nomLieu} (${d.statut})`)
                          .join(", ")}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lieux à problèmes */}
      {rapport.lieuxAProblemes.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Lieux nécessitant une attention particulière
            </CardTitle>
            <CardDescription className="text-amber-700">
              Ces cabinets présentent des écarts significatifs ou des virements
              manquants
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {rapport.lieuxAProblemes.map((lieu) => (
                <div
                  key={lieu.lieuId}
                  className="border border-amber-200 rounded-lg p-4 bg-white"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: lieu.couleurLieu }}
                    />
                    <h3 className="font-semibold text-slate-800">
                      {lieu.nomLieu}
                    </h3>
                    <Badge
                      variant="outline"
                      className={
                        lieu.deficitTotal < -100
                          ? "bg-red-100 text-red-800 border-red-200"
                          : "bg-amber-100 text-amber-800 border-amber-200"
                      }
                    >
                      Déficit : {Math.abs(lieu.deficitTotal).toFixed(2)} €
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-slate-600 mb-2">
                        Trimestres avec problèmes :
                      </div>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4].map((trimestre) => (
                          <Badge
                            key={trimestre}
                            variant="secondary"
                            className={
                              lieu.trimestresManquants.includes(trimestre)
                                ? "bg-red-100 text-red-800 border-red-200"
                                : "bg-green-100 text-green-800 border-green-200"
                            }
                          >
                            T{trimestre}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-slate-600">Recommandations :</div>
                      <ul className="text-xs text-slate-700 space-y-1">
                        {lieu.trimestresManquants.length > 0 && (
                          <li>
                            • Vérifier les virements manquants pour{" "}
                            {lieu.trimestresManquants.length} trimestre(s)
                          </li>
                        )}
                        {lieu.deficitTotal < -100 && (
                          <li>
                            • Contacter le cabinet pour régulariser le déficit
                            de {Math.abs(lieu.deficitTotal).toFixed(2)} €
                          </li>
                        )}
                        <li>
                          • Mettre à jour les pourcentages de rétrocession si
                          nécessaire
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Synthèse et recommandations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Performance globale */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Synthèse de performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Meilleur trimestre :</span>
                <span className="font-semibold text-green-600">
                  T{meilleurTrimestre.trimestre} (
                  {meilleurTrimestre.taux.toFixed(1)}%)
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Trimestre à améliorer :</span>
                <span className="font-semibold text-amber-600">
                  T{pireTrimestre.trimestre} ({pireTrimestre.taux.toFixed(1)}%)
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">
                  Stabilité des paiements :
                </span>
                <span className="font-semibold">
                  {trimestrePerformance[0].taux -
                    trimestrePerformance[3].taux <=
                  10
                    ? "Élevée"
                    : "Variable"}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <div className="text-xs text-slate-600">
                <strong>Évaluation :</strong>{" "}
                {tauxRealisation >= 95
                  ? "Excellente correspondance théorie/réalité"
                  : tauxRealisation >= 85
                  ? "Bon suivi, quelques écarts mineurs"
                  : tauxRealisation >= 70
                  ? "Écarts significatifs à investiguer"
                  : "Problèmes majeurs de paiement détectés"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan d'action */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Plan d&apos;action recommandé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-blue-800 text-sm">
              {rapport.difference < -500 && (
                <p>
                  • <strong>Investigation prioritaire</strong> sur le déficit
                  global de {Math.abs(rapport.difference).toFixed(2)} €
                </p>
              )}

              {rapport.lieuxAProblemes.length > 0 && (
                <p>
                  • <strong>Contact proactif</strong> avec{" "}
                  {rapport.lieuxAProblemes.length} cabinet(s) problématique(s)
                </p>
              )}

              {pireTrimestre.taux < 80 && (
                <p>
                  • <strong>Analyse ciblée</strong> du T
                  {pireTrimestre.trimestre} (taux de{" "}
                  {pireTrimestre.taux.toFixed(1)}%)
                </p>
              )}

              <p>
                • <strong>Mise à jour</strong> des pourcentages de rétrocession
                si nécessaire
              </p>
              <p>
                • <strong>Vérification</strong> des processus de déclaration et
                de paiement
              </p>

              <div className="pt-3 border-t border-blue-200">
                <div className="text-xs">
                  <strong>Objectif {rapport.annee + 1} :</strong> Atteindre un
                  taux de réalisation ≥ 95%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bilan final */}
      <Card
        className={
          tauxRealisation >= 95
            ? "bg-green-50 border-green-200"
            : tauxRealisation >= 80
            ? "bg-amber-50 border-amber-200"
            : "bg-red-50 border-red-200"
        }
      >
        <CardContent className="p-6">
          <div className="text-center">
            <h3
              className={`text-lg font-semibold ${
                tauxRealisation >= 95
                  ? "text-green-800"
                  : tauxRealisation >= 80
                  ? "text-amber-800"
                  : "text-red-800"
              }`}
            >
              Bilan Annuel {rapport.annee}
            </h3>
            <p
              className={`mt-2 ${
                tauxRealisation >= 95
                  ? "text-green-700"
                  : tauxRealisation >= 80
                  ? "text-amber-700"
                  : "text-red-700"
              }`}
            >
              {tauxRealisation >= 95
                ? "✅ Excellente année ! Vos honoraires théoriques et réels correspondent parfaitement."
                : tauxRealisation >= 80
                ? "⚠️ Bonne année globale, mais certains écarts méritent votre attention."
                : "❌ Année problématique : des actions correctives sont nécessaires pour améliorer la correspondance théorie/réalité."}
            </p>
            <div className="mt-3 text-sm text-slate-600">
              Généré le {new Date().toLocaleDateString("fr-FR")}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
