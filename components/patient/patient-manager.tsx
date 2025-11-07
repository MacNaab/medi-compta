// components/patient/patient-manager.tsx
"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Consultation, ConsultationFormData } from "@/types/consultation";
import { useConsultations } from "@/hooks/useConsultations";
import { useJournees } from "@/hooks/useJournees";
import { useLieux } from "@/hooks/useLieux";
import { AgendaMedical } from "./agenda-medical";
import { ConsultationForm } from "./consultation-form";
import { ListeConsultations } from "./liste-consultations";
import { ResumeJournee } from "./resume-journee";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, List, BarChart3, FileText } from "lucide-react";
import { ModalLieuSelection } from "./modal-lieu-selection";
import { JourneeFormData } from "@/types/journee";
import { Acte } from "@/types/acte";
import { ActesManager } from "./actes-manager";

type ViewMode = "agenda" | "create" | "edit";
type ActiveTab = "agenda" | "liste" | "resume" | "actes";

export function PatientManager() {
  const {
    // consultations,
    isLoading,
    createConsultation,
    updateConsultation,
    deleteConsultation,
    getConsultationsParDate,
  } = useConsultations();
  const { createJournee } = useJournees();
  const { lieux } = useLieux();

  const [viewMode, setViewMode] = useState<ViewMode>("agenda");
  const [activeTab, setActiveTab] = useState<ActiveTab>("agenda");

  const [selectedConsultation, setSelectedConsultation] =
    useState<Consultation | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHeure, setSelectedHeure] = useState<string>("");
  const [showModalLieu, setShowModalLieu] = useState(false);
  const [selectedActe, setSelectedActe] = useState<Acte | null>(null);

  // Consultations pour la date sélectionnée
  const consultationsDuJour = useMemo(() => {
    return getConsultationsParDate(selectedDate);
  }, [getConsultationsParDate, selectedDate]);

  // Calcul du total de la journée pour le modal
  const totalJournee = useMemo(() => {
    return consultationsDuJour.reduce((sum, c) => sum + c.montantTotal, 0);
  }, [consultationsDuJour]);

  const handleCreateConsultation = (heure?: string) => {
    setSelectedConsultation(null);
    setSelectedHeure(heure || "");
    setViewMode("create");
    setSelectedActe(null); // Réinitialiser l'acte sélectionné
  };

  const handleEditConsultation = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setViewMode("edit");
    setSelectedActe(null); // Réinitialiser l'acte sélectionné
  };

  const handleSubmitConsultation = async (data: ConsultationFormData) => {
    if (viewMode === "create") {
      await createConsultation(data);
    } else if (viewMode === "edit" && selectedConsultation) {
      await updateConsultation(selectedConsultation.id, data);
    }
    setViewMode("agenda");
    setSelectedConsultation(null);
    setSelectedHeure("");
    setSelectedActe(null);
  };

  const handleCancel = () => {
    setViewMode("agenda");
    setSelectedConsultation(null);
    setSelectedHeure("");
    setSelectedActe(null);
  };

  // Gestion de la sélection d'acte
  const handleActeSelect = (acte: Acte) => {
    setSelectedActe(acte);
    setViewMode("create");
  };

  // Ouvrir le modal pour créer une journée
  const handleOuvrirModalJournee = () => {
    if (consultationsDuJour.length === 0) {
      toast.error("Aucune consultation à exporter vers une journée.");
      return;
    }
    if (lieux.length === 0) {
      toast.error("Vous devez d'abord créer au moins un lieu de travail.");
      return;
    }
    setShowModalLieu(true);
  };

  // Créer une journée après sélection du lieu
  const handleCreerJournee = async (lieuId: string, total: number) => {
    try {
      const journeeData: JourneeFormData = {
        date: selectedDate,
        lieuId: lieuId,
        recettesTotales: total,
        notes: `Généré depuis le tracking patients - ${consultationsDuJour.length} consultation(s)`,
      };

      await createJournee(journeeData);
      setShowModalLieu(false);
      toast.success("Journée créée avec succès dans la saisie !");
    } catch (error) {
      console.error("Erreur lors de la création de la journée:", error);
      toast.error("Erreur lors de la création de la journée.");
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Tracking Patients
          </h1>
          <p className="text-slate-600">
            Gérez vos consultations et suivez vos revenus
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => handleCreateConsultation()}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle consultation
          </Button>
          <Button
            onClick={handleOuvrirModalJournee}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
            disabled={consultationsDuJour.length === 0 || lieux.length === 0}
          >
            Créer journée
          </Button>
        </div>
      </div>

      {/* Onglets */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ActiveTab)}
      >
        <TabsList className="grid w-full grid-cols-4 max-w-xl">
          <TabsTrigger value="agenda" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Agenda
          </TabsTrigger>
          <TabsTrigger value="liste" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Liste
          </TabsTrigger>
          <TabsTrigger value="resume" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Résumé
          </TabsTrigger>
          <TabsTrigger value="actes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Actes
          </TabsTrigger>
        </TabsList>

        <div className="text-center">
          <h3 className="text-xl font-semibold text-slate-800">
            {selectedDate.toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </h3>
        </div>

        {/* Onglet Agenda */}
        <TabsContent value="agenda" className="space-y-6">
          <AgendaMedical
            date={selectedDate}
            onDateChange={setSelectedDate}
            consultations={consultationsDuJour}
            onCreateConsultation={handleCreateConsultation}
            onEditConsultation={handleEditConsultation}
          />
        </TabsContent>

        {/* Onglet Liste */}
        <TabsContent value="liste" className="space-y-6">
          <ListeConsultations
            consultations={consultationsDuJour}
            onEdit={handleEditConsultation}
            onDelete={deleteConsultation}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* Onglet Résumé */}
        <TabsContent value="resume" className="space-y-6">
          <ResumeJournee
            date={selectedDate}
            consultations={consultationsDuJour}
            onExport={() => {
              /* À implémenter */
            }}
          />
        </TabsContent>

        {/* NOUVEL ONGLET : Actes */}
        <TabsContent value="actes" className="space-y-6">
          <ActesManager onActeSelect={handleActeSelect} modeSelection={false} />
        </TabsContent>
      </Tabs>

      {/* Modal de sélection du lieu */}
      <ModalLieuSelection
        lieux={lieux}
        isOpen={showModalLieu}
        onClose={() => setShowModalLieu(false)}
        onConfirm={handleCreerJournee}
        totalJournee={totalJournee}
      />

      {/* Modal de création/édition */}
      <Dialog
        open={viewMode !== "agenda"}
        onOpenChange={(open) => !open && handleCancel()}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-6 w-6 text-blue-600" />
            {viewMode === "create"
              ? "Nouvelle Consultation"
              : "Modifier la Consultation"}
          </DialogTitle>
          <ConsultationForm
            onSubmit={handleSubmitConsultation}
            onCancel={handleCancel}
            isLoading={isLoading}
            datePredefinie={selectedDate}
            heurePredefinie={selectedHeure}
            consultationExistante={
              viewMode === "edit" ? selectedConsultation : undefined
            }
            actePredefini={selectedActe}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
