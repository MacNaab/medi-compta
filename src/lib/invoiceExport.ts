import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Journee, Lieu, UserProfile } from './storage';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: Date;
  lieu: Lieu;
  journees: Journee[];
  profile: UserProfile;
}

export function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `F${year}${month}-${random}`;
}

export function calculateInvoiceTotals(journees: Journee[]) {
  const totalRecettes = journees.reduce((sum, j) => sum + (j.recettesTotales || 0), 0);
  const totalHonoraires = journees.reduce((sum, j) => sum + (j.honorairesTheoriques || 0), 0);
  return { totalRecettes, totalHonoraires };
}

export function exportInvoicePDF(data: InvoiceData): void {
  const { invoiceNumber, invoiceDate, lieu, journees, profile } = data;
  const doc = new jsPDF();
  
  const { totalRecettes, totalHonoraires } = calculateInvoiceTotals(journees);
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURE', 105, 25, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${invoiceNumber}`, 105, 33, { align: 'center' });
  
  // Émetteur (remplaçant) - avec mentions obligatoires EI
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ÉMETTEUR', 20, 50);
  doc.setFont('helvetica', 'normal');
  
  let emetteurY = 57;
  // Nom avec mention EI obligatoire
  const nomComplet = profile.fullName || 'Remplaçant';
  doc.text(`${nomComplet} - EI`, 20, emetteurY);
  emetteurY += 5;
  doc.text('Médecin remplaçant', 20, emetteurY);
  emetteurY += 5;
  
  // Adresse obligatoire
  if (profile.adresse) {
    doc.text(profile.adresse, 20, emetteurY);
    emetteurY += 5;
  }
  
  // SIREN obligatoire
  if (profile.siren) {
    const formattedSiren = profile.siren.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
    doc.text(`SIREN : ${formattedSiren}`, 20, emetteurY);
  }
  
  // Destinataire (cabinet/client)
  doc.setFont('helvetica', 'bold');
  doc.text('DESTINATAIRE', 120, 50);
  doc.setFont('helvetica', 'normal');
  let destinataireY = 57;
  doc.text(lieu.nom, 120, destinataireY);
  destinataireY += 5;
  if (lieu.adresse) {
    const addressLines = lieu.adresse.split('\n');
    addressLines.forEach((line) => {
      doc.text(line, 120, destinataireY);
      destinataireY += 5;
    });
  }
  if (lieu.email) {
    doc.text(lieu.email, 120, destinataireY);
  }
  
  // Date et période
  doc.setFont('helvetica', 'bold');
  doc.text('Date de facturation:', 20, 95);
  doc.setFont('helvetica', 'normal');
  doc.text(format(invoiceDate, 'dd MMMM yyyy', { locale: fr }), 60, 95);
  
  const sortedJournees = [...journees].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  if (sortedJournees.length > 0) {
    const debut = format(new Date(sortedJournees[0].date), 'dd/MM/yyyy');
    const fin = format(new Date(sortedJournees[sortedJournees.length - 1].date), 'dd/MM/yyyy');
    doc.setFont('helvetica', 'bold');
    doc.text('Période couverte:', 20, 102);
    doc.setFont('helvetica', 'normal');
    doc.text(`Du ${debut} au ${fin}`, 60, 102);
  }
  
  // Tableau des journées
  const tableData = sortedJournees.map((j) => [
    format(new Date(j.date), 'dd/MM/yyyy'),
    `${(j.recettesTotales || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €`,
    `${lieu.pourcentageRetrocession}%`,
    `${(j.honorairesTheoriques || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €`,
  ]);
  
  autoTable(doc, {
    startY: 115,
    head: [['Date', 'Recettes', 'Rétrocession', 'Honoraires']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { halign: 'center' },
      1: { halign: 'right' },
      2: { halign: 'center' },
      3: { halign: 'right' },
    },
  });
  
  // Totaux
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  
  doc.setFillColor(240, 240, 240);
  doc.rect(100, finalY, 90, 30, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Total recettes:', 105, finalY + 10);
  doc.text(`${totalRecettes.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €`, 185, finalY + 10, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL DÛ:', 105, finalY + 22);
  doc.text(`${totalHonoraires.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €`, 185, finalY + 22, { align: 'right' });
  
  // Conditions de paiement obligatoires
  const paymentBlockHeight = 35;
  const legalMentionHeight = 15;
  const marginBottom = 15;
  const requiredSpace = paymentBlockHeight + legalMentionHeight + marginBottom;
  const pageHeight = doc.internal.pageSize.height;
  
  let paymentY = finalY + 15;
  
  // Check if we need a new page for payment conditions
  if (paymentY + requiredSpace > pageHeight) {
    doc.addPage();
    paymentY = 25;
  }
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('Conditions de paiement', 20, paymentY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Délai de paiement : 30 jours à compter de la date de facturation', 20, paymentY + 7);
  doc.text('Escompte pour paiement anticipé : néant', 20, paymentY + 13);
  doc.text('Pénalités de retard : 3 fois le taux de l\'intérêt légal en vigueur, soit 7,86 % par an', 20, paymentY + 19);
  doc.text('Indemnité forfaitaire pour frais de recouvrement en cas de retard de paiement : 40 €', 20, paymentY + 25);
  
  // Informations légales (en bas de page ou après conditions)
  const legalY = paymentY + 40;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Non assujetti à la TVA (Article 261-4-1° du CGI)', 105, legalY, { align: 'center' });
  
  // Sauvegarder
  const filename = `Facture_${invoiceNumber}_${lieu.nom.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}
