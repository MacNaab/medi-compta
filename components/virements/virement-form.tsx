/* eslint-disable @typescript-eslint/no-explicit-any */
// components/virements/virement-form.tsx
import { useState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { VirementAvecLieu, VirementFormData } from "@/types/virement";
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
import { Euro, Building, AlertTriangle, CheckCircle2 } from "lucide-react";

const virementSchema = z.object({
  lieuId: z.string().min(1, "Veuillez sélectionner un lieu"),
  dateDebut: z.date(),
  dateFin: z.date(),
  montantRecu: z.number().min(0, "Le montant doit être positif"),
  dateReception: z.date(),
  statut: z.enum(["recu", "attente", "partiel", "manquant"]),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof virementSchema>;

interface VirementFormProps {
  lieux: Lieu[];
  journees: any[];
  onSubmit: (data: VirementFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  virementExistant?: VirementAvecLieu | null;
}

export function VirementForm({
  lieux,
  journees,
  onSubmit,
  onCancel,
  isLoading = false,
  virementExistant,
}: VirementFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [montantTheorique, setMontantTheorique] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(virementSchema),
    defaultValues: virementExistant
      ? virementExistant
      : {
          statut: "recu",
          dateReception: new Date(),
        },
  });

  const dateDebut = watch("dateDebut");
  const dateFin = watch("dateFin");
  const montantRecu = watch("montantRecu");
  const lieuId = watch("lieuId");

  // Calculer le montant théorique quand les dates ou le lieu changent
  useEffect(() => {
    if (lieuId && dateDebut && dateFin) {
      const journeesPeriode = journees.filter((j) => {
        const dateJournee = new Date(j.date);
        return (
          dateJournee.getDate() >= dateDebut.getDate() &&
          dateJournee.getDate() <= dateFin.getDate() &&
          j.lieuId === lieuId
        );
      });

      const theorique = journeesPeriode.reduce(
        (sum, j) => sum + j.honorairesTheoriques,
        0
      );
      setMontantTheorique(theorique);
    }
  }, [dateDebut, dateFin, lieuId, journees]);

  const difference = montantRecu - montantTheorique;
  const pourcentageDifference =
    montantTheorique > 0 ? (difference / montantTheorique) * 100 : 0;

  const getStatutCouleur = (statut: string) => {
    switch (statut) {
      case "recu":
        return "bg-green-100 text-green-800 border-green-200";
      case "attente":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "partiel":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "manquant":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleFormSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format de la date pour l'input HTML
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Fonctions pour obtenir les valeurs des dates
  const getDateDebutValue = (): string => {
    const dateValue = watch("dateDebut");
    return dateValue ? formatDateForInput(dateValue) : "";
  };

  const getDateFinValue = (): string => {
    const dateValue = watch("dateFin");
    return dateValue ? formatDateForInput(dateValue) : "";
  };

  const getDateReceptionValue = (): string => {
    const dateValue = watch("dateReception");
    return dateValue
      ? formatDateForInput(dateValue)
      : formatDateForInput(new Date());
  };

  const handleDateDebutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    setValue("dateDebut", newDate, { shouldValidate: true });
  };

  const handleDateFinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    setValue("dateFin", newDate, { shouldValidate: true });
  };

  const handleDateReceptionChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newDate = new Date(e.target.value);
    setValue("dateReception", newDate, { shouldValidate: true });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardDescription>
          {virementExistant
            ? `Modifiez les informations du virement du ${new Date(
                virementExistant.dateReception
              ).toLocaleDateString("fr-FR")}`
            : "Suivez les virements réels et comparez avec les honoraires théoriques"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Lieu */}
          <div className="space-y-2">
            <Label htmlFor="lieu" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Lieu *
            </Label>

            <Controller
              name="lieuId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    className={errors.lieuId ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Sélectionnez un lieu" />
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
              )}
            />
            {errors.lieuId && (
              <p className="text-red-500 text-sm">{errors.lieuId.message}</p>
            )}
          </div>

          {/* Période */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateDebut">Date de début *</Label>
              <Input
                id="dateDebut"
                type="date"
                value={getDateDebutValue()}
                onChange={handleDateDebutChange}
                className={errors.dateDebut ? "border-red-500" : ""}
              />
              {errors.dateDebut && (
                <p className="text-red-500 text-sm">
                  {errors.dateDebut.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFin">Date de fin *</Label>
              <Input
                id="dateFin"
                type="date"
                value={getDateFinValue()}
                onChange={handleDateFinChange}
                className={errors.dateFin ? "border-red-500" : ""}
              />
              {errors.dateFin && (
                <p className="text-red-500 text-sm">{errors.dateFin.message}</p>
              )}
            </div>
          </div>

          {/* Montants */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="montantRecu" className="flex items-center gap-2">
                <Euro className="h-4 w-4" />
                Montant reçu (€) *
              </Label>
              <Input
                id="montantRecu"
                type="number"
                step="0.01"
                min="0"
                {...register("montantRecu", { valueAsNumber: true })}
                className={errors.montantRecu ? "border-red-500" : ""}
              />
              {errors.montantRecu && (
                <p className="text-red-500 text-sm">
                  {errors.montantRecu.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateReception">Date de réception *</Label>
              <Input
                id="dateReception"
                type="date"
                value={getDateReceptionValue()}
                onChange={handleDateReceptionChange}
                className={errors.dateReception ? "border-red-500" : ""}
              />
              {errors.dateReception && (
                <p className="text-red-500 text-sm">
                  {errors.dateReception.message}
                </p>
              )}
            </div>
          </div>

          {/* Comparaison théorie/réalité */}
          {montantTheorique > 0 && (
            <Card
              className={
                difference === 0
                  ? "bg-green-50 border-green-200"
                  : difference > 0
                  ? "bg-blue-50 border-blue-200"
                  : "bg-amber-50 border-amber-200"
              }
            >
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-600">Montant théorique</div>
                    <div className="font-semibold text-slate-800">
                      {montantTheorique.toFixed(2)} €
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-600">Différence</div>
                    <div
                      className={`font-semibold ${
                        difference === 0
                          ? "text-green-600"
                          : difference > 0
                          ? "text-blue-600"
                          : "text-amber-600"
                      }`}
                    >
                      {difference > 0 ? "+" : ""}
                      {difference.toFixed(2)} €
                      {pourcentageDifference !== 0 && (
                        <span className="text-xs ml-1">
                          ({pourcentageDifference > 0 ? "+" : ""}
                          {pourcentageDifference.toFixed(1)}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {difference !== 0 && (
                  <div className="text-xs text-slate-600 mt-2">
                    {difference > 0
                      ? "✅ Montant supérieur aux honoraires théoriques"
                      : "⚠️ Montant inférieur aux honoraires théoriques"}
                    {virementExistant && (
                      <span className="ml-2">
                        (Ancien écart :{" "}
                        {virementExistant.difference > 0 ? "+" : ""}
                        {virementExistant.difference.toFixed(2)} €)
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Statut */}
          <div className="space-y-2">
            <Label>Statut du virement *</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "recu", label: "Reçu", icon: CheckCircle2 },
                { value: "attente", label: "En attente", icon: AlertTriangle },
                { value: "partiel", label: "Partiel", icon: AlertTriangle },
                { value: "manquant", label: "Manquant", icon: AlertTriangle },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  className={`
                    p-3 border rounded-lg text-center transition-all
                    ${
                      watch("statut") === value
                        ? getStatutCouleur(value) + " border-2"
                        : "bg-white border-slate-300 hover:bg-slate-50"
                    }
                  `}
                  onClick={() =>
                    setValue("statut", value as any, { shouldValidate: true })
                  }
                >
                  <Icon className="h-4 w-4 mx-auto mb-1" />
                  <div className="text-sm font-medium">{label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Informations complémentaires sur ce virement..."
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
              {isSubmitting
                ? "Enregistrement..."
                : virementExistant
                ? "Modifier le virement"
                : "Enregistrer le virement"}
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
