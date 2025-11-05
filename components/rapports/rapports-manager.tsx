/* eslint-disable @typescript-eslint/no-explicit-any */
// components/rapports/rapports-manager.tsx
"use client";

import { useState, useMemo } from "react";
import { useJournees } from "@/hooks/useJournees";
import { useLieux } from "@/hooks/useLieux";
import { useVirements } from "@/hooks/useVirements";
import { RapportService } from "@/services/rapport-service";
import { ExportService } from "@/services/export-service";
import { RapportSelector } from "./rapport-selector";
import { RapportTrimestrielView } from "./rapport-trimestriel";
import { RapportAnnuelView } from "./rapport-annuel";
import { Card, CardContent } from "@/components/ui/card";
import { RapportComparatifService } from "@/services/rapport-comparatif-service";
import { RapportComparatifTrimestrielView } from "./rapport-comparatif-trimestriel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, TrendingUp, GitCompareArrows } from "lucide-react";
import { RapportComparatifAnnuelView } from "./rapport-comparatif-annuel";
import { RapportReelService } from "@/services/rapport-reel-service";
import { RapportReelTrimestrielView } from "./rapport-reel-trimestriel";
import { RapportReelAnnuelView } from "./rapport-reel-annuel";

type RapportView =
  | "selection"
  | "trimestriel"
  | "annuel"
  | "comparatif-trimestriel"
  | "comparatif-annuel"
  | "reel-trimestriel"
  | "reel-annuel";

type RapportType = "theorique" | "reel" | "comparatif";

