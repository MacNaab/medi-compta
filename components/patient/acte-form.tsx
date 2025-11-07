// components/patient/acte-form.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Acte, ActeFormData } from "@/types/acte";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Euro, CreditCard, Palette } from "lucide-react";

// Schéma de validation
const acteSchema = z.object({
  code: z.string().min(1, "Le code est requis"),
  libelle: z.string().min(1, "Le libellé est requis"),
  montantTotal: z.number().min(0, "Le montant total doit être positif"),
  montantPatient: z.number().min(0, "Le montant patient doit être positif"),
  modePaiementParDefaut: z.enum(["carte", "cheque", "especes", "100%"]),
  couleur: z.string().optional(),
});

type FormData = z.infer<typeof acteSchema>;

interface ActeFormProps {
  onSubmit: (data: ActeFormData) => Promise<void>;
  onCancel: () => void;
  acteExistante?: Acte | null;
}

// Couleurs prédéfinies pour les actes
const COULEURS_DISPONIBLES = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#ec4899",
  "#6366f1",
];

export function ActeForm({ onSubmit, onCancel, acteExistante }: ActeFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(acteSchema),
    defaultValues: acteExistante
      ? {
          code: acteExistante.code,
          libelle: acteExistante.libelle,
          montantTotal: acteExistante.montantTotal,
          montantPatient: acteExistante.montantPatient,
          modePaiementParDefaut: acteExistante.modePaiementParDefaut,
          couleur: acteExistante.couleur || COULEURS_DISPONIBLES[0],
        }
      : {
          code: "",
          libelle: "",
          montantTotal: 0,
          montantPatient: 0,
          modePaiementParDefaut: "carte",
          couleur: COULEURS_DISPONIBLES[0],
        },
  });

  const handleFormSubmit = async (data: FormData) => {
    await onSubmit(data);
  };

  const montantTotal = watch("montantTotal");
  const montantPatient = watch("montantPatient");

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Code et Libellé */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Code *
              </Label>
              <Input
                id="code"
                placeholder="Ex: G, G+MEG..."
                {...register("code")}
                className={errors.code ? "border-red-500" : ""}
              />
              {errors.code && (
                <p className="text-red-500 text-sm">{errors.code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="libelle" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Libellé *
              </Label>
              <Input
                id="libelle"
                placeholder="Description de l'acte"
                {...register("libelle")}
                className={errors.libelle ? "border-red-500" : ""}
              />
              {errors.libelle && (
                <p className="text-red-500 text-sm">{errors.libelle.message}</p>
              )}
            </div>
          </div>

          {/* Montants */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="montantTotal" className="flex items-center gap-2">
                <Euro className="h-4 w-4" />
                Montant total (€) *
              </Label>
              <Input
                id="montantTotal"
                type="number"
                step="0.01"
                min="0"
                {...register("montantTotal", { valueAsNumber: true })}
                className={errors.montantTotal ? "border-red-500" : ""}
              />
              {errors.montantTotal && (
                <p className="text-red-500 text-sm">
                  {errors.montantTotal.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="montantPatient"
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Part patient (€) *
              </Label>
              <Input
                id="montantPatient"
                type="number"
                step="0.01"
                min="0"
                {...register("montantPatient", { valueAsNumber: true })}
                className={errors.montantPatient ? "border-red-500" : ""}
              />
              {errors.montantPatient && (
                <p className="text-red-500 text-sm">
                  {errors.montantPatient.message}
                </p>
              )}
            </div>
          </div>

          {/* Mode de paiement par défaut */}
          <div className="space-y-2">
            <Label
              htmlFor="modePaiementParDefaut"
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Mode de paiement par défaut
            </Label>
            <Select
              value={watch("modePaiementParDefaut") || ""}
              onValueChange={(value: "carte" | "cheque" | "especes" | "100%") =>
                setValue("modePaiementParDefaut", value)
              }
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
          </div>

          {/* Couleur */}
          <div className="space-y-2">
            <Label htmlFor="couleur" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Couleur
            </Label>
            <div className="flex gap-2">
              {COULEURS_DISPONIBLES.map((couleur) => (
                <button
                  key={couleur}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${
                    // eslint-disable-next-line react-hooks/incompatible-library
                    watch("couleur") === couleur
                      ? "border-slate-800"
                      : "border-slate-300"
                  }`}
                  style={{ backgroundColor: couleur }}
                  onClick={() => setValue("couleur", couleur)}
                />
              ))}
            </div>
          </div>

          {/* Résumé */}
          {(montantTotal > 0 || montantPatient > 0) && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="text-sm">
                  <div className="font-semibold text-slate-800 mb-2">
                    Résumé de l&apos;acte
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-slate-600">Montant total</div>
                      <div className="font-bold text-green-600">
                        {montantTotal} €
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-600">Part patient</div>
                      <div className="font-bold text-blue-600">
                        {montantPatient} €
                      </div>
                    </div>
                  </div>
                  {watch("modePaiementParDefaut") && (
                    <div className="mt-2 text-slate-600">
                      Paiement par défaut : {watch("modePaiementParDefaut")}
                    </div>
                  )}
                  {!watch("modePaiementParDefaut") && (
                    <div className="mt-2 text-slate-600">
                      Acte pris en charge à 100%
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {acteExistante ? "Modifier l'acte" : "Créer l'acte"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
