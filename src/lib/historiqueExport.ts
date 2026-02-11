/* eslint-disable @typescript-eslint/no-explicit-any */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Journee, Lieu, getProfile } from "./storage";

const currencyNumberFormat = (number: number) => {
  return number.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' €';
};

export const exportHistoriquePDF = (
  journees: Journee[],
  lieux: Lieu[],
  filters?: {
    lieuId?: string;
    months?: string[];
  }
) => {
  const profile = getProfile();
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Historique des Journées", pageWidth / 2, yPos, { align: "center" });

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

  // Filter info
  if (filters?.lieuId || (filters?.months && filters.months.length > 0)) {
    yPos += 8;
    const filterParts: string[] = [];
    if (filters.lieuId) {
      const lieu = lieux.find(l => l.id === filters.lieuId);
      if (lieu) filterParts.push(`Cabinet: ${lieu.nom}`);
    }
    if (filters.months && filters.months.length > 0) {
      const monthsText = filters.months.length <= 3 
        ? filters.months.map(m => format(new Date(m + '-01'), 'MMM yyyy', { locale: fr })).join(', ')
        : `${filters.months.length} mois sélectionnés`;
      filterParts.push(`Période: ${monthsText}`);
    }
    doc.text(`Filtres: ${filterParts.join(' • ')}`, pageWidth / 2, yPos, { align: "center" });
  }

  // Separator
  yPos += 10;
  doc.setDrawColor(200);
  doc.line(20, yPos, pageWidth - 20, yPos);

  // Summary
  yPos += 15;
  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Résumé", 20, yPos);

  const totalRecettes = journees.reduce((sum, j) => sum + (j.recettesTotales || 0), 0);
  const totalHonoraires = journees.reduce((sum, j) => sum + (j.honorairesTheoriques || 0), 0);

  yPos += 10;
  const summaryData = [
    ["Nombre de journées", `${journees.length}`],
    ["Total des recettes", `${currencyNumberFormat(totalRecettes)}`],
    ["Total des honoraires", `${currencyNumberFormat(totalHonoraires)}`],
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
  });

  // Helper function to parse date string without timezone issues
  const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day || 1);
  };

  const getMonthName = (monthKey: string): string => {
    const [year, month] = monthKey.split('-').map(Number);
    const monthNames = ["janvier", "février", "mars", "avril", "mai", "juin", 
                       "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
    return `${monthNames[month - 1]} ${year}`;
  };

  // Group journees by month
  const journeesByMonth: Record<string, Journee[]> = {};
  journees.forEach(j => {
    const monthKey = j.date.substring(0, 7);
    if (!journeesByMonth[monthKey]) {
      journeesByMonth[monthKey] = [];
    }
    journeesByMonth[monthKey].push(j);
  });

  const sortedMonths = Object.keys(journeesByMonth).sort((a, b) => b.localeCompare(a));

  // Monthly breakdown
  yPos = (doc as any).lastAutoTable.finalY + 15;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Récapitulatif par mois", 20, yPos);

  yPos += 5;

  const monthlyTableData = sortedMonths.map(monthKey => {
    const monthJournees = journeesByMonth[monthKey];
    const monthRecettes = monthJournees.reduce((sum, j) => sum + (j.recettesTotales || 0), 0);
    const monthHonoraires = monthJournees.reduce((sum, j) => sum + (j.honorairesTheoriques || 0), 0);
    const monthName = getMonthName(monthKey);
    return [
      monthName.charAt(0).toUpperCase() + monthName.slice(1),
      `${monthJournees.length}`,
      `${currencyNumberFormat(monthRecettes)}`,
      `${currencyNumberFormat(monthHonoraires)}`,
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [["Mois", "Journées", "Recettes", "Honoraires"]],
    body: monthlyTableData,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { halign: "center", cellWidth: 25 },
      2: { halign: "right", cellWidth: 40 },
      3: { halign: "right", cellWidth: 40 },
    },
    margin: { left: 20, right: 20 },
  });

  // Detail by month
  sortedMonths.forEach(monthKey => {
    yPos = (doc as any).lastAutoTable.finalY + 15;

    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    const monthJournees = journeesByMonth[monthKey].sort((a, b) => a.date.localeCompare(b.date));
    const monthName = getMonthName(monthKey);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(monthName.charAt(0).toUpperCase() + monthName.slice(1), 20, yPos);

    yPos += 5;

    const formatLocalDate = (dateStr: string): string => {
      const date = parseLocalDate(dateStr);
      const dayNames = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const dayName = dayNames[date.getDay()];
      return `${day}/${month}/${year} (${dayName})`;
    };

    const journeesTableData = monthJournees.map(j => {
      const lieu = lieux.find(l => l.id === j.lieuId);
      return [
        formatLocalDate(j.date),
        lieu?.nom || 'Non spécifié',
        `${currencyNumberFormat(j.recettesTotales || 0)}`,
        `${currencyNumberFormat(j.honorairesTheoriques || 0)}`,
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [["Date", "Cabinet", "Recettes", "Honoraires"]],
      body: journeesTableData,
      theme: "striped",
      headStyles: { fillColor: [107, 114, 128], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 50 },
        2: { halign: "right", cellWidth: 35 },
        3: { halign: "right", cellWidth: 35 },
      },
      margin: { left: 20, right: 20 },
    });
  });

  // Footer with page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Page ${i} / ${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
    doc.text("Historique des journées - Médecin Remplaçant", 20, doc.internal.pageSize.getHeight() - 10);
  }

  // Save
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  doc.save(`historique-journees-${dateStr}.pdf`);
};
