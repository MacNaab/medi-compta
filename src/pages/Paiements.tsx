import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Wallet,
  Check,
  Clock,
  MoreVertical,
  Pencil,
  Trash2,
  Filter,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  X,
  FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getVirements,
  getLieux,
  getJournees,
  saveVirement,
  updateVirement,
  deleteVirement,
  Virement,
  Lieu,
  Journee,
} from "@/lib/storage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, parseISO, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { DatePickerInput } from "@/components/ui/date-picker";

interface YearMonthSelection {
  [year: string]: string[]; // year -> array of months (YYYY-MM format)
}

interface PendingPayment {
  lieuId: string;
  lieuNom: string;
  lieuCouleur: string;
  month: string;
  monthLabel: string;
  montantAttendu: number;
  journees: Journee[];
}

interface CabinetBalance {
  lieuId: string;
  lieuNom: string;
  lieuCouleur: string;
  totalAttendu: number;
  totalRecu: number;
  solde: number; // recu - attendu (negatif = manquant)
}

export default function Paiements() {
  const [virements, setVirements] = useState<Virement[]>([]);
  const [lieux, setLieux] = useState<Lieu[]>([]);
  const [journees, setJournees] = useState<Journee[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVirement, setEditingVirement] = useState<Virement | null>(null);
  const [activeTab, setActiveTab] = useState("en_attente");
  const [expandedPending, setExpandedPending] = useState<string | null>(null);

  // Filtres pour les paiements reçus
  const [filterLieuId, setFilterLieuId] = useState<string>("all");
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [expandedYears, setExpandedYears] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    lieuId: "",
    dateDebut: "",
    dateFin: "",
    montantRecu: "",
    dateReception: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  });

  useEffect(() => {
    setVirements(getVirements());
    setLieux(getLieux());
    setJournees(getJournees());
  }, []);

  // Calcul du montant attendu basé sur les journées entre dateDebut et dateFin
  const calculateMontantAttendu = (
    lieuId: string,
    dateDebut: string,
    dateFin: string,
  ): number => {
    if (!lieuId || !dateDebut || !dateFin) return 0;

    const lieu = lieux.find((l) => l.id === lieuId);
    if (!lieu) return 0;

    const start = parseISO(dateDebut);
    const end = parseISO(dateFin);

    // Trouver les journées dans cette période pour ce lieu
    const journeesInPeriod = journees.filter((j) => {
      if (j.lieuId !== lieuId) return false;
      const journeeDate = parseISO(j.date);
      return isWithinInterval(journeeDate, { start, end });
    });

    // Calculer le total des honoraires théoriques
    return journeesInPeriod.reduce(
      (sum, j) => sum + (j.honorairesTheoriques || 0),
      0,
    );
  };

  const montantAttendu = useMemo(() => {
    return calculateMontantAttendu(
      formData.lieuId,
      formData.dateDebut,
      formData.dateFin,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.lieuId, formData.dateDebut, formData.dateFin, journees, lieux]);

  // Calcul automatique des paiements en attente par journée non couverte
  const pendingPayments = useMemo((): PendingPayment[] => {
    const payments: PendingPayment[] = [];

    // Pour chaque journée, vérifier si elle est couverte par un virement reçu
    const uncoveredByLieuMonth: Record<string, Record<string, Journee[]>> = {};

    journees.forEach((j) => {
      if (!j.lieuId || !j.date) return;
      if ((j.honorairesTheoriques || 0) <= 0) return;

      const journeeDate = j.date; // format YYYY-MM-DD

      // Vérifier si cette journée est couverte par au moins un virement reçu
      const isCovered = virements.some((v) => {
        if (v.statut !== "recu" || v.lieuId !== j.lieuId) return false;
        if (!v.dateDebut || !v.dateFin) return false;
        return journeeDate >= v.dateDebut && journeeDate <= v.dateFin;
      });

      if (!isCovered) {
        const monthKey = j.date.substring(0, 7); // 'YYYY-MM'
        if (!uncoveredByLieuMonth[j.lieuId]) {
          uncoveredByLieuMonth[j.lieuId] = {};
        }
        if (!uncoveredByLieuMonth[j.lieuId][monthKey]) {
          uncoveredByLieuMonth[j.lieuId][monthKey] = [];
        }
        uncoveredByLieuMonth[j.lieuId][monthKey].push(j);
      }
    });

    // Construire les PendingPayment à partir des journées non couvertes groupées
    Object.entries(uncoveredByLieuMonth).forEach(([lieuId, monthsData]) => {
      const lieu = lieux.find((l) => l.id === lieuId);
      if (!lieu) return;

      Object.entries(monthsData).forEach(([monthKey, uncoveredJournees]) => {
        const montantAttendu = uncoveredJournees.reduce(
          (sum, j) => sum + (j.honorairesTheoriques || 0),
          0,
        );

        payments.push({
          lieuId,
          lieuNom: lieu.nom,
          lieuCouleur: lieu.couleur,
          month: monthKey,
          monthLabel: format(parseISO(`${monthKey}-01`), "MMMM yyyy", {
            locale: fr,
          }),
          montantAttendu,
          journees: uncoveredJournees,
        });
      });
    });

    // Trier par date décroissante
    return payments.sort((a, b) => b.month.localeCompare(a.month));
  }, [journees, virements, lieux]);

  // Calcul des soldes par cabinet (agrégé)
  const cabinetBalances = useMemo((): CabinetBalance[] => {
    const balances: CabinetBalance[] = [];

    lieux.forEach((lieu) => {
      const totalAttendu = journees
        .filter((j) => j.lieuId === lieu.id)
        .reduce((sum, j) => sum + (j.honorairesTheoriques || 0), 0);

      const totalRecu = virements
        .filter((v) => v.statut === "recu" && v.lieuId === lieu.id)
        .reduce((sum, v) => sum + (v.montantRecu || 0), 0);

      const solde = totalRecu - totalAttendu;

      // if (solde < 0) {
      balances.push({
        lieuId: lieu.id,
        lieuNom: lieu.nom,
        lieuCouleur: lieu.couleur,
        totalAttendu,
        totalRecu,
        solde,
      });
      // }
    });

    return balances.sort((a, b) => a.solde - b.solde);
  }, [journees, virements, lieux]);

  // Total des soldes manquants
  const totalPartialMissing = useMemo(() => {
    return cabinetBalances.reduce(
      (sum, b) => sum + (b.solde > 0 ? b.solde : 0),
      0,
    );
  }, [cabinetBalances]);

  // Total en attente
  const totalEnAttente = useMemo(() => {
    return pendingPayments.reduce((sum, p) => sum + p.montantAttendu, 0);
  }, [pendingPayments]);

  // Générer la liste des années et mois disponibles pour le filtre hiérarchique
  const availableYearsMonths = useMemo(() => {
    const yearMonths: Record<string, string[]> = {};
    virements
      .filter((v) => v.statut === "recu" && v.dateDebut)
      .forEach((v) => {
        const monthKey = v.dateDebut!.substring(0, 7);
        const year = monthKey.substring(0, 4);
        if (!yearMonths[year]) {
          yearMonths[year] = [];
        }
        if (!yearMonths[year].includes(monthKey)) {
          yearMonths[year].push(monthKey);
        }
      });
    // Sort months within each year
    Object.keys(yearMonths).forEach((year) => {
      yearMonths[year].sort().reverse();
    });
    return yearMonths;
  }, [virements]);

  const availableYears = useMemo(() => {
    return Object.keys(availableYearsMonths).sort().reverse();
  }, [availableYearsMonths]);

  // Toggle year selection
  const toggleYear = (year: string) => {
    const yearMonths = availableYearsMonths[year] || [];
    const allSelected = yearMonths.every((m) => selectedMonths.includes(m));

    if (allSelected) {
      // Deselect all months of this year
      setSelectedMonths((prev) => prev.filter((m) => !m.startsWith(year)));
    } else {
      // Select all months of this year
      setSelectedMonths((prev) => {
        const withoutYear = prev.filter((m) => !m.startsWith(year));
        return [...withoutYear, ...yearMonths];
      });
    }
  };

  // Toggle month selection
  const toggleMonth = (month: string) => {
    setSelectedMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month],
    );
  };

  // Toggle year expansion
  const toggleYearExpanded = (year: string) => {
    setExpandedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year],
    );
  };

  // Clear all filters
  const clearMonthFilters = () => {
    setSelectedMonths([]);
  };

  // Filtrage des paiements reçus
  const filteredReceivedVirements = useMemo(() => {
    return virements
      .filter((v) => v.statut === "recu")
      .filter((v) => filterLieuId === "all" || v.lieuId === filterLieuId)
      .filter((v) => {
        if (selectedMonths.length === 0) return true;
        if (!v.dateDebut) return false;
        const monthKey = v.dateDebut.substring(0, 7);
        return selectedMonths.includes(monthKey);
      })
      .sort(
        (a, b) =>
          new Date(b.dateReception || b.createdAt).getTime() -
          new Date(a.dateReception || a.createdAt).getTime(),
      );
  }, [virements, filterLieuId, selectedMonths]);

  const totalReceived = useMemo(() => {
    return filteredReceivedVirements.reduce(
      (sum, v) => sum + (v.montantRecu || 0),
      0,
    );
  }, [filteredReceivedVirements]);

  const resetForm = () => {
    setFormData({
      lieuId: lieux[0]?.id || "",
      dateDebut: "",
      dateFin: "",
      montantRecu: "",
      dateReception: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    });
    setEditingVirement(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      lieuId: formData.lieuId || undefined,
      dateDebut: formData.dateDebut || undefined,
      dateFin: formData.dateFin || undefined,
      montantRecu: formData.montantRecu
        ? Number(formData.montantRecu)
        : undefined,
      dateReception: formData.dateReception || format(new Date(), "yyyy-MM-dd"),
      statut: "recu" as const,
      notes: formData.notes || undefined,
    };

    if (editingVirement) {
      updateVirement(editingVirement.id, data);
      toast.success("Paiement modifié");
    } else {
      saveVirement(data);
      toast.success("Paiement ajouté");
    }

    setVirements(getVirements());
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (virement: Virement) => {
    setEditingVirement(virement);
    setFormData({
      lieuId: virement.lieuId || "",
      dateDebut: virement.dateDebut || "",
      dateFin: virement.dateFin || "",
      montantRecu: virement.montantRecu?.toString() || "",
      dateReception: virement.dateReception || format(new Date(), "yyyy-MM-dd"),
      notes: virement.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteVirement(id);
    setVirements(getVirements());
    toast.success("Paiement supprimé");
  };

  const getLieuById = (id: string) => lieux.find((l) => l.id === id);

  // Créer un paiement à partir d'un paiement en attente
  const handleCreateFromPending = (pending: PendingPayment) => {
    const dates = pending.journees
      .map((j) => parseISO(j.date))
      .sort((a, b) => a.getTime() - b.getTime());
    const dateDebut = dates[0];
    const dateFin = dates[dates.length - 1];

    setFormData({
      lieuId: pending.lieuId,
      dateDebut: format(dateDebut, "yyyy-MM-dd"),
      dateFin: format(dateFin, "yyyy-MM-dd"),
      montantRecu: pending.montantAttendu.toString(),
      dateReception: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    });
    setEditingVirement(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Paiements</h1>
          <p className="text-muted-foreground">
            Suivez vos virements et paiements
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouveau paiement</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] flex flex-col overflow-hidden">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>
                {editingVirement
                  ? "Modifier le paiement"
                  : "Nouveau paiement reçu"}
              </DialogTitle>
              <DialogDescription>
                Enregistrez un paiement reçu
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 overflow-y-auto pr-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lieu">Cabinet</Label>
                  <Select
                    value={formData.lieuId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, lieuId: value })
                    }
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
                            {lieu.nom}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="dateDebut">Date début</Label>
                    <DatePickerInput
                      id="dateDebut"
                      value={
                        formData.dateDebut ? new Date(formData.dateDebut) : null
                      }
                      onChange={(e) =>
                        setFormData({ ...formData, dateDebut: e })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateFin">Date fin</Label>
                    <DatePickerInput
                      id="dateFin"
                      value={
                        formData.dateFin ? new Date(formData.dateFin) : null
                      }
                      onChange={(e) => setFormData({ ...formData, dateFin: e })}
                    />
                  </div>
                </div>

                {/* Montant attendu (calculé automatiquement) */}
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Montant attendu
                    </span>
                    <span className="font-semibold">
                      {montantAttendu.toLocaleString("fr-FR")} €
                    </span>
                  </div>
                  {montantAttendu === 0 &&
                    formData.lieuId &&
                    formData.dateDebut &&
                    formData.dateFin && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Aucune journée enregistrée pour cette période
                      </p>
                    )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="montantRecu">Montant reçu (€)</Label>
                  <Input
                    id="montantRecu"
                    type="number"
                    step="0.01"
                    value={formData.montantRecu}
                    onChange={(e) =>
                      setFormData({ ...formData, montantRecu: e.target.value })
                    }
                    placeholder="Ex: 1250.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateReception">Date de réception</Label>
                  <DatePickerInput
                    id="dateReception"
                    value={new Date(formData.dateReception)}
                    // max={format(new Date(), "yyyy-MM-dd")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dateReception: e,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Notes sur ce paiement..."
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingVirement ? "Enregistrer" : "Ajouter"}
                  </Button>
                </div>
              </form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-warning/20">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">En attente</p>
              <p className="text-2xl font-bold">
                {totalEnAttente.toLocaleString("fr-FR")} €
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-destructive/20">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Solde cabinets</p>
              <p className="text-2xl font-bold">
                {totalPartialMissing.toLocaleString("fr-FR")} €
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-success/30 bg-success/5 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-success/20">
              <Check className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reçus (filtrés)</p>
              <p className="text-2xl font-bold">
                {totalReceived.toLocaleString("fr-FR")} €
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="en_attente">
            En attente ({pendingPayments.length})
          </TabsTrigger>
          <TabsTrigger value="partiel">
            Solde cabinets ({cabinetBalances.length})
          </TabsTrigger>
          <TabsTrigger value="recu">
            Reçus ({filteredReceivedVirements.length})
          </TabsTrigger>
        </TabsList>

        {/* En attente - calculé automatiquement */}
        <TabsContent value="en_attente" className="mt-4">
          {pendingPayments.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
                <Check className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Tout est à jour !</h3>
              <p className="text-muted-foreground">Aucun paiement en attente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPayments.map((payment) => (
                <Collapsible
                  key={`${payment.lieuId}-${payment.month}`}
                  open={
                    expandedPending === `${payment.lieuId}-${payment.month}`
                  }
                  onOpenChange={(open) =>
                    setExpandedPending(
                      open ? `${payment.lieuId}-${payment.month}` : null,
                    )
                  }
                >
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                        <div
                          className="w-2 h-14 rounded-full shrink-0"
                          style={{ backgroundColor: payment.lieuCouleur }}
                        />

                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">
                              {payment.lieuNom}
                            </h3>
                            <Badge
                              variant="outline"
                              className="shrink-0 bg-warning/10 text-warning border-warning/30"
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              En attente
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground capitalize">
                            {payment.monthLabel} • {payment.journees.length}{" "}
                            journée
                            {payment.journees.length > 1 ? "s" : ""}
                          </p>
                        </div>

                        <p className="text-lg font-bold shrink-0">
                          {payment.montantAttendu.toLocaleString("fr-FR")} €
                        </p>

                        <ChevronDown
                          className={cn(
                            "w-5 h-5 text-muted-foreground transition-transform",
                            expandedPending ===
                              `${payment.lieuId}-${payment.month}` &&
                              "rotate-180",
                          )}
                        />

                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-success hover:text-success hover:bg-success/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateFromPending(payment);
                          }}
                          title="Marquer comme reçu"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="border-t border-border p-4 bg-muted/30">
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">
                          Détail des journées
                        </h4>
                        <div className="space-y-2">
                          {payment.journees.map((journee) => (
                            <div
                              key={journee.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-card border border-border"
                            >
                              <span className="text-sm">
                                {format(parseISO(journee.date), "EEEE d MMMM", {
                                  locale: fr,
                                })}
                              </span>
                              <span className="text-sm font-medium">
                                {(
                                  journee.honorairesTheoriques || 0
                                ).toLocaleString("fr-FR")}{" "}
                                €
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Solde cabinets */}
        <TabsContent value="partiel" className="mt-4">
          {totalPartialMissing === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
                <Check className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Tous les cabinets sont à jour !
              </h3>
              <p className="text-muted-foreground">
                Aucun solde négatif détecté
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cabinetBalances.map((balance, index) => (
                <div
                  key={balance.lieuId}
                  className="p-4 rounded-xl border border-border bg-card animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-2 h-14 rounded-full shrink-0"
                      style={{ backgroundColor: balance.lieuCouleur }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">
                          {balance.lieuNom}
                        </h3>
                        {balance.solde === 0 && (
                          <Badge
                            variant="outline"
                            className="shrink-0 bg-success/10 text-success border-success/30"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Solde OK
                          </Badge>
                        )}
                        {balance.solde > 0 && (
                          <Badge
                            variant="outline"
                            className="shrink-0 bg-success/10 text-success border-success/30"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Solde positif
                          </Badge>
                        )}
                        {balance.solde < 0 && (
                          <Badge
                            variant="outline"
                            className="shrink-0 bg-destructive/10 text-destructive border-destructive/30"
                          >
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Solde négatif
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>
                          Attendu :{" "}
                          {balance.totalAttendu.toLocaleString("fr-FR")} €
                        </span>
                        <span>
                          Reçu : {balance.totalRecu.toLocaleString("fr-FR")} €
                        </span>
                      </div>
                    </div>

                    {balance.solde > 0 && (
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-success">
                          {balance.solde.toLocaleString("fr-FR")} €
                        </p>
                        <p className="text-xs text-muted-foreground">
                          surplus
                        </p>
                      </div>
                    )}
                    {
                      balance.solde === 0 && (
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold text-success">
                            {balance.solde.toLocaleString("fr-FR")} €
                          </p>
                        </div>
                      )
                    }
                    {
                      balance.solde < 0 && (
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold text-destructive">
                            {balance.solde.toLocaleString("fr-FR")} €
                          </p>
                          <p className="text-xs text-muted-foreground">
                            manquant
                          </p>
                        </div>
                      )
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Reçus - avec filtres */}
        <TabsContent value="recu" className="mt-4 space-y-4">
          {/* Filtres */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtres:</span>
            </div>
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

            {/* Period multi-select with hierarchy */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[220px] justify-start text-left font-normal"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {selectedMonths.length === 0
                    ? "Toutes les périodes"
                    : `${selectedMonths.length} période${selectedMonths.length > 1 ? "s" : ""}`}
                  {selectedMonths.length > 0 && (
                    <X
                      className="w-4 h-4 ml-auto hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearMonthFilters();
                      }}
                    />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0" align="start">
                <div className="p-3 border-b border-border">
                  <p className="text-sm font-medium">
                    Sélectionner les périodes
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cochez les années ou mois souhaités
                  </p>
                </div>
                <ScrollArea className="h-[300px]">
                  <div className="p-2 space-y-1">
                    {availableYears.map((year) => {
                      const yearMonths = availableYearsMonths[year] || [];
                      const allSelected =
                        yearMonths.length > 0 &&
                        yearMonths.every((m) => selectedMonths.includes(m));
                      const someSelected = yearMonths.some((m) =>
                        selectedMonths.includes(m),
                      );
                      const isExpanded = expandedYears.includes(year);

                      return (
                        <div key={year}>
                          <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 p-0"
                              onClick={() => toggleYearExpanded(year)}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                            <Checkbox
                              checked={allSelected}
                              ref={(el) => {
                                if (el && someSelected && !allSelected) {
                                  (el as HTMLButtonElement).dataset.state =
                                    "indeterminate";
                                }
                              }}
                              onCheckedChange={() => toggleYear(year)}
                            />
                            <span className="font-medium">{year}</span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              ({yearMonths.length} mois)
                            </span>
                          </div>

                          {isExpanded && (
                            <div className="ml-7 space-y-1">
                              {yearMonths.map((monthKey) => (
                                <div
                                  key={monthKey}
                                  className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50"
                                >
                                  <Checkbox
                                    checked={selectedMonths.includes(monthKey)}
                                    onCheckedChange={() =>
                                      toggleMonth(monthKey)
                                    }
                                  />
                                  <span className="text-sm capitalize">
                                    {format(
                                      parseISO(`${monthKey}-01`),
                                      "MMMM",
                                      { locale: fr },
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {availableYears.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aucune période disponible
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>

          {filteredReceivedVirements.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Aucun paiement reçu
              </h3>
              <p className="text-muted-foreground mb-6">
                {filterLieuId !== "all" || selectedMonths.length > 0
                  ? "Aucun paiement ne correspond aux filtres sélectionnés"
                  : "Enregistrez vos premiers paiements reçus"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReceivedVirements.map((virement, index) => {
                const lieu = getLieuById(virement.lieuId || "");

                return (
                  <div
                    key={virement.id}
                    className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card transition-all hover:shadow-card animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div
                      className="w-2 h-14 rounded-full shrink-0"
                      style={{ backgroundColor: lieu?.couleur || "#6B7280" }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">
                          {lieu?.nom || "Cabinet inconnu"}
                        </h3>
                        <Badge
                          variant="outline"
                          className="shrink-0 bg-success/10 text-success border-success/30"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Reçu
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {virement.dateDebut && virement.dateFin
                          ? `${format(parseISO(virement.dateDebut), "dd MMM", { locale: fr })} - ${format(parseISO(virement.dateFin), "dd MMM yyyy", { locale: fr })}`
                          : "Période non spécifiée"}
                        {virement.dateReception && (
                          <span className="ml-2">
                            • Reçu le{" "}
                            {format(
                              parseISO(virement.dateReception),
                              "dd/MM/yyyy",
                              { locale: fr },
                            )}
                          </span>
                        )}
                      </p>
                    </div>

                    <p className="text-lg font-bold shrink-0">
                      {(virement.montantRecu || 0).toLocaleString("fr-FR")} €
                    </p>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(virement)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(virement.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
