// components/virements/virements-manager.tsx
"use client";

import { useMemo, useState } from "react";
import { VirementFormData, VirementAvecLieu } from "@/types/virement";
import { useVirements } from "@/hooks/useVirements";
import { useLieux } from "@/hooks/useLieux";
import { useJournees } from "@/hooks/useJournees";
import { VirementForm } from "./virement-form";
import { VirementsList } from "./virements-list";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { VirementAlerteService } from "@/services/virement-alerte-service";
import { TableauBordVirements } from "./tableau-bord-virements";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Euro, AlertTriangle, List } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type ViewMode = "list" | "create" | "edit" | "tableau-bord";

export function VirementsManager() {
  const { journees } = useJournees();
  const { lieux, isLoading: lieuxLoading } = useLieux();
  const {
    virements,
    isLoading,
    createVirement,
    updateVirement,
    deleteVirement,
  } = useVirements(journees);

  const [viewMode, setViewMode] = useState<ViewMode>("tableau-bord");
  const [selectedVirement, setSelectedVirement] =
    useState<VirementAvecLieu | null>(null);

  const resumeVirementsManquants = useMemo(() => {
    return VirementAlerteService.detecterVirementsManquants(
      journees,
      virements,
      lieux
    );
  }, [journees, virements, lieux]);

  const handleCreerVirementDepuisAlerte = (
    lieuId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dateDebut: Date,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dateFin: Date
  ) => {
    const lieu = lieux.find((l) => l.id === lieuId);
    if (!lieu) return;

    // Pré-remplir les données du virement
    setSelectedVirement(null);
    setViewMode("create");

    // On pourrait pré-remplir le formulaire ici avec les dates
    // Pour l'instant, on laisse l'utilisateur compléter
  };

  const handleEdit = (virement: VirementAvecLieu) => {
    setSelectedVirement(virement);
    setViewMode("edit");
  };

  const handleDelete = async (virement: VirementAvecLieu) => {
    if (
      confirm(
        `Êtes-vous sûr de vouloir supprimer le virement du ${virement.dateReception.toLocaleDateString(
          "fr-FR"
        )} ?`
      )
    ) {
      await deleteVirement(virement.id);
    }
  };

  const handleSubmit = async (data: VirementFormData) => {
    if (viewMode === "create") {
      await createVirement(data);
    } else if (viewMode === "edit" && selectedVirement) {
      await updateVirement(selectedVirement.id, data);
    }
    setViewMode("list");
    setSelectedVirement(null);
  };

  const handleCancel = () => {
    setViewMode("list");
    setSelectedVirement(null);
  };

  return (
    <div className="container mx-auto p-6">
      {/* Mode Tableau de Bord ou Liste */}
      {viewMode === "tableau-bord" || viewMode === "list" ? (
        <div className="space-y-6">
          {/* En-tête avec onglets */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                Gestion des Virements
              </h1>
              <p className="text-slate-600">
                Suivez vos virements réels et détectez les manquants
              </p>
            </div>
          </div>

          {/* Onglets */}
          <Tabs
            value={viewMode}
            onValueChange={(value) => setViewMode(value as ViewMode)}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger
                value="tableau-bord"
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Tableau de bord
                {resumeVirementsManquants.nombreAlertes > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {resumeVirementsManquants.nombreAlertes}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Liste complète
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tableau-bord" className="space-y-6">
              <TableauBordVirements
                resume={resumeVirementsManquants}
                onCreerVirement={handleCreerVirementDepuisAlerte}
              />
            </TabsContent>

            <TabsContent value="list" className="space-y-6">
              <VirementsList
                virements={virements}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCreate={() => setViewMode("create")}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        /* Mode création/édition */
        <VirementsList
          virements={virements}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCreate={() => setViewMode("create")}
          isLoading={isLoading}
        />
      )}

      {/* Modal de création/édition (inchangé) */}
      <Dialog
        open={viewMode === "create" || viewMode === "edit"}
        onOpenChange={(open) => !open && handleCancel()}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="flex items-center gap-2">
            <Euro className="h-6 w-6 text-green-600" />
            Enregistrement d&apos;un virement
          </DialogTitle>
          {(viewMode === "create" || viewMode === "edit") && (
            <VirementForm
              lieux={lieux}
              journees={journees}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={isLoading || lieuxLoading}
              virementExistant={viewMode === 'edit' ? selectedVirement : undefined}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
