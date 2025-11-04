// components/saisie/filtres-saisie.tsx
import { useState } from "react";
import { Lieu } from "@/types/lieu";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Filter, X } from "lucide-react";

interface FiltresSaisieProps {
  lieux: Lieu[];
  onFiltresChange: (filtres: {
    mois?: Date;
    lieuId?: string;
    annee?: number;
  }) => void;
}

export function FiltresSaisie({ lieux, onFiltresChange }: FiltresSaisieProps) {
  const [selectedMois, setSelectedMois] = useState<string>("");
  const [selectedLieu, setSelectedLieu] = useState<string>("");
  const [selectedAnnee, setSelectedAnnee] = useState<string>(
    new Date().getFullYear().toString()
  );

  const annees = Array.from({ length: 5 }, (_, i) =>
    (new Date().getFullYear() - 2 + i).toString()
  );

  const mois = [
    { value: "0", label: "Janvier" },
    { value: "1", label: "Février" },
    { value: "2", label: "Mars" },
    { value: "3", label: "Avril" },
    { value: "4", label: "Mai" },
    { value: "5", label: "Juin" },
    { value: "6", label: "Juillet" },
    { value: "7", label: "Août" },
    { value: "8", label: "Septembre" },
    { value: "9", label: "Octobre" },
    { value: "10", label: "Novembre" },
    { value: "11", label: "Décembre" },
  ];

  const appliquerFiltres = () => {
    const filtres: {
      mois?: Date;
      lieuId?: string;
      annee?: number;
    } = {};

    if (selectedAnnee) {
      filtres.annee = parseInt(selectedAnnee);

      if (selectedMois) {
        filtres.mois = new Date(
          parseInt(selectedAnnee),
          parseInt(selectedMois)
        );
      }
    }

    if (selectedLieu) {
      filtres.lieuId = selectedLieu;
    }

    onFiltresChange(filtres);
  };

  const reinitialiserFiltres = () => {
    setSelectedMois("");
    setSelectedLieu("");
    setSelectedAnnee(new Date().getFullYear().toString());
    onFiltresChange({});
  };

  const hasActiveFilters =
    selectedMois ||
    selectedLieu ||
    selectedAnnee !== new Date().getFullYear().toString();

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          {/* Filtre Année */}
          <div className="space-y-2 flex-1">
            <label className="text-sm font-medium text-slate-700">Année</label>
              <Select value={selectedAnnee} onValueChange={setSelectedAnnee}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {annees.map((annee) => (
                    <SelectItem key={annee} value={annee}>
                      {annee}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>

          {/* Filtre Mois */}
          <div className="space-y-2 flex-1">
            <label className="text-sm font-medium text-slate-700">Mois</label>
                <Select value={selectedMois} onValueChange={setSelectedMois}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les mois" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">Tous les mois</SelectItem>
                {mois.map((mois) => (
                  <SelectItem key={mois.value} value={mois.value}>
                    {mois.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtre Lieu */}
          <div className="space-y-2 flex-1">
            <label className="text-sm font-medium text-slate-700">Lieu</label>
                <Select value={selectedLieu} onValueChange={setSelectedLieu}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les lieux" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-1">Tous les lieux</SelectItem>
                {lieux.map((lieu) => (
                  <SelectItem key={lieu.id} value={lieu.id}>
                    {lieu.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={appliquerFiltres}
              variant="default"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Filter className="h-4 w-4 mr-2" />
              Appliquer
            </Button>

            {hasActiveFilters && (
              <Button onClick={reinitialiserFiltres} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
