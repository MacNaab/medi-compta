import { Link } from 'react-router-dom';
import { Plus, CalendarPlus, Receipt, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const actions = [
  {
    name: 'Nouvelle journée',
    description: 'Saisir une journée de travail',
    href: '/calendrier',
    icon: CalendarPlus,
    color: 'bg-primary/10 text-primary hover:bg-primary/20',
  },
  {
    name: 'Nouveau cabinet',
    description: 'Ajouter un lieu de remplacement',
    href: '/cabinets',
    icon: Building2,
    color: 'bg-accent/10 text-accent hover:bg-accent/20',
  },
  {
    name: 'Paiement reçu',
    description: 'Marquer un paiement comme reçu',
    href: '/paiements',
    icon: Receipt,
    color: 'bg-success/10 text-success hover:bg-success/20',
  },
];

export function QuickActions() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Actions rapides</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {actions.map((action) => (
          <Link
            key={action.name}
            to={action.href}
            className={cn(
              'flex items-center gap-4 p-4 rounded-xl border border-border bg-card',
              'transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5'
            )}
          >
            <div className={cn('p-3 rounded-xl transition-colors', action.color)}>
              <action.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium">{action.name}</p>
              <p className="text-sm text-muted-foreground">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
