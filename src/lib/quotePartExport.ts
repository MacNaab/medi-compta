/* eslint-disable @typescript-eslint/no-explicit-any */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getProfile } from "./storage";

interface HomeCalculations {
  quotePart: number;
  totalDeductibleAnnuel: number;
}

interface VehicleCalculations {
  quotePart: number;
  baremeDeductible: number;
  fraisReelsDeductible: number;
  deductible: number;
  methodeRecommandee: string;
}

interface PhoneCalculations {
  totalAnnuel: number;
}

interface QuotePartData {
  // Home
  surfaceTotale: number;
  surfacePro: number;
  loyerMensuel: number;
  chargesMensuelles: number;
  electriciteMensuelle: number;
  internetMensuel: number;
  assuranceMensuelle: number;
  homeCalculations: HomeCalculations;
  
  // Vehicle
  kmProfessionnels: number;
  kmTotaux: number;
  puissanceFiscale: string;
  fraisReelsVehicule: number;
  methodeVehicule: 'bareme' | 'fraisreels';
  vehicleCalculations: VehicleCalculations;
  
  // Phone
  facturePhone: number;
  usageProPhone: number;
  factureInternet: number;
  usageProInternet: number;
  phoneCalculations: PhoneCalculations;
  
  // Total
  totalDeductible: number;
}

const currencyFormat = (number: number) => {
  return number.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ').replace('.', ',') + ' €';
};

const percentFormat = (number: number) => {
  return number.toFixed(1).replace('.', ',') + ' %';
};

