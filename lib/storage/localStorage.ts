/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/storage/localStorage.ts
import { BaseStorage } from "./base";
import { Lieu } from "@/types/lieu";
import { Journee } from "@/types/journee";
import { Virement } from "@/types/virement";

const STORAGE_KEY = "medecin-lieux";
const JOURNEES_STORAGE_KEY = "medecin-journees";
const VIREMENTS_STORAGE_KEY = "medecin-virements";

export class LocalStorageProvider extends BaseStorage {
  async getAll(): Promise<Lieu[]> {
    if (typeof window === "undefined") return [];

    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const lieux = JSON.parse(data) as any[];
    return lieux.map((l) => ({
      ...l,
      createdAt: new Date(l.createdAt),
      updatedAt: new Date(l.updatedAt),
    }));
  }

  async getById(id: string): Promise<Lieu | null> {
    const lieux = await this.getAll();
    return lieux.find((l) => l.id === id) || null;
  }

  async create(lieuData: Omit<Lieu, "id">): Promise<Lieu> {
    const lieux = await this.getAll();
    const nouveauLieu: Lieu = {
      ...lieuData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    lieux.push(nouveauLieu);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lieux));
    return nouveauLieu;
  }

  async update(id: string, lieuData: Partial<Lieu>): Promise<Lieu> {
    const lieux = await this.getAll();
    const index = lieux.findIndex((l) => l.id === id);

    if (index === -1) {
      throw new Error("Lieu non trouvé");
    }

    const lieuModifie: Lieu = {
      ...lieux[index],
      ...lieuData,
      updatedAt: new Date(),
    };

    lieux[index] = lieuModifie;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lieux));
    return lieuModifie;
  }

  async delete(id: string): Promise<void> {
    const lieux = await this.getAll();
    const lieuxFiltres = lieux.filter((l) => l.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lieuxFiltres));
  }

  // Méthodes pour les journées
  async getAllJournees(): Promise<Journee[]> {
    if (typeof window === "undefined") return [];

    const data = localStorage.getItem(JOURNEES_STORAGE_KEY);
    if (!data) return [];

    const journees = JSON.parse(data) as any[];
    return journees.map((j) => ({
      ...j,
      date: new Date(j.date),
      createdAt: new Date(j.createdAt),
      updatedAt: new Date(j.updatedAt),
    }));
  }

  async createJournee(journeeData: Omit<Journee, "id">): Promise<Journee> {
    const journees = await this.getAllJournees();
    const nouvelleJournee: Journee = {
      ...journeeData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    journees.push(nouvelleJournee);
    localStorage.setItem(JOURNEES_STORAGE_KEY, JSON.stringify(journees));
    return nouvelleJournee;
  }

  async getJourneesByLieu(lieuId: string): Promise<Journee[]> {
    const journees = await this.getAllJournees();
    return journees.filter((j) => j.lieuId === lieuId);
  }

  async getJourneesByMois(annee: number, mois: number): Promise<Journee[]> {
    const journees = await this.getAllJournees();
    return journees.filter((j) => {
      const date = new Date(j.date);
      return date.getFullYear() === annee && date.getMonth() === mois;
    });
  }

  async updateJournee(
    id: string,
    journeeData: Partial<Journee>
  ): Promise<Journee> {
    const journees = await this.getAllJournees();
    const index = journees.findIndex((j) => j.id === id);

    if (index === -1) {
      throw new Error("Journée non trouvée");
    }

    const journeeModifiee: Journee = {
      ...journees[index],
      ...journeeData,
      updatedAt: new Date(),
    };

    journees[index] = journeeModifiee;
    localStorage.setItem(JOURNEES_STORAGE_KEY, JSON.stringify(journees));
    return journeeModifiee;
  }

  async deleteJournee(id: string): Promise<void> {
    const journees = await this.getAllJournees();
    const journeesFiltrees = journees.filter((j) => j.id !== id);
    localStorage.setItem(
      JOURNEES_STORAGE_KEY,
      JSON.stringify(journeesFiltrees)
    );
  }

  async getJourneesByPeriode(debut: Date, fin: Date): Promise<Journee[]> {
    const journees = await this.getAllJournees();
    return journees.filter((j) => {
      const date = new Date(j.date);
      return date >= debut && date <= fin;
    });
  }

  // Méthodes pour les virements
  async getAllVirements(): Promise<Virement[]> {
    if (typeof window === "undefined") return [];

    const data = localStorage.getItem(VIREMENTS_STORAGE_KEY);
    if (!data) return [];

    const virements = JSON.parse(data) as any[];
    return virements.map((v) => ({
      ...v,
      dateDebut: new Date(v.dateDebut),
      dateFin: new Date(v.dateFin),
      dateReception: new Date(v.dateReception),
      createdAt: new Date(v.createdAt),
      updatedAt: new Date(v.updatedAt),
    }));
  }

  async createVirement(virementData: Omit<Virement, "id">): Promise<Virement> {
    const virements = await this.getAllVirements();
    const nouveauVirement: Virement = {
      ...virementData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    virements.push(nouveauVirement);
    localStorage.setItem(VIREMENTS_STORAGE_KEY, JSON.stringify(virements));
    return nouveauVirement;
  }

  async updateVirement(
    id: string,
    virementData: Partial<Virement>
  ): Promise<Virement> {
    const virements = await this.getAllVirements();
    const index = virements.findIndex((v) => v.id === id);

    if (index === -1) {
      throw new Error("Virement non trouvé");
    }

    const virementModifie: Virement = {
      ...virements[index],
      ...virementData,
      updatedAt: new Date(),
    };

    virements[index] = virementModifie;
    localStorage.setItem(VIREMENTS_STORAGE_KEY, JSON.stringify(virements));
    return virementModifie;
  }

  async deleteVirement(id: string): Promise<void> {
    const virements = await this.getAllVirements();
    const virementsFiltres = virements.filter((v) => v.id !== id);
    localStorage.setItem(
      VIREMENTS_STORAGE_KEY,
      JSON.stringify(virementsFiltres)
    );
  }

  // NOUVELLES MÉTHODES D'IMPORT DIRECT
  async importLieux(lieux: Lieu[]): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lieux))
  }

  async importJournees(journees: Journee[]): Promise<void> {
    localStorage.setItem(JOURNEES_STORAGE_KEY, JSON.stringify(journees))
  }

  async importVirements(virements: Virement[]): Promise<void> {
<<<<<<< Updated upstream
    localStorage.setItem(VIREMENTS_STORAGE_KEY, JSON.stringify(virements))
=======
    localStorage.setItem(VIREMENTS_STORAGE_KEY, JSON.stringify(virements));
>>>>>>> Stashed changes
  }

  // Méthode pour vider complètement les données
  async clearAll(): Promise<void> {
<<<<<<< Updated upstream
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(JOURNEES_STORAGE_KEY)
    localStorage.removeItem(VIREMENTS_STORAGE_KEY)
=======
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(JOURNEES_STORAGE_KEY);
    localStorage.removeItem(VIREMENTS_STORAGE_KEY);
>>>>>>> Stashed changes
  }
}
