/* eslint-disable @typescript-eslint/no-explicit-any */
// services/export-import-service.ts
import { DonneesExport } from "@/types/export";
import { Lieu } from "@/types/lieu";
import { Journee } from "@/types/journee";
import { Virement } from "@/types/virement";

export class ExportImportService {
  private static VERSION = "1.0.0";

  // Export vers JSON
  static exporterDonnees(
    lieux: Lieu[],
    journees: Journee[],
    virements: Virement[]
  ): void {
    const donnees: DonneesExport = {
      version: this.VERSION,
      dateExport: new Date().toISOString(),
      lieux,
      journees,
      virements,
    };

    const donneesJSON = JSON.stringify(donnees, null, 2);
    this.downloadJSON(
      donneesJSON,
      `sauvegarde-honoraires-${new Date().toISOString().split("T")[0]}.json`
    );
  }

  // Import depuis JSON
  static async importerDonnees(file: File): Promise<{
    lieux: Lieu[];
    journees: Journee[];
    virements: Virement[];
  }> {
    // Changement du type de retour
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const contenu = e.target?.result as string;
          const donnees: DonneesExport = JSON.parse(contenu);

          // Valider la structure
          if (!this.validerDonnees(donnees)) {
            throw new Error("Format de fichier invalide");
          }

          // VALIDATION : Vérifier l'intégrité des données
          const erreursValidation = this.validerIntegriteDonnees(donnees);
          if (erreursValidation.length > 0) {
            throw new Error(
              `Données incohérentes : ${erreursValidation.join(", ")}`
            );
          }

          // Convertir les dates (MAIS GARDER LES IDs ORIGINAUX)
          const lieux = donnees.lieux.map((l) => ({
            ...l,
            createdAt: new Date(l.createdAt),
            updatedAt: new Date(l.updatedAt),
            // ID conservé tel quel
          }));

          const journees = donnees.journees.map((j) => ({
            ...j,
            date: new Date(j.date),
            createdAt: new Date(j.createdAt),
            updatedAt: new Date(j.updatedAt),
            // ID conservé tel quel
          }));

          const virements = donnees.virements.map((v) => ({
            ...v,
            dateDebut: new Date(v.dateDebut),
            dateFin: new Date(v.dateFin),
            dateReception: new Date(v.dateReception),
            createdAt: new Date(v.createdAt),
            updatedAt: new Date(v.updatedAt),
            // ID conservé tel quel
          }));

          // Retourner les données AVEC leurs IDs originaux
          resolve({
            lieux,
            journees,
            virements,
          });
        } catch (error) {
          console.error("Erreur détaillée import:", error);
          reject(
            new Error(
              "Erreur lors de la lecture du fichier: " +
                (error as Error).message
            )
          );
        }
      };

      reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
      reader.readAsText(file);
    });
  }

  private static validerIntegriteDonnees(donnees: DonneesExport): string[] {
    const erreurs: string[] = [];

    // Vérifier que toutes les journées référencent des lieux existants
    const idsLieux = new Set(donnees.lieux.map((l) => l.id));
    const lieuxManquants = new Set<string>();

    donnees.journees.forEach((journee) => {
      if (!idsLieux.has(journee.lieuId)) {
        lieuxManquants.add(journee.lieuId);
      }
    });

    if (lieuxManquants.size > 0) {
      erreurs.push(
        `Lieux manquants pour les journées: ${Array.from(lieuxManquants).join(
          ", "
        )}`
      );
    }

    // Vérifier que tous les virements référencent des lieux existants
    const lieuxManquantsVirements = new Set<string>();
    donnees.virements.forEach((virement) => {
      if (!idsLieux.has(virement.lieuId)) {
        lieuxManquantsVirements.add(virement.lieuId);
      }
    });

    if (lieuxManquantsVirements.size > 0) {
      erreurs.push(
        `Lieux manquants pour les virements: ${Array.from(
          lieuxManquantsVirements
        ).join(", ")}`
      );
    }

    return erreurs;
  }

  // Export vers Excel (CSV simplifié)
  static exporterExcel(
    lieux: Lieu[],
    journees: Journee[],
    virements: Virement[]
  ): void {
    // Feuille Lieux
    const entetesLieux = [
      "Nom",
      "Rétrocession %",
      "Couleur",
      "Adresse",
      "Téléphone",
      "Email",
    ];
    const donneesLieux = lieux.map((l) => [
      l.nom,
      l.pourcentageRetrocession.toString(),
      l.couleur,
      l.adresse || "",
      l.telephone || "",
      l.email || "",
    ]);

    // Feuille Journées
    const entetesJournees = [
      "Date",
      "Lieu",
      "Recettes Totales (€)",
      "Honoraires Théoriques (€)",
      "Notes",
    ];
    const donneesJournees = journees.map((j) => {
      const lieu = lieux.find((l) => l.id === j.lieuId);
      return [
        new Date(j.date).toLocaleDateString("fr-FR"),
        lieu?.nom || "Lieu inconnu",
        j.recettesTotales.toString(),
        j.honorairesTheoriques.toString(),
        j.notes || "",
      ];
    });

    // Feuille Virements
    const entetesVirements = [
      "Lieu",
      "Période Début",
      "Période Fin",
      "Montant Reçu (€)",
      "Date Réception",
      "Statut",
      "Notes",
    ];
    const donneesVirements = virements.map((v) => {
      const lieu = lieux.find((l) => l.id === v.lieuId);
      return [
        lieu?.nom || "Lieu inconnu",
        new Date(v.dateDebut).toLocaleDateString("fr-FR"),
        new Date(v.dateFin).toLocaleDateString("fr-FR"),
        v.montantRecu.toString(),
        new Date(v.dateReception).toLocaleDateString("fr-FR"),
        v.statut,
        v.notes || "",
      ];
    });

    // Créer le contenu CSV
    const contenu = this.creerCSVMultiFeuilles([
      { nom: "Lieux", entetes: entetesLieux, donnees: donneesLieux },
      { nom: "Journees", entetes: entetesJournees, donnees: donneesJournees },
      {
        nom: "Virements",
        entetes: entetesVirements,
        donnees: donneesVirements,
      },
    ]);

    this.downloadCSV(
      contenu,
      `donnees-honoraires-${new Date().toISOString().split("T")[0]}.csv`
    );
  }

  private static creerCSVMultiFeuilles(
    feuilles: Array<{
      nom: string;
      entetes: string[];
      donnees: string[][];
    }>
  ): string {
    return feuilles
      .map((feuille) => {
        const lignes = [
          `=== ${feuille.nom} ===`,
          feuille.entetes.join(","),
          ...feuille.donnees.map((ligne) => ligne.join(",")),
        ];
        return lignes.join("\n");
      })
      .join("\n\n");
  }

  private static validerDonnees(donnees: any): donnees is DonneesExport {
    return (
      donnees &&
      typeof donnees.version === "string" &&
      Array.isArray(donnees.lieux) &&
      Array.isArray(donnees.journees) &&
      Array.isArray(donnees.virements)
    );
  }

  private static downloadJSON(contenu: string, filename: string): void {
    const blob = new Blob([contenu], { type: "application/json" });
    this.downloadBlob(blob, filename);
  }

  private static downloadCSV(contenu: string, filename: string): void {
    const blob = new Blob([contenu], { type: "text/csv;charset=utf-8;" });
    this.downloadBlob(blob, filename);
  }

  private static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
