// components/rapports/rapport-trimestriel.tsx
import { RapportTrimestriel } from "@/types/rapport";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Euro, Calendar, MapPin, TrendingUp } from "lucide-react";

interface RapportTrimestrielProps {
  rapport: RapportTrimestriel;
}

export function RapportTrimestrielView({ rapport }: RapportTrimestrielProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* En-tête du rapport */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Rapport Trimestriel URSSAF - {rapport.annee} T
                {rapport.trimestre}
              </h1>
              <p className="text-slate-600 mt-1">
                Période du {formatDate(rapport.dateDebut)} au{" "}
                {formatDate(rapport.dateFin)}
              </p>
            </div>

            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-800 text-lg px-4 py-2"
            >
              {rapport.nombreJours} jour{rapport.nombreJours > 1 ? "s" : ""}{" "}
              travaillé{rapport.nombreJours > 1 ? "s" : ""}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              {rapport.nombreJours}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Détail par lieu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Répartition par lieu de travail
          </CardTitle>
          <CardDescription>
            Détail des honoraires et recettes pour chaque cabinet
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {rapport.donneesParLieu.map((donnees) => (
              <div key={donnees.lieuId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: donnees.couleurLieu }}
                    />
                    <h3 className="font-semibold text-slate-800">
                      {donnees.nomLieu}
                    </h3>
                    <Badge variant="outline">
                      {donnees.pourcentageRetrocession}% de rétrocession
                    </Badge>
                  </div>

                  <div className="text-sm text-slate-600">
                    {donnees.nombreJours} jour
                    {donnees.nombreJours > 1 ? "s" : ""}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-600">Recettes totales :</span>
                      <span className="font-semibold">
                        {donnees.totalRecettes.toFixed(2)} €
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">
                        Honoraires perçus :
                      </span>
                      <span className="font-semibold text-green-600">
                        {donnees.totalHonoraires.toFixed(2)} €
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded p-3">
                    <div className="text-xs text-slate-600 mb-1">
                      Pourcentage du total
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            (donnees.totalHonoraires /
                              rapport.totalHonoraires) *
                            100
                          }%`,
                          backgroundColor: donnees.couleurLieu,
                        }}
                      />
                    </div>
                    <div className="text-xs text-slate-600 mt-1 text-right">
                      {(
                        (donnees.totalHonoraires / rapport.totalHonoraires) *
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

      {/* Notes pour la déclaration URSSAF */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-800 flex items-center gap-2">
            📋 Informations pour la déclaration URSSAF
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-amber-800 text-sm">
            <p>
              • Montant total des honoraires à déclarer :{" "}
              <strong>{rapport.totalHonoraires.toFixed(2)} €</strong>
            </p>
            <p>
              • Période de déclaration : du {formatDate(rapport.dateDebut)} au{" "}
              {formatDate(rapport.dateFin)}
            </p>
            <p>• Nombre de jours d&apos;activité : {rapport.nombreJours}</p>
            <p className="text-xs mt-3">
              💡 Ces données correspondent à vos honoraires théoriques après
              application des pourcentages de rétrocession.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
