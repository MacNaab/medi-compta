import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Wallet, Building2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getJournees, getVirements, getLieux } from '@/lib/storage';
import { Link } from 'react-router-dom';

export function RecentActivity() {
  const journees = getJournees().slice(-5).reverse();
  const virements = getVirements().slice(-5).reverse();
  const lieux = getLieux();

  const getLieuName = (lieuId?: string) => {
    if (!lieuId) return 'Non spécifié';
    return lieux.find(l => l.id === lieuId)?.nom || 'Cabinet inconnu';
  };

  const activities = [
    ...journees.map(j => ({
      type: 'journee' as const,
      id: j.id,
      date: new Date(j.createdAt),
      title: `Journée au ${getLieuName(j.lieuId)}`,
      subtitle: j.recettesTotales ? `${j.recettesTotales.toLocaleString('fr-FR')} €` : 'Recettes non saisies',
      icon: Calendar,
      color: 'text-primary bg-primary/10',
    })),
    ...virements.map(v => ({
      type: 'virement' as const,
      id: v.id,
      date: new Date(v.createdAt),
      title: `Virement ${v.statut === 'recu' ? 'reçu' : 'en attente'}`,
      subtitle: v.montantRecu ? `${v.montantRecu.toLocaleString('fr-FR')} €` : 'Montant non spécifié',
      icon: Wallet,
      color: v.statut === 'recu' ? 'text-success bg-success/10' : 'text-warning bg-warning/10',
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

  if (activities.length === 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Activité récente</h2>
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Calendar className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">Aucune activité pour le moment</p>
          <Link 
            to="/calendrier" 
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
          >
            Saisir votre première journée
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Activité récente</h2>
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {activities.map((activity) => (
          <div key={`${activity.type}-${activity.id}`} className="flex items-center gap-4 p-4">
            <div className={cn('p-2.5 rounded-lg', activity.color)}>
              <activity.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{activity.title}</p>
              <p className="text-sm text-muted-foreground">{activity.subtitle}</p>
            </div>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(activity.date, { addSuffix: true, locale: fr })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
