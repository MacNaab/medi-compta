/* eslint-disable @typescript-eslint/no-explicit-any */
// components/rapports/rapports-manager.tsx
"use client";

import { useState, useMemo } from "react";
import { useJournees } from "@/hooks/useJournees";
import { useLieux } from "@/hooks/useLieux";
import { RapportService } from "@/services/rapport-service";
import { ExportService } from "@/services/export-service";
import { RapportSelector } from "./rapport-selector";
import { RapportTrimestrielView } from "./rapport-trimestriel";
import { RapportAnnuelView } from "./rapport-annuel";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

type RapportView = "selection" | "trimestriel" | "annuel";

export function RapportsManager() {
  const { journees, isLoading: journeesLoading } = useJournees();
  const { lieux, isLoading: lieuxLoading } = useLieux();
  const [rapportView, setRapportView] = useState<RapportView>("selection");
  const [rapportCourant, setRapportCourant] = useState<any>(null);

  const anneesDisponibles = useMemo(() => {
    return RapportService.getAnneesDisponibles(journees);
  }, [journees]);

  const handleRapportSelect = (annee: number, trimestre?: number) => {
    if (trimestre) {
      // Rapport trimestriel
      const rapport = RapportService.genererRapportTrimestriel(
        journees,
        lieux,
        annee,
        trimestre as 1 | 2 | 3 | 4
      );
      setRapportCourant(rapport);
      setRapportView("trimestriel");
    } else {
      // Rapport annuel
      const rapport = RapportService.genererRapportAnnuel(
        journees,
        lieux,
        annee
      );
      setRapportCourant(rapport);
      setRapportView("annuel");
    }
  };

  const handleExport = (annee: number, trimestre?: number) => {
    if (trimestre) {
      const rapport = RapportService.genererRapportTrimestriel(
        journees,
        lieux,
        annee,
        trimestre as 1 | 2 | 3 | 4
      );
      ExportService.exportRapportTrimestrielPDF(rapport);
    } else {
      const rapport = RapportService.genererRapportAnnuel(
        journees,
        lieux,
        annee
      );
      ExportService.exportRapportAnnuelPDF(rapport);
    }
  };

  const handleRetour = () => {
    setRapportView("selection");
    setRapportCourant(null);
  };

  const isLoading = journeesLoading || lieuxLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-slate-200 rounded w-1/3 mx-auto"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Bouton de retour pour les vues de rapport */}
      {rapportView !== "selection" && (
        <button
          onClick={handleRetour}
          className="mb-6 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2 transition-colors"
        >
          ← Retour aux rapports
        </button>
      )}

      {/* Vue sélection */}
      {rapportView === "selection" && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Rapports URSSAF
            </h1>
            <p className="text-slate-600">
              Générez vos déclarations trimestrielles et vos synthèses annuelles
            </p>
          </div>

          {journees.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  Aucune donnée disponible
                </h3>
                <p className="text-slate-500">
                  Commencez par saisir vos premières journées de travail pour
                  générer des rapports.
                </p>
              </CardContent>
            </Card>
          ) : (
            <RapportSelector
              anneesDisponibles={anneesDisponibles}
              onRapportSelect={handleRapportSelect}
              onExport={handleExport}
            />
          )}
        </div>
      )}

      {/* Vue rapport trimestriel */}
      {rapportView === "trimestriel" && rapportCourant && (
        <RapportTrimestrielView rapport={rapportCourant} />
      )}

      {/* Vue rapport annuel */}
      {rapportView === "annuel" && rapportCourant && (
        <RapportAnnuelView rapport={rapportCourant} />
      )}
    </div>
  );
}
