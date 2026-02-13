import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertTriangle, Download, Eye, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Lieu, Journee, UserProfile } from '@/lib/storage';
import { calculateInvoiceTotals } from '@/lib/invoiceExport';

interface InvoicePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceNumber: string;
  invoiceDate: Date;
  lieu: Lieu;
  journees: Journee[];
  profile: UserProfile;
  onConfirm: () => void;
}

export function InvoicePreviewDialog({
  open,
  onOpenChange,
  invoiceNumber,
  invoiceDate,
  lieu,
  journees,
  profile,
  onConfirm,
}: InvoicePreviewDialogProps) {
  const { totalRecettes, totalHonoraires } = calculateInvoiceTotals(journees);
  
  const sortedJournees = [...journees].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const missingFields: string[] = [];
  if (!profile.adresse) missingFields.push('Adresse professionnelle');
  if (!profile.siren) missingFields.push('Numéro SIREN');

  const formatSiren = (siren: string) => {
    return siren.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  };

  const handleConfirmAndClose = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Aperçu de la facture
          </DialogTitle>
          <DialogDescription>
            Vérifiez les informations avant de générer le PDF
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="p-6 pt-4 space-y-6">
            {/* Missing fields warning */}
            {missingFields.length > 0 && (
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium text-warning">Informations manquantes</p>
                    <p className="text-sm text-muted-foreground">
                      Les champs suivants sont obligatoires sur une facture et peuvent être renseignés dans Paramètres &gt; Profil :
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside">
                      {missingFields.map((field) => (
                        <li key={field}>{field}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Invoice preview - styled like a document */}
            <div className="border rounded-lg bg-white dark:bg-card p-6 space-y-6 shadow-sm">
              {/* Header */}
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold">FACTURE</h2>
                <p className="text-muted-foreground">N° {invoiceNumber}</p>
              </div>

              <Separator />

              {/* Parties */}
              <div className="grid grid-cols-2 gap-6">
                {/* Émetteur */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Émetteur
                  </h3>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{profile.fullName || 'Non renseigné'} - EI</p>
                    <p className="text-muted-foreground">Médecin remplaçant</p>
                    {profile.adresse ? (
                      <p className="text-muted-foreground">{profile.adresse}</p>
                    ) : (
                      <p className="text-warning italic">Adresse non renseignée</p>
                    )}
                    {profile.siren ? (
                      <p className="text-muted-foreground">SIREN : {formatSiren(profile.siren)}</p>
                    ) : (
                      <p className="text-warning italic">SIREN non renseigné</p>
                    )}
                  </div>
                </div>

                {/* Destinataire */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Destinataire
                  </h3>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{lieu.nom}</p>
                    {lieu.adresse && (
                      <p className="text-muted-foreground whitespace-pre-line">{lieu.adresse}</p>
                    )}
                    {lieu.email && (
                      <p className="text-muted-foreground">{lieu.email}</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Dates */}
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Date de facturation : </span>
                  <span className="font-medium">{format(invoiceDate, 'dd MMMM yyyy', { locale: fr })}</span>
                </div>
                {sortedJournees.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Période : </span>
                    <span className="font-medium">
                      Du {format(new Date(sortedJournees[0].date), 'dd/MM/yyyy')} au{' '}
                      {format(new Date(sortedJournees[sortedJournees.length - 1].date), 'dd/MM/yyyy')}
                    </span>
                  </div>
                )}
              </div>

              {/* Table */}
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-primary text-primary-foreground">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Date</th>
                      <th className="px-4 py-2 text-right font-medium">Recettes</th>
                      <th className="px-4 py-2 text-center font-medium">Rétrocession</th>
                      <th className="px-4 py-2 text-right font-medium">Honoraires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedJournees.map((journee, index) => (
                      <tr key={journee.id} className={index % 2 === 0 ? 'bg-muted/30' : ''}>
                        <td className="px-4 py-2">
                          {format(new Date(journee.date), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {(journee.recettesTotales || 0).toFixed(2)} €
                        </td>
                        <td className="px-4 py-2 text-center">
                          {lieu.pourcentageRetrocession}%
                        </td>
                        <td className="px-4 py-2 text-right">
                          {(journee.honorairesTheoriques || 0).toFixed(2)} €
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total recettes</span>
                    <span>{totalRecettes.toFixed(2)} €</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-bold">
                    <span>TOTAL DÛ</span>
                    <span className="text-primary">{totalHonoraires.toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              {/* Payment conditions */}
              <div className="bg-muted/50 rounded-md p-4 text-xs space-y-1">
                <p className="font-medium">Conditions de paiement</p>
                <p className="text-muted-foreground">Délai de paiement : 30 jours à compter de la date de facturation</p>
                <p className="text-muted-foreground">Escompte pour paiement anticipé : néant</p>
                <p className="text-muted-foreground">Pénalités de retard : 3 fois le taux de l'intérêt légal en vigueur, soit 7,86 % par an</p>
                <p className="text-muted-foreground">Indemnité forfaitaire pour frais de recouvrement : 40 €</p>
              </div>

              {/* Legal mention */}
              <p className="text-center text-xs text-muted-foreground">
                Non assujetti à la TVA (Article 261-4-1° du CGI)
              </p>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-muted/30">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
          <Button onClick={handleConfirmAndClose}>
            <Download className="w-4 h-4 mr-2" />
            Télécharger le PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
