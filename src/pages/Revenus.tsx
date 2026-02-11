import { useState, useEffect, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { getJournees, getLieux, Journee, Lieu } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, isSameMonth, getYear, startOfYear, endOfYear } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function Revenus() {
  const [journees, setJournees] = useState<Journee[]>([]);
  const [lieux, setLieux] = useState<Lieu[]>([]);
  const [period, setPeriod] = useState('6');
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    setJournees(getJournees());
    setLieux(getLieux());
  }, []);

  // Get available years from data
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    journees.forEach(j => {
      if (j.date) {
        years.add(getYear(new Date(j.date)));
      }
    });
    // Add current year if not present
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [journees]);

  const now = new Date();
  const monthsCount = parseInt(period);
  
  // Monthly view data
  const monthlyMonths = eachMonthOfInterval({
    start: subMonths(startOfMonth(now), monthsCount - 1),
    end: endOfMonth(now),
  });

  // Yearly view data - all months of selected year
  const yearlyMonths = useMemo(() => {
    const year = parseInt(selectedYear);
    return eachMonthOfInterval({
      start: startOfYear(new Date(year, 0, 1)),
      end: endOfYear(new Date(year, 0, 1)),
    });
  }, [selectedYear]);

  const months = viewMode === 'yearly' ? yearlyMonths : monthlyMonths;

  // Calculate monthly data
  const monthlyData = months.map(month => {
    const monthJournees = journees.filter(j => isSameMonth(new Date(j.date), month));
    const recettes = monthJournees.reduce((sum, j) => sum + (j.recettesTotales || 0), 0);
    const honoraires = monthJournees.reduce((sum, j) => sum + (j.honorairesTheoriques || 0), 0);
    
    return {
      month: format(month, viewMode === 'yearly' ? 'MMM' : 'MMM yy', { locale: fr }),
      fullMonth: format(month, 'MMMM yyyy', { locale: fr }),
      recettes,
      honoraires,
      jours: monthJournees.length,
    };
  });

  // Calculate per-cabinet stats for the selected period
  const cabinetStats = useMemo(() => {
    const periodJournees = viewMode === 'yearly'
      ? journees.filter(j => getYear(new Date(j.date)) === parseInt(selectedYear))
      : journees.filter(j => {
          const jDate = new Date(j.date);
          return months.some(m => isSameMonth(jDate, m));
        });

    return lieux.map(lieu => {
      const lieuJournees = periodJournees.filter(j => j.lieuId === lieu.id);
      const totalRecettes = lieuJournees.reduce((sum, j) => sum + (j.recettesTotales || 0), 0);
      const totalHonoraires = lieuJournees.reduce((sum, j) => sum + (j.honorairesTheoriques || 0), 0);
      const avgPerDay = lieuJournees.length > 0 ? totalHonoraires / lieuJournees.length : 0;
      
      return {
        id: lieu.id,
        nom: lieu.nom,
        couleur: lieu.couleur,
        jours: lieuJournees.length,
        recettes: totalRecettes,
        honoraires: totalHonoraires,
        avgPerDay,
      };
    }).sort((a, b) => b.honoraires - a.honoraires);
  }, [journees, lieux, viewMode, selectedYear, months]);

  // Current vs previous month comparison (only for monthly view)
  const currentMonthData = monthlyData[monthlyData.length - 1];
  const previousMonthData = monthlyData[monthlyData.length - 2];
  const revenueChange = previousMonthData?.honoraires 
    ? ((currentMonthData.honoraires - previousMonthData.honoraires) / previousMonthData.honoraires * 100)
    : 0;

  // Totals
  const totalHonoraires = monthlyData.reduce((sum, m) => sum + m.honoraires, 0);
  const totalJours = monthlyData.reduce((sum, m) => sum + m.jours, 0);
  const displayMonthsCount = viewMode === 'yearly' ? 12 : monthsCount;
  const avgPerMonth = totalHonoraires / displayMonthsCount;
  const avgPerDay = totalJours > 0 ? totalHonoraires / totalJours : 0;


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Revenus</h1>
          <p className="text-muted-foreground">Analyse de vos revenus et statistiques</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'monthly' | 'yearly')}>
            <TabsList>
              <TabsTrigger value="monthly">Mensuel</TabsTrigger>
              <TabsTrigger value="yearly">Annuel</TabsTrigger>
            </TabsList>
          </Tabs>
          {viewMode === 'monthly' ? (
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 derniers mois</SelectItem>
                <SelectItem value="6">6 derniers mois</SelectItem>
                <SelectItem value="12">12 derniers mois</SelectItem>
              </SelectContent>
            </Select>
          ) : (
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground mb-1">
            {viewMode === 'yearly' ? `Total ${selectedYear}` : 'Ce mois'}
          </p>
          <p className="text-2xl font-bold">
            {viewMode === 'yearly' 
              ? totalHonoraires.toLocaleString('fr-FR')
              : currentMonthData.honoraires.toLocaleString('fr-FR')
            } €
          </p>
          {viewMode === 'monthly' && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-sm',
              revenueChange >= 0 ? 'text-success' : 'text-destructive'
            )}>
              {revenueChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(revenueChange).toFixed(0)}% vs mois dernier
            </div>
          )}
          {viewMode === 'yearly' && (
            <p className="text-sm text-muted-foreground mt-2">Honoraires nets</p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground mb-1">Moyenne mensuelle</p>
          <p className="text-2xl font-bold">{avgPerMonth.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</p>
          <p className="text-sm text-muted-foreground mt-2">
            Sur {viewMode === 'yearly' ? '12' : monthsCount} mois
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground mb-1">Moyenne / jour</p>
          <p className="text-2xl font-bold">{avgPerDay.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</p>
          <p className="text-sm text-muted-foreground mt-2">{totalJours} jours travaillés</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground mb-1">
            {viewMode === 'yearly' ? 'Recettes brutes' : 'Total période'}
          </p>
          <p className="text-2xl font-bold">
            {viewMode === 'yearly'
              ? monthlyData.reduce((sum, m) => sum + m.recettes, 0).toLocaleString('fr-FR')
              : totalHonoraires.toLocaleString('fr-FR')
            } €
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {viewMode === 'yearly' ? 'Avant rétrocession' : 'Honoraires nets'}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Chart */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold mb-4">Évolution mensuelle</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number) => [`${value.toLocaleString('fr-FR')} €`, 'Honoraires']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="honoraires" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Days Chart */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold mb-4">Jours travaillés</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  formatter={(value: number) => [`${value} jours`, 'Remplacements']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="jours" 
                  stroke="hsl(var(--accent))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--accent))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Per Cabinet Stats */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold mb-4">Revenus par cabinet</h2>
        {cabinetStats.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Aucune donnée disponible. Ajoutez des cabinets et des journées pour voir les statistiques.
          </p>
        ) : (
          <div className="space-y-4">
            {cabinetStats.map((cabinet, index) => (
              <div key={cabinet.id} className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold text-muted-foreground bg-muted">
                  {index + 1}
                </div>
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-primary-foreground font-bold"
                  style={{ backgroundColor: cabinet.couleur }}
                >
                  {cabinet.nom.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{cabinet.nom}</p>
                  <p className="text-sm text-muted-foreground">{cabinet.jours} jours</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{cabinet.honoraires.toLocaleString('fr-FR')} €</p>
                  <p className="text-sm text-muted-foreground">
                    ~{cabinet.avgPerDay.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €/j
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
