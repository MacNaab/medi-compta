// services/export-consultations.ts
import { Consultation } from "@/types/consultation";
import XLSX from "xlsx";

export function exportConsultationsToExcel(consultations: Consultation[], date: Date): void {
  // Préparer les données pour l'export
  const data = consultations.map(consultation => ({
    "Heure": consultation.heure,
    "Patient": consultation.nomPatient,
    "Motif": consultation.motif,
    "Code Acte": consultation.acteCode,
    "Mode Paiement": consultation.modePaiement === null ? "100%" : consultation.modePaiement,
    "Part Patient (€)": consultation.montantPatient,
    "Total (€)": consultation.montantTotal,
    "Notes": consultation.notes || ""
  }));

  // Calculer les totaux
  const totalCarte = consultations.filter(c => c.modePaiement === 'carte').reduce((sum, c) => sum + c.montantTotal, 0);
  const totalCheque = consultations.filter(c => c.modePaiement === 'cheque').reduce((sum, c) => sum + c.montantTotal, 0);
  const totalEspeces = consultations.filter(c => c.modePaiement === 'especes').reduce((sum, c) => sum + c.montantTotal, 0);
  const totalPrisEnCharge = consultations.filter(c => c.modePaiement === null).reduce((sum, c) => sum + c.montantTotal, 0);
  const totalGeneral = consultations.reduce((sum, c) => sum + c.montantTotal, 0);

  // Ajouter une ligne de totaux
  const totaux = [
    {},
    { "Patient": "TOTAUX", "Mode Paiement": "" },
    { "Patient": "Carte bancaire", "Total (€)": totalCarte },
    { "Patient": "Chèque", "Total (€)": totalCheque },
    { "Patient": "Espèces", "Total (€)": totalEspeces },
    { "Patient": "100%", "Total (€)": totalPrisEnCharge },
    { "Patient": "TOTAL GÉNÉRAL", "Total (€)": totalGeneral }
  ];

  const dataAvecTotaux = [...data, ...totaux];

  // Créer le workbook et les sheets
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(dataAvecTotaux);

  // Ajouter le sheet au workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "Consultations");

  // Générer le nom du fichier
  const dateStr = date.toISOString().split('T')[0];
  const filename = `consultations-${dateStr}.xlsx`;

  // Télécharger le fichier
  XLSX.writeFile(workbook, filename);
}