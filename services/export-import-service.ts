/* eslint-disable @typescript-eslint/no-explicit-any */
// services/export-import-service.ts
import { DonneesExport } from "@/types/export";
import { Lieu } from "@/types/lieu";
import { Journee } from "@/types/journee";
import { Virement } from "@/types/virement";
import XLSX from "xlsx";

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

  // Export vers Excel 
  static exporterExcel(lieux: Lieu[], journees: Journee[], virements: Virement[]): void {
    // utilisation sheetjs
    const workbook = XLSX.utils.book_new();
    const sheetLieux = XLSX.utils.json_to_sheet(lieux);
    const sheetJournees = XLSX.utils.json_to_sheet(journees);
    const sheetVirements = XLSX.utils.json_to_sheet(virements);
    XLSX.utils.book_append_sheet(workbook, sheetLieux, "Lieux");
    XLSX.utils.book_append_sheet(workbook, sheetJournees, "Journees");
    XLSX.utils.book_append_sheet(workbook, sheetVirements, "Virements");
    XLSX.writeFile(workbook, `sauvegarde-honoraires-${new Date().toISOString().split("T")[0]}.xlsx`);
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
