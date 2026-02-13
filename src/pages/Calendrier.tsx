import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { MonthlySummary } from "@/components/calendar/MonthlySummary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import {
  getJournees,
  getLieux,
  saveJournee,
  updateJournee,
  deleteJournee,
  Journee,
  Lieu,
} from "@/lib/storage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from "date-fns";
import { fr } from "date-fns/locale";
import { NumberInput } from "@/components/ui/number-input";

// Parse date string as local date (no timezone conversion)
const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

// Format date to YYYY-MM-DD in local timezone
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Format date for display
const formatDisplayDate = (date: Date, formatStr: string): string => {
  const months = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ];
  const days = [
    "dimanche",
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi",
  ];

  if (formatStr === "MMMM yyyy") {
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }
  if (formatStr === "EEEE d MMMM yyyy") {
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }
  return date.toLocaleDateString("fr-FR");
};

export default function Calendrier() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [journees, setJournees] = useState<Journee[]>([]);
  const [lieux, setLieux] = useState<Lieu[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dayJournees, setDayJournees] = useState<Journee[]>([]);
  const [formData, setFormData] = useState({
    lieuId: "",
    recettesTotales: "",
    prime: "",
    notes: "",
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    setJournees(getJournees());
    setLieux(getLieux());
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { locale: fr });
  const calendarEnd = endOfWeek(monthEnd, { locale: fr });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getJourneesForDay = (date: Date) => {
    const dateStr = formatLocalDate(date);
    return journees.filter((j) => j.date === dateStr);
  };

  const getLieuById = (id: string) => lieux.find((l) => l.id === id);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    const existingJournees = getJourneesForDay(date);
    setDayJournees(existingJournees);
    setEditingIndex(null);
    setFormData({
      lieuId: lieux[0]?.id || "",
      recettesTotales: "",
      prime: "",
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    if (!selectedDate) return;

    const primeAmount = formData.prime ? Number(formData.prime) : 0;
    const retrocessionAmount =
      formData.recettesTotales && formData.lieuId
        ? (Number(formData.recettesTotales) *
            (getLieuById(formData.lieuId)?.pourcentageRetrocession || 80)) /
          100
        : undefined;

    const data = {
      lieuId: formData.lieuId || undefined,
      date: formatLocalDate(selectedDate),
      recettesTotales: formData.recettesTotales
        ? Number(formData.recettesTotales)
        : undefined,
      honorairesTheoriques:
        retrocessionAmount !== undefined
          ? retrocessionAmount + primeAmount
          : undefined,
      prime: primeAmount || undefined,
      notes: formData.notes || undefined,
    };

    saveJournee(data);
    toast.success("Journée ajoutée");

    // Refresh data
    const allJournees = getJournees();
    setJournees(allJournees);

    // Close modal after adding
    setIsDialogOpen(false);
    setDayJournees([]);
    setFormData({
      lieuId: lieux[0]?.id || "",
      recettesTotales: "",
      prime: "",
      notes: "",
    });
    setEditingIndex(null);
  };

  const handleEditJournee = (index: number) => {
    const journee = dayJournees[index];
    setEditingIndex(index);
    setFormData({
      lieuId: journee.lieuId || "",
      recettesTotales: journee.recettesTotales?.toString() || "",
      prime: journee.prime?.toString() || "",
      notes: journee.notes || "",
    });
  };

  const handleUpdateJournee = () => {
    if (editingIndex === null || !selectedDate) return;

    const journee = dayJournees[editingIndex];
    const primeAmount = formData.prime ? Number(formData.prime) : 0;
    const retrocessionAmount =
      formData.recettesTotales && formData.lieuId
        ? (Number(formData.recettesTotales) *
            (getLieuById(formData.lieuId)?.pourcentageRetrocession || 80)) /
          100
        : undefined;

    const data = {
      lieuId: formData.lieuId || undefined,
      date: formatLocalDate(selectedDate),
      recettesTotales: formData.recettesTotales
        ? Number(formData.recettesTotales)
        : undefined,
      honorairesTheoriques:
        retrocessionAmount !== undefined
          ? retrocessionAmount + primeAmount
          : undefined,
      prime: primeAmount || undefined,
      notes: formData.notes || undefined,
    };

    updateJournee(journee.id, data);
    toast.success("Journée modifiée");

    // Refresh data
    const allJournees = getJournees();
    setJournees(allJournees);
    setDayJournees(
      allJournees.filter((j) => j.date === formatLocalDate(selectedDate)),
    );
    setEditingIndex(null);
    setFormData({
      lieuId: lieux[0]?.id || "",
      recettesTotales: "",
      prime: "",
      notes: "",
    });
  };

  const handleDeleteJournee = (index: number) => {
    const journee = dayJournees[index];
    deleteJournee(journee.id);
    toast.success("Journée supprimée");

    // Refresh data
    const allJournees = getJournees();
    setJournees(allJournees);
    if (selectedDate) {
      setDayJournees(
        allJournees.filter((j) => j.date === formatLocalDate(selectedDate)),
      );
    }
    setEditingIndex(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setFormData({
      lieuId: lieux[0]?.id || "",
      recettesTotales: "",
      prime: "",
      notes: "",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Calendrier</h1>
          <p className="text-muted-foreground">
            Visualisez et gérez vos remplacements
          </p>
        </div>
      </div>

      {/* Calendar */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Month navigation */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold capitalize">
              {formatDisplayDate(currentDate, "MMMM yyyy")}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="text-xs"
            >
              Aujourd'hui
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dayJourneesLocal = getJourneesForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);

            return (
              <button
                key={index}
                onClick={() => handleDayClick(day)}
                className={cn(
                  "relative min-h-[80px] lg:min-h-[100px] p-2 border-b border-r border-border transition-colors text-left",
                  !isCurrentMonth && "bg-muted/30",
                  isToday(day) && "bg-primary/5",
                  "hover:bg-muted/50",
                )}
              >
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-7 h-7 rounded-full text-sm",
                    isToday(day) &&
                      "bg-primary text-primary-foreground font-semibold",
                    !isCurrentMonth && "text-muted-foreground",
                  )}
                >
                  {day.getDate()}
                </span>

                {/* Journées */}
                <div className="mt-1 space-y-1">
                  {dayJourneesLocal.slice(0, 2).map((journee) => {
                    const lieu = getLieuById(journee.lieuId || "");
                    return (
                      <div
                        key={journee.id}
                        className="flex items-center gap-1 text-xs p-1 rounded"
                        style={{
                          backgroundColor: lieu
                            ? `${lieu.couleur}20`
                            : "hsl(var(--muted))",
                          color:
                            lieu?.couleur || "hsl(var(--muted-foreground))",
                        }}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              lieu?.couleur || "hsl(var(--muted-foreground))",
                          }}
                        />
                        <div className="truncate font-medium">
                          {lieu?.nom || "Sans cabinet"}
                        </div>
                        {journee.recettesTotales !== undefined && (
                          <div className="ml-auto text-[10px] opacity-80 shrink-0 whitespace-nowrap flex items-center">
                            <div className="flex flex-col">
                              <div>
                                {journee.recettesTotales.toLocaleString(
                                  "fr-FR",
                                )}
                                €
                              </div>
                              {journee.prime && <div>+ {journee.prime}€</div>}
                            </div>
                            <div>
                              →{" "}
                              {(
                                journee.honorairesTheoriques || 0
                              ).toLocaleString("fr-FR")}
                              €
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {dayJourneesLocal.length > 2 && (
                    <span className="text-xs text-muted-foreground pl-1">
                      +{dayJourneesLocal.length - 2} autre
                      {dayJourneesLocal.length - 2 > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Monthly summary */}
        <MonthlySummary
          journees={journees}
          currentDate={currentDate}
          lieux={lieux}
          parseLocalDate={parseLocalDate}
        />
      </div>

      {/* Dialog for managing day's journées */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDate &&
                formatDisplayDate(selectedDate, "EEEE d MMMM yyyy")}
            </DialogTitle>
          </DialogHeader>

          {/* Existing journées for this day */}
          {dayJournees.length > 0 && (
            <div className="space-y-3 mb-4">
              <h4 className="text-sm font-medium text-muted-foreground">
                Remplacements enregistrés
              </h4>
              {dayJournees.map((journee, index) => {
                const lieu = getLieuById(journee.lieuId || "");
                const isEditing = editingIndex === index;

                return (
                  <div
                    key={journee.id}
                    className={cn(
                      "p-3 rounded-lg border",
                      isEditing
                        ? "border-primary bg-primary/5"
                        : "border-border bg-muted/30",
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: lieu?.couleur || "#6B7280",
                          }}
                        />
                        <span className="font-medium">
                          {lieu?.nom || "Sans cabinet"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {!isEditing && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditJournee(index)}
                            >
                              Modifier
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteJournee(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    {journee.recettesTotales && (
                      <p className="text-sm text-muted-foreground">
                        Recettes:{" "}
                        {journee.recettesTotales.toLocaleString("fr-FR")} € →
                        Honoraires:{" "}
                        {(journee.honorairesTheoriques || 0).toLocaleString(
                          "fr-FR",
                        )}{" "}
                        €
                        {journee.prime
                          ? ` (dont ${journee.prime.toLocaleString("fr-FR")} € de prime)`
                          : ""}
                      </p>
                    )}
                    {journee.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {journee.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Form for adding/editing */}
          <div className="space-y-4 border-t border-border pt-4">
            <h4 className="text-sm font-medium">
              {editingIndex !== null
                ? "Modifier le remplacement"
                : "Ajouter un remplacement"}
            </h4>

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
              {lieux.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Ajoutez d'abord un cabinet dans l'onglet Cabinets
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="recettes">Recettes totales (€)</Label>
              <NumberInput
                id="recettes"
                step="0.01"
                value={Number(formData.recettesTotales)}
                onValueChange={(e) =>
                  setFormData({ ...formData, recettesTotales: e.toString() })
                }
                placeholder="Ex: 850.00"
              />
              <div className="space-y-2">
                <Label htmlFor="prime">Bonus (€)</Label>
                <NumberInput
                  id="prime"
                  step="0.01"
                  value={Number(formData.prime)}
                  onValueChange={(e) =>
                    setFormData({ ...formData, prime: e.toString() })
                  }
                  placeholder="Ex: 50.00"
                />
                <p className="text-xs text-muted-foreground">
                  Somme ajoutée aux honoraires sans rétrocession
                </p>
              </div>
              {formData.recettesTotales && formData.lieuId && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Rétrocession (
                      {getLieuById(formData.lieuId)?.pourcentageRetrocession}%)
                    </span>
                    <span>
                      {(
                        (Number(formData.recettesTotales) *
                          (getLieuById(formData.lieuId)
                            ?.pourcentageRetrocession || 80)) /
                        100
                      ).toLocaleString("fr-FR")}{" "}
                      €
                    </span>
                  </div>
                  {formData.prime && Number(formData.prime) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bonus</span>
                      <span>
                        + {Number(formData.prime).toLocaleString("fr-FR")} €
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold border-t border-border pt-1">
                    <span>Total honoraires</span>
                    <span className="text-primary">
                      {(
                        (Number(formData.recettesTotales) *
                          (getLieuById(formData.lieuId)
                            ?.pourcentageRetrocession || 80)) /
                          100 +
                        (Number(formData.prime) || 0)
                      ).toLocaleString("fr-FR")}{" "}
                      €
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Notes sur cette journée..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              {editingIndex !== null ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    Annuler
                  </Button>
                  <Button onClick={handleUpdateJournee}>Enregistrer</Button>
                </>
              ) : (
                <Button onClick={handleAddNew} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Ajouter ce remplacement
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
