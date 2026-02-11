import { useState, useEffect, useMemo } from 'react';
import { Calendar, Filter, ChevronDown, ChevronRight, MoreVertical, Pencil, Trash2, X, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getJournees, getLieux, deleteJournee, updateJournee, Journee, Lieu } from '@/lib/storage';
import { exportHistoriquePDF } from '@/lib/historiqueExport';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Historique() {
  const [journees, setJournees] = useState<Journee[]>([]);
  const [lieux, setLieux] = useState<Lieu[]>([]);
  
  // Filtres
  const [filterLieuId, setFilterLieuId] = useState<string>('all');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [expandedYears, setExpandedYears] = useState<string[]>([]);

  // Edition
  const [editingJournee, setEditingJournee] = useState<Journee | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    lieuId: '',
    recettesTotales: '',
    notes: '',
  });

  useEffect(() => {
    setJournees(getJournees());
    setLieux(getLieux());
  }, []);

  // Générer la liste des années et mois disponibles
  const availableYearsMonths = useMemo(() => {
    const yearMonths: Record<string, string[]> = {};
    journees.forEach(j => {
      if (!j.date) return;
      const monthKey = j.date.substring(0, 7);
      const year = monthKey.substring(0, 4);
      if (!yearMonths[year]) {
        yearMonths[year] = [];
      }
      if (!yearMonths[year].includes(monthKey)) {
        yearMonths[year].push(monthKey);
      }
    });
    // Trier les mois dans chaque année
    Object.keys(yearMonths).forEach(year => {
      yearMonths[year].sort().reverse();
    });
    return yearMonths;
  }, [journees]);

  const availableYears = useMemo(() => {
    return Object.keys(availableYearsMonths).sort().reverse();
  }, [availableYearsMonths]);

  // Toggle year selection
  const toggleYear = (year: string) => {
    const yearMonths = availableYearsMonths[year] || [];
    const allSelected = yearMonths.every(m => selectedMonths.includes(m));
    
    if (allSelected) {
      setSelectedMonths(prev => prev.filter(m => !m.startsWith(year)));
    } else {
      setSelectedMonths(prev => {
        const withoutYear = prev.filter(m => !m.startsWith(year));
        return [...withoutYear, ...yearMonths];
      });
    }
  };

  // Toggle month selection
  const toggleMonth = (month: string) => {
    setSelectedMonths(prev => 
      prev.includes(month) 
        ? prev.filter(m => m !== month)
        : [...prev, month]
    );
  };

  // Toggle year expansion
  const toggleYearExpanded = (year: string) => {
    setExpandedYears(prev => 
      prev.includes(year)
        ? prev.filter(y => y !== year)
        : [...prev, year]
    );
  };

  // Clear all filters
  const clearMonthFilters = () => {
    setSelectedMonths([]);
  };

  // Filtrage des journées
  const filteredJournees = useMemo(() => {
    return journees
      .filter(j => filterLieuId === 'all' || j.lieuId === filterLieuId)
      .filter(j => {
        if (selectedMonths.length === 0) return true;
        if (!j.date) return false;
        const monthKey = j.date.substring(0, 7);
        return selectedMonths.includes(monthKey);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [journees, filterLieuId, selectedMonths]);

  // Statistiques
  const stats = useMemo(() => {
    const totalRecettes = filteredJournees.reduce((sum, j) => sum + (j.recettesTotales || 0), 0);
    const totalHonoraires = filteredJournees.reduce((sum, j) => sum + (j.honorairesTheoriques || 0), 0);
    return {
      count: filteredJournees.length,
      totalRecettes,
      totalHonoraires,
    };
  }, [filteredJournees]);

  const handleDelete = (id: string) => {
    deleteJournee(id);
    setJournees(getJournees());
    toast.success('Journée supprimée');
  };

  const handleEdit = (journee: Journee) => {
    setEditingJournee(journee);
    setEditForm({
      lieuId: journee.lieuId || '',
      recettesTotales: journee.recettesTotales?.toString() || '',
      notes: journee.notes || '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingJournee) return;
    
    const recettes = parseFloat(editForm.recettesTotales) || 0;
    const lieu = lieux.find(l => l.id === editForm.lieuId);
    const honoraires = lieu ? recettes * (lieu.pourcentageRetrocession / 100) : recettes;

    updateJournee(editingJournee.id, {
      lieuId: editForm.lieuId || undefined,
      recettesTotales: recettes,
      honorairesTheoriques: honoraires,
      notes: editForm.notes || undefined,
    });

    setJournees(getJournees());
    setEditDialogOpen(false);
    setEditingJournee(null);
    toast.success('Journée modifiée');
  };

  const getLieuById = (id: string) => lieux.find(l => l.id === id);

  // Grouper les journées par mois pour l'affichage
  const journeesByMonth = useMemo(() => {
    const grouped: Record<string, Journee[]> = {};
    filteredJournees.forEach(j => {
      const monthKey = j.date.substring(0, 7);
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(j);
    });
    return grouped;
  }, [filteredJournees]);

  const sortedMonths = useMemo(() => {
    return Object.keys(journeesByMonth).sort().reverse();
  }, [journeesByMonth]);

  const handleExportPDF = () => {
    exportHistoriquePDF(
      filteredJournees, 
      lieux, 
      { 
        lieuId: filterLieuId !== 'all' ? filterLieuId : undefined,
        months: selectedMonths.length > 0 ? selectedMonths : undefined,
      }
    );
    toast.success('Export PDF téléchargé');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Historique</h1>
          <p className="text-muted-foreground">Consultez toutes vos journées de remplacement</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleExportPDF}
          disabled={filteredJournees.length === 0}
          className="gap-2"
        >
          <FileDown className="w-4 h-4" />
          Export PDF
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Journées</p>
              <p className="text-xl font-bold">{stats.count}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <span className="text-emerald-500 font-bold text-sm">€</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recettes totales</p>
              <p className="text-xl font-bold">{stats.totalRecettes.toLocaleString('fr-FR')} €</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <span className="text-blue-500 font-bold text-sm">€</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Honoraires</p>
              <p className="text-xl font-bold">{stats.totalHonoraires.toLocaleString('fr-FR')} €</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filtre par cabinet */}
        <Select value={filterLieuId} onValueChange={setFilterLieuId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tous les cabinets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les cabinets</SelectItem>
            {lieux.map((lieu) => (
              <SelectItem key={lieu.id} value={lieu.id}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: lieu.couleur }}
                  />
                  {lieu.nom}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtre par période (hiérarchique) */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Période
              {selectedMonths.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {selectedMonths.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Filtrer par période</span>
                {selectedMonths.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-auto p-1 text-xs"
                    onClick={clearMonthFilters}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Effacer
                  </Button>
                )}
              </div>
            </div>
            <ScrollArea className="h-[300px]">
              <div className="p-2 pr-4">
                {availableYears.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">Aucune donnée</p>
                ) : (
                  availableYears.map(year => {
                    const yearMonths = availableYearsMonths[year] || [];
                    const allSelected = yearMonths.every(m => selectedMonths.includes(m));
                    const someSelected = yearMonths.some(m => selectedMonths.includes(m));
                    const isExpanded = expandedYears.includes(year);

                    return (
                      <div key={year} className="mb-1">
                        <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 w-5"
                            onClick={() => toggleYearExpanded(year)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </Button>
                          <Checkbox
                            id={`year-${year}`}
                            checked={allSelected}
                            className={cn(someSelected && !allSelected && "opacity-50")}
                            onCheckedChange={() => toggleYear(year)}
                          />
                          <label
                            htmlFor={`year-${year}`}
                            className="text-sm font-medium cursor-pointer flex-1"
                          >
                            {year}
                          </label>
                          <Badge variant="outline" className="text-xs">
                            {yearMonths.length}
                          </Badge>
                        </div>
                        {isExpanded && (
                          <div className="ml-7 mt-1 space-y-1">
                            {yearMonths.map(month => (
                              <div
                                key={month}
                                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50"
                              >
                                <Checkbox
                                  id={`month-${month}`}
                                  checked={selectedMonths.includes(month)}
                                  onCheckedChange={() => toggleMonth(month)}
                                />
                                <label
                                  htmlFor={`month-${month}`}
                                  className="text-sm cursor-pointer capitalize"
                                >
                                  {format(parseISO(`${month}-01`), 'MMMM', { locale: fr })}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Tags des filtres actifs */}
        {selectedMonths.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedMonths.slice(0, 3).map(month => (
              <Badge key={month} variant="secondary" className="gap-1">
                {format(parseISO(`${month}-01`), 'MMM yyyy', { locale: fr })}
                <button onClick={() => toggleMonth(month)}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {selectedMonths.length > 3 && (
              <Badge variant="secondary">
                +{selectedMonths.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Liste des journées groupées par mois */}
      <div className="space-y-6">
        {sortedMonths.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Aucune journée trouvée</p>
          </div>
        ) : (
          sortedMonths.map(monthKey => {
            const monthJournees = journeesByMonth[monthKey];
            const monthLabel = format(parseISO(`${monthKey}-01`), 'MMMM yyyy', { locale: fr });
            const monthTotal = monthJournees.reduce((sum, j) => sum + (j.honorairesTheoriques || 0), 0);

            return (
              <div key={monthKey} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold capitalize">{monthLabel}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{monthJournees.length} journée{monthJournees.length > 1 ? 's' : ''}</span>
                    <span className="font-medium text-foreground">{monthTotal.toLocaleString('fr-FR')} €</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {monthJournees.map(journee => {
                    const lieu = getLieuById(journee.lieuId || '');
                    return (
                      <div
                        key={journee.id}
                        className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            {/* Date */}
                            <div className="text-center min-w-[50px]">
                              <p className="text-2xl font-bold">
                                {format(parseISO(journee.date), 'd')}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {format(parseISO(journee.date), 'EEE', { locale: fr })}
                              </p>
                            </div>
                            {/* Infos */}
                            <div className="space-y-1">
                              {lieu && (
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: lieu.couleur }}
                                  />
                                  <span className="font-medium">{lieu.nom}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {journee.recettesTotales !== undefined && (
                                  <span>Recettes: {journee.recettesTotales.toLocaleString('fr-FR')} €</span>
                                )}
                                {journee.honorairesTheoriques !== undefined && (
                                  <span className="text-primary font-medium">
                                    Honoraires: {journee.honorairesTheoriques.toLocaleString('fr-FR')} €
                                  </span>
                                )}
                              </div>
                              {journee.notes && (
                                <p className="text-sm text-muted-foreground">{journee.notes}</p>
                              )}
                            </div>
                          </div>
                          {/* Actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(journee)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(journee.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dialog de modification */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Modifier la journée du {editingJournee && format(parseISO(editingJournee.date), 'd MMMM yyyy', { locale: fr })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Cabinet</Label>
              <Select 
                value={editForm.lieuId} 
                onValueChange={(value) => setEditForm(prev => ({ ...prev, lieuId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un cabinet" />
                </SelectTrigger>
                <SelectContent>
                  {lieux.map((lieu) => (
                    <SelectItem key={lieu.id} value={lieu.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: lieu.couleur }}
                        />
                        {lieu.nom} ({lieu.pourcentageRetrocession}%)
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Recettes totales (€)</Label>
              <Input
                type="number"
                value={editForm.recettesTotales}
                onChange={(e) => setEditForm(prev => ({ ...prev, recettesTotales: e.target.value }))}
                placeholder="0"
              />
              {editForm.lieuId && editForm.recettesTotales && (
                <p className="text-sm text-muted-foreground">
                  Honoraires calculés : {(
                    parseFloat(editForm.recettesTotales) * 
                    (lieux.find(l => l.id === editForm.lieuId)?.pourcentageRetrocession || 0) / 100
                  ).toLocaleString('fr-FR')} €
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notes optionnelles..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveEdit}>
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
