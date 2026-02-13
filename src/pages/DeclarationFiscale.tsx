import { useState, useMemo } from "react";
import { FileDown, Receipt, Wallet, TrendingDown, Building2, Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getVirements, getLieux, getCharges, Virement, Lieu, Charge } from "@/lib/storage";
import { exportAnnualPaymentsPDF } from "@/lib/pdfExport";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "transport", label: "Transport" },
  { value: "materiel", label: "Matériel" },
  { value: "formation", label: "Formation" },
  { value: "cotisations", label: "Cotisations" },
  { value: "assurance", label: "Assurance" },
  { value: "telephone", label: "Téléphone/Internet" },
  { value: "autre", label: "Autre" },
] as const;

const getCategoryLabel = (value: string) => {
  return CATEGORIES.find((c) => c.value === value)?.label || "Autre";
};

export default function DeclarationFiscale() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const virements = useMemo(() => getVirements(), []);
  const lieux = useMemo(() => getLieux(), []);
  const charges = useMemo(() => getCharges(), []);

  // Available years
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    virements.forEach((v) => {
      if (v.dateReception) years.add(parseInt(v.dateReception.substring(0, 4)));
    });
    charges.forEach((c) => {
      years.add(new Date(c.date).getFullYear());
    });
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [virements, charges]);

  // Filter data for selected year
  const yearVirements = useMemo(() => {
    return virements.filter((v) => v.statut === "recu" && v.dateReception?.startsWith(selectedYear.toString()));
  }, [virements, selectedYear]);

  const yearCharges = useMemo(() => {
    return charges.filter((c) => new Date(c.date).getFullYear() === selectedYear);
  }, [charges, selectedYear]);

  const deductibleCharges = useMemo(() => {
    return yearCharges.filter((c) => c.deductible);
  }, [yearCharges]);

  // Monthly breakdown for payments
  const monthlyPayments = useMemo(() => {
    const data: Record<string, { montant: number; count: number }> = {};
    for (let m = 0; m < 12; m++) {
      const key = `${selectedYear}-${String(m + 1).padStart(2, "0")}`;
      data[key] = { montant: 0, count: 0 };
    }
    yearVirements.forEach((v) => {
      if (!v.dateReception) return;
      const key = v.dateReception.substring(0, 7);
      if (data[key]) {
        data[key].montant += v.montantRecu || 0;
        data[key].count += 1;
      }
    });
    return Object.entries(data)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, val]) => {
        // Parse key manually to avoid timezone issues
        const [year, month] = key.split("-").map(Number);
        const monthNames = ["janvier", "février", "mars", "avril", "mai", "juin", 
                           "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
        return {
          month: key,
          label: monthNames[month - 1],
          ...val,
        };
      });
  }, [yearVirements, selectedYear]);

  // Monthly breakdown for charges
  const monthlyCharges = useMemo(() => {
    const data: Record<string, { montant: number; count: number }> = {};
    for (let m = 0; m < 12; m++) {
      const key = `${selectedYear}-${String(m + 1).padStart(2, "0")}`;
      data[key] = { montant: 0, count: 0 };
    }
    deductibleCharges.forEach((c) => {
      const key = c.date.substring(0, 7);
      if (data[key]) {
        data[key].montant += c.montant;
        data[key].count += 1;
      }
    });
    return Object.entries(data)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, val]) => {
        const [year, month] = key.split("-").map(Number);
        const monthNames = ["janvier", "février", "mars", "avril", "mai", "juin", 
                           "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
        return {
          month: key,
          label: monthNames[month - 1],
          ...val,
        };
      });
  }, [deductibleCharges, selectedYear]);

  // Stats per cabinet
  const cabinetStats = useMemo(() => {
    return lieux
      .map((lieu) => {
        const lieuVirements = yearVirements.filter((v) => v.lieuId === lieu.id);
        return {
          id: lieu.id,
          nom: lieu.nom,
          couleur: lieu.couleur,
          montant: lieuVirements.reduce((sum, v) => sum + (v.montantRecu || 0), 0),
          count: lieuVirements.length,
        };
      })
      .filter((c) => c.count > 0);
  }, [yearVirements, lieux]);

  // Charges by category
  const chargesByCategory = useMemo(() => {
    const data: Record<string, number> = {};
    deductibleCharges.forEach((c) => {
      data[c.categorie] = (data[c.categorie] || 0) + c.montant;
    });
    return Object.entries(data).map(([cat, montant]) => ({
      categorie: cat,
      label: getCategoryLabel(cat),
      montant,
    }));
  }, [deductibleCharges]);

  // Totals
  const totalRevenus = yearVirements.reduce((sum, v) => sum + (v.montantRecu || 0), 0);
  const totalChargesDeductibles = deductibleCharges.reduce((sum, c) => sum + c.montant, 0);
  const beneficeNet = totalRevenus - totalChargesDeductibles;

  const handleExportPDF = (type: 'annual' | 'quarterly' = 'annual', quarter?: number) => {
    if (type === 'quarterly' && quarter) {
      exportAnnualPaymentsPDF(selectedYear, virements, lieux, charges, { type: 'quarterly', quarter });
      toast.success(`Déclaration T${quarter} ${selectedYear} générée`);
    } else {
      exportAnnualPaymentsPDF(selectedYear, virements, lieux, charges);
      toast.success(`Déclaration fiscale ${selectedYear} générée`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Déclaration Fiscale</h1>
          <p className="text-muted-foreground">Récapitulatif annuel pour votre déclaration d'impôts</p>
        </div>
        <div className="flex items-center gap-3">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2">
                <FileDown className="w-4 h-4" />
                Exporter PDF
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExportPDF('annual')}>
                Déclaration annuelle
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExportPDF('quarterly', 1)}>
                T1 (Janvier - Mars)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportPDF('quarterly', 2)}>
                T2 (Avril - Juin)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportPDF('quarterly', 3)}>
                T3 (Juillet - Septembre)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportPDF('quarterly', 4)}>
                T4 (Octobre - Décembre)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Revenus (virements reçus)
            </CardDescription>
            <CardTitle className="text-2xl text-primary">{totalRevenus.toLocaleString("fr-FR")} €</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {yearVirements.length} virement{yearVirements.length > 1 ? "s" : ""} en {selectedYear}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Charges déductibles
            </CardDescription>
            <CardTitle className="text-2xl text-destructive">
              -{totalChargesDeductibles.toLocaleString("fr-FR")} €
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {deductibleCharges.length} charge{deductibleCharges.length > 1 ? "s" : ""} déductible
              {deductibleCharges.length > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Bénéfice net imposable
            </CardDescription>
            <CardTitle className="text-2xl">{beneficeNet.toLocaleString("fr-FR")} €</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Revenus - Charges déductibles</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for details */}
      <Tabs defaultValue="revenus" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenus">Revenus</TabsTrigger>
          <TabsTrigger value="charges">Charges</TabsTrigger>
          <TabsTrigger value="cabinets">Par cabinet</TabsTrigger>
        </TabsList>

        {/* Revenus Tab */}
        <TabsContent value="revenus">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Détail mensuel des revenus
              </CardTitle>
              <CardDescription>Virements reçus par mois de réception</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mois</TableHead>
                    <TableHead className="text-center">Virements</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyPayments.map((row) => (
                    <TableRow key={row.month}>
                      <TableCell className="capitalize">{row.label}</TableCell>
                      <TableCell className="text-center">{row.count}</TableCell>
                      <TableCell className="text-right font-medium">{row.montant.toLocaleString("fr-FR")} €</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>TOTAL</TableCell>
                    <TableCell className="text-center">{yearVirements.length}</TableCell>
                    <TableCell className="text-right">{totalRevenus.toLocaleString("fr-FR")} €</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Charges Tab */}
        <TabsContent value="charges">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Charges par mois
                </CardTitle>
                <CardDescription>Charges déductibles par mois</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mois</TableHead>
                      <TableHead className="text-center">Nb</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyCharges.map((row) => (
                      <TableRow key={row.month}>
                        <TableCell className="capitalize">{row.label}</TableCell>
                        <TableCell className="text-center">{row.count}</TableCell>
                        <TableCell className="text-right font-medium">
                          {row.montant.toLocaleString("fr-FR")} €
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-center">{deductibleCharges.length}</TableCell>
                      <TableCell className="text-right">{totalChargesDeductibles.toLocaleString("fr-FR")} €</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Charges par catégorie</CardTitle>
                <CardDescription>Répartition des charges déductibles</CardDescription>
              </CardHeader>
              <CardContent>
                {chargesByCategory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune charge déductible</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Catégorie</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {chargesByCategory.map((row) => (
                        <TableRow key={row.categorie}>
                          <TableCell>{row.label}</TableCell>
                          <TableCell className="text-right font-medium">
                            {row.montant.toLocaleString("fr-FR")} €
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cabinets Tab */}
        <TabsContent value="cabinets">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Revenus par cabinet
              </CardTitle>
              <CardDescription>Répartition des virements reçus par cabinet</CardDescription>
            </CardHeader>
            <CardContent>
              {cabinetStats.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucun revenu enregistré</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cabinet</TableHead>
                      <TableHead className="text-center">Virements</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cabinetStats.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: row.couleur }} />
                            {row.nom}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{row.count}</TableCell>
                        <TableCell className="text-right font-medium">
                          {row.montant.toLocaleString("fr-FR")} €
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-center">{yearVirements.length}</TableCell>
                      <TableCell className="text-right">{totalRevenus.toLocaleString("fr-FR")} €</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
