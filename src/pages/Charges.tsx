import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Pencil, Trash2, Car, Laptop, GraduationCap, Shield, Phone, HelpCircle, Receipt, FileDown, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { toast } from 'sonner';
import { getCharges, saveCharge, updateCharge, deleteCharge, Charge } from '@/lib/storage';
import { MoreHorizontal } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { NumberInput } from '@/components/ui/number-input';

const CATEGORIES = [
  { value: 'transport', label: 'Transport', icon: Car, color: 'hsl(var(--chart-1))' },
  { value: 'materiel', label: 'Matériel', icon: Laptop, color: 'hsl(var(--chart-2))' },
  { value: 'formation', label: 'Formation', icon: GraduationCap, color: 'hsl(var(--chart-3))' },
  { value: 'cotisations', label: 'Cotisations', icon: Receipt, color: 'hsl(var(--chart-4))' },
  { value: 'assurance', label: 'Assurance', icon: Shield, color: 'hsl(var(--chart-5))' },
  { value: 'telephone', label: 'Téléphone/Internet', icon: Phone, color: 'hsl(210, 70%, 50%)' },
  { value: 'autre', label: 'Autre', icon: HelpCircle, color: 'hsl(0, 0%, 50%)' },
] as const;

type CategoryValue = typeof CATEGORIES[number]['value'];

const getCategoryInfo = (value: string) => {
  return CATEGORIES.find(c => c.value === value) || CATEGORIES[6];
};

