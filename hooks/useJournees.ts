// hooks/useJournees.ts
import { useState, useEffect } from "react";
import { Journee, JourneeFormData, JourneeAvecLieu } from "@/types/journee";
import { LocalStorageProvider } from "@/lib/storage/localStorage";

const storage = new LocalStorageProvider();

export function useJournees() {
  const [journees, setJournees] = useState<JourneeAvecLieu[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadJournees();
  }, []);

  const loadJournees = async () => {
    setIsLoading(true);
    try {
      const [allJournees, allLieux] = await Promise.all([
        storage.getAllJournees(),
        storage.getAll(),
      ]);

      // Enrichir les journées avec les infos du lieu
      const journeesAvecLieu: JourneeAvecLieu[] = allJournees.map((journee) => {
        const lieu = allLieux.find((l) => l.id === journee.lieuId);
        return {
          ...journee,
          lieu: {
            nom: lieu?.nom || "Lieu inconnu",
            pourcentageRetrocession: lieu?.pourcentageRetrocession || 0,
            couleur: lieu?.couleur || "#000000",
          },
        };
      });

      // Trier par date (plus récent en premier)
      journeesAvecLieu.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setJournees(journeesAvecLieu);
    } catch (error) {
      console.error("Erreur lors du chargement des journées:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createJournee = async (data: JourneeFormData): Promise<Journee> => {
    // Récupérer le lieu pour calculer les honoraires théoriques
    const lieux = await storage.getAll();
    const lieu = lieux.find((l) => l.id === data.lieuId);

    if (!lieu) {
      throw new Error("Lieu non trouvé");
    }

    const honorairesTheoriques =
      (data.recettesTotales * lieu.pourcentageRetrocession) / 100;

    const nouvelleJournee: Omit<Journee, "id"> = {
      ...data,
      honorairesTheoriques,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const journeeCree = await storage.createJournee(nouvelleJournee);
    await loadJournees();
    return journeeCree;
  };

  const updateJournee = async (id: string, data: Partial<JourneeFormData>): Promise<Journee> => {
    let honorairesTheoriques: number | undefined
    
    // Recalculer les honoraires si les recettes ou le lieu changent
    if (data.recettesTotales !== undefined || data.lieuId !== undefined) {
      const lieux = await storage.getAll()
      const lieu = data.lieuId 
        ? lieux.find(l => l.id === data.lieuId)
        : lieux.find(l => l.id === journees.find(j => j.id === id)?.lieuId)
      
      if (lieu) {
        const recettes = data.recettesTotales !== undefined 
          ? data.recettesTotales 
          : journees.find(j => j.id === id)?.recettesTotales || 0
        
        honorairesTheoriques = (recettes * lieu.pourcentageRetrocession) / 100
      }
    }

    const updateData: Partial<Journee> = {
      ...data,
      ...(honorairesTheoriques !== undefined && { honorairesTheoriques }),
      updatedAt: new Date()
    }

    const journeeModifiee = await storage.updateJournee(id, updateData)
    await loadJournees()
    return journeeModifiee
  }

  const deleteJournee = async (id: string): Promise<void> => {
    await storage.deleteJournee(id);
    await loadJournees();
  };

  const getJourneesFiltrees = (filtres: {
    mois?: Date
    lieuId?: string
    annee?: number
  }) => {
    let result = [...journees]

    if (filtres.mois) {
      const annee = filtres.mois.getFullYear()
      const mois = filtres.mois.getMonth()
      result = result.filter(j => {
        const date = new Date(j.date)
        return date.getFullYear() === annee && date.getMonth() === mois
      })
    }

    if (filtres.annee) {
      result = result.filter(j => new Date(j.date).getFullYear() === filtres.annee)
    }

    if (filtres.lieuId) {
      result = result.filter(j => j.lieuId === filtres.lieuId)
    }

    return result
  }

  const getAllJournees = async () => {
    return [...journees];
  }

  const importJournees = async (journees: Journee[]): Promise<void> => {
    try {
      await storage.importJournees(journees)
      await loadJournees() // Recharger la liste
    } catch (error) {
      console.error('Erreur import journees:', error)
      throw error
    }
  }

  return {
    journees,
    isLoading,
    createJournee,
    updateJournee,
    deleteJournee,
    getJourneesFiltrees,
    getAllJournees,
    importJournees,
    refetch: loadJournees,
  };
}
