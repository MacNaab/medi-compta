// components/patient/modal-lieu-selection.tsx
import { useState } from "react";
import { Lieu } from "@/types/lieu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building, Euro } from "lucide-react";

interface ModalLieuSelectionProps {
  lieux: Lieu[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (lieuId: string, total: number) => void;
  totalJournee: number;
}

export function ModalLieuSelection({
  lieux,
  isOpen,
  onClose,
  onConfirm,
  totalJournee,
}: ModalLieuSelectionProps) {
  const [selectedLieuId, setSelectedLieuId] = useState<string>("");

  const handleConfirm = () => {
    if (selectedLieuId) {
      onConfirm(selectedLieuId, totalJournee);
    }
  };

  const selectedLieu = lieux.find((l) => l.id === selectedLieuId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Créer une journée
          </DialogTitle>
          <DialogDescription>
            Sélectionnez le lieu de travail pour créer la journée avec le total
            des consultations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Affichage du total */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">
                Total des consultations :
              </span>
              <span className="text-lg font-bold text-blue-800">
                {totalJournee.toFixed(2)} €
              </span>
            </div>
          </div>

          {/* Sélection du lieu */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700">
              Lieu de travail *
            </label>
            <Select value={selectedLieuId} onValueChange={setSelectedLieuId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un lieu" />
              </SelectTrigger>
              <SelectContent>
                {lieux.map((lieu) => (
                  <SelectItem key={lieu.id} value={lieu.id}>
                    <div className="flex justify-between items-center w-full">
                      <span>{lieu.nom}</span>
                      <span className="text-sm text-slate-500 ml-2">
                        ({lieu.pourcentageRetrocession}%)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Calcul des honoraires théoriques */}
          {selectedLieu && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-green-800">Rétrocession :</span>
                  <span className="font-medium text-green-800">
                    {selectedLieu.pourcentageRetrocession}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-800 font-medium">
                    Honoraires théoriques :
                  </span>
                  <span className="text-lg font-bold text-green-800">
                    {(
                      (totalJournee * selectedLieu.pourcentageRetrocession) /
                      100
                    ).toFixed(2)}{" "}
                    €
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleConfirm}
              disabled={!selectedLieuId}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Euro className="h-4 w-4 mr-2" />
              Créer la journée
            </Button>
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
