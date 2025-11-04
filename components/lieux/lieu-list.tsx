// components/lieux/lieu-list.tsx
import { useState } from "react";
import { Lieu } from "@/types/lieu";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Phone,
  Mail,
  Percent,
  Edit3,
  Trash2,
  Plus,
  Building,
} from "lucide-react";

interface LieuListProps {
  lieux: Lieu[];
  onEdit: (lieu: Lieu) => void;
  onDelete: (lieu: Lieu) => void;
  onCreate: () => void;
  isLoading?: boolean;
}

export function LieuList({
  lieux,
  onEdit,
  onDelete,
  onCreate,
  isLoading,
}: LieuListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (lieu: Lieu) => {
    setDeletingId(lieu.id);
    try {
      await onDelete(lieu);
    } finally {
      setDeletingId(null);
    }
  };

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
            <Building className="h-6 w-6 text-blue-600" />
            Lieux de travail
          </h2>
          <p className="text-slate-600 mt-1">
            {lieux.length} cabinet{lieux.length > 1 ? "s" : ""} enregistré
            {lieux.length > 1 ? "s" : ""}
          </p>
        </div>

        <Button
          onClick={onCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau lieu
        </Button>
      </div>

      {/* Liste des lieux */}
      {lieux.length === 0 ? (
        <Card className="text-center py-12 border-2 border-dashed border-slate-200">
          <CardContent>
            <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              Aucun lieu enregistré
            </h3>
            <p className="text-slate-500 mb-4">
              Commencez par ajouter votre premier cabinet pour suivre vos
              honoraires.
            </p>
            <Button
              onClick={onCreate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un lieu
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lieux.map((lieu) => (
            <Card
              key={lieu.id}
              className="group hover:shadow-lg transition-all duration-200 border-l-4"
              style={{ borderLeftColor: lieu.couleur }}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold text-slate-800 truncate">
                      {lieu.nom}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Percent className="h-3 w-3" />
                      <span className="font-medium text-slate-700">
                        {lieu.pourcentageRetrocession}% de rétrocession
                      </span>
                    </CardDescription>
                  </div>

                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 hover:bg-blue-200 ml-2"
                  >
                    {lieu.pourcentageRetrocession}%
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Informations de contact */}
                <div className="space-y-2 text-sm text-slate-600">
                  {lieu.adresse && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{lieu.adresse}</span>
                    </div>
                  )}

                  {lieu.telephone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span>{lieu.telephone}</span>
                    </div>
                  )}

                  {lieu.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span className="truncate">{lieu.email}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(lieu)}
                    className="flex-1 border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Modifier
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(lieu)}
                    disabled={deletingId === lieu.id}
                    className="border-red-200 hover:bg-red-50 hover:text-red-700 text-red-600 transition-colors"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    {deletingId === lieu.id ? "..." : "Supprimer"}
                  </Button>
                </div>

                {/* Date de création */}
                <div className="text-xs text-slate-400 mt-3">
                  Créé le {lieu.createdAt.toLocaleDateString("fr-FR")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
