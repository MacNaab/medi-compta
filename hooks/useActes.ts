// hooks/useActes.ts
import { useState, useEffect, useCallback } from "react";
import { Acte, ActeFormData } from "@/types/acte";
import { LocalStorageProvider } from "@/lib/storage/localStorage";
import { ACTES_PAR_DEFAUT } from "@/lib/utils";
import { toast } from "sonner";

const storage = new LocalStorageProvider();

export function useActes() {
  const [actes, setActes] = useState<Acte[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadActes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await storage.getAllActes();

      // Si aucun acte n'existe, initialiser avec les actes par défaut
      if (data.length === 0) {
        await initialiserActesParDefaut();
        const newData = await storage.getAllActes();
        setActes(newData);
      } else {
        setActes(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des actes:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActes();
  }, [loadActes]);

  const initialiserActesParDefaut = async () => {
    for (const acteData of ACTES_PAR_DEFAUT) {
      await storage.createActe(acteData);
    }
  };

  const createActe = async (data: ActeFormData): Promise<Acte> => {
    const nouvelActe: Acte = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const acteCree = await storage.createActe(nouvelActe);
    await loadActes();
    return acteCree;
  };

  const updateActe = async (
    id: string,
    data: Partial<ActeFormData>
  ): Promise<Acte> => {
    const acteModifie = await storage.updateActe(id, {
      ...data,
      updatedAt: new Date(),
    });
    await loadActes();
    return acteModifie;
  };

  const deleteActe = async (id: string): Promise<void> => {
    await storage.deleteActe(id);
    await loadActes();
  };

  const getActeByCode = (code: string): Acte | undefined => {
    return actes.find((acte) => acte.code === code);
  };

  // NOUVELLE MÉTHODE : Réinitialiser les actes
  const reinitialiserActes = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Vider complètement la table
      await storage.clearActes();

      // Réinitialiser avec les actes par défaut
      await initialiserActesParDefaut();

      // Recharger la liste
      await loadActes();

      toast.success("Actes réinitialisés avec succès !");
    } catch (error) {
      console.error("Erreur lors de la réinitialisation des actes:", error);
      toast.error("Erreur lors de la réinitialisation des actes.");
    } finally {
      setIsLoading(false);
    }
  };

  const importActes = async (actesData: Acte[]): Promise<void> => {
    try {
      // Vider complètement la table
      await storage.clearActes();

      for (const acteData of actesData) {
        await storage.createActe(acteData);
      }
      await loadActes();
    } catch (error) {
      console.error("Erreur lors de l'importation des actes:", error);
      throw error;
    }
  };

  return {
    actes,
    isLoading,
    createActe,
    updateActe,
    deleteActe,
    getActeByCode,
    reinitialiserActes,
    importActes,
    refetch: loadActes,
  };
}
