import { ArrowRight, AlertTriangle, Check } from 'lucide-react';
import { getVirements, getLieux, getJournees } from '@/lib/storage';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useMemo } from 'react';

interface CabinetBalance {
  lieuId: string;
  lieuNom: string;
  lieuCouleur: string;
  totalAttendu: number;
  totalRecu: number;
  solde: number;
}

export function PendingPayments() {
  const virements = getVirements();
  const lieux = getLieux();
  const journees = getJournees();

  const cabinetBalances = useMemo((): CabinetBalance[] => {
    const balances: CabinetBalance[] = [];

    lieux.forEach(lieu => {
      const totalAttendu = journees
        .filter(j => j.lieuId === lieu.id)
        .reduce((sum, j) => sum + (j.honorairesTheoriques || 0), 0);

      const totalRecu = virements
        .filter(v => v.statut === 'recu' && v.lieuId === lieu.id)
        .reduce((sum, v) => sum + (v.montantRecu || 0), 0);

      const solde = totalRecu - totalAttendu;

      if (solde < 0) {
        balances.push({
          lieuId: lieu.id,
          lieuNom: lieu.nom,
          lieuCouleur: lieu.couleur,
          totalAttendu,
          totalRecu,
          solde,
        });
      }
    });

    return balances.sort((a, b) => a.solde - b.solde);
  }, [virements, journees, lieux]);

  const totalMissing = cabinetBalances.reduce((sum, b) => sum + Math.abs(b.solde), 0);

  if (cabinetBalances.length === 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Solde cabinets</h2>
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
            <Check className="w-6 h-6 text-success" />
          </div>
          <p className="font-medium text-success mb-1">Tout est à jour !</p>
          <p className="text-sm text-muted-foreground">Aucun solde négatif détecté</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Solde cabinets</h2>
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
            <p className="font-semibold text-lg">{totalMissing.toLocaleString('fr-FR')} €</p>
            <p className="text-sm text-muted-foreground">
              {cabinetBalances.length} cabinet{cabinetBalances.length > 1 ? 's' : ''} avec solde négatif
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {cabinetBalances.slice(0, 5).map((balance) => (
            <div 
              key={balance.lieuId} 
              className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-2 h-8 rounded-full"
                  style={{ backgroundColor: balance.lieuCouleur || '#6B7280' }}
                />
                <div>
                  <p className="font-medium">{balance.lieuNom}</p>
                  <p className="text-xs text-muted-foreground">
                    Reçu {balance.totalRecu.toLocaleString('fr-FR')} € / Attendu {balance.totalAttendu.toLocaleString('fr-FR')} €
                  </p>
                </div>
              </div>
              <p className="font-semibold text-destructive">{balance.solde.toLocaleString('fr-FR')} €</p>
            </div>
          ))}
          {cabinetBalances.length > 5 && (
            <p className="text-sm text-muted-foreground text-center pt-2">
              +{cabinetBalances.length - 5} autre{cabinetBalances.length - 5 > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
