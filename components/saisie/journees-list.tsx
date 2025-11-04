// components/saisie/journees-list.tsx
import { useState } from "react";
import { JourneeAvecLieu } from "@/types/journee";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit3, Trash2, Euro, Building, FileText } from "lucide-react";

interface JourneesListProps {
  journees: JourneeAvecLieu[];
  onEdit: (journee: JourneeAvecLieu) => void;
  onDelete: (journee: JourneeAvecLieu) => void;
  isLoading?: boolean;
}

export function JourneesList({
  journees,
  onEdit,
  onDelete,
  isLoading,
}: JourneesListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (journee: JourneeAvecLieu) => {
    setDeletingId(journee.id);
    try {
      await onDelete(journee);
    } finally {
      setDeletingId(null);
    }
  };

  // Calcul des totaux
  const totalRecettes = journees.reduce((sum, j) => sum + j.recettesTotales, 0);
  const totalHonoraires = journees.reduce(
    (sum, j) => sum + j.honorairesTheoriques,
    0
  );

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
      {journees.length > 0 && (
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-slate-600">Nombre de jours</p>
                <p className="text-2xl font-bold text-slate-800">
                  {journees.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Total recettes</p>
                <p className="text-2xl font-bold text-blue-600">
                  {totalRecettes.toFixed(2)} €
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Total honoraires</p>
                <p className="text-2xl font-bold text-green-600">
                  {totalHonoraires.toFixed(2)} €
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des journées */}
      {journees.length === 0 ? (
        <Card className="text-center py-12 border-2 border-dashed border-slate-200">
          <CardContent>
            <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              Aucune journée enregistrée
            </h3>
            <p className="text-slate-500">
              Commencez par saisir vos premières journées de travail.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Cartes de journées triés par date */}
          {journees
            .sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            )
            .map((journee) => (
              <Card
                key={journee.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    {/* Informations principales */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-slate-800 text-lg">
                          {new Date(journee.date).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </h3>
                        <Badge
                          variant="secondary"
                          className="border-2"
                          style={{
                            borderColor: journee.lieu.couleur,
                            backgroundColor: `${journee.lieu.couleur}15`,
                          }}
                        >
                          {journee.lieu.nom}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Euro className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-600">Recettes :</span>
                          <span className="font-semibold">
                            {journee.recettesTotales.toFixed(2)} €
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-600">Rétrocession :</span>
                          <span className="font-semibold">
                            {journee.lieu.pourcentageRetrocession}%
                          </span>
                        </div>
                      </div>

                      {journee.notes && (
                        <div className="flex items-start gap-2 text-sm">
                          <FileText className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                          <p className="text-slate-600 italic">
                            {journee.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Honoraires et actions */}
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-sm text-slate-600">
                          Honoraires théoriques
                        </p>
                        <p className="text-xl font-bold text-green-600">
                          {journee.honorairesTheoriques.toFixed(2)} €
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(journee)}
                          className="border-slate-300 hover:bg-slate-50"
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          Modifier
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(journee)}
                          disabled={deletingId === journee.id}
                          className="border-red-200 hover:bg-red-50 hover:text-red-700 text-red-600"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          {deletingId === journee.id ? "..." : "Supprimer"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
