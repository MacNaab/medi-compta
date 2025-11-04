// components/lieux/lieu-form.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lieu, LieuFormData } from "@/types/lieu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Percent, MapPin, Phone, Mail, Palette } from "lucide-react";

// Palette de couleurs prédéfinies
const COULEURS_DISPO = [
  "#3b82f6", // blue-500
  "#ef4444", // red-500
  "#10b981", // green-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#84cc16", // lime-500
  "#f97316", // orange-500
  "#6366f1", // indigo-500
];

// Schéma de validation avec Zod
const lieuSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  pourcentageRetrocession: z
    .number()
    .min(0, "La rétrocession doit être au minimum 0%")
    .max(100, "La rétrocession doit être au maximum 100%"),
  couleur: z.string().min(1, "La couleur est requise"),
  adresse: z.string().optional(),
  telephone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
});

type FormData = z.infer<typeof lieuSchema>;

interface LieuFormProps {
  lieu?: Lieu;
  onSubmit: (data: LieuFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function LieuForm({
  lieu,
  onSubmit,
  onCancel,
  isLoading = false,
}: LieuFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couleurSelectionnee, setCouleurSelectionnee] = useState(
    lieu?.couleur || COULEURS_DISPO[0]
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(lieuSchema),
    defaultValues: lieu
      ? {
          nom: lieu.nom,
          pourcentageRetrocession: lieu.pourcentageRetrocession,
          couleur: lieu.couleur,
          adresse: lieu.adresse || "",
          telephone: lieu.telephone || "",
          email: lieu.email || "",
        }
      : {
          pourcentageRetrocession: 80, // Valeur par défaut typique
          couleur: COULEURS_DISPO[0],
        },
  });

  const handleCouleurChange = (couleur: string) => {
    setCouleurSelectionnee(couleur);
    setValue("couleur", couleur);
  };

  const handleFormSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...data,
        adresse: data.adresse || undefined,
        telephone: data.telephone || undefined,
        email: data.email || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardDescription>
          {lieu
            ? "Modifiez les informations de ce cabinet"
            : "Ajoutez un nouveau cabinet avec son pourcentage de rétrocession"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Nom du lieu */}
          <div className="space-y-2">
            <Label htmlFor="nom">Nom du cabinet *</Label>
            <Input
              id="nom"
              placeholder="Ex: Cabinet Médical Dupont"
              {...register("nom")}
              className={errors.nom ? "border-red-500" : ""}
            />
            {errors.nom && (
              <p className="text-red-500 text-sm">{errors.nom.message}</p>
            )}
          </div>

          {/* Pourcentage de rétrocession */}
          <div className="space-y-2">
            <Label
              htmlFor="pourcentageRetrocession"
              className="flex items-center gap-2"
            >
              <Percent className="h-4 w-4" />
              Pourcentage de rétrocession (%) *
            </Label>
            <Input
              id="pourcentageRetrocession"
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="80"
              {...register("pourcentageRetrocession", { valueAsNumber: true })}
              className={errors.pourcentageRetrocession ? "border-red-500" : ""}
            />
            {errors.pourcentageRetrocession && (
              <p className="text-red-500 text-sm">
                {errors.pourcentageRetrocession.message}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Pourcentage que vous percevez sur les honoraires (0-100%)
            </p>
          </div>

          {/* Sélecteur de couleur */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Couleur d&apos;identification *
            </Label>

            <div className="grid grid-cols-5 gap-3">
              {COULEURS_DISPO.map((couleur) => (
                <button
                  key={couleur}
                  type="button"
                  className={`
                    w-10 h-10 rounded-full border-2 transition-all
                    ${
                      couleurSelectionnee === couleur
                        ? "border-slate-800 scale-110"
                        : "border-slate-300 hover:scale-105"
                    }
                  `}
                  style={{ backgroundColor: couleur }}
                  onClick={() => handleCouleurChange(couleur)}
                />
              ))}
            </div>

            <input type="hidden" {...register("couleur")} />

            {errors.couleur && (
              <p className="text-red-500 text-sm">{errors.couleur.message}</p>
            )}

            <p className="text-sm text-muted-foreground">
              Cette couleur sera utilisée pour identifier ce lieu dans les
              graphiques et le calendrier
            </p>
          </div>

          {/* Adresse */}
          <div className="space-y-2">
            <Label htmlFor="adresse" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Adresse
            </Label>
            <Input
              id="adresse"
              placeholder="123 Avenue du Médical, 75000 Paris"
              {...register("adresse")}
            />
          </div>

          {/* Téléphone */}
          <div className="space-y-2">
            <Label htmlFor="telephone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Téléphone
            </Label>
            <Input
              id="telephone"
              placeholder="01 23 45 67 89"
              {...register("telephone")}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="contact@cabinet.fr"
              {...register("email")}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="flex-1"
            >
              {isSubmitting
                ? "Enregistrement..."
                : lieu
                ? "Modifier"
                : "Créer le lieu"}
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
