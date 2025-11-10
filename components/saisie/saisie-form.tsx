// components/saisie/saisie-form.tsx
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { JourneeAvecLieu, JourneeFormData } from "@/types/journee";
import { Lieu } from "@/types/lieu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Euro, Building } from "lucide-react";

// Schéma de validation
const saisieSchema = z.object({
  date: z.date(),
  lieuId: z.string().min(1, "Veuillez sélectionner un lieu"),
  recettesTotales: z.number().min(0, "Les recettes doivent être positives"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof saisieSchema>;

interface SaisieFormProps {
  lieux: Lieu[];
  onSubmit: (data: JourneeFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  datePredefinie?: Date;
  journeeExistante?: JourneeAvecLieu | null;
}

export function SaisieForm({
  lieux,
  onSubmit,
  onCancel,
  isLoading = false,
  datePredefinie,
  journeeExistante,
}: SaisieFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLieu, setSelectedLieu] = useState<Lieu | null>(null);
  const [recettes, setRecettes] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(saisieSchema),
    defaultValues: journeeExistante
      ? { ...journeeExistante }
      : {
          date: datePredefinie || new Date(),
        },
  });

  const recettesTotales = watch("recettesTotales");

  // Format de la date pour l'input HTML
  const formatDateForInput = (date: Date): string => {
    // Utiliser toLocaleDateString pour éviter les problèmes de timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseDateFromInput = (dateString: string): Date => {
    const [year, month, day] = dateString.split("-").map(Number);
    // Créer la date en timezone local
    return new Date(year, month - 1, day);
  };

  // Fonction pour obtenir la valeur de la date
  const getDateValue = (): string => {
    const dateValue = watch("date");
    return formatDateForInput(dateValue);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = parseDateFromInput(e.target.value);
    setValue("date", newDate);
  };

  useEffect(() => {
    if (journeeExistante) {
      // MODE ÉDITION : Pré-remplir avec les données existantes
      const lieu = lieux.find((l) => l.id === journeeExistante.lieuId);
      setSelectedLieu(lieu || null);
      setRecettes(journeeExistante.recettesTotales.toString());

      reset({
        date: new Date(journeeExistante.date),
        lieuId: journeeExistante.lieuId,
        recettesTotales: journeeExistante.recettesTotales,
        notes: journeeExistante.notes || "",
      });
    } else {
      // MODE CRÉATION : Valeurs par défaut
      setRecettes("");
      setSelectedLieu(null);

      reset({
        date: datePredefinie || new Date(),
        lieuId: "",
        recettesTotales: 0,
        notes: "",
      });
    }
  }, [journeeExistante, lieux, datePredefinie, reset]);

  // Calcul automatique des honoraires théoriques
  const honorairesTheoriques =
    selectedLieu && recettesTotales
      ? (recettesTotales * selectedLieu.pourcentageRetrocession) / 100
      : 0;

  const handleRecettesChange = (value: string) => {
    setRecettes(value);
    const numericValue = parseFloat(value) || 0;
    setValue("recettesTotales", numericValue);
  };

  const handleFormSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardDescription>
          Enregistrez vos recettes et calculez automatiquement vos honoraires
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date *
            </Label>
            <Input
              id="date"
              type="date"
              value={getDateValue()}
              onChange={handleDateChange}
              className={errors.date ? "border-red-500" : ""}
            />
            {errors.date && (
              <p className="text-red-500 text-sm">{errors.date.message}</p>
            )}
          </div>

          {/* Sélection du lieu */}
          <div className="space-y-2">
            <Label htmlFor="lieu" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Lieu de travail *
            </Label>

            <Controller
              name="lieuId"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger
                    className={errors.lieuId ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Sélectionnez un lieu" />
                  </SelectTrigger>
                  <SelectContent>
                    {lieux.map((lieu) => (
                      <SelectItem key={lieu.id} value={lieu.id}>
                        <div className="flex justify-between items-center w-full">
                          <span>{lieu.nom}</span>
                          <span className="text-sm text-slate-500 ml-2">
                            ({lieu.pourcentageRetrocession}%)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.lieuId && (
              <p className="text-red-500 text-sm">{errors.lieuId.message}</p>
            )}
          </div>

          {/* Recettes totales */}
          <div className="space-y-2">
            <Label
              htmlFor="recettesTotales"
              className="flex items-center gap-2"
            >
              <Euro className="h-4 w-4" />
              Recettes totales de la journée (€) *
            </Label>
            <Input
              id="recettesTotales"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={recettes}
              onChange={(e) => handleRecettesChange(e.target.value)}
              className={errors.recettesTotales ? "border-red-500" : ""}
            />
            {errors.recettesTotales && (
              <p className="text-red-500 text-sm">
                {errors.recettesTotales.message}
              </p>
            )}
          </div>

          {/* Calcul automatique des honoraires */}
          {selectedLieu && recettesTotales > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600">Rétrocession</p>
                    <p className="font-semibold text-slate-800">
                      {selectedLieu.pourcentageRetrocession}%
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600">Honoraires théoriques</p>
                    <p className="font-semibold text-green-700 text-lg">
                      {honorairesTheoriques.toFixed(2)} €
                    </p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Calcul : {recettesTotales.toFixed(2)} € ×{" "}
                  {selectedLieu.pourcentageRetrocession}%
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Informations complémentaires sur la journée..."
              {...register("notes")}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Enregistrement..." : "Enregistrer la journée"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