export default function Charges() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCharge, setEditingCharge] = useState<Charge | null>(null);
  const [form, setForm] = useState({
    categorie: 'autre' as CategoryValue,
    description: '',
    montant: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    deductible: true,
    notes: '',
  });

  useEffect(() => {
    setCharges(getCharges());
  }, []);

  const availableYears = useMemo(() => {
    const years = new Set(charges.map(c => new Date(c.date).getFullYear()));
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [charges]);

  const filteredCharges = useMemo(() => {
    return charges
      .filter(c => new Date(c.date).getFullYear() === selectedYear)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [charges, selectedYear]);

  const stats = useMemo(() => {
    const total = filteredCharges.reduce((sum, c) => sum + c.montant, 0);
    const deductible = filteredCharges.filter(c => c.deductible).reduce((sum, c) => sum + c.montant, 0);
    const byCategory = CATEGORIES.map(cat => ({
      ...cat,
      total: filteredCharges.filter(c => c.categorie === cat.value).reduce((sum, c) => sum + c.montant, 0),
    })).filter(c => c.total > 0);
    return { total, deductible, byCategory };
  }, [filteredCharges]);

  // Data for pie chart (by category)
  const pieChartData = useMemo(() => {
    return stats.byCategory.map(cat => ({
      name: cat.label,
      value: cat.total,
      color: cat.color,
    }));
  }, [stats.byCategory]);

  // Data for bar chart (by month)
  const barChartData = useMemo(() => {
    const monthlyData: Record<string, number> = {};
    for (let m = 0; m < 12; m++) {
      const monthKey = `${selectedYear}-${String(m + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = 0;
    }
    filteredCharges.forEach(c => {
      const monthKey = c.date.substring(0, 7);
      if (monthlyData[monthKey] !== undefined) {
        monthlyData[monthKey] += c.montant;
      }
    });
    return Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, value]) => ({
        month: format(new Date(key + '-01'), 'MMM', { locale: fr }),
        montant: value,
      }));
  }, [filteredCharges, selectedYear]);

  const resetForm = () => {
    setForm({
      categorie: 'autre',
      description: '',
      montant: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      deductible: true,
      notes: '',
    });
    setEditingCharge(null);
  };

  const handleOpenDialog = (charge?: Charge) => {
    if (charge) {
      setEditingCharge(charge);
      setForm({
        categorie: charge.categorie,
        description: charge.description,
        montant: charge.montant.toString(),
        date: charge.date,
        deductible: charge.deductible,
        notes: charge.notes || '',
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    const montant = parseFloat(form.montant);
    if (!form.description.trim() || isNaN(montant) || montant <= 0) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const chargeData = {
      categorie: form.categorie,
      description: form.description.trim(),
      montant,
      date: form.date,
      deductible: form.deductible,
      notes: form.notes.trim() || undefined,
    };

    if (editingCharge) {
      updateCharge(editingCharge.id, chargeData);
      toast.success('Charge modifiée');
    } else {
      saveCharge(chargeData);
      toast.success('Charge ajoutée');
    }

    setCharges(getCharges());
    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteCharge(id);
    setCharges(getCharges());
    toast.success('Charge supprimée');
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Catégorie', 'Description', 'Montant', 'Déductible', 'Notes'];
    const rows = filteredCharges.map(c => [
      format(new Date(c.date), 'dd/MM/yyyy'),
      getCategoryInfo(c.categorie).label,
      c.description,
      c.montant.toFixed(2),
      c.deductible ? 'Oui' : 'Non',
      c.notes || '',
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `charges_${selectedYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Export CSV téléchargé');
  };

  const chartConfig = {
    montant: {
      label: "Montant",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Charges professionnelles</h1>
          <p className="text-muted-foreground">
            Gérez vos dépenses déductibles pour la déclaration fiscale
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-32">
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
          <Button variant="outline" onClick={handleExportCSV} disabled={filteredCharges.length === 0}>
            <FileDown className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total des charges</CardDescription>
            <CardTitle className="text-2xl">{stats.total.toFixed(2)} €</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {filteredCharges.length} dépense{filteredCharges.length > 1 ? 's' : ''} en {selectedYear}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Charges déductibles</CardDescription>
            <CardTitle className="text-2xl text-primary">{stats.deductible.toFixed(2)} €</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              À déduire de vos revenus imposables
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Répartition</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {stats.byCategory.length > 0 ? (
              stats.byCategory.slice(0, 3).map(cat => (
                <div key={cat.value} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{cat.label}</span>
                  <span className="font-medium">{cat.total.toFixed(2)} €</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Aucune charge</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {filteredCharges.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Pie Chart - By Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Répartition par catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              {pieChartData.length > 0 ? (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-background border border-border rounded-lg p-2 shadow-md">
                                <p className="font-medium">{payload[0].name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {Number(payload[0].value).toFixed(2)} €
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Aucune donnée</p>
              )}
            </CardContent>
          </Card>

          {/* Bar Chart - By Month */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Évolution mensuelle</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px]">
                <BarChart data={barChartData}>
                  <XAxis 
                    dataKey="month" 
                    tickLine={false} 
                    axisLine={false}
                    fontSize={12}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `${value}€`}
                    fontSize={12}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent 
                        formatter={(value) => [`${Number(value).toFixed(2)} €`, "Montant"]}
                      />
                    }
                  />
                  <Bar 
                    dataKey="montant" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Liste des charges
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCharges.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucune charge enregistrée pour {selectedYear}</p>
              <Button variant="link" onClick={() => handleOpenDialog()}>
                Ajouter votre première charge
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-center">Déductible</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCharges.map((charge) => {
                  const cat = getCategoryInfo(charge.categorie);
                  const Icon = cat.icon;
                  return (
                    <TableRow key={charge.id}>
                      <TableCell>{format(new Date(charge.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span>{cat.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{charge.description}</TableCell>
                      <TableCell className="text-right font-medium">{charge.montant.toFixed(2)} €</TableCell>
                      <TableCell className="text-center">
                        {charge.deductible ? (
                          <Badge variant="default" className="bg-primary/10 text-primary">Oui</Badge>
                        ) : (
                          <Badge variant="secondary">Non</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDialog(charge)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(charge.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCharge ? 'Modifier la charge' : 'Nouvelle charge'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={form.categorie} onValueChange={(v) => setForm({ ...form, categorie: v as CategoryValue })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Input
                placeholder="Ex: Frais kilométriques janvier"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Montant (€) *</Label>
              <NumberInput
                step="0.01"
                min={0}
                placeholder="0.00"
                value={Number(form.montant)}
                onValueChange={(e) => setForm({ ...form, montant: e.toString() })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Charge déductible</Label>
                <p className="text-xs text-muted-foreground">À inclure dans la déclaration fiscale</p>
              </div>
              <Switch
                checked={form.deductible}
                onCheckedChange={(checked) => setForm({ ...form, deductible: checked })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (optionnel)</Label>
              <Textarea
                placeholder="Informations complémentaires..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave}>
              {editingCharge ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
