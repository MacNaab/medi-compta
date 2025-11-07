// hooks/useConsultations.ts
import { useState, useEffect } from "react";
import {
  Consultation,
  ConsultationFormData,
  ResumeJournee,
} from "@/types/consultation";
import { LocalStorageProvider } from "@/lib/storage/localStorage";

const storage = new LocalStorageProvider();

export function useConsultations() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConsultations();
  }, []);

  const loadConsultations = async () => {
    setIsLoading(true);
    try {
      const data = await storage.getAllConsultations();
      setConsultations(data);
    } catch (error) {
      console.error("Erreur lors du chargement des consultations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createConsultation = async (
    data: ConsultationFormData
  ): Promise<Consultation> => {
    const nouvelleConsultation: Consultation = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const consultationCree = await storage.createConsultation(
      nouvelleConsultation
    );
    await loadConsultations();
    return consultationCree;
  };

  const updateConsultation = async (
    id: string,
    data: Partial<ConsultationFormData>
  ): Promise<Consultation> => {
    const consultationModifiee = await storage.updateConsultation(id, {
      ...data,
      updatedAt: new Date(),
    });
    await loadConsultations();
    return consultationModifiee;
  };

  const deleteConsultation = async (id: string): Promise<void> => {
    await storage.deleteConsultation(id);
    await loadConsultations();
  };

  // Résumé pour une date spécifique
  const getResumeJournee = (date: Date): ResumeJournee => {
    const consultationsJour = consultations.filter((consult) => {
      const consultDate = new Date(consult.date);
      return consultDate.toDateString() === date.toDateString();
    });

    const totalCarte = consultationsJour
      .filter((c) => c.modePaiement === "carte")
      .reduce((sum, c) => sum + c.montantTotal, 0);

    const totalCheque = consultationsJour
      .filter((c) => c.modePaiement === "cheque")
      .reduce((sum, c) => sum + c.montantTotal, 0);

    const totalEspeces = consultationsJour
      .filter((c) => c.modePaiement === "especes")
      .reduce((sum, c) => sum + c.montantTotal, 0);

    const totalPrisEnCharge = consultationsJour
      .filter((c) => c.modePaiement === null)
      .reduce((sum, c) => sum + c.montantTotal, 0);

    const totalGeneral = consultationsJour.reduce(
      (sum, c) => sum + c.montantTotal,
      0
    );

    return {
      date,
      totalCarte,
      totalCheque,
      totalEspeces,
      totalPrisEnCharge,
      totalGeneral,
      nombreConsultations: consultationsJour.length,
    };
  };

  // Filtrer par date
  const getConsultationsParDate = (date: Date) => {
    return consultations.filter((consult) => {
      const consultDate = new Date(consult.date);
      return consultDate.toDateString() === date.toDateString();
    });
  };

  const importConsultations = async (data: Consultation[]): Promise<void> => {
    try {
      await storage.importConsultations(data);
      await loadConsultations();
    } catch (error) {
      console.error("Erreur lors de l'importation des consultations:", error);
      throw error;
    }
  };

  return {
    consultations,
    isLoading,
    createConsultation,
    updateConsultation,
    deleteConsultation,
    getResumeJournee,
    getConsultationsParDate,
    importConsultations,
    refetch: loadConsultations,
  };
}
