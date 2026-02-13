import { useEffect, useState, useMemo } from 'react';
import { TrendingUp, AlertTriangle, Calendar, Building2 } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { PendingPayments } from '@/components/dashboard/PendingPayments';
import { Reminders } from '@/components/dashboard/Reminders';
import { getStatistics, getJournees, getLieux, getVirements } from '@/lib/storage';

const Index = () => {
  const [stats, setStats] = useState(getStatistics());
  const [journees, setJournees] = useState(getJournees());
  const [virements, setVirements] = useState(getVirements());
  const [lieux, setLieux] = useState(getLieux());

  useEffect(() => {
    setStats(getStatistics());
    setJournees(getJournees());
    setVirements(getVirements());
    setLieux(getLieux());
  }, []);

  const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  
  // Get this month's stats
  const now = new Date();
  const journeesThisMonth = journees.filter(j => {
    const date = new Date(j.date);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
  const revenueThisMonth = journeesThisMonth.reduce((sum, j) => sum + (j.honorairesTheoriques || 0), 0);

  // Calculate cabinet balances (aggregated)
  const totalPartialMissing = useMemo(() => {
    let total = 0;
    
    lieux.forEach(lieu => {
      const totalAttendu = journees
        .filter(j => j.lieuId === lieu.id)
        .reduce((sum, j) => sum + (j.honorairesTheoriques || 0), 0);

      const totalRecu = virements
        .filter(v => v.statut === 'recu' && v.lieuId === lieu.id)
        .reduce((sum, v) => sum + (v.montantRecu || 0), 0);
      
      const solde = totalRecu - totalAttendu;
      if (solde < 0) {
        total += Math.abs(solde);
        }
    });
    
    return total;
  }, [journees, virements, lieux]);

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Welcome header */}
      <div className="space-y-1">
        <h1 className="text-2xl lg:text-3xl font-bold">
          Bonjour ! 👋
        </h1>
        <p className="text-muted-foreground">
          Voici un aperçu de votre activité pour {currentMonth}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Revenus ce mois"
          value={`${revenueThisMonth.toLocaleString('fr-FR')} €`}
          subtitle="Honoraires théoriques"
          icon={TrendingUp}
          variant="primary"
        />
        <StatCard
          title="Partiels manquants"
          value={`${totalPartialMissing.toLocaleString('fr-FR')} €`}
          subtitle="Solde cabinets négatif"
          icon={AlertTriangle}
          variant={totalPartialMissing > 0 ? 'warning' : 'default'}
        />
        <StatCard
          title="Journées ce mois"
          value={journeesThisMonth.length.toString()}
          subtitle="Remplacements effectués"
          icon={Calendar}
        />
        <StatCard
          title="Cabinets"
          value={stats.nombreLieux.toString()}
          subtitle="Lieux de remplacement"
          icon={Building2}
        />
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Reminders */}
      <Reminders />

      {/* Two column layout for desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PendingPayments />
        <RecentActivity />
      </div>
    </div>
  );
};

export default Index;
