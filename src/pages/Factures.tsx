import { useState, useMemo, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileText, Download, Calendar, Building2, CheckCircle2, Filter, ChevronDown, ChevronRight, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getLieux, getJournees, getProfile, Lieu, Journee, UserProfile } from '@/lib/storage';
import { exportInvoicePDF, generateInvoiceNumber, calculateInvoiceTotals } from '@/lib/invoiceExport';
import { InvoicePreviewDialog } from '@/components/invoices/InvoicePreviewDialog';

export default function Factures() {
  const [lieux, setLieux] = useState<Lieu[]>([]);
  const [journees, setJournees] = useState<Journee[]>([]);
  const [selectedLieuId, setSelectedLieuId] = useState<string>('');
  const [selectedJourneeIds, setSelectedJourneeIds] = useState<Set<string>>(new Set());
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [expandedYears, setExpandedYears] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{
    invoiceNumber: string;
    invoiceDate: Date;
    profile: UserProfile;
  } | null>(null);

  useEffect(() => {
    setLieux(getLieux());
    setJournees(getJournees());
  }, []);

  // Journées filtrées par cabinet sélectionné et non encore facturées (hypothèse: toutes disponibles)
  const availableJournees = useMemo(() => {
    if (!selectedLieuId) return [];
    return journees
      .filter((j) => j.lieuId === selectedLieuId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [journees, selectedLieuId]);

  // Available years and months for filtering
  const availableYearsMonths = useMemo(() => {
    const yearMonths: Record<string, string[]> = {};
    availableJournees.forEach((j) => {
      const monthKey = j.date.substring(0, 7);
      const year = monthKey.substring(0, 4);
      if (!yearMonths[year]) {
        yearMonths[year] = [];
      }
      if (!yearMonths[year].includes(monthKey)) {
        yearMonths[year].push(monthKey);
      }
    });
    Object.keys(yearMonths).forEach((year) => {
      yearMonths[year].sort().reverse();
    });
    return yearMonths;
  }, [availableJournees]);

  const availableYears = useMemo(() => {
    return Object.keys(availableYearsMonths).sort().reverse();
  }, [availableYearsMonths]);

  // Filtered journees based on selected months
  const filteredJournees = useMemo(() => {
    if (selectedMonths.length === 0) return availableJournees;
    return availableJournees.filter((j) => {
      const monthKey = j.date.substring(0, 7);
      return selectedMonths.includes(monthKey);
    });
  }, [availableJournees, selectedMonths]);

  const selectedLieu = useMemo(() => {
    return lieux.find((l) => l.id === selectedLieuId);
  }, [lieux, selectedLieuId]);

  const selectedJournees = useMemo(() => {
    return filteredJournees.filter((j) => selectedJourneeIds.has(j.id));
  }, [filteredJournees, selectedJourneeIds]);

  const { totalRecettes, totalHonoraires } = useMemo(() => {
    return calculateInvoiceTotals(selectedJournees);
  }, [selectedJournees]);

  const handleSelectAll = () => {
    if (selectedJourneeIds.size === filteredJournees.length) {
      setSelectedJourneeIds(new Set());
    } else {
      setSelectedJourneeIds(new Set(filteredJournees.map((j) => j.id)));
    }
  };

  // Toggle year filter
  const toggleYear = (year: string) => {
    const yearMonths = availableYearsMonths[year] || [];
    const allSelected = yearMonths.every((m) => selectedMonths.includes(m));
    
    if (allSelected) {
      setSelectedMonths((prev) => prev.filter((m) => !m.startsWith(year)));
    } else {
      setSelectedMonths((prev) => {
        const withoutYear = prev.filter((m) => !m.startsWith(year));
        return [...withoutYear, ...yearMonths];
      });
    }
  };

  // Toggle month filter
  const toggleMonth = (month: string) => {
    setSelectedMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
    );
  };

  // Toggle year expansion
  const toggleYearExpanded = (year: string) => {
    setExpandedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  // Clear month filters
  const clearMonthFilters = () => {
    setSelectedMonths([]);
  };

  const handleToggleJournee = (id: string) => {
    const newSet = new Set(selectedJourneeIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedJourneeIds(newSet);
  };

  const handleOpenPreview = () => {
    if (!selectedLieu || selectedJournees.length === 0) {
      toast.error('Sélectionnez au moins une journée');
      return;
    }

    const profile = getProfile();
    setPreviewData({
      invoiceNumber: generateInvoiceNumber(),
      invoiceDate: new Date(),
      profile,
    });
    setPreviewOpen(true);
  };

  const handleConfirmGenerateInvoice = () => {
    if (!selectedLieu || selectedJournees.length === 0 || !previewData) {
      return;
    }

    exportInvoicePDF({
      invoiceNumber: previewData.invoiceNumber,
      invoiceDate: previewData.invoiceDate,
      lieu: selectedLieu,
      journees: selectedJournees,
      profile: previewData.profile,
    });

    toast.success('Facture générée avec succès');
    setPreviewData(null);
  };

  // Reset selection and filters when changing cabinet
  useEffect(() => {
    setSelectedJourneeIds(new Set());
    setSelectedMonths([]);
    setExpandedYears([]);
  }, [selectedLieuId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Générer une facture</h1>
        <p className="text-muted-foreground">
          Créez une facture pour un cabinet basée sur vos journées de remplacement
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sélection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Sélection des journées
            </CardTitle>
            <CardDescription>
              Choisissez le cabinet puis les journées à inclure dans la facture
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sélection du cabinet */}
            <div className="space-y-2">
              <Label>Cabinet</Label>
              <Select value={selectedLieuId} onValueChange={setSelectedLieuId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un cabinet" />
                </SelectTrigger>
                <SelectContent>
                  {lieux.map((lieu) => (
                    <SelectItem key={lieu.id} value={lieu.id}>
                      {lieu.nom} ({lieu.pourcentageRetrocession}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Liste des journées */}
            {selectedLieuId && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <Label>Journées disponibles</Label>
                  {availableJournees.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Period filter popover */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
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
                                availableYears.map((year) => {
                                  const yearMonths = availableYearsMonths[year] || [];
                                  const allSelected = yearMonths.every((m) => selectedMonths.includes(m));
                                  const someSelected = yearMonths.some((m) => selectedMonths.includes(m));
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
                                          id={`facture-year-${year}`}
                                          checked={allSelected}
                                          className={cn(someSelected && !allSelected && "opacity-50")}
                                          onCheckedChange={() => toggleYear(year)}
                                        />
                                        <label
                                          htmlFor={`facture-year-${year}`}
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
                                          {yearMonths.map((month) => (
                                            <div
                                              key={month}
                                              className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50"
                                            >
                                              <Checkbox
                                                id={`facture-month-${month}`}
                                                checked={selectedMonths.includes(month)}
                                                onCheckedChange={() => toggleMonth(month)}
                                              />
                                              <label
                                                htmlFor={`facture-month-${month}`}
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

                      {/* Active filter tags */}
                      {selectedMonths.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {selectedMonths.slice(0, 2).map((month) => (
                            <Badge key={month} variant="secondary" className="gap-1">
                              {format(parseISO(`${month}-01`), 'MMM yyyy', { locale: fr })}
                              <button onClick={() => toggleMonth(month)}>
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                          {selectedMonths.length > 2 && (
                            <Badge variant="secondary">+{selectedMonths.length - 2}</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {filteredJournees.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{availableJournees.length === 0 ? 'Aucune journée enregistrée pour ce cabinet' : 'Aucune journée pour cette période'}</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={filteredJournees.length > 0 && selectedJourneeIds.size === filteredJournees.length}
                              onCheckedChange={handleSelectAll}
                              aria-label="Tout sélectionner"
                            />
                          </TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Recettes</TableHead>
                          <TableHead className="text-right">Honoraires</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredJournees.map((journee) => (
                          <TableRow
                            key={journee.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleToggleJournee(journee.id)}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedJourneeIds.has(journee.id)}
                                onCheckedChange={() => handleToggleJournee(journee.id)}
                              />
                            </TableCell>
                            <TableCell>
                              {format(parseISO(journee.date), 'EEEE d MMMM yyyy', { locale: fr })}
                            </TableCell>
                            <TableCell className="text-right">
                              {(journee.recettesTotales || 0).toFixed(2)} €
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {(journee.honorairesTheoriques || 0).toFixed(2)} €
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aperçu et génération */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Aperçu de la facture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedLieu ? (
              <>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cabinet</span>
                    <span className="font-medium">{selectedLieu.nom}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Rétrocession</span>
                    <Badge variant="secondary">{selectedLieu.pourcentageRetrocession}%</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Journées</span>
                    <span className="font-medium">{selectedJournees.length}</span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total recettes</span>
                    <span>{totalRecettes.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Honoraires dus</span>
                    <span className="text-primary">{totalHonoraires.toFixed(2)} €</span>
                  </div>
                </div>

                <Button
                  className="w-full mt-4"
                  size="lg"
                  onClick={handleOpenPreview}
                  disabled={selectedJournees.length === 0}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Aperçu et génération
                </Button>

                {selectedJournees.length > 0 && (
                  <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {selectedJournees.length} journée{selectedJournees.length > 1 ? 's' : ''} sélectionnée
                    {selectedJournees.length > 1 ? 's' : ''}
                  </p>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Sélectionnez un cabinet pour commencer</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice Preview Dialog */}
      {selectedLieu && previewData && (
        <InvoicePreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          invoiceNumber={previewData.invoiceNumber}
          invoiceDate={previewData.invoiceDate}
          lieu={selectedLieu}
          journees={selectedJournees}
          profile={previewData.profile}
          onConfirm={handleConfirmGenerateInvoice}
        />
      )}
    </div>
  );
}
