// components/lieux/lieu-manager.tsx
"use client";

import { useState } from "react";
import { Lieu, LieuFormData } from "@/types/lieu";
import { useLieux } from "@/hooks/useLieux";
import { LieuForm } from "./lieu-form";
import { LieuList } from "./lieu-list";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MapPin } from "lucide-react";

type ViewMode = "list" | "create" | "edit";

export function LieuManager() {
  const { lieux, isLoading, createLieu, updateLieu, deleteLieu } = useLieux();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedLieu, setSelectedLieu] = useState<Lieu | null>(null);

  const handleCreate = () => {
    setSelectedLieu(null);
    setViewMode("create");
  };

  const handleEdit = (lieu: Lieu) => {
    setSelectedLieu(lieu);
    setViewMode("edit");
  };

  const handleDelete = async (lieu: Lieu) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le lieu "${lieu.nom}" ?`)) {
      await deleteLieu(lieu.id);
    }
  };

  const handleSubmit = async (data: LieuFormData) => {
    if (viewMode === "create") {
      await createLieu(data);
    } else if (viewMode === "edit" && selectedLieu) {
      await updateLieu(selectedLieu.id, data);
    }
    setViewMode("list");
    setSelectedLieu(null);
  };

  const handleCancel = () => {
    setViewMode("list");
    setSelectedLieu(null);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Mode Liste */}
      {viewMode === "list" && (
        <LieuList
          lieux={lieux}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCreate={handleCreate}
          isLoading={isLoading}
        />
      )}

      {/* Mode Création/Édition en Modal */}
      <Dialog
        open={viewMode !== "list"}
        onOpenChange={(open) => !open && handleCancel()}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            {viewMode === "edit" ? "Modifier le lieu" : "Nouveau lieu de travail"}
          </DialogTitle>
          {(viewMode === "create" || viewMode === "edit") && (
            <LieuForm
              lieu={selectedLieu || undefined}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={isLoading}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
