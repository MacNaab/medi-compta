// components/patient/actes-manager.tsx
import { useState } from "react";
import { Acte, ActeFormData } from "@/types/acte";
import { useActes } from "@/hooks/useActes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit3, Trash2, FileText, Euro, CreditCard, RotateCcw, AlertTriangle } from "lucide-react";
import { ActeForm } from "./acte-form";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ACTES_PAR_DEFAUT } from "@/lib/utils";

interface ActesManagerProps {
  onActeSelect?: (acte: Acte) => void;
  modeSelection?: boolean;
}

export function ActesManager({ onActeSelect, modeSelection = false }: ActesManagerProps) {
  const { actes, isLoading, createActe, updateActe, deleteActe, reinitialiserActes } = useActes();

  const [viewMode, setViewMode] = useState<"list" | "create" | "edit">("list");
  const [selectedActe, setSelectedActe] = useState<Acte | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleCreate = () => {
    setSelectedActe(null);
    setViewMode("create");
  };

  const handleEdit = (acte: Acte) => {
    setSelectedActe(acte);
    setViewMode("edit");
  };

  const handleDelete = async (acte: Acte) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'acte "${acte.code} - ${acte.libelle}" ?`)) {
      await deleteActe(acte.id);
    }
  };

  const handleSelect = (acte: Acte) => {
    if (onActeSelect) {
      onActeSelect(acte);
    }
  };

  const handleSubmit = async (data: ActeFormData) => {
    if (viewMode === "create") {
      await createActe(data);
    } else if (viewMode === "edit" && selectedActe) {
      await updateActe(selectedActe.id, data);
    }
    setViewMode("list");
    setSelectedActe(null);
  };

  const handleCancel = () => {
    setViewMode("list");
    setSelectedActe(null);
  };

  const handleReinitialiser = async () => {
    await reinitialiserActes();
    setShowResetDialog(false);
  };

  // Compter les actes personnalisés (non par défaut)
  const actesPersonnalises = actes.filter(acte => 
    !ACTES_PAR_DEFAUT.some(acteDefaut => acteDefaut.code === acte.code)
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
      {/* En-tête */}
      {!modeSelection && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Gestion des Actes</h2>
            <div className="text-slate-600">
              Configurez vos codes d&apos;actes et leurs tarifs
              {actesPersonnalises.length > 0 && (
                <span className="text-amber-600 ml-2">
                  • {actesPersonnalises.length} acte(s) personnalisé(s)
                </span>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="border-amber-600 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                  disabled={isLoading}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-5 w-5" />
                    Réinitialiser les actes
                  </AlertDialogTitle>
                  <div>
                    Cette action est irréversible. Elle va :
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Supprimer tous les actes personnalisés ({actesPersonnalises.length})</li>
                      <li>Restaurer les {ACTES_PAR_DEFAUT.length} actes par défaut</li>
                      <li>Perdre toutes vos modifications personnalisées</li>
                    </ul>
                  </div>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleReinitialiser}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    Oui, réinitialiser
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nouvel acte
            </Button>
          </div>
        </div>
      )}

      {/* Bannière d'information */}
      {!modeSelection && actesPersonnalises.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-blue-800 text-sm">
                  Vous avez {actesPersonnalises.length} acte(s) personnalisé(s). 
                  La réinitialisation restaurera les valeurs par défaut.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des actes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actes.map((acte) => (
          <Card 
            key={acte.id} 
            className={`cursor-pointer hover:shadow-md transition-shadow ${
              modeSelection ? 'hover:border-blue-300' : ''
            }`}
            onClick={() => modeSelection && handleSelect(acte)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Badge 
                      style={{ backgroundColor: acte.couleur }}
                      className="text-white"
                    >
                      {acte.code}
                    </Badge>
                    <span className="text-lg">{acte.libelle}</span>
                  </CardTitle>
                  <CardDescription className="mt-2">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Euro className="h-3 w-3" />
                        <span>Total: {acte.montantTotal}€</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        <span>Patient: {acte.montantPatient}€</span>
                      </div>
                    </div>
                  </CardDescription>
                </div>
                {!modeSelection && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(acte);
                      }}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(acte);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-sm">
                <Badge variant="outline">
                  {acte.modePaiementParDefaut === null 
                    ? "Pris en charge" 
                    : acte.modePaiementParDefaut}
                </Badge>
                {modeSelection && (
                  <Button size="sm" variant="outline">
                    Sélectionner
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de création/édition */}
      <Dialog open={viewMode !== "list"} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="max-w-2xl">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            {viewMode === "create" ? "Nouvel Acte" : "Modifier l'Acte"}
          </DialogTitle>
          <ActeForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            acteExistante={viewMode === 'edit' ? selectedActe : undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}