export function RapportsManager() {
  const { journees, isLoading: journeesLoading } = useJournees();
  const { lieux, isLoading: lieuxLoading } = useLieux();
  const { virements } = useVirements(journees);
  const [rapportView, setRapportView] = useState<RapportView>("selection");
  const [rapportCourant, setRapportCourant] = useState<any>(null);
  const [rapportType, setRapportType] = useState<RapportType>("theorique");

  const anneesDisponibles = useMemo(() => {
    return RapportService.getAnneesDisponibles(journees);
  }, [journees]);

  const handleRapportSelect = (annee: number, trimestre?: number) => {
    if (rapportType === "comparatif") {
      if (trimestre) {
        const rapport =
          RapportComparatifService.genererRapportComparatifTrimestriel(
            journees,
            virements,
            lieux,
            annee,
            trimestre as 1 | 2 | 3 | 4
          );
        setRapportCourant(rapport);
        setRapportView("comparatif-trimestriel");
      } else {
        // Rapport comparatif annuel
        const rapport = RapportComparatifService.genererRapportComparatifAnnuel(
          journees,
          virements,
          lieux,
          annee
        );
        setRapportCourant(rapport);
        setRapportView("comparatif-annuel");
      }
    } else if (rapportType === "reel") {
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
          lieux,
          annee
        );
        setRapportCourant(rapport);
        setRapportView("reel-annuel");
      }
    } else {
      // Rapports existants (théoriques)
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
    }
  };

  const handleExport = (annee: number, trimestre?: number) => {
    if (rapportType === "theorique") {
      if (trimestre) {
        const rapport = RapportService.genererRapportTrimestriel(
          journees,
          lieux,
          annee,
          trimestre as 1 | 2 | 3 | 4
        );
        ExportService.exporterRapportTheoriquePDF(rapport, "trimestriel");
      } else {
        const rapport = RapportService.genererRapportAnnuel(
          journees,
          lieux,
          annee
        );
        ExportService.exporterRapportTheoriquePDF(rapport, "annuel");
      }
    } else if (rapportType === "reel") {
      if (trimestre) {
        const rapport = RapportReelService.genererRapportReelTrimestriel(
          virements,
          lieux,
          annee,
          trimestre as 1 | 2 | 3 | 4
        );
        ExportService.exporterRapportReelPDF(rapport, "trimestriel");
      } else {
        const rapport = RapportReelService.genererRapportReelAnnuel(
          virements,
          lieux,
          annee
        );
        ExportService.exporterRapportReelPDF(rapport, "annuel");
      }
    } else if (rapportType === "comparatif") {
      if (trimestre) {
        const rapport =
          RapportComparatifService.genererRapportComparatifTrimestriel(
            journees,
            virements,
            lieux,
            annee,
            trimestre as 1 | 2 | 3 | 4
          );
        ExportService.exporterRapportComparatifPDF(rapport, "trimestriel");
      } else {
        const rapport = RapportComparatifService.genererRapportComparatifAnnuel(
          journees,
          virements,
          lieux,
          annee
        );
        ExportService.exporterRapportComparatifPDF(rapport, "annuel");
      }
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
              Rapports et Analyses
            </h1>
            <p className="text-slate-600">
              Analysez vos honoraires théoriques, virements réels et comparez
              les données
            </p>
          </div>

          {/* Sélection du type de rapport */}
          <Card>
            <CardContent className="p-6">
              <Tabs
                value={rapportType}
                onValueChange={(value) => setRapportType(value as RapportType)}
              >
                <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto mb-6">
                  <TabsTrigger
                    value="theorique"
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Théorique
                  </TabsTrigger>
                  <TabsTrigger value="reel" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Réel
                  </TabsTrigger>
                  <TabsTrigger
                    value="comparatif"
                    className="flex items-center gap-2"
                  >
                    <GitCompareArrows className="h-4 w-4" />
                    Comparatif
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="theorique" className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">
                      Rapports Théoriques
                    </h3>
                    <p className="text-slate-600">
                      Basés sur vos déclarations quotidiennes
                    </p>
                  </div>
                  {journees.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      Aucune donnée de saisie disponible
                    </div>
                  ) : (
                    <RapportSelector
                      anneesDisponibles={anneesDisponibles}
                      onRapportSelect={handleRapportSelect}
                      onExport={handleExport}
                      rapportType="theorique"
                    />
                  )}
                </TabsContent>

                <TabsContent value="reel" className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">
                      Rapports Réels
                    </h3>
                    <p className="text-slate-600">
                      Basés sur vos virements effectivement reçus
                    </p>
                  </div>
                  {virements.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      Aucun virement enregistré. Rendez-vous dans l&apos;onglet
                      &quot;Virements&quot;.
                    </div>
                  ) : (
                    <RapportSelector
                      anneesDisponibles={anneesDisponibles}
                      onRapportSelect={handleRapportSelect}
                      onExport={handleExport}
                      rapportType="reel"
                    />
                  )}
                </TabsContent>

                <TabsContent value="comparatif" className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">
                      Rapports Comparatifs
                    </h3>
                    <p className="text-slate-600">
                      Comparez théorie et réalité pour détecter les écarts
                    </p>
                  </div>
                  {journees.length === 0 || virements.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      {journees.length === 0 && virements.length === 0
                        ? "Aucune donnée de saisie ni de virements disponibles"
                        : journees.length === 0
                        ? "Aucune donnée de saisie disponible"
                        : "Aucun virement enregistré"}
                    </div>
                  ) : (
                    <RapportSelector
                      anneesDisponibles={anneesDisponibles}
                      onRapportSelect={handleRapportSelect}
                      onExport={handleExport}
                      rapportType="comparatif"
                    />
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
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

      {/* Vue rapport reel trimestriel */}
      {rapportView === "reel-trimestriel" && rapportCourant && (
        <RapportReelTrimestrielView rapport={rapportCourant} />
      )}

      {/* Vue rapport reel annuel */}
      {rapportView === "reel-annuel" && rapportCourant && (
        <RapportReelAnnuelView rapport={rapportCourant} />
      )}

      {/* Vue rapport comparatif */}
      {rapportView === "comparatif-trimestriel" && rapportCourant && (
        <RapportComparatifTrimestrielView rapport={rapportCourant} />
      )}

      {/* Vue rapport comparatif annuel */}
      {rapportView === "comparatif-annuel" && rapportCourant && (
        <RapportComparatifAnnuelView rapport={rapportCourant} />
      )}
    </div>
  );
}
