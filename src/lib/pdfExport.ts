/* eslint-disable @typescript-eslint/no-explicit-any */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Virement, Lieu, Charge, getProfile } from "./storage";

interface MonthlyPaymentData {
  month: string;
  fullMonth: string;
  montantRecu: number;
  nombreVirements: number;
}

interface CabinetPaymentStat {
  id: string;
  nom: string;
  montantRecu: number;
  nombreVirements: number;
}

const CATEGORIES = [
  { value: "transport", label: "Transport" },
  { value: "materiel", label: "Matériel" },
  { value: "formation", label: "Formation" },
  { value: "cotisations", label: "Cotisations" },
  { value: "assurance", label: "Assurance" },
  { value: "telephone", label: "Téléphone/Internet" },
  { value: "autre", label: "Autre" },
] as const;

const getCategoryLabel = (value: string) => {
  return CATEGORIES.find((c) => c.value === value)?.label || "Autre";
};

const currencyNumberFormat = (number: number) => {
  return number.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' €';
};

interface ExportOptions {
  type?: 'annual' | 'quarterly';
  quarter?: number; // 1, 2, 3, or 4
}

const getQuarterMonths = (quarter: number): number[] => {
  switch (quarter) {
    case 1: return [0, 1, 2]; // Jan, Feb, Mar
    case 2: return [3, 4, 5]; // Apr, May, Jun
    case 3: return [6, 7, 8]; // Jul, Aug, Sep
    case 4: return [9, 10, 11]; // Oct, Nov, Dec
    default: return [];
  }
};

const getQuarterLabel = (quarter: number): string => {
  switch (quarter) {
    case 1: return 'T1 (Janvier - Mars)';
    case 2: return 'T2 (Avril - Juin)';
    case 3: return 'T3 (Juillet - Septembre)';
    case 4: return 'T4 (Octobre - Décembre)';
    default: return '';
  }
};

