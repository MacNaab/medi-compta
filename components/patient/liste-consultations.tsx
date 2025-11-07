// components/patient/liste-consultations.tsx
import { useState } from "react";
import { Consultation } from "@/types/consultation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit3, Trash2, Euro, User, FileText, CreditCard } from "lucide-react";

interface ListeConsultationsProps {
  consultations: Consultation[];
  onEdit: (consultation: Consultation) => void;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function ListeConsultations({
  consultations,
  onEdit,
  onDelete,
  isLoading,
}: ListeConsultationsProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (consultation: Consultation) => {
    setDeletingId(consultation.id);
    try {
      await onDelete(consultation.id);
    } finally {
      setDeletingId(null);
    }
  };

  // Calcul des totaux
  const totalCarte = consultations
    .filter((c) => c.modePaiement === "carte")
    .reduce((sum, c) => sum + c.montantTotal, 0);

  const totalCheque = consultations
    .filter((c) => c.modePaiement === "cheque")
    .reduce((sum, c) => sum + c.montantTotal, 0);

  const totalEspeces = consultations
    .filter((c) => c.modePaiement === "especes")
    .reduce((sum, c) => sum + c.montantTotal, 0);

  const totalPrisEnCharge = consultations
    .filter((c) => c.modePaiement === null)
    .reduce((sum, c) => sum + c.montantTotal, 0);

  const totalGeneral = consultations.reduce(
    (sum, c) => sum + c.montantTotal,
    0
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      {consultations.length > 0 && (
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
              <div>
                <p className="text-sm text-slate-600">Total consultations</p>
                <p className="text-xl font-bold text-slate-800">
                  {consultations.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Carte</p>
                <p className="text-xl font-bold text-blue-600">
                  {totalCarte.toFixed(2)} €
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Chèque</p>
                <p className="text-xl font-bold text-purple-600">
                  {totalCheque.toFixed(2)} €
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Espèces</p>
                <p className="text-xl font-bold text-red-600">
                  {totalEspeces.toFixed(2)} €
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">100%</p>
                <p className="text-xl font-bold text-gray-600">
                  {totalPrisEnCharge.toFixed(2)} €
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Total général</p>
                <p className="text-xl font-bold text-green-600">
                  {totalGeneral.toFixed(2)} €
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des consultations */}
      {consultations.length === 0 ? (
        <Card className="text-center py-12 border-2 border-dashed border-slate-200">
          <CardContent>
            <User className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              Aucune consultation enregistrée
            </h3>
            <p className="text-slate-500">
              Commencez par saisir vos premières consultations.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {consultations
            .sort((a, b) => a.heure.localeCompare(b.heure))
            .map((consultation) => (
              <Card
                key={consultation.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    {/* Informations principales */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">
                            {consultation.heure}
                          </Badge>
                          <h3 className="font-semibold text-slate-800 text-lg">
                            {consultation.nomPatient}
                          </h3>
                        </div>
                        <Badge
                          variant="secondary"
                          className={
                            consultation.modePaiement === null
                              ? "bg-gray-100 text-gray-700"
                              : consultation.modePaiement === "carte"
                              ? "bg-blue-100 text-blue-700"
                              : consultation.modePaiement === "cheque"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-red-100 text-red-700"
                          }
                        >
                          {consultation.modePaiement === null
                            ? "100%"
                            : consultation.modePaiement}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-600">Motif :</span>
                          <span className="font-semibold">
                            {consultation.motif}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-600">Acte :</span>
                          <span className="font-semibold">
                            {consultation.acteCode}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Euro className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-600">Part patient :</span>
                          <span className="font-semibold">
                            {consultation.montantPatient.toFixed(2)} €
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-600">Total :</span>
                          <span className="font-semibold text-green-600">
                            {consultation.montantTotal.toFixed(2)} €
                          </span>
                        </div>
                      </div>

                      {consultation.notes && (
                        <div className="flex items-start gap-2 text-sm">
                          <FileText className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                          <p className="text-slate-600 italic">
                            {consultation.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(consultation)}
                        className="border-slate-300 hover:bg-slate-50"
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Modifier
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(consultation)}
                        disabled={deletingId === consultation.id}
                        className="border-red-200 hover:bg-red-50 hover:text-red-700 text-red-600"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        {deletingId === consultation.id ? "..." : "Supprimer"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
