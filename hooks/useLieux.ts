// hooks/useLieux.ts
import { useState, useEffect } from "react";
import { Lieu, LieuFormData } from "@/types/lieu";
import { LocalStorageProvider } from "@/lib/storage/localStorage";

const storage = new LocalStorageProvider();

export function useLieux() {
  const [lieux, setLieux] = useState<Lieu[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLieux();
  }, []);

  const loadLieux = async () => {
    setIsLoading(true);
    try {
      const data = await storage.getAll();
      setLieux(data);
    } catch (error) {
      console.error("Erreur lors du chargement des lieux:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createLieu = async (data: LieuFormData): Promise<Lieu> => {
    const nouveauLieu: Lieu = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const nouveauLieuEnregistré = await storage.create(nouveauLieu);
    await loadLieux(); // Recharger la liste
    return nouveauLieuEnregistré;
  };

  const updateLieu = async (id: string, data: Partial<Lieu>): Promise<Lieu> => {
    const lieuModifie = await storage.update(id, data);
    await loadLieux();
    return lieuModifie;
  };

  const deleteLieu = async (id: string): Promise<void> => {
    await storage.delete(id);
    await loadLieux();
  };

  const importLieux = async (lieux: Lieu[]): Promise<void> => {
    try {
      await storage.importLieux(lieux);
      await loadLieux(); // Recharger la liste
    } catch (error) {
      console.error("Erreur import lieux:", error);
      throw error;
    }
  };

  return {
    lieux,
    isLoading,
    createLieu,
    updateLieu,
    deleteLieu,
    importLieux,
    refetch: loadLieux,
  };
}
