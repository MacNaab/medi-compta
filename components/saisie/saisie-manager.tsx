// components/saisie/saisie-manager.tsx
"use client";

import { useState, useMemo } from "react";
import { JourneeFormData, JourneeAvecLieu } from "@/types/journee";
import { useJournees } from "@/hooks/useJournees";
import { useLieux } from "@/hooks/useLieux";
import { SaisieForm } from "./saisie-form";
import { JourneesList } from "./journees-list";
import { FiltresSaisie } from "./filtres-saisie";
import { CalendrierSaisie } from "./calendrier-saisie";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, BarChart3, List, Calendar, Calculator } from "lucide-react";
import Link from "next/link";

type ViewMode = "list" | "create" | "edit";
type ActiveTab = "liste" | "statistiques";

export function SaisieManager() {
  const {
    journees,
    isLoading,
    createJournee,
    updateJournee,
    deleteJournee,
    getJourneesFiltrees,
  } = useJournees();
  const { lieux, isLoading: lieuxLoading } = useLieux();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [activeTab, setActiveTab] = useState<ActiveTab>("liste");
  const [selectedJournee, setSelectedJournee] =
    useState<JourneeAvecLieu | null>(null);
  const [filtres, setFiltres] = useState<{
    mois?: Date;
    lieuId?: string;
    annee?: number;
  }>({});

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Appliquer les filtres aux journées
  const journeesFiltrees = useMemo(() => {
    return getJourneesFiltrees(filtres);
  }, [filtres, getJourneesFiltrees]);

  const handleCreate = () => {
    setSelectedJournee(null);
    setViewMode("create");
  };

  const handleEdit = (journee: JourneeAvecLieu) => {
    setSelectedJournee(journee);
    setViewMode("edit");
  };

  const handleDelete = async (journee: JourneeAvecLieu) => {
    if (
      confirm(
        `Êtes-vous sûr de vouloir supprimer la journée du ${new Date(
          journee.date
        ).toLocaleDateString("fr-FR")} ?`
      )
    ) {
      await deleteJournee(journee.id);
    }
  };

  const handleSubmit = async (data: JourneeFormData) => {
    if (viewMode === "create") {
      await createJournee(data);
    } else if (viewMode === "edit" && selectedJournee) {
      await updateJournee(selectedJournee.id, data);
    }
    setViewMode("list");
    setSelectedJournee(null);
  };

  const handleCancel = () => {
    setViewMode("list");
    setSelectedJournee(null);
  };

  const handleFiltresChange = (nouveauxFiltres: typeof filtres) => {
    setFiltres(nouveauxFiltres);
  };

  const handleDateClick = (date: Date) => {
    setSelectedJournee(null);
    setViewMode("create");
    // Pré-remplir la date dans le formulaire
    setSelectedDate(date);
  };

  const handleJourneeClick = (journee: JourneeAvecLieu) => {
    setSelectedJournee(journee);
    setViewMode("edit");
  };

  // Calcul des statistiques pour l'onglet statistiques
  const statistiques = useMemo(() => {
    const totalRecettes = journeesFiltrees.reduce(
      (sum, j) => sum + j.recettesTotales,
      0
    );
    const totalHonoraires = journeesFiltrees.reduce(
      (sum, j) => sum + j.honorairesTheoriques,
      0
    );
    const moyenneParJour =
      journeesFiltrees.length > 0
        ? totalHonoraires / journeesFiltrees.length
        : 0;

    // Par lieu
    const parLieu = lieux
      .map((lieu) => {
        const journeesLieu = journeesFiltrees.filter(
          (j) => j.lieuId === lieu.id
        );
        const totalLieu = journeesLieu.reduce(
          (sum, j) => sum + j.honorairesTheoriques,
          0
        );
        return {
          lieu: lieu.nom,
          nombreJours: journeesLieu.length,
          totalHonoraires: totalLieu,
          pourcentageTotal:
            totalHonoraires > 0 ? (totalLieu / totalHonoraires) * 100 : 0,
          couleur: lieu.couleur,
        };
      })
      .filter((stat) => stat.nombreJours > 0);

    return {
      totalRecettes,
      totalHonoraires,
      moyenneParJour,
      nombreJours: journeesFiltrees.length,
      parLieu,
    };
  }, [journeesFiltrees, lieux]);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* En-tête avec actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Saisie Quotidienne
          </h1>
          <p className="text-slate-600">
            Gérez vos déclarations de revenus et suivez vos honoraires
          </p>
        </div>

        <Button
          onClick={handleCreate}
          className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
          disabled={lieux.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle saisie
        </Button>
      </div>

      {lieux.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            ⚠️ Vous devez d&apos;abord créer au moins un lieu de travail avant
            de pouvoir saisir des journées.
          </p>
          <Button
            variant="link"
            className="text-yellow-800 p-0 h-auto mt-2"
            asChild
          >
            <Link href="/lieux">Créer un lieu de travail</Link>
          </Button>
        </div>
      )}

      {/* Filtres */}
      <FiltresSaisie lieux={lieux} onFiltresChange={handleFiltresChange} />

      {/* Onglets */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ActiveTab)}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3 max-w-sm">
          <TabsTrigger value="calendrier" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendrier
          </TabsTrigger>
          <TabsTrigger value="liste" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Liste
          </TabsTrigger>
          <TabsTrigger value="statistiques" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistiques
          </TabsTrigger>
        </TabsList>

        {/* Onglet Calendrier */}
        <TabsContent value="calendrier" className="space-y-6">
          <CalendrierSaisie
            journees={journees}
            onDateClick={handleDateClick}
            onJourneeClick={handleJourneeClick}
            onCreateClick={handleCreate}
          />
        </TabsContent>

        {/* Onglet Liste */}
        <TabsContent value="liste" className="space-y-6">
          <JourneesList
            journees={journeesFiltrees}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* Onglet Statistiques */}
        <TabsContent value="statistiques" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cartes de statistiques */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 text-center">
              <div className="text-2xl font-bold text-slate-800 mb-2">
                {statistiques.nombreJours}
              </div>
              <div className="text-slate-600 text-sm">Jours travaillés</div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-6 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {statistiques.totalRecettes.toFixed(2)} €
              </div>
              <div className="text-slate-600 text-sm">Total recettes</div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-6 text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {statistiques.totalHonoraires.toFixed(2)} €
              </div>
              <div className="text-slate-600 text-sm">Total honoraires</div>
            </div>
          </div>

          {/* Moyenne par jour */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Performance moyenne
            </h3>
            <div className="text-3xl font-bold text-purple-600">
              {statistiques.moyenneParJour.toFixed(2)} €
            </div>
            <p className="text-slate-600 text-sm mt-2">
              Honoraires moyens par jour travaillé
            </p>
          </div>

          {/* Répartition par lieu */}
          {statistiques.parLieu.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Répartition par lieu
              </h3>
              <div className="space-y-4">
                {statistiques.parLieu.map((stat, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-slate-700">
                          {stat.lieu}
                        </span>
                        <span className="text-slate-600">
                          {stat.totalHonoraires.toFixed(2)} € (
                          {stat.pourcentageTotal.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${stat.pourcentageTotal}%`,
                            backgroundColor: stat.couleur,
                          }}
                        />
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {stat.nombreJours} jour{stat.nombreJours > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de création/édition */}
      <Dialog
        open={viewMode !== "list"}
        onOpenChange={(open) => !open && handleCancel()}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-6 w-6 text-green-600" />
            {viewMode === "create" ? "Nouvelle Saisie" : "Modifier la Saisie"}
          </DialogTitle>
          {(viewMode === "create" || viewMode === "edit") && (
            <SaisieForm
              lieux={lieux}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={isLoading || lieuxLoading}
              datePredefinie={viewMode === "create" ? selectedDate : undefined}
              journeeExistante={viewMode === 'edit' ? selectedJournee : undefined}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
