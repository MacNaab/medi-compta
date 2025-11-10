// components/rapports/rapports-manager.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import { Download } from "lucide-react";
import { usePDF } from "react-to-pdf";
import { useJournees } from "@/hooks/useJournees";
import { useLieux } from "@/hooks/useLieux";
import { useVirements } from "@/hooks/useVirements";
import { RapportReelService } from "@/services/rapport-reel-service";
import { RapportService } from "@/services/rapport-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { RapportReelAnnuelView } from "./rapport-reel-annuel";
import { RapportReelTrimestrielView } from "./rapport-reel-trimestriel";
import { RapportSelector } from "./rapport-selector";

type RapportView = "selection" | "reel-trimestriel" | "reel-annuel";

function ExportToPdf({ children }: { children: React.ReactNode }) {
  const { toPDF, targetRef } = usePDF({ filename: "rapport.pdf" });
  return (
    <div>
      <div
        style={{ marginTop: "-3.5rem" }}
        className="pb-1 flex justify-center"
      >
        <Button onClick={() => toPDF()} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Télécharger en PDF
        </Button>
      </div>
      <div ref={targetRef}>{children}</div>
    </div>
  );
}

export function RapportsManager() {
  const { journees, isLoading: journeesLoading } = useJournees();
  const { lieux, isLoading: lieuxLoading } = useLieux();
  const { virements } = useVirements(journees);
  const [rapportView, setRapportView] = useState<RapportView>("selection");
  const [rapportCourant, setRapportCourant] = useState<any>(null);

  const anneesDisponibles = useMemo(() => {
    return RapportService.getAnneesDisponibles(journees);
  }, [journees]);

  const handleRapportSelect = (annee: number, trimestre?: number) => {
    if (trimestre) {
      const rapport = RapportReelService.genererRapportReelTrimestriel(
        virements,
        lieux,
        annee,
        trimestre as 1 | 2 | 3 | 4
      );
      setRapportCourant(rapport);
      setRapportView("reel-trimestriel");
    } else {
      const rapport = RapportReelService.genererRapportReelAnnuel(
        virements,
        journees,
        lieux,
        annee
      );
      setRapportCourant(rapport);
      setRapportView("reel-annuel");
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
        <Button
          onClick={handleRetour}
          variant="ghost"
          className="mb-6 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2 transition-colors"
        >
          ← Retour aux rapports
        </Button>
      )}

      {/* Vue sélection */}
      {rapportView === "selection" && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Rapports des Virements
            </h1>
            <p className="text-slate-600">
              Analysez vos virements effectivement reçus et suivez votre
              trésorerie
            </p>
          </div>

          {/* Sélection du type de rapport */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">
                  Rapports Basés sur les Virements Reçus
                </h3>
                <p className="text-slate-600">
                  Analyse détaillée de vos virements
                </p>
              </div>
              {virements.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  Aucun virement enregistré. Rendez-vous dans l&apos;onglet
                  &quot;Virements&quot; pour saisir vos premiers virements.
                </div>
              ) : (
                <RapportSelector
                  anneesDisponibles={anneesDisponibles}
                  onRapportSelect={handleRapportSelect}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vue rapport reel trimestriel */}
      {rapportView === "reel-trimestriel" && rapportCourant && (
        <ExportToPdf>
          <RapportReelTrimestrielView rapport={rapportCourant} />
        </ExportToPdf>
      )}

      {/* Vue rapport reel annuel */}
      {rapportView === "reel-annuel" && rapportCourant && (
        <ExportToPdf>
          <RapportReelAnnuelView rapport={rapportCourant} />
        </ExportToPdf>
      )}
    </div>
  );
}