export const exportQuotePartPDF = (data: QuotePartData) => {
  const profile = getProfile();
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Récapitulatif des Quote-Parts Professionnelles", pageWidth / 2, yPos, { align: "center" });

  yPos += 8;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`${profile.fullName || 'Médecin Remplaçant'}`, pageWidth / 2, yPos, { align: "center" });

  yPos += 6;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Document généré le ${format(new Date(), "dd MMMM yyyy", { locale: fr })}`, pageWidth / 2, yPos, {
    align: "center",
  });

  // Separator
  yPos += 10;
  doc.setDrawColor(200);
  doc.line(20, yPos, pageWidth - 20, yPos);

  // Summary box
  yPos += 12;
  doc.setFillColor(240, 249, 255);
  doc.setDrawColor(59, 130, 246);
  doc.roundedRect(20, yPos, pageWidth - 40, 30, 3, 3, 'FD');
  
  yPos += 10;
  doc.setTextColor(59, 130, 246);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Total annuel déductible estimé", pageWidth / 2, yPos, { align: "center" });
  
  yPos += 10;
  doc.setTextColor(0);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(currencyFormat(data.totalDeductible), pageWidth / 2, yPos, { align: "center" });

  // Reset
  yPos += 25;
  doc.setTextColor(0);

  // 1. DOMICILE
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(34, 197, 94); // Success color
  doc.text("1. Usage professionnel du domicile", 20, yPos);
  doc.setTextColor(0);

  yPos += 8;

  const homeData = [
    ["Surface totale", `${data.surfaceTotale} m²`],
    ["Surface professionnelle", `${data.surfacePro} m²`],
    ["Quote-part applicable", percentFormat(data.homeCalculations.quotePart)],
    ["", ""],
    ["Loyer mensuel", currencyFormat(data.loyerMensuel)],
    ["Charges mensuelles", currencyFormat(data.chargesMensuelles)],
    ["Électricité mensuelle", currencyFormat(data.electriciteMensuelle)],
    ["Internet mensuel", currencyFormat(data.internetMensuel)],
    ["Assurance mensuelle", currencyFormat(data.assuranceMensuelle)],
    ["", ""],
    ["DÉDUCTIBLE ANNUEL DOMICILE", currencyFormat(data.homeCalculations.totalDeductibleAnnuel)],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: homeData,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { halign: "right", cellWidth: 50 },
    },
    margin: { left: 25, right: 25 },
    didParseCell: (cellData) => {
      if (cellData.row.index === 2 || cellData.row.index === 10) {
        cellData.cell.styles.fontStyle = "bold";
      }
      if (cellData.row.index === 10) {
        cellData.cell.styles.fillColor = [220, 252, 231]; // Success light
      }
      if (cellData.row.index === 3 || cellData.row.index === 9) {
        cellData.cell.styles.cellPadding = 1;
      }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // 2. VÉHICULE
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(59, 130, 246); // Info color
  doc.text("2. Frais de véhicule", 20, yPos);
  doc.setTextColor(0);

  yPos += 8;

  const vehicleData = [
    ["Kilomètres professionnels", `${data.kmProfessionnels.toLocaleString('fr-FR')} km`],
    ["Kilomètres totaux", `${data.kmTotaux.toLocaleString('fr-FR')} km`],
    ["Quote-part applicable", percentFormat(data.vehicleCalculations.quotePart)],
    ["Puissance fiscale", data.puissanceFiscale],
    ["", ""],
    ["Méthode barème kilométrique", currencyFormat(data.vehicleCalculations.baremeDeductible)],
    ["Méthode frais réels", currencyFormat(data.vehicleCalculations.fraisReelsDeductible)],
    ["", ""],
    ["Méthode retenue", data.methodeVehicule === 'bareme' ? 'Barème kilométrique' : 'Frais réels'],
    ["DÉDUCTIBLE ANNUEL VÉHICULE", currencyFormat(data.vehicleCalculations.deductible)],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: vehicleData,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { halign: "right", cellWidth: 50 },
    },
    margin: { left: 25, right: 25 },
    didParseCell: (cellData) => {
      if (cellData.row.index === 2 || cellData.row.index === 9) {
        cellData.cell.styles.fontStyle = "bold";
      }
      if (cellData.row.index === 9) {
        cellData.cell.styles.fillColor = [219, 234, 254]; // Info light
      }
      if (cellData.row.index === 4 || cellData.row.index === 7) {
        cellData.cell.styles.cellPadding = 1;
      }
      // Highlight recommended method
      if (cellData.row.index === 5 && data.vehicleCalculations.methodeRecommandee === 'bareme') {
        cellData.cell.styles.textColor = [34, 197, 94];
      }
      if (cellData.row.index === 6 && data.vehicleCalculations.methodeRecommandee === 'fraisreels') {
        cellData.cell.styles.textColor = [34, 197, 94];
      }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // 3. TÉLÉPHONE & INTERNET
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(245, 158, 11); // Warning color
  doc.text("3. Téléphone & Internet", 20, yPos);
  doc.setTextColor(0);

  yPos += 8;

  const phoneData = [
    ["Facture téléphone mensuelle", currencyFormat(data.facturePhone)],
    ["Usage professionnel téléphone", percentFormat(data.usageProPhone)],
    ["", ""],
    ["Facture internet mensuelle", currencyFormat(data.factureInternet)],
    ["Usage professionnel internet", percentFormat(data.usageProInternet)],
    ["", ""],
    ["DÉDUCTIBLE ANNUEL TÉLÉPHONE", currencyFormat(data.phoneCalculations.totalAnnuel)],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: phoneData,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { halign: "right", cellWidth: 50 },
    },
    margin: { left: 25, right: 25 },
    didParseCell: (cellData) => {
      if (cellData.row.index === 6) {
        cellData.cell.styles.fontStyle = "bold";
        cellData.cell.styles.fillColor = [254, 243, 199]; // Warning light
      }
      if (cellData.row.index === 2 || cellData.row.index === 5) {
        cellData.cell.styles.cellPadding = 1;
      }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // RÉCAPITULATIF
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Récapitulatif", 20, yPos);

  yPos += 8;

  const summaryData = [
    ["Domicile", currencyFormat(data.homeCalculations.totalDeductibleAnnuel)],
    ["Véhicule", currencyFormat(data.vehicleCalculations.deductible)],
    ["Téléphone & Internet", currencyFormat(data.phoneCalculations.totalAnnuel)],
    ["TOTAL DÉDUCTIBLE", currencyFormat(data.totalDeductible)],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [["Catégorie", "Montant annuel"]],
    body: summaryData,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 11, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { halign: "right", cellWidth: 50 },
    },
    margin: { left: 25, right: 25 },
    didParseCell: (cellData) => {
      if (cellData.row.index === 3) {
        cellData.cell.styles.fontStyle = "bold";
        cellData.cell.styles.fillColor = [219, 234, 254];
      }
    },
  });

  // Source info
  yPos = (doc as any).lastAutoTable.finalY + 20;

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont("helvetica", "italic");
  doc.text("Sources :", 20, yPos);
  yPos += 5;
  doc.setFont("helvetica", "normal");
  doc.text("• Barème kilométrique 2024 : impots.gouv.fr/particulier/frais-de-transport", 20, yPos);
  yPos += 4;
  doc.text("• Quote-part domicile : BOFiP-BNC-BASE-40-20", 20, yPos);
  yPos += 8;
  doc.text("Ces calculs sont indicatifs. Consultez un expert-comptable pour valider vos déductions.", 20, yPos);

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Document généré via l'application Médecin Remplaçant - Archives comptables", pageWidth / 2, pageHeight - 10, {
    align: "center",
  });

  // Save
  const dateStr = format(new Date(), "yyyy-MM-dd");
  doc.save(`quote-parts-professionnelles-${dateStr}.pdf`);
};
