// components/virements/tableau-bord-virements.tsx
import { useState } from "react";
import {
  VirementAlerteService,
  VirementManquant,
  ResumeVirementsManquants,
} from "@/services/virement-alerte-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Euro,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Mail,
} from "lucide-react";

interface TableauBordVirementsProps {
  resume: ResumeVirementsManquants;
  onCreerVirement: (lieuId: string, dateDebut: Date, dateFin: Date) => void;
}

export function TableauBordVirements({
  resume,
  onCreerVirement,
}: TableauBordVirementsProps) {
  const [filtreUrgence, setFiltreUrgence] = useState<
    "tous" | "elevee" | "moyenne" | "faible"
  >("tous");

  const alertesFiltrees =
    filtreUrgence === "tous"
      ? resume.parLieu
      : resume.parLieu.filter((a) => a.urgence === filtreUrgence);

  const getCouleurUrgence = (urgence: string) => {
    switch (urgence) {
      case "elevee":
        return "bg-red-100 text-red-800 border-red-200";
      case "moyenne":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "faible":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getIconeUrgence = (urgence: string) => {
    switch (urgence) {
      case "elevee":
        return AlertTriangle;
      case "moyenne":
        return Clock;
      case "faible":
        return TrendingUp;
      default:
        return CheckCircle2;
    }
  };

  const getDelaiJours = (dateFin: Date): number => {
    const aujourdhui = new Date();
    const delai = aujourdhui.getTime() - dateFin.getTime();
    return Math.floor(delai / (1000 * 60 * 60 * 24));
  };

  const handleCreerVirement = (alerte: VirementManquant) => {
    onCreerVirement(
      alerte.lieuId,
      alerte.periode.dateDebut,
      alerte.periode.dateFin
    );
  };

  if (resume.nombreAlertes === 0) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Aucun virement manquant
          </h3>
          <p className="text-green-600">
            Tous vos virements sont à jour. Excellente gestion !
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec résumé */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
                Virements à suivre
              </h2>
              <p className="text-slate-600 mt-1">
                {VirementAlerteService.genererMessageAlerte(resume)}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-800 text-lg px-4 py-2"
              >
                {resume.totalManquant.toFixed(2)} €
              </Badge>
              <div className="text-sm text-slate-600">
                {resume.nombreAlertes} alerte
                {resume.nombreAlertes > 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filtreUrgence === "tous" ? "default" : "outline"}
              onClick={() => setFiltreUrgence("tous")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Tous ({resume.nombreAlertes})
            </Button>
            <Button
              variant={filtreUrgence === "elevee" ? "default" : "outline"}
              onClick={() => setFiltreUrgence("elevee")}
              className="bg-red-600 hover:bg-red-700"
            >
              Urgent (
              {resume.parLieu.filter((a) => a.urgence === "elevee").length})
            </Button>
            <Button
              variant={filtreUrgence === "moyenne" ? "default" : "outline"}
              onClick={() => setFiltreUrgence("moyenne")}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Moyen (
              {resume.parLieu.filter((a) => a.urgence === "moyenne").length})
            </Button>
            <Button
              variant={filtreUrgence === "faible" ? "default" : "outline"}
              onClick={() => setFiltreUrgence("faible")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Faible (
              {resume.parLieu.filter((a) => a.urgence === "faible").length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des alertes */}
      <div className="space-y-4">
        {alertesFiltrees.map((alerte, index) => {
          const IconeUrgence = getIconeUrgence(alerte.urgence);
          const delaiJours = getDelaiJours(alerte.periode.dateFin);

          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  {/* Informations de l'alerte */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: alerte.couleurLieu }}
                      />
                      <h3 className="font-semibold text-slate-800 text-lg">
                        {alerte.nomLieu}
                      </h3>

                      <Badge className={getCouleurUrgence(alerte.urgence)}>
                        <IconeUrgence className="h-3 w-3 mr-1" />
                        {alerte.urgence === "elevee"
                          ? "Urgent"
                          : alerte.urgence === "moyenne"
                          ? "En retard"
                          : "À suivre"}
                      </Badge>

                      <Badge variant="outline" className="bg-blue-50">
                        {alerte.pourcentageRetrocession}%
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="h-4 w-4" />
                          <span>{alerte.periode.label}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Euro className="h-4 w-4" />
                          <span className="font-semibold text-amber-600">
                            {alerte.montantTheorique.toFixed(2)} €
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-slate-600">
                          {alerte.joursTravailles} jour
                          {alerte.joursTravailles > 1 ? "s" : ""} travaillé
                          {alerte.joursTravailles > 1 ? "s" : ""}
                        </div>
                        <div className="text-slate-600">
                          Dernier jour :{" "}
                          {alerte.dernierJour.toLocaleDateString("fr-FR")}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div
                          className={`text-sm font-medium ${
                            delaiJours > 60
                              ? "text-red-600"
                              : delaiJours > 30
                              ? "text-amber-600"
                              : "text-blue-600"
                          }`}
                        >
                          {delaiJours > 0
                            ? `En retard de ${delaiJours} jour${
                                delaiJours > 1 ? "s" : ""
                              }`
                            : "Dans les temps"}
                        </div>
                        <div className="text-xs text-slate-500">
                          Échéance :{" "}
                          {alerte.periode.dateFin.toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 lg:flex-col">
                    <Button
                      onClick={() => handleCreerVirement(alerte)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Euro className="h-3 w-3 mr-1" />
                      Créer virement
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-200 hover:bg-blue-50"
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      Relancer
                    </Button>
                  </div>
                </div>

                {/* Recommandation */}
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="text-sm text-slate-600">
                    <strong>Recommandation :</strong>{" "}
                    {alerte.urgence === "elevee"
                      ? "Contactez immédiatement le cabinet pour régulariser ce virement en retard."
                      : alerte.urgence === "moyenne"
                      ? "Planifiez un rappel pour régulariser ce virement."
                      : "Vérifiez que le virement est bien en cours de traitement."}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Résumé des actions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Plan d&apos;action recommandé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-blue-800 text-sm">
            {resume.alertesUrgentes > 0 && (
              <p>
                • <strong>Priorité absolue</strong> : Traiter les{" "}
                {resume.alertesUrgentes} virement(s) urgent(s) en retard
              </p>
            )}
            <p>
              • <strong>Créer les virements manquants</strong> dans le système
              pour suivre leur statut
            </p>
            <p>
              • <strong>Relancer les cabinets</strong> pour les virements en
              retard de plus de 30 jours
            </p>
            <p>
              • <strong>Vérifier les processus</strong> de déclaration et de
              paiement avec chaque cabinet
            </p>

            <div className="pt-3 border-t border-blue-200">
              <div className="text-xs">
                <strong>Objectif :</strong> Réduire le montant manquant de{" "}
                {resume.totalManquant.toFixed(2)} € à 0 €
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
