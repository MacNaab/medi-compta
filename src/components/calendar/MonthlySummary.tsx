import { useState } from "react";
import { isSameMonth } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Journee, Lieu } from "@/lib/storage";

interface MonthlySummaryProps {
  journees: Journee[];
  currentDate: Date;
  lieux: Lieu[];
  parseLocalDate: (dateStr: string) => Date;
}

export function MonthlySummary({
  journees,
  currentDate,
  lieux,
  parseLocalDate,
}: MonthlySummaryProps) {
  const [selectedLieuId, setSelectedLieuId] = useState<string>("all");

  const monthJournees = journees.filter((j) => {
    const journeeDate = parseLocalDate(j.date);
    const isInMonth = isSameMonth(journeeDate, currentDate);
    const matchesFilter =
      selectedLieuId === "all" || j.lieuId === selectedLieuId;
    return isInMonth && matchesFilter;
  });

  const totalRecettes = monthJournees.reduce(
    (sum, j) => sum + (j.recettesTotales || 0),
    0,
  );
  const totalHonoraires = monthJournees.reduce(
    (sum, j) => sum + (j.honorairesTheoriques || 0),
    0,
  );
  const totalPrimes = monthJournees.reduce((sum, j) => sum + (j.prime || 0), 0);
  const nbJournees = monthJournees.length;

  // Get lieux that have journées this month
  const allMonthJournees = journees.filter((j) => {
    const journeeDate = parseLocalDate(j.date);
    return isSameMonth(journeeDate, currentDate);
  });
  const lieuxWithJournees = lieux.filter((lieu) =>
    allMonthJournees.some((j) => j.lieuId === lieu.id),
  );

  const selectedLieu = lieux.find((l) => l.id === selectedLieuId);

  return (
    <div className="p-4 border-t border-border bg-muted/30 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="text-sm">
            <span className="text-muted-foreground">Journées : </span>
            <span className="font-semibold">{nbJournees}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Recettes : </span>
            <span className="font-semibold">
              {totalRecettes.toLocaleString("fr-FR")} €
            </span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Honoraires : </span>
            <span className="font-semibold text-primary">
              {totalHonoraires.toLocaleString("fr-FR")} €
            </span>
          </div>
          {totalPrimes > 0 && (
            <div className="text-sm">
              <span className="text-muted-foreground">Bonus : </span>
              <span className="font-semibold text-primary/80">
                {totalPrimes.toLocaleString("fr-FR")} €
              </span>
            </div>
          )}
        </div>

        {/* Filter by cabinet */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtrer :</span>
          <Select value={selectedLieuId} onValueChange={setSelectedLieuId}>
            <SelectTrigger className="w-[180px] h-8 text-sm">
              <SelectValue placeholder="Tous les cabinets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les cabinets</SelectItem>
              {lieuxWithJournees.map((lieu) => (
                <SelectItem key={lieu.id} value={lieu.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: lieu.couleur }}
                    />
                    {lieu.nom}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {nbJournees > 0 && (
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          {selectedLieu && (
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: selectedLieu.couleur }}
            />
          )}
          <span>
            Moyenne par journée :{" "}
            {(totalRecettes / nbJournees).toLocaleString("fr-FR", {
              maximumFractionDigits: 0,
            })}{" "}
            € recettes
            {totalPrimes > 0 && (
              <>
                {" "}
                +{" "}
                {(totalPrimes / nbJournees).toLocaleString("fr-FR", {
                  maximumFractionDigits: 0,
                })}{" "}
                € bonus
              </>
            )}{" "}
            →{" "}
            {(totalHonoraires / nbJournees).toLocaleString("fr-FR", {
              maximumFractionDigits: 0,
            })}{" "}
            € honoraires
          </span>
        </div>
      )}
    </div>
  );
}