export const exportAnnualPaymentsPDF = (year: number, virements: Virement[], lieux: Lieu[], charges: Charge[] = [], options: ExportOptions = {}) => {
  const { type = 'annual', quarter } = options;
  const profile = getProfile();
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Get quarter months if quarterly export
  const quarterMonths = type === 'quarterly' && quarter ? getQuarterMonths(quarter) : null;

  // Filter virements for the selected year based on dateReception
  const yearVirements = virements.filter((v) => {
    if (v.statut !== "recu" || !v.dateReception) return false;
    if (!v.dateReception.startsWith(year.toString())) return false;
    
    if (quarterMonths) {
      const month = parseInt(v.dateReception.substring(5, 7)) - 1;
      return quarterMonths.includes(month);
    }
    return true;
  });

  // Filter charges for the selected year (only deductible)
  const yearCharges = charges.filter((c) => {
    if (!c.deductible) return false;
    const chargeDate = new Date(c.date);
    if (chargeDate.getFullYear() !== year) return false;
    
    if (quarterMonths) {
      return quarterMonths.includes(chargeDate.getMonth());
    }
    return true;
  });

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  const title = type === 'quarterly' && quarter 
    ? `Déclaration URSSAF ${year} - ${getQuarterLabel(quarter)}`
    : `Déclaration Fiscale ${year}`;
  doc.text(title, pageWidth / 2, yPos, { align: "center" });

  yPos += 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Médecin Remplaçant: ${profile.fullName}`, pageWidth / 2, yPos, { align: "center" });

  yPos += 5;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Document généré le ${format(new Date(), "dd MMMM yyyy", { locale: fr })}`, pageWidth / 2, yPos, {
    align: "center",
  });

  // Separator
  yPos += 10;
  doc.setDrawColor(200);
  doc.line(20, yPos, pageWidth - 20, yPos);

  // Summary Section
  yPos += 15;
  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  const summaryTitle = type === 'quarterly' && quarter
    ? `Résumé ${getQuarterLabel(quarter)}`
    : "Résumé Annuel";
  doc.text(summaryTitle, 20, yPos);

  const totalMontantRecu = yearVirements.reduce((sum, v) => sum + (v.montantRecu || 0), 0);
  const totalChargesDeductibles = yearCharges.reduce((sum, c) => sum + c.montant, 0);
  const beneficeNet = totalMontantRecu - totalChargesDeductibles;
  const nombreVirements = yearVirements.length;

  yPos += 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  const summaryData = [
    ["Total des virements reçus", `${currencyNumberFormat(totalMontantRecu)}`],
    ["Total des charges déductibles", `${currencyNumberFormat(totalChargesDeductibles)}`],
    ["Bénéfice net imposable", `${currencyNumberFormat(beneficeNet)}`],
    ["Nombre de virements", `${nombreVirements}`],
    ["Nombre de charges déductibles", `${yearCharges.length}`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: summaryData,
    theme: "plain",
    styles: { fontSize: 11, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 80 },
      1: { halign: "right", cellWidth: 60 },
    },
    margin: { left: 20, right: 20 },
    didParseCell: (data) => {
      // Highlight the net benefit row
      if (data.row.index === 2) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [229, 246, 253];
      }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Monthly Breakdown (based on dateReception)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Détail Mensuel des Revenus", 20, yPos);

  yPos += 5;

  // Group virements by month of reception
  const monthlyData: Record<string, { montantRecu: number; nombreVirements: number }> = {};

  // Only show months for the selected period
  const monthsToShow = quarterMonths ? quarterMonths : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  monthsToShow.forEach((m) => {
    const monthKey = `${year}-${String(m + 1).padStart(2, "0")}`;
    monthlyData[monthKey] = { montantRecu: 0, nombreVirements: 0 };
  });

  yearVirements.forEach((v) => {
    if (!v.dateReception) return;
    const monthKey = v.dateReception.substring(0, 7);
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].montantRecu += v.montantRecu || 0;
      monthlyData[monthKey].nombreVirements += 1;
    }
  });

  const monthlyTableData = Object.entries(monthlyData)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([monthKey, data]) => {
      const date = new Date(monthKey + "-01");
      const monthName = format(date, "MMMM", { locale: fr });
      return [
        monthName.charAt(0).toUpperCase() + monthName.slice(1),
        `${data.nombreVirements}`,
        `${currencyNumberFormat(data.montantRecu)}`,
      ];
    });

  // Add total row
  monthlyTableData.push(["TOTAL", `${nombreVirements}`, `${currencyNumberFormat(totalMontantRecu)}`]);

  autoTable(doc, {
    startY: yPos,
    head: [["Mois", "Virements", "Montant reçu"]],
    body: monthlyTableData,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { halign: "center", cellWidth: 30 },
      2: { halign: "right", cellWidth: 50 },
    },
    margin: { left: 20, right: 20 },
    foot: [],
    didParseCell: (data) => {
      // Style the total row
      if (data.row.index === monthlyTableData.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [229, 231, 235];
      }
    },
  });

  // Charges Section
  if (yearCharges.length > 0) {
    yPos = (doc as any).lastAutoTable.finalY + 15;

    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Charges Déductibles", 20, yPos);

    yPos += 5;

    // Group charges by category
    const chargesByCategory: Record<string, number> = {};
    yearCharges.forEach((c) => {
      chargesByCategory[c.categorie] = (chargesByCategory[c.categorie] || 0) + c.montant;
    });

    const chargesTableData = Object.entries(chargesByCategory).map(([cat, montant]) => [
      getCategoryLabel(cat),
      `${currencyNumberFormat(montant)}`,
    ]);

    chargesTableData.push(["TOTAL CHARGES DÉDUCTIBLES", `${currencyNumberFormat(totalChargesDeductibles)}`]);

    autoTable(doc, {
      startY: yPos,
      head: [["Catégorie", "Montant"]],
      body: chargesTableData,
      theme: "striped",
      headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { halign: "right", cellWidth: 50 },
      },
      margin: { left: 20, right: 20 },
      didParseCell: (data) => {
        if (data.row.index === chargesTableData.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [254, 226, 226];
        }
      },
    });

    // Detail of charges
    yPos = (doc as any).lastAutoTable.finalY + 10;

    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Détail des Charges", 20, yPos);

    yPos += 5;

    const chargesDetailData = yearCharges
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((c) => [
        format(new Date(c.date), "dd/MM/yyyy"),
        getCategoryLabel(c.categorie),
        c.description,
        `${currencyNumberFormat(c.montant)}`,
      ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Date", "Catégorie", "Description", "Montant"]],
      body: chargesDetailData,
      theme: "striped",
      headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 35 },
        2: { cellWidth: 70 },
        3: { halign: "right", cellWidth: 30 },
      },
      margin: { left: 20, right: 20 },
    });
  }

  // Per Cabinet Stats (new page if needed)
  const cabinetStats: CabinetPaymentStat[] = lieux
    .map((lieu) => {
      const lieuVirements = yearVirements.filter((v) => v.lieuId === lieu.id);
      return {
        id: lieu.id,
        nom: lieu.nom,
        montantRecu: lieuVirements.reduce((sum, v) => sum + (v.montantRecu || 0), 0),
        nombreVirements: lieuVirements.length,
      };
    })
    .filter((c) => c.nombreVirements > 0);

  if (cabinetStats.length > 0) {
    yPos = (doc as any).lastAutoTable.finalY + 15;

    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Revenus par Cabinet", 20, yPos);

    yPos += 5;

    const cabinetTableData = cabinetStats.map((c) => [
      c.nom,
      `${c.nombreVirements}`,
      `${currencyNumberFormat(c.montantRecu)}`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Cabinet", "Virements", "Montant reçu"]],
      body: cabinetTableData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { halign: "center", cellWidth: 30 },
        2: { halign: "right", cellWidth: 50 },
      },
      margin: { left: 20, right: 20 },
    });
  }

  // Detail of each virement
  if (yearVirements.length > 0) {
    yPos = (doc as any).lastAutoTable.finalY + 15;

    if (yPos > 180) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Détail des Virements", 20, yPos);

    yPos += 5;

    const virementsTableData = yearVirements
      .sort((a, b) => (a.dateReception || "").localeCompare(b.dateReception || ""))
      .map((v) => {
        const lieu = lieux.find((l) => l.id === v.lieuId);
        return [
          v.dateReception ? format(new Date(v.dateReception), "dd/MM/yyyy") : "-",
          lieu?.nom || "Non spécifié",
          v.dateDebut && v.dateFin
            ? `${format(new Date(v.dateDebut), "dd/MM")} - ${format(new Date(v.dateFin), "dd/MM/yy")}`
            : "-",
          `${currencyNumberFormat(v.montantRecu || 0)}`,
        ];
      });

    autoTable(doc, {
      startY: yPos,
      head: [["Date réception", "Cabinet", "Période couverte", "Montant"]],
      body: virementsTableData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 45 },
        2: { cellWidth: 45 },
        3: { halign: "right", cellWidth: 35 },
      },
      margin: { left: 20, right: 20 },
    });
  }

  // Footer with page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Page ${i} / ${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
    doc.text("Document à usage déclaratif - Médecin Remplaçant", 20, doc.internal.pageSize.getHeight() - 10);
  }

  // Save
  const filename = type === 'quarterly' && quarter 
    ? `declaration-urssaf-${year}-T${quarter}.pdf`
    : `declaration-fiscale-${year}.pdf`;
  doc.save(filename);
};
