// services/export-service.ts
import { RapportTrimestriel, RapportAnnuel } from "@/types/rapport";

export class ExportService {
  static exportRapportTrimestrielPDF(rapport: RapportTrimestriel): void {
    // Simuler l'export PDF (à intégrer avec une librairie comme jsPDF)
    const contenu = this.genererContenuPDFTrimestriel(rapport);
    this.downloadTextAsFile(
      contenu,
      `rapport-urssaf-${rapport.annee}-T${rapport.trimestre}.txt`
    );
  }

  static exportRapportAnnuelPDF(rapport: RapportAnnuel): void {
    const contenu = this.genererContenuPDFAnnuel(rapport);
    this.downloadTextAsFile(contenu, `rapport-annuel-${rapport.annee}.txt`);
  }

  private static genererContenuPDFTrimestriel(
    rapport: RapportTrimestriel
  ): string {
    return `
RAPPORT URSSAF TRIMESTRIEL
===========================

Période : T${rapport.trimestre} ${rapport.annee}
Du ${rapport.dateDebut.toLocaleDateString(
      "fr-FR"
    )} au ${rapport.dateFin.toLocaleDateString("fr-FR")}

STATISTIQUES GLOBALES
---------------------
Total Recettes : ${rapport.totalRecettes.toFixed(2)} €
Total Honoraires : ${rapport.totalHonoraires.toFixed(2)} €
Jours travaillés : ${rapport.nombreJours}

DÉTAIL PAR LIEU
---------------
${rapport.donneesParLieu
  .map(
    (donnees) => `
${donnees.nomLieu} (${donnees.pourcentageRetrocession}%)
  Recettes : ${donnees.totalRecettes.toFixed(2)} €
  Honoraires : ${donnees.totalHonoraires.toFixed(2)} €
  Jours : ${donnees.nombreJours}
`
  )
  .join("")}

INFORMATIONS POUR DÉCLARATION URSSAF
------------------------------------
Montant à déclarer : ${rapport.totalHonoraires.toFixed(2)} €
Période : ${rapport.dateDebut.toLocaleDateString(
      "fr-FR"
    )} - ${rapport.dateFin.toLocaleDateString("fr-FR")}

Généré le ${new Date().toLocaleDateString("fr-FR")}
    `.trim();
  }

  private static genererContenuPDFAnnuel(rapport: RapportAnnuel): string {
    return `
RAPPORT ANNUEL ${rapport.annee}
==============================

SYNTHÈSE ANNUELLE
-----------------
Total Recettes : ${rapport.totalRecettes.toFixed(2)} €
Total Honoraires : ${rapport.totalHonoraires.toFixed(2)} €
Total Jours travaillés : ${rapport.totalJours}
Moyenne honoraires/jour : ${(
      rapport.totalHonoraires / rapport.totalJours
    ).toFixed(2)} €

ANALYSE PAR TRIMESTRE
---------------------
${rapport.trimestres
  .map(
    (trimestre) => `
T${trimestre.trimestre} ${trimestre.annee}
  Honoraires : ${trimestre.totalHonoraires.toFixed(2)} €
  Jours : ${trimestre.nombreJours}
  Moyenne/jour : ${(trimestre.totalHonoraires / trimestre.nombreJours).toFixed(
    2
  )} €
`
  )
  .join("")}

INFORMATIONS FISCALES
---------------------
Chiffre d'affaires annuel : ${rapport.totalRecettes.toFixed(2)} €
Honoraires nets perçus : ${rapport.totalHonoraires.toFixed(2)} €

Généré le ${new Date().toLocaleDateString("fr-FR")}
    `.trim();
  }

  private static downloadTextAsFile(contenu: string, filename: string): void {
    const blob = new Blob([contenu], { type: "text/plain" });
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
