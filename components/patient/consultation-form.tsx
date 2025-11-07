// components/patient/consultation-form.tsx
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Consultation, ConsultationFormData } from "@/types/consultation";
import { Acte } from "@/types/acte";
import { useActes } from "@/hooks/useActes";
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
import {
  Calendar,
  User,
  FileText,
  Euro,
  CreditCard,
  Search,
} from "lucide-react";

// Schéma de validation
const consultationSchema = z.object({
  date: z.date(),
  heure: z.string().min(1, "L'heure est requise"),
  nomPatient: z.string().min(1, "Le nom du patient est requis"),
  motif: z.string().min(1, "Le motif est requis"),
  acteCode: z.string().min(1, "Le code acte est requis"),
  modePaiement: z.enum(["carte", "cheque", "especes", "100%"]),
  montantPatient: z.number().min(0, "Le montant patient doit être positif"),
  montantTotal: z.number().min(0, "Le montant total doit être positif"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof consultationSchema>;

interface ConsultationFormProps {
  onSubmit: (data: ConsultationFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  datePredefinie?: Date;
  heurePredefinie?: string;
  consultationExistante?: Consultation | null;
  actePredefini?: Acte | null;
}

export function ConsultationForm({
  onSubmit,
  onCancel,
  isLoading = false,
  datePredefinie,
  heurePredefinie,
  consultationExistante,
}: ConsultationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rechercheActe, setRechercheActe] = useState("");
  const { actes } = useActes();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(consultationSchema),
    // Valeurs par défaut basées sur consultationExistante
    defaultValues: consultationExistante
      ? {
          date: new Date(consultationExistante.date),
          heure: consultationExistante.heure,
          nomPatient: consultationExistante.nomPatient,
          motif: consultationExistante.motif,
          acteCode: consultationExistante.acteCode,
          modePaiement: consultationExistante.modePaiement || "100%",
          montantPatient: consultationExistante.montantPatient,
          montantTotal: consultationExistante.montantTotal,
          notes: consultationExistante.notes || "",
        }
      : {
          date: datePredefinie || new Date(),
          heure: heurePredefinie || "09:00",
          nomPatient: "",
          motif: "",
          acteCode: "",
          modePaiement: "100%",
          montantPatient: 0,
          montantTotal: 0,
          notes: "",
        },
  });

  const modePaiement = watch("modePaiement");
  const montantPatient = watch("montantPatient");
  const montantTotal = watch("montantTotal");

  // Filtrer les actes selon la recherche
  const actesFiltres = actes.filter(
    (acte) =>
      acte.code.toLowerCase().includes(rechercheActe.toLowerCase()) ||
      acte.libelle.toLowerCase().includes(rechercheActe.toLowerCase())
  );

  // Appliquer un acte sélectionné
  const appliquerActe = (acte: Acte) => {
    setValue("acteCode", acte.code);
    setValue("motif", acte.libelle);
    setValue("montantTotal", acte.montantTotal);
    setValue("montantPatient", acte.montantPatient);
    setValue("modePaiement", acte.modePaiementParDefaut);
    setRechercheActe("");
  };

  // Format de la date pour l'input HTML
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseDateFromInput = (dateString: string): Date => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const getDateValue = (): string => {
    const dateValue = watch("date");
    return formatDateForInput(dateValue);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = parseDateFromInput(e.target.value);
    setValue("date", newDate);
  };

  const handleHeureChange = (value: string) => {
    setValue("heure", value, { shouldValidate: true });
  };

  const handleFormSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMontantPatientChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseFloat(e.target.value);
    setValue("montantPatient", value);
    const montantTotal = watch("montantTotal");
    if (value > montantTotal) {
      setValue("montantTotal", value);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardDescription>
          Enregistrez les détails de la consultation et le paiement
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Date et Heure */}
          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="heure" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Heure *
              </Label>
              <Input
                id="heure"
                type="time"
                value={watch("heure")}
                onChange={(e) => handleHeureChange(e.target.value)}
                className={errors.heure ? "border-red-500" : ""}
              />
              {errors.heure && (
                <p className="text-red-500 text-sm">{errors.heure.message}</p>
              )}
            </div>
          </div>

          {/* Nom du patient */}
          <div className="space-y-2">
            <Label htmlFor="nomPatient" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Nom du patient *
            </Label>
            <Input
              id="nomPatient"
              placeholder="Nom du patient"
              {...register("nomPatient")}
              className={errors.nomPatient ? "border-red-500" : ""}
            />
            {errors.nomPatient && (
              <p className="text-red-500 text-sm">
                {errors.nomPatient.message}
              </p>
            )}
          </div>

          {/* NOUVELLE SECTION : Sélection d'acte */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Sélectionner un acte prédéfini
            </Label>

            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Rechercher un acte par code ou libellé..."
                  value={rechercheActe}
                  onChange={(e) => setRechercheActe(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Card className="max-h-48 overflow-y-auto">
                <CardContent className="p-2">
                  <div className="space-y-1">
                    {actesFiltres.map((acte) => (
                      <button
                        key={acte.id}
                        type="button"
                        className="w-full text-left p-2 rounded hover:bg-slate-100 transition-colors flex justify-between items-center"
                        onClick={() => appliquerActe(acte)}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: acte.couleur }}
                          />
                          <div>
                            <div className="font-medium">{acte.code}</div>
                            <div className="text-sm text-slate-600">
                              {acte.libelle}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-semibold">
                            {acte.montantTotal}€
                          </div>
                          <div className="text-slate-500">
                            Patient: {acte.montantPatient}€
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Motif et Code acte */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="motif" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Motif *
              </Label>
              <Input
                id="motif"
                placeholder="Motif de la consultation"
                {...register("motif")}
                className={errors.motif ? "border-red-500" : ""}
              />
              {errors.motif && (
                <p className="text-red-500 text-sm">{errors.motif.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="acteCode" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Code acte *
              </Label>
              <Input
                id="acteCode"
                placeholder="Ex: G, G+MEG..."
                {...register("acteCode")}
                className={errors.acteCode ? "border-red-500" : ""}
              />
              {errors.acteCode && (
                <p className="text-red-500 text-sm">
                  {errors.acteCode.message}
                </p>
              )}
            </div>
          </div>

          {/* Mode de paiement */}
          <div className="space-y-2">
            <Label htmlFor="modePaiement" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Mode de paiement
            </Label>
            <Controller
              name="modePaiement"
              control={control}
              render={({ field }) => {
                return (
                  <Select
                    value={field.value || "0"}
                    onValueChange={(
                      value: "carte" | "cheque" | "especes" | "100%"
                    ) => {
                      field.onChange(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="100%" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100%">100%</SelectItem>
                      <SelectItem value="carte">Carte bancaire</SelectItem>
                      <SelectItem value="cheque">Chèque</SelectItem>
                      <SelectItem value="especes">Espèces</SelectItem>
                    </SelectContent>
                  </Select>
                );
              }}
            />
          </div>

          {/* Montants */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="montantPatient"
                className="flex items-center gap-2"
              >
                <Euro className="h-4 w-4" />
                Part patient (€) *
              </Label>
              <Input
                id="montantPatient"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                {...register("montantPatient", { valueAsNumber: true })}
                className={errors.montantPatient ? "border-red-500" : ""}
                onChange={handleMontantPatientChange}
              />
              {errors.montantPatient && (
                <p className="text-red-500 text-sm">
                  {errors.montantPatient.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="montantTotal" className="flex items-center gap-2">
                <Euro className="h-4 w-4" />
                Total (€) *
              </Label>
              <Input
                id="montantTotal"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                {...register("montantTotal", { valueAsNumber: true })}
                className={errors.montantTotal ? "border-red-500" : ""}
              />
              {errors.montantTotal && (
                <p className="text-red-500 text-sm">
                  {errors.montantTotal.message}
                </p>
              )}
            </div>
          </div>

          {/* Résumé du paiement */}
          {(montantPatient > 0 || montantTotal > 0) && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600">Part patient</p>
                    <p className="font-semibold text-slate-800">
                      {montantPatient.toFixed(2)} €
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600">Total consultation</p>
                    <p className="font-semibold text-green-700 text-lg">
                      {montantTotal.toFixed(2)} €
                    </p>
                  </div>
                </div>
                {modePaiement && (
                  <div className="mt-2 text-xs text-slate-500">
                    Paiement par {modePaiement}
                  </div>
                )}
                {!modePaiement && (
                  <div className="mt-2 text-xs text-slate-500">
                    Consultation prise en charge
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Informations complémentaires..."
              {...register("notes")}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting
                ? "Enregistrement..."
                : consultationExistante
                ? "Modifier la consultation"
                : "Enregistrer la consultation"}
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
