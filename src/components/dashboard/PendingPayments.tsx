import { Wallet, ArrowRight, AlertTriangle, Check } from 'lucide-react';
import { getVirements, getLieux, getJournees, Virement, Journee } from '@/lib/storage';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useMemo } from 'react';
import { parseISO, isWithinInterval } from 'date-fns';

export function PendingPayments() {
  const virements = getVirements();
  const lieux = getLieux();
  const journees = getJournees();

  const getLieu = (lieuId?: string) => {
    if (!lieuId) return null;
    return lieux.find(l => l.id === lieuId);
  };

  // Calculate partial payments (received payments where montantRecu < montantAttendu)
  const partialPayments = useMemo(() => {
    const payments: Array<{
      lieuId: string;
      lieuNom: string;
      lieuCouleur: string;
      montantAttendu: number;
      montantRecu: number;
      montantManquant: number;
      dateDebut: string;
      dateFin: string;
    }> = [];

    virements.filter(v => v.statut === 'recu').forEach(v => {
      if (!v.lieuId || !v.dateDebut || !v.dateFin) return;

      const lieu = lieux.find(l => l.id === v.lieuId);
      if (!lieu) return;

      const start = parseISO(v.dateDebut);
      const end = parseISO(v.dateFin);

      const journeesInPeriod = journees.filter(j => {
        if (j.lieuId !== v.lieuId) return false;
        const journeeDate = parseISO(j.date);
        return isWithinInterval(journeeDate, { start, end });
      });

      const montantAttendu = journeesInPeriod.reduce((sum, j) => sum + (j.honorairesTheoriques || 0), 0);
      const montantRecu = v.montantRecu || 0;
      const montantManquant = montantAttendu - montantRecu;

      if (montantManquant > 0) {
        payments.push({
          lieuId: v.lieuId,
          lieuNom: lieu.nom,
          lieuCouleur: lieu.couleur,
          montantAttendu,
          montantRecu,
          montantManquant,
          dateDebut: v.dateDebut,
          dateFin: v.dateFin,
        });
      }
    });

    return payments;
  }, [virements, journees, lieux]);

  const totalPartialMissing = partialPayments.reduce((sum, p) => sum + p.montantManquant, 0);

  if (partialPayments.length === 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">À encaisser</h2>
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
            <Check className="w-6 h-6 text-success" />
          </div>
          <p className="font-medium text-success mb-1">Tout est à jour !</p>
          <p className="text-sm text-muted-foreground">Aucun paiement partiel manquant</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">À encaisser</h2>
        <Link to="/paiements">
          <Button variant="ghost" size="sm" className="text-primary">
            Voir tout
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
      
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-destructive/20">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="font-semibold text-lg">{totalPartialMissing.toLocaleString('fr-FR')} €</p>
            <p className="text-sm text-muted-foreground">
              {partialPayments.length} paiement{partialPayments.length > 1 ? 's' : ''} partiel{partialPayments.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {partialPayments.slice(0, 5).map((payment, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-2 h-8 rounded-full"
                  style={{ backgroundColor: payment.lieuCouleur || '#6B7280' }}
                />
                <div>
                  <p className="font-medium">{payment.lieuNom}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(payment.dateDebut).toLocaleDateString('fr-FR')} - {new Date(payment.dateFin).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-destructive">-{payment.montantManquant.toLocaleString('fr-FR')} €</p>
                <p className="text-xs text-muted-foreground">
                  sur {payment.montantAttendu.toLocaleString('fr-FR')} €
                </p>
              </div>
            </div>
          ))}
          {partialPayments.length > 5 && (
            <p className="text-sm text-muted-foreground text-center pt-2">
              +{partialPayments.length - 5} autre{partialPayments.length - 5 > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
