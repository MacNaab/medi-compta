// hooks/useVirements.ts
import { useState, useEffect, useMemo } from "react";
import { Virement, VirementFormData, VirementAvecLieu } from "@/types/virement";
import { JourneeAvecLieu } from "@/types/journee";
import { LocalStorageProvider } from "@/lib/storage/localStorage";

const storage = new LocalStorageProvider();

export function useVirements(journees: JourneeAvecLieu[]) {
  const [virements, setVirements] = useState<Virement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVirements();
  }, []);

  const loadVirements = async () => {
    setIsLoading(true);
    try {
      const data = await storage.getAllVirements();
      setVirements(data);
    } catch (error) {
      console.error("Erreur lors du chargement des virements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Enrichir les virements avec les données calculées
  const virementsAvecDetails = useMemo((): VirementAvecLieu[] => {
    return virements.map((virement) => {
      // Calculer le montant théorique pour la période du virement
      const journeesPeriode = journees.filter((j) => {
        const dateJournee = new Date(j.date);
        return (
          dateJournee >= virement.dateDebut &&
          dateJournee <= virement.dateFin &&
          j.lieuId === virement.lieuId
        );
      });

      const montantTheorique = journeesPeriode.reduce(
        (sum, j) => sum + j.honorairesTheoriques,
        0
      );
      const difference = virement.montantRecu - montantTheorique;

      return {
        ...virement,
        lieu: {
          nom:
            journees.find((j) => j.lieuId === virement.lieuId)?.lieu.nom ||
            "Lieu inconnu",
          couleur:
            journees.find((j) => j.lieuId === virement.lieuId)?.lieu.couleur ||
            "#3b82f6",
        },
        montantTheorique,
        difference,
      };
    });
  }, [virements, journees]);

  const createVirement = async (data: VirementFormData): Promise<Virement> => {
    const nouveauVirement: Virement = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const nouveauVirementEnregistre = await storage.createVirement(nouveauVirement);
    await loadVirements();
    return nouveauVirementEnregistre;
  };

  const updateVirement = async (
    id: string,
    data: Partial<Virement>
  ): Promise<Virement> => {
    const virementModifie = await storage.updateVirement(id, data);
    await loadVirements();
    return virementModifie;
  };

  const deleteVirement = async (id: string): Promise<void> => {
    await storage.deleteVirement(id);
    await loadVirements();
  };

  /*
  // Obtenir les périodes sans virement pour un lieu donné
  const getPeriodesSansVirement = (lieuId: string) => {
    const virementsLieu = virements.filter((v) => v.lieuId === lieuId);
    // Implémentation à compléter selon les besoins
    return [];
  };
  */

  const getVirementsBruts = async (): Promise<Virement[]> => {
    return await storage.getAllVirements()
  }

  const importVirements = async (virements: Virement[]): Promise<void> => {
    try {
      await storage.importVirements(virements)
      await loadVirements() // Recharger la liste
    } catch (error) {
      console.error('Erreur import virements:', error)
      throw error
    }
  }

  return {
    virements: virementsAvecDetails,
    isLoading,
    createVirement,
    updateVirement,
    deleteVirement,
    getVirementsBruts,
    importVirements,
    refetch: loadVirements,
    // getPeriodesSansVirement,
  };
}
