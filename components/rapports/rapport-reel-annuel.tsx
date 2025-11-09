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
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Calendar,
} from "lucide-react";

interface RapportReelAnnuelProps {
  rapport: RapportReelAnnuel;
}

export function RapportReelAnnuelView({ rapport }: RapportReelAnnuelProps) {
  const totalAttenduAutomatique = rapport.virementsAutomatiques.reduce(
    (sum, v) => sum + v.montantTheorique,
    0
  );

  const totalVirementsReels = rapport.trimestres.reduce(
    (sum, t) => sum + t.totalVirements,
    0
  );
  const totalVirementsAttendus = rapport.virementsAutomatiques.reduce(
    (sum, v) => sum + v.montantTheorique,
    0
  );
  const totalTheoriqueGlobal = totalVirementsReels + totalVirementsAttendus;

  // Taux basé sur ce qui a été reçu vs ce qui est attendu au total
  const tauxCompletion =
    totalTheoriqueGlobal > 0
      ? (totalVirementsReels / totalTheoriqueGlobal) * 100
      : 100;

  const moyenneMensuelle = totalVirementsReels / 12;
  const virementsEnRetard = rapport.virementsAutomatiques.filter(
    (v) => v.statut === "manquant"
  ).length;

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
                className={`" border text-lg px-4 py-2 " ${
                  tauxCompletion >= 95
                    ? "bg-green-50 border-green-200 text-green-800"
                    : tauxCompletion >= 80
                    ? "bg-amber-50 border-amber-200 text-amber-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                Taux de complétion :{" "}
                <strong>{tauxCompletion.toFixed(1)}%</strong>{" "}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Annuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {rapport.totalVirements.toFixed(2)} €
            </div>
            <div className="text-sm text-slate-600 mt-1">
              {moyenneMensuelle.toFixed(2)} €/mois
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
              {rapport.trimestres.reduce(
                (sum, t) => sum + t.nombreVirements,
                0
              ) -
                rapport.totalVirementsEnAttente -
                rapport.totalVirementsPartiels}
            </div>
            <div className="text-sm text-slate-600 mt-1">Sans problème</div>
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
              {rapport.virementsAutomatiques.length}
            </div>
            <div className="text-sm text-slate-600 mt-1">À recevoir</div>
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
              {rapport.totalVirementsPartiels}
            </div>
            <div className="text-sm text-slate-600 mt-1">Incomplets</div>
          </CardContent>
        </Card>
      </div>

      {/* Analyse par trimestre */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Répartition par trimestre
          </CardTitle>
          <CardDescription>
            Évolution des virements reçus au cours de l&apos;année
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {rapport.trimestres.map((trimestre) => (
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
                    <div className="text-sm text-slate-600">
                      {trimestre.nombreVirements} virement
                      {trimestre.nombreVirements > 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Moyenne/virement :</span>
                      <span className="font-medium">
                        {(
                          trimestre.totalVirements / trimestre.nombreVirements
                        ).toFixed(2)}{" "}
                        €
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Lieux actifs :</span>
                      <span className="font-medium">
                        {trimestre.donneesParLieu.length}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">En attente :</span>
                      <span className="font-medium text-amber-600">
                        {trimestre.virementsEnAttente}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Partiels :</span>
                      <span className="font-medium text-blue-600">
                        {trimestre.virementsPartiels}
                      </span>
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
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lieux avec problèmes */}
      {rapport.lieuxAvecProblemes.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Suivi des situations particulières
            </CardTitle>
            <CardDescription className="text-amber-700">
              Cabinets avec des virements en attente ou partiels
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {rapport.lieuxAvecProblemes.map((lieu) => (
                <div
                  key={lieu.lieuId}
                  className="border border-amber-200 rounded-lg p-4 bg-white"
                >
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: lieu.couleurLieu }}
                    />
                    <h3 className="font-semibold text-slate-800">
                      {lieu.nomLieu}
                    </h3>
                    <div className="flex gap-2">
                      {lieu.virementsEnAttente > 0 && (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                          <Clock className="h-3 w-3 mr-1" />
                          {lieu.virementsEnAttente} en attente
                        </Badge>
                      )}
                      {lieu.virementsPartiels > 0 && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {lieu.virementsPartiels} partiels
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-slate-600 space-y-1">
                    <div className="flex justify-around">
                      {lieu.dernierVirement && (
                        <div>
                          Dernier virement :{" "}
                          {lieu.dernierVirement.toLocaleDateString("fr-FR")}
                        </div>
                      )}
                      {lieu.virements && (
                        <div className="border-2 rounded p-1 border-red-600">
                          Déficit :{" "}
                          <strong>
                            {
                              // somme des diférences des virements
                              lieu.virements.reduce(
                                (total, virement) =>
                                  total + virement.difference,
                                0
                              )
                            }
                          </strong>
                          €
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-amber-700 text-center mt-2">
                      💡 Recommandation : Relance du cabinet pour régularisation
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* NOUVELLE SECTION : Virements automatiques en attente */}
      {rapport.virementsAutomatiques.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Virements à recevoir (détection automatique)
            </CardTitle>
            <CardDescription className="text-amber-700">
              {rapport.virementsAutomatiques.length} virement(s) détecté(s)
              automatiquement basé sur vos honoraires théoriques
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {rapport.virementsAutomatiques.length}
                </div>
                <div className="text-sm text-amber-700">Virements attendus</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-700">
                  {totalAttenduAutomatique.toFixed(2)} €
                </div>
                <div className="text-sm text-amber-700">
                  Montant total attendu
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {virementsEnRetard}
                </div>
                <div className="text-sm text-amber-700">
                  Virements en retard
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {rapport.virementsAutomatiques.map((virement) => (
                <div
                  key={virement.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: virement.lieu.couleur }}
                    />
                    <div>
                      <div className="font-medium text-slate-800">
                        {virement.lieu.nom}
                      </div>
                      <div className="text-sm text-slate-600">
                        {virement.dateDebut.toLocaleDateString("fr-FR", {
                          month: "long",
                        })}{" "}
                        -{virement.montantTheorique.toFixed(2)}€ attendus
                      </div>
                    </div>
                  </div>

                  <Badge
                    className={
                      virement.statut === "manquant"
                        ? "bg-red-100 text-red-800"
                        : virement.statut === "partiel"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800"
                    }
                  >
                    {virement.statut === "manquant"
                      ? "En retard"
                      : virement.statut === "partiel"
                      ? "Retard modéré"
                      : "En attente"}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-amber-100 rounded-lg">
              <div className="text-sm text-amber-800">
                💡 <strong>Fonctionnalité automatique :</strong> Ces virements
                sont détectés automatiquement à partir de vos honoraires
                théoriques. Ils n&apos;ont pas besoin d&apos;être saisis
                manuellement.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bilan annuel */}
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
              className={`" text-lg font-semibold " ${
                tauxCompletion >= 95
                  ? "text-green-800"
                  : tauxCompletion >= 80
                  ? "text-amber-800"
                  : "text-red-800"
              } `}
            >
              Bilan de l&apos;année {rapport.annee}
            </h3>
            <p
              className={`" mt-4 " ${
                tauxCompletion >= 95
                  ? "text-green-700"
                  : tauxCompletion >= 80
                  ? "text-amber-700"
                  : "text-red-700"
              } `}
            >
              {tauxCompletion >= 95
                ? "✅ Excellente année ! La quasi-totalité des virements ont été reçus sans problème."
                : tauxCompletion >= 80
                ? "⚠️ Bonne année globalement, mais certaines situations nécessitent un suivi."
                : "❌ Année difficile : nombreux virements en attente ou partiels nécessitant une action."}
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
