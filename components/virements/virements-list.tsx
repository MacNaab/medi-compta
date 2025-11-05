// components/virements/virements-list.tsx
import { useState } from "react";
import { VirementAvecLieu } from "@/types/virement";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Edit3,
  Trash2,
  Calendar,
  Euro,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface VirementsListProps {
  virements: VirementAvecLieu[];
  onEdit: (virement: VirementAvecLieu) => void;
  onDelete: (virement: VirementAvecLieu) => void;
  onCreate: () => void;
  isLoading?: boolean;
}

export function VirementsList({
  virements,
  onEdit,
  onDelete,
  onCreate,
  isLoading,
}: VirementsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (virement: VirementAvecLieu) => {
    setDeletingId(virement.id);
    try {
      await onDelete(virement);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatutConfig = (statut: string) => {
    switch (statut) {
      case "recu":
        return {
          label: "Reçu",
          class: "bg-green-100 text-green-800 border-green-200",
          icon: CheckCircle2,
        };
      case "attente":
        return {
          label: "En attente",
          class: "bg-amber-100 text-amber-800 border-amber-200",
          icon: AlertTriangle,
        };
      case "partiel":
        return {
          label: "Partiel",
          class: "bg-blue-100 text-blue-800 border-blue-200",
          icon: TrendingUp,
        };
      case "manquant":
        return {
          label: "Manquant",
          class: "bg-red-100 text-red-800 border-red-200",
          icon: AlertTriangle,
        };
      default:
        return {
          label: "Inconnu",
          class: "bg-gray-100 text-gray-800 border-gray-200",
          icon: AlertTriangle,
        };
    }
  };

  // Calcul des totaux
  const totalTheorique = virements.reduce(
    (sum, v) => sum + v.montantTheorique,
    0
  );
  const totalRecu = virements.reduce((sum, v) => sum + v.montantRecu, 0);
  const totalDifference = totalRecu - totalTheorique;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Euro className="h-6 w-6 text-green-600" />
            Suivi des virements
          </h2>
          <p className="text-slate-600 mt-1">
            {virements.length} virement{virements.length > 1 ? "s" : ""}{" "}
            enregistré{virements.length > 1 ? "s" : ""}
          </p>
        </div>

        <Button
          onClick={onCreate}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Euro className="h-4 w-4 mr-2" />
          Nouveau virement
        </Button>
      </div>

      {/* Statistiques globales */}
      {virements.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {totalTheorique.toFixed(2)} €
              </div>
              <div className="text-sm text-slate-600">Total théorique</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600">
                {totalRecu.toFixed(2)} €
              </div>
              <div className="text-sm text-slate-600">Total reçu</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div
                className={`text-2xl font-bold ${
                  totalDifference === 0
                    ? "text-slate-600"
                    : totalDifference > 0
                    ? "text-green-600"
                    : "text-amber-600"
                }`}
              >
                {totalDifference > 0 ? "+" : ""}
                {totalDifference.toFixed(2)} €
              </div>
              <div className="text-sm text-slate-600">Écart global</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Liste des virements */}
      {virements.length === 0 ? (
        <Card className="text-center py-12 border-2 border-dashed border-slate-200">
          <CardContent>
            <Euro className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              Aucun virement enregistré
            </h3>
            <p className="text-slate-500 mb-4">
              Commencez par enregistrer vos premiers virements pour suivre vos
              revenus réels.
            </p>
            <Button
              onClick={onCreate}
              className="bg-green-600 hover:bg-green-700"
            >
              <Euro className="h-4 w-4 mr-2" />
              Ajouter un virement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {virements.map((virement) => {
            const statutConfig = getStatutConfig(virement.statut);
            const StatutIcon = statutConfig.icon;

            return (
              <Card
                key={virement.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    {/* Informations principales */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: virement.lieu.couleur }}
                          />
                          <h3 className="font-semibold text-slate-800 text-lg">
                            {virement.lieu.nom}
                          </h3>
                        </div>

                        <Badge className={statutConfig.class}>
                          <StatutIcon className="h-3 w-3 mr-1" />
                          {statutConfig.label}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {virement.dateDebut.toLocaleDateString("fr-FR")} -{" "}
                              {virement.dateFin.toLocaleDateString("fr-FR")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Euro className="h-4 w-4" />
                            <span>
                              Reçu le{" "}
                              {virement.dateReception.toLocaleDateString(
                                "fr-FR"
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Théorique :</span>
                            <span className="font-medium">
                              {virement.montantTheorique.toFixed(2)} €
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Reçu :</span>
                            <span className="font-medium text-green-600">
                              {virement.montantRecu.toFixed(2)} €
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Différence */}
                      {virement.difference !== 0 && (
                        <div
                          className={`
                          px-3 py-2 rounded text-sm font-medium
                          ${
                            virement.difference === 0
                              ? "bg-green-100 text-green-800"
                              : virement.difference > 0
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }
                        `}
                        >
                          {virement.difference > 0 ? "Surplus" : "Déficit"} :{" "}
                          {virement.difference > 0 ? "+" : ""}
                          {virement.difference.toFixed(2)} €
                          {virement.montantTheorique > 0 && (
                            <span className="ml-2">
                              (
                              {(
                                (virement.difference /
                                  virement.montantTheorique) *
                                100
                              ).toFixed(1)}
                              %)
                            </span>
                          )}
                        </div>
                      )}

                      {virement.notes && (
                        <div className="text-sm text-slate-600 bg-slate-50 rounded p-3">
                          {virement.notes}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 lg:flex-col">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(virement)}
                        className="border-slate-300 hover:bg-slate-50"
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Modifier
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(virement)}
                        disabled={deletingId === virement.id}
                        className="border-red-200 hover:bg-red-50 hover:text-red-700 text-red-600"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        {deletingId === virement.id ? "..." : "Supprimer"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
