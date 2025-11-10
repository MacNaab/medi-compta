// components/rapports/rapport-reel-annuel.tsx
import { RapportReelAnnuel } from "@/services/rapport-reel-service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Euro,
  AlertTriangle,
} from "lucide-react";

interface RapportReelAnnuelProps {
  rapport: RapportReelAnnuel;
}

export function RapportReelAnnuelView({ rapport }: RapportReelAnnuelProps) {
  // Calculs automatiques basés sur les différences
  const virementsComplets = rapport.trimestres
    .flatMap((t) =>
      t.donneesParLieu.flatMap((lieu) => lieu.virementsComplets || 0)
    )
    .reduce((sum, count) => sum + count, 0);

  const virementsPartiels = rapport.trimestres
    .flatMap((t) =>
      t.donneesParLieu.flatMap((lieu) => lieu.virementsPartiels || 0)
    )
    .reduce((sum, count) => sum + count, 0);

  const virementsEnAttente = rapport.virementsAutomatiques.length;

  // Récupérer tous les virements partiels de l'année
  const tousVirementsPartiels = rapport.trimestres
    .flatMap((trimestre) =>
      trimestre.donneesParLieu.flatMap((lieu) =>
        lieu.virementsPartiels > 0
          ? {
              lieuNom: lieu.nomLieu,
              lieuCouleur: lieu.couleurLieu,
              trimestre: trimestre.trimestre,
              montantManquant: lieu.totalVirementsManquants || 0,
              nombrePartiels: lieu.virementsPartiels,
            }
          : []
      )
    )
    .filter(Boolean);

  // Calcul précis du taux de complétion
  const totalVirementsReels = rapport.totalVirements;
  const totalAttenduTheorique =
    rapport.virementsAutomatiques.reduce(
      (sum, v) => sum + v.montantTheorique,
      0
    ) + totalVirementsReels;

  const tauxCompletion =
    totalAttenduTheorique > 0
      ? (totalVirementsReels / totalAttenduTheorique) * 100
      : 0;

  const moyenneMensuelle = totalVirementsReels / 12;

  // Calcul du déficit total des virements partiels
  const deficitTotal = tousVirementsPartiels.reduce(
    (total, virement) => total + virement.montantManquant,
    0
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Rapport Réel Annuel {rapport.annee}
              </h1>
              <p className="text-slate-600 mt-1">
                Synthèse des virements effectivement reçus sur l&apos;année{" "}
                {rapport.annee}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Badge
                variant="secondary"
                className={`border text-lg px-4 py-2 ${
                  tauxCompletion >= 95
                    ? "bg-green-50 border-green-200 text-green-800"
                    : tauxCompletion >= 80
                    ? "bg-amber-50 border-amber-200 text-amber-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                Taux de complétion :{" "}
                <strong>{tauxCompletion.toFixed(1)}%</strong>
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques principales améliorées */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Euro className="h-4 w-4" />
              Total Annuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-center font-bold text-green-600">
              {totalVirementsReels.toFixed(2)} €
            </div>
            <div className="text-sm text-center text-slate-600 mt-1">
              {moyenneMensuelle.toFixed(2)} €/mois
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Virements complets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-center font-bold text-green-600">
              {virementsComplets}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Virements partiels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-center font-bold text-amber-600">
              {virementsPartiels}
            </div>
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
            <div className="text-2xl text-center font-bold text-blue-600">
              {virementsEnAttente}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analyse par trimestre améliorée */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Répartition par trimestre
          </CardTitle>
          <CardDescription>
            Évolution des virements reçus avec analyse automatique des statuts
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {rapport.trimestres.map((trimestre) => {
              const trimestreComplets = trimestre.donneesParLieu.reduce(
                (sum, lieu) => sum + (lieu.virementsComplets || 0),
                0
              );
              const trimestrePartiels = trimestre.donneesParLieu.reduce(
                (sum, lieu) => sum + (lieu.virementsPartiels || 0),
                0
              );
              const trimestreManquants = trimestre.donneesParLieu.reduce(
                (sum, lieu) => sum + (lieu.virementsEnAttente || 0),
                0
              );
              const alertTristre = trimestrePartiels + trimestreManquants;
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
                      <div className="text-lg font-bold text-green-600">
                        {trimestre.totalVirements.toFixed(2)} €
                      </div>
                      <div className="flex gap-2 text-sm">
                        <div className=" text-slate-600">
                          {trimestre.nombreVirements} virement
                          {trimestre.nombreVirements > 1 ? "s" : ""}
                        </div>
                        <div>-</div>
                        <div className="text-slate-600">
                          {trimestre.donneesParLieu.length} lieu
                          {trimestre.donneesParLieu.length > 1 ? "x" : ""} actif
                          {trimestre.donneesParLieu.length > 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Complets :</span>
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700"
                        >
                          {trimestreComplets}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Partiels :</span>
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700"
                        >
                          {trimestrePartiels}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-600">
                          Moyenne/virement :
                        </span>
                        <span className="font-medium">
                          {(
                            trimestre.totalVirements / trimestre.nombreVirements
                          ).toFixed(2)}{" "}
                          €
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">En attente :</span>
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700"
                        >
                          {trimestreManquants}
                        </Badge>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded p-2">
                      <div className="text-xs text-slate-600 mb-1">
                        Part de l&apos;année
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-green-500 transition-all duration-500"
                          style={{
                            width: `${
                              (trimestre.totalVirements /
                                rapport.totalVirements) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <div className="text-xs text-slate-600 mt-1 text-right">
                        {(
                          (trimestre.totalVirements / rapport.totalVirements) *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                    </div>

                    <div className="text-center">
                      <div
                        className={`text-sm font-semibold ${
                          alertTristre === 0
                            ? "text-green-600"
                            : "text-amber-600"
                        }`}
                      >
                        {alertTristre === 0 ? "✅ Optimal" : "⚠️ À surveiller"}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        {alertTristre} situation
                        {alertTristre > 1 ? "s" : ""} particulière
                        {alertTristre > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Section conseils améliorée avec listes détaillées */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Analyse et Recommandations Détaillées
          </CardTitle>
          <CardDescription className="text-blue-700">
            Conseils personnalisés basés sur votre situation réelle{" "}
            {rapport.annee}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {/* Conseil taux de complétion */}
            <div className="p-4 bg-white rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                📊 Taux de Complétion : {tauxCompletion.toFixed(1)}%
              </h4>
              <p className="text-sm text-slate-700 mb-3">
                {tauxCompletion >= 95
                  ? "Excellente couverture ! Votre trésorerie est saine et prévisible."
                  : tauxCompletion >= 80
                  ? "Bon taux global. Quelques retards à surveiller pour optimiser votre trésorerie."
                  : "Taux faible. Recommandation : mettre en place un suivi actif des retards."}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="text-center p-2 bg-green-50 rounded">
                  <div className="font-bold text-green-700">
                    {virementsComplets}
                  </div>
                  <div className="text-green-600">Complets</div>
                </div>
                <div className="text-center p-2 bg-amber-50 rounded">
                  <div className="font-bold text-amber-700">
                    {virementsPartiels}
                  </div>
                  <div className="text-amber-600">Partiels</div>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded">
                  <div className="font-bold text-blue-700">
                    {virementsEnAttente}
                  </div>
                  <div className="text-blue-600">En attente</div>
                </div>
                <div className="text-center p-2 bg-slate-100 rounded">
                  <div className="font-bold text-slate-700">
                    {virementsComplets + virementsPartiels + virementsEnAttente}
                  </div>
                  <div className="text-slate-600">Total</div>
                </div>
              </div>
            </div>

            {/* Liste détaillée des virements partiels */}
            {virementsPartiels > 0 && (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {virementsPartiels} Virement{virementsPartiels > 1 && "s"} Partiel{virementsPartiels > 1 && "s"} - Déficit :{" "}
                  {deficitTotal.toFixed(2)} €
                </h4>

                <div className="space-y-3 mb-3">
                  {rapport.trimestres.map((trimestre) =>
                    trimestre.donneesParLieu
                      .filter((lieu) => lieu.virementsPartiels > 0)
                      .map((lieu) => (
                        <div
                          key={`${trimestre.trimestre}-${lieu.lieuId}`}
                          className="flex items-center justify-between p-3 bg-white rounded border border-amber-200"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: lieu.couleurLieu }}
                            />
                            <div>
                              <div className="font-medium text-slate-800">
                                {lieu.nomLieu}
                              </div>
                              <div className="text-xs text-slate-600">
                                T{trimestre.trimestre} -{" "}
                                {lieu.virementsPartiels} virement{lieu.virementsPartiels > 1 && "s"} partiel{lieu.virementsPartiels > 1 && "s"}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-amber-700">
                              -{(lieu.totalVirementsManquants || 0).toFixed(2)}{" "}
                              €
                            </div>
                            <div className="text-xs text-slate-600">
                              manquant
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>

                <div className="p-3 bg-amber-100 rounded border border-amber-300">
                  <p className="text-sm text-amber-800 font-semibold mb-2">
                    💡 Actions Recommandées :
                  </p>
                  <ul className="text-xs text-amber-700 space-y-1">
                    <li>
                      • Relance immédiate des cabinets avec déficit supérieur à
                      500€
                    </li>
                    <li>
                      • Vérification des justificatifs pour les écarts
                      importants
                    </li>
                    <li>
                      • Mise en place d&apos;un suivi hebdomadaire des
                      régularisations
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Liste détaillée des virements en attente */}
            {virementsEnAttente > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {virementsEnAttente} Virement(s) en Attente
                </h4>

                <div className="space-y-3 mb-3">
                  {rapport.virementsAutomatiques.map((virement) => (
                    <div
                      key={virement.id}
                      className="flex items-center justify-between p-3 bg-white rounded border border-blue-200"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: virement.lieu.couleur }}
                        />
                        <div>
                          <div className="font-medium text-slate-800">
                            {virement.lieu.nom}
                          </div>
                          <div className="text-xs text-slate-600">
                            {virement.dateDebut.toLocaleDateString("fr-FR", {
                              month: "long",
                              year: "numeric",
                            })}{" "}
                            - {virement.montantTheorique.toFixed(2)}€ attendus
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          className={
                            virement.statut === "manquant"
                              ? "bg-red-100 text-red-800 border-red-200"
                              : virement.statut === "partiel"
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : "bg-blue-100 text-blue-800 border-blue-200"
                          }
                        >
                          {virement.statut === "manquant" && "⏰ En retard"}
                          {virement.statut === "partiel" && "⚠️ Retard modéré"}
                          {virement.statut === "attente" && "⏳ En attente"}
                        </Badge>
                        <div className="text-xs text-slate-600 mt-1">
                          {virement.dateReception.toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-blue-100 rounded border border-blue-300">
                  <p className="text-sm text-blue-800 font-semibold mb-2">
                    💡 Gestion des Virements Attendus :
                  </p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>
                      • Ces virements sont détectés automatiquement basé sur vos
                      honoraires théoriques
                    </li>
                    <li>
                      • Vérification recommandée sous 15 jours pour les statuts
                      &quot;en attente&quot;
                    </li>
                    <li>
                      • Relance immédiate pour les statuts &quot;en retard&quot;
                    </li>
                    <li>
                      • Pensez à saisir les virements reçus dans l&apos;onglet
                      &quot;Virements&quot;
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Analyse comparative trimestre par trimestre */}
            <div className="p-4 bg-slate-100 rounded-lg border border-slate-300">
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                📈 Évolution Trimestrielle
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {rapport.trimestres.map((trimestre) => {
                  const trimestrePartiels = trimestre.donneesParLieu.reduce(
                    (sum, lieu) => sum + (lieu.virementsPartiels || 0),
                    0
                  );
                  const trimestreManquants = trimestre.donneesParLieu.reduce(
                    (sum, lieu) => sum + (lieu.virementsEnAttente || 0),
                    0
                  );
                  const alertTristre = trimestrePartiels + trimestreManquants;

                  return (
                    <div
                      key={trimestre.trimestre}
                      className="text-center p-3 bg-white rounded border"
                    >
                      <div className="font-bold text-slate-800">
                        T{trimestre.trimestre}
                      </div>
                      <div
                        className={`text-sm font-semibold ${
                          alertTristre === 0
                            ? "text-green-600"
                            : "text-amber-600"
                        }`}
                      >
                        {alertTristre === 0
                          ? "✅ Stable"
                          : "⚠️ " +
                            alertTristre +
                            " alerte" +
                            (alertTristre > 1 ? "s" : "")}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        {trimestre.totalVirements.toFixed(0)}€
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 p-2 bg-slate-200 rounded">
                <p className="text-xs text-slate-700 text-center">
                  {rapport.trimestres.every(
                    (t) =>
                      t.donneesParLieu.reduce(
                        (sum, lieu) => sum + (lieu.virementsPartiels || 0),
                        0
                      ) === 0
                  )
                    ? "✅ Excellente stabilité sur tous les trimestres"
                    : "📊 Suivi trimestriel recommandé pour anticiper les tendances"}
                </p>
              </div>
            </div>

            {/* Conseil performance annuelle */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                💰 Synthèse de Performance
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-slate-600">Trésorerie moyenne</div>
                  <div className="font-bold text-green-700">
                    {moyenneMensuelle.toFixed(2)} €/mois
                  </div>
                </div>
                <div>
                  <div className="text-slate-600">Total annuel</div>
                  <div className="font-bold text-green-700">
                    {totalVirementsReels.toFixed(2)} €
                  </div>
                </div>
                <div>
                  <div className="text-slate-600">Taux de complétion</div>
                  <div className="font-bold text-green-700">
                    {tauxCompletion.toFixed(1)}%
                  </div>
                </div>
              </div>
              {deficitTotal > 0 && (
                <div className="mt-3 p-2 bg-amber-100 rounded border border-amber-300">
                  <p className="text-xs text-amber-800 text-center">
                    <strong>Point d&apos;attention :</strong> Un déficit de{" "}
                    {deficitTotal.toFixed(2)}€ est à régulariser
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bilan annuel amélioré */}
      <Card
        className={
          tauxCompletion >= 95
            ? "bg-green-50 border-green-200"
            : tauxCompletion >= 80
            ? "bg-amber-50 border-amber-200"
            : "bg-red-50 border-red-200"
        }
      >
        <CardContent className="p-6">
          <div className="text-center">
            <h3
              className={`text-lg font-semibold ${
                tauxCompletion >= 95
                  ? "text-green-800"
                  : tauxCompletion >= 80
                  ? "text-amber-800"
                  : "text-red-800"
              }`}
            >
              Bilan de l&apos;année {rapport.annee}
            </h3>
            <p
              className={`mt-4 ${
                tauxCompletion >= 95
                  ? "text-green-700"
                  : tauxCompletion >= 80
                  ? "text-amber-700"
                  : "text-red-700"
              }`}
            >
              {tauxCompletion >= 95
                ? "✅ Excellente année ! Votre trésorerie est saine avec une couverture optimale des honoraires."
                : tauxCompletion >= 80
                ? "⚠️ Bonne année globalement. Quelques points de vigilance à surveiller pour améliorer votre trésorerie."
                : "❌ Année difficile nécessitant une attention particulière sur le suivi des paiements."}
            </p>
            <div className="mt-3 text-sm text-slate-600">
              Rapport généré le{" "}
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
