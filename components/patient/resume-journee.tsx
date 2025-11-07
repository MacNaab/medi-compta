// components/patient/resume-journee.tsx
import { Consultation } from "@/types/consultation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Euro, Users, TrendingUp, FileText } from "lucide-react";
import { exportConsultationsToExcel } from "@/services/export-consultations";

interface ResumeJourneeProps {
  date: Date;
  consultations: Consultation[];
  onExport: () => void;
}

export function ResumeJournee({
  date,
  consultations,
  // onExport,
}: ResumeJourneeProps) {
  // Calcul des statistiques détaillées
  const stats = {
    totalCarte: consultations
      .filter((c) => c.modePaiement === "carte")
      .reduce((sum, c) => sum + c.montantPatient, 0),
    totalCheque: consultations
      .filter((c) => c.modePaiement === "cheque")
      .reduce((sum, c) => sum + c.montantPatient, 0),
    totalEspeces: consultations
      .filter((c) => c.modePaiement === "especes")
      .reduce((sum, c) => sum + c.montantPatient, 0),
    totalPrisEnCharge: consultations
      .filter((c) => c.modePaiement === "100%")
      .reduce((sum, c) => sum + c.montantTotal, 0),
    totalGeneral: consultations.reduce((sum, c) => sum + c.montantTotal, 0),
    nombreConsultations: consultations.length,
    nombreAvecPaiement: consultations.filter((c) => c.modePaiement !== "100%")
      .length,
    nombrePrisEnCharge: consultations.filter((c) => c.modePaiement === "100%")
      .length,
    nombreCarte: consultations.filter((c) => c.modePaiement === "carte").length,
    nombreCheque: consultations.filter((c) => c.modePaiement === "cheque").length,
    nombreEspeces: consultations.filter((c) => c.modePaiement === "especes").length,
  };

  // Moyenne par consultation
  const moyenneParConsultation =
    stats.nombreConsultations > 0
      ? stats.totalGeneral / stats.nombreConsultations
      : 0;

  const handleExportExcel = () => {
    exportConsultationsToExcel(consultations, date);
  };

  return (
    <div className="space-y-6">
      {/* Cartes de statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-800">
              {stats.nombreConsultations}
            </div>
            <div className="text-slate-600 text-sm">Consultations</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">
              {stats.totalGeneral.toFixed(2)} €
            </div>
            <div className="text-slate-600 text-sm">Total général</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Euro className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">
              {moyenneParConsultation.toFixed(2)} €
            </div>
            <div className="text-slate-600 text-sm">Moyenne/consultation</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-600">
              {stats.nombreAvecPaiement}
            </div>
            <div className="text-slate-600 text-sm">Avec paiement</div>
          </CardContent>
        </Card>
      </div>

      {/* Détails des paiements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition par mode de paiement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Répartition des paiements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  label: "Carte bancaire",
                  value: stats.nombreCarte,
                  color: "bg-blue-500",
                },
                {
                  label: "Chèque",
                  value: stats.nombreCheque,
                  color: "bg-purple-500",
                },
                {
                  label: "Espèces",
                  value: stats.nombreEspeces,
                  color: "bg-red-500",
                },
                {
                  label: "100%",
                  value: stats.nombrePrisEnCharge,
                  color: "bg-gray-500",
                },
              ].map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      {item.label}
                    </span>
                    <span className="text-slate-600">
                      {item.value}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${item.color}`}
                      style={{
                        width:
                          stats.nombreConsultations > 0
                            ? `${(item.value / stats.nombreConsultations) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Résumé chiffré */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Résumé chiffré
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-200">
                <span className="text-slate-600">
                  Consultations avec paiement
                </span>
                <Badge variant="secondary">{stats.nombreAvecPaiement}</Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-200">
                <span className="text-slate-600">
                  Consultations prises en charge 100%
                </span>
                <Badge variant="secondary">{stats.nombrePrisEnCharge}</Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-200">
                <span className="text-slate-600">Total carte</span>
                <span className="font-semibold text-blue-600">
                  {stats.totalCarte.toFixed(2)} €
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-200">
                <span className="text-slate-600">Total chèque</span>
                <span className="font-semibold text-purple-600">
                  {stats.totalCheque.toFixed(2)} €
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-200">
                <span className="text-slate-600">Total espèces</span>
                <span className="font-semibold text-red-600">
                  {stats.totalEspeces.toFixed(2)} €
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-600 font-semibold">
                  Total général
                </span>
                <span className="font-bold text-green-600 text-lg">
                  {stats.totalGeneral.toFixed(2)} €
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bouton d'export */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">
                Export des données
              </h3>
              <p className="text-slate-600 text-sm">
                Téléchargez le détail des consultations au format Excel
              </p>
            </div>
            <Button
              onClick={handleExportExcel}
              className="bg-green-600 hover:bg-green-700"
              disabled={consultations.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste détaillée pour vérification */}
      {consultations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Détail des consultations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {consultations
                .sort((a, b) => a.heure.localeCompare(b.heure))
                .map((consultation) => (
                  <div
                    key={consultation.id}
                    className="flex justify-between items-center py-2 px-3 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="font-mono">
                        {consultation.heure}
                      </Badge>
                      <div>
                        <div className="font-medium text-slate-800">
                          {consultation.nomPatient}
                        </div>
                        <div className="text-sm text-slate-500">
                          {consultation.motif} • {consultation.acteCode}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        {consultation.montantTotal.toFixed(2)} €
                      </div>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {consultation.modePaiement}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
