/* eslint-disable @typescript-eslint/no-explicit-any */
// services/export-service.ts
import { RapportTrimestriel, RapportAnnuel } from "@/types/rapport";

export class ExportService {
  static exportRapportTrimestrielPDF(rapport: RapportTrimestriel): void {
    // Simuler l'export PDF (à intégrer avec une librairie comme jsPDF)
    const contenu = this.genererContenuPDFTrimestriel(rapport);
    this.downloadTextAsFile(
      contenu,
      `rapport-theorique-${rapport.annee}-T${rapport.trimestre}.txt`
    );
  }

  static exportRapportAnnuelPDF(rapport: RapportAnnuel): void {
    const contenu = this.genererContenuPDFAnnuel(rapport);
    this.downloadTextAsFile(contenu, `rapport-theorique-annuel-${rapport.annee}.txt`);
  }

  private static genererContenuPDFTrimestriel(
    rapport: RapportTrimestriel
  ): string {
    return `
RAPPORT THÉORIQUE TRIMESTRIEL
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
RAPPORT THÉORIQUE ANNUEL ${rapport.annee}
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

  // Export des rapports théoriques
  static exporterRapportTheoriquePDF(rapport: any, type: 'trimestriel' | 'annuel'): void {
    const contenu = type === 'trimestriel' 
      ? this.genererContenuPDFTheoriqueTrimestriel(rapport)
      : this.genererContenuPDFTheoriqueAnnuel(rapport)
    
    const filename = type === 'trimestriel'
      ? `rapport-theorique-${rapport.annee}-T${rapport.trimestre}.txt`
      : `rapport-theorique-annuel-${rapport.annee}.txt`
    
    this.downloadTextAsFile(contenu, filename)
  }

  // Export des rapports réels
  static exporterRapportReelPDF(rapport: any, type: 'trimestriel' | 'annuel'): void {
    const contenu = type === 'trimestriel' 
      ? this.genererContenuPDFReelTrimestriel(rapport)
      : this.genererContenuPDFReelAnnuel(rapport)
    
    const filename = type === 'trimestriel'
      ? `rapport-reel-${rapport.annee}-T${rapport.trimestre}.txt`
      : `rapport-reel-annuel-${rapport.annee}.txt`
    
    this.downloadTextAsFile(contenu, filename)
  }

  // Export des rapports comparatifs
  static exporterRapportComparatifPDF(rapport: any, type: 'trimestriel' | 'annuel'): void {
    const contenu = type === 'trimestriel' 
      ? this.genererContenuPDFComparatifTrimestriel(rapport)
      : this.genererContenuPDFComparatifAnnuel(rapport)
    
    const filename = type === 'trimestriel'
      ? `rapport-comparatif-${rapport.annee}-T${rapport.trimestre}.txt`
      : `rapport-comparatif-annuel-${rapport.annee}.txt`
    
    this.downloadTextAsFile(contenu, filename)
  }

  private static genererContenuPDFTheoriqueTrimestriel(rapport: any): string {
    return `
RAPPORT THÉORIQUE TRIMESTRIEL URSSAF
=====================================

Période : T${rapport.trimestre} ${rapport.annee}
Du ${rapport.dateDebut.toLocaleDateString('fr-FR')} au ${rapport.dateFin.toLocaleDateString('fr-FR')}

HONORAIRES THÉORIQUES
---------------------
Total Recettes : ${rapport.totalRecettes.toFixed(2)} €
Total Honoraires : ${rapport.totalHonoraires.toFixed(2)} €
Jours travaillés : ${rapport.nombreJours}

DÉTAIL PAR LIEU
---------------
${rapport.donneesParLieu.map((donnees: any) => `
${donnees.nomLieu} (${donnees.pourcentageRetrocession}%)
  Recettes : ${donnees.totalRecettes.toFixed(2)} €
  Honoraires : ${donnees.totalHonoraires.toFixed(2)} €
  Jours : ${donnees.nombreJours}
`).join('')}

INFORMATIONS POUR DÉCLARATION URSSAF
------------------------------------
Montant à déclarer : ${rapport.totalHonoraires.toFixed(2)} €
Période : ${rapport.dateDebut.toLocaleDateString('fr-FR')} - ${rapport.dateFin.toLocaleDateString('fr-FR')}

Généré le ${new Date().toLocaleDateString('fr-FR')}
    `.trim()
  }

  private static genererContenuPDFTheoriqueAnnuel(rapport: any): string {
    return `
RAPPORT THÉORIQUE ANNUEL ${rapport.annee}
=========================================

SYNTHÈSE ANNUELLE
-----------------
Total Recettes : ${rapport.totalRecettes.toFixed(2)} €
Total Honoraires : ${rapport.totalHonoraires.toFixed(2)} €
Total Jours travaillés : ${rapport.totalJours}
Moyenne honoraires/jour : ${(rapport.totalHonoraires / rapport.totalJours).toFixed(2)} €

ANALYSE PAR TRIMESTRE
---------------------
${rapport.trimestres.map((trimestre: any) => `
T${trimestre.trimestre} ${trimestre.annee}
  Honoraires : ${trimestre.totalHonoraires.toFixed(2)} €
  Jours : ${trimestre.nombreJours}
  Moyenne/jour : ${(trimestre.totalHonoraires / trimestre.nombreJours).toFixed(2)} €
`).join('')}

INFORMATIONS FISCALES
---------------------
Chiffre d'affaires annuel : ${rapport.totalRecettes.toFixed(2)} €
Honoraires nets perçus : ${rapport.totalHonoraires.toFixed(2)} €

Généré le ${new Date().toLocaleDateString('fr-FR')}
    `.trim()
  }

  private static genererContenuPDFReelTrimestriel(rapport: any): string {
    return `
RAPPORT RÉEL TRIMESTRIEL - VIREMENTS
=====================================

Période : T${rapport.trimestre} ${rapport.annee}
Du ${rapport.dateDebut.toLocaleDateString('fr-FR')} au ${rapport.dateFin.toLocaleDateString('fr-FR')}

VIREMENTS EFFECTUÉS
-------------------
Total virements : ${rapport.totalVirements.toFixed(2)} €
Nombre de virements : ${rapport.nombreVirements}
Virements en attente : ${rapport.virementsEnAttente}
Virements partiels : ${rapport.virementsPartiels}

DÉTAIL PAR LIEU
---------------
${rapport.donneesParLieu.map((donnees: any) => `
${donnees.nomLieu}
  Total virements : ${donnees.totalVirements.toFixed(2)} €
  Nombre de virements : ${donnees.nombreVirements}
  Statut moyen : ${donnees.statutMoyen}
  Moyenne/virement : ${(donnees.totalVirements / donnees.nombreVirements).toFixed(2)} €
`).join('')}

SITUATION DES PAIEMENTS
-----------------------
Taux de complétion : ${(100 - ((rapport.virementsEnAttente + rapport.virementsPartiels) / rapport.nombreVirements * 100)).toFixed(1)}%
Virements à suivre : ${rapport.virementsEnAttente + rapport.virementsPartiels}

Généré le ${new Date().toLocaleDateString('fr-FR')}
    `.trim()
  }

  private static genererContenuPDFReelAnnuel(rapport: any): string {
    return `
RAPPORT RÉEL ANNUEL - VIREMENTS ${rapport.annee}
================================================

SYNTHÈSE ANNUELLE
-----------------
Total virements : ${rapport.totalVirements.toFixed(2)} €
Moyenne mensuelle : ${(rapport.totalVirements / 12).toFixed(2)} €/mois
Virements en attente : ${rapport.totalVirementsEnAttente}
Virements partiels : ${rapport.totalVirementsPartiels}

ANALYSE PAR TRIMESTRE
---------------------
${rapport.trimestres.map((trimestre: any) => `
T${trimestre.trimestre} ${trimestre.annee}
  Virements : ${trimestre.totalVirements.toFixed(2)} €
  Nombre : ${trimestre.nombreVirements}
  En attente : ${trimestre.virementsEnAttente}
  Partiels : ${trimestre.virementsPartiels}
`).join('')}

SITUATIONS PARTICULIÈRES
------------------------
${rapport.lieuxAvecProblemes.map((lieu: any) => `
${lieu.nomLieu}
  Virements en attente : ${lieu.virementsEnAttente}
  Virements partiels : ${lieu.virementsPartiels}
  ${lieu.dernierVirement ? `Dernier virement : ${new Date(lieu.dernierVirement).toLocaleDateString('fr-FR')}` : ''}
`).join('')}

BILAN ANNUEL
------------
Taux de complétion : ${(100 - ((rapport.totalVirementsEnAttente + rapport.totalVirementsPartiels) / rapport.trimestres.reduce((sum: number, t: any) => sum + t.nombreVirements, 0) * 100)).toFixed(1)}%

Généré le ${new Date().toLocaleDateString('fr-FR')}
    `.trim()
  }

  private static genererContenuPDFComparatifTrimestriel(rapport: any): string {
    return `
RAPPORT COMPARATIF TRIMESTRIEL
==============================

Période : T${rapport.trimestre} ${rapport.annee}
Du ${rapport.dateDebut.toLocaleDateString('fr-FR')} au ${rapport.dateFin.toLocaleDateString('fr-FR')}

COMPARAISON THÉORIE/RÉALITÉ
---------------------------
Honoraires théoriques : ${rapport.totalTheorique.toFixed(2)} €
Virements réels : ${rapport.totalReel.toFixed(2)} €
Écart : ${rapport.difference > 0 ? '+' : ''}${rapport.difference.toFixed(2)} €
Pourcentage : ${rapport.pourcentageDifference > 0 ? '+' : ''}${rapport.pourcentageDifference.toFixed(1)}%

ANALYSE DÉTAILLÉE PAR LIEU
--------------------------
${rapport.donneesParLieu.map((donnees: any) => `
${donnees.nomLieu}
  Théorique : ${donnees.theorique.toFixed(2)} €
  Réel : ${donnees.reel.toFixed(2)} €
  Écart : ${donnees.difference > 0 ? '+' : ''}${donnees.difference.toFixed(2)} € (${donnees.pourcentageDifference > 0 ? '+' : ''}${donnees.pourcentageDifference.toFixed(1)}%)
  Statut : ${donnees.statut}
`).join('')}

RECOMMANDATIONS
---------------
${rapport.donneesParLieu
  .filter((d: any) => d.statut === 'manquant')
  .map((d: any) => `• ${d.nomLieu} : Virement manquant pour ${d.theorique.toFixed(2)} €`)
  .join('\n')}
${rapport.donneesParLieu
  .filter((d: any) => d.statut === 'deficit' && d.difference < -10)
  .map((d: any) => `• ${d.nomLieu} : Déficit de ${Math.abs(d.difference).toFixed(2)} €`)
  .join('\n')}

Généré le ${new Date().toLocaleDateString('fr-FR')}
    `.trim()
  }

  private static genererContenuPDFComparatifAnnuel(rapport: any): string {
    const tauxRealisation = rapport.totalTheorique > 0 ? (rapport.totalReel / rapport.totalTheorique) * 100 : 0
    
    return `
RAPPORT COMPARATIF ANNUEL ${rapport.annee}
==========================================

SYNTHÈSE ANNUELLE
-----------------
Honoraires théoriques : ${rapport.totalTheorique.toFixed(2)} €
Virements réels : ${rapport.totalReel.toFixed(2)} €
Écart total : ${rapport.difference > 0 ? '+' : ''}${rapport.difference.toFixed(2)} €
Taux de réalisation : ${tauxRealisation.toFixed(1)}%

ANALYSE PAR TRIMESTRE
---------------------
${rapport.trimestres.map((trimestre: any) => {
  const tauxTrimestre = trimestre.totalTheorique > 0 ? (trimestre.totalReel / trimestre.totalTheorique) * 100 : 0
  return `
T${trimestre.trimestre}
  Théorique : ${trimestre.totalTheorique.toFixed(2)} €
  Réel : ${trimestre.totalReel.toFixed(2)} €
  Écart : ${trimestre.difference > 0 ? '+' : ''}${trimestre.difference.toFixed(2)} €
  Taux : ${tauxTrimestre.toFixed(1)}%
  Lieux avec problèmes : ${trimestre.donneesParLieu.filter((d: any) => d.statut !== 'conforme').length}
`
}).join('')}

LIEUX À PROBLÈMES
-----------------
${rapport.lieuxAProblemes.map((lieu: any) => `
${lieu.nomLieu}
  Déficit total : ${Math.abs(lieu.deficitTotal).toFixed(2)} €
  Trimestres manquants : ${lieu.trimestresManquants.join(', ')}
`).join('')}

PLAN D'ACTION RECOMMANDÉ
------------------------
${rapport.difference < -500 ? `• Investigation prioritaire du déficit de ${Math.abs(rapport.difference).toFixed(2)} €` : ''}
${rapport.lieuxAProblemes.length > 0 ? `• Contact avec ${rapport.lieuxAProblemes.length} cabinet(s) problématique(s)` : ''}
• Mise à jour des processus de suivi

Généré le ${new Date().toLocaleDateString('fr-FR')}
    `.trim()
  }

  // ... méthodes existantes ...
}
