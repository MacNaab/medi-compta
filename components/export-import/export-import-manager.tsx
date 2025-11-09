// components/export-import/export-import-manager.tsx
"use client";

import { useState } from "react";
import { useLieux } from "@/hooks/useLieux";
import { useJournees } from "@/hooks/useJournees";
import { useVirements } from "@/hooks/useVirements";
import { ExportImportService } from "@/services/export-import-service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Download,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Euro,
  Building,
} from "lucide-react";
<<<<<<< Updated upstream
=======
import { toast } from "sonner";
>>>>>>> Stashed changes

export function ExportImportManager() {
  const { lieux, importLieux } = useLieux();
  const { journees, importJournees } = useJournees();
  const { virements, getVirementsBruts, importVirements } =
    useVirements(journees);

<<<<<<< Updated upstream
  const [importStatus, setImportStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleExportJSON = async () => {
    try {
      const virementsBruts = await getVirementsBruts();
      ExportImportService.exporterDonnees(lieux, journees, virementsBruts);
      setMessage("Export JSON réussi !");
      setImportStatus("success");
=======
  const handleExportJSON = async () => {
    try {
      const virementsBruts = await getVirementsBruts();
      ExportImportService.exporterDonnees(
        lieux,
        journees,
        virementsBruts,
      );
      toast.success("Export JSON réussi !");
>>>>>>> Stashed changes
    } catch (error) {
      setMessage("Erreur lors de l'export JSON");
      setImportStatus("error");
      console.error(error);
    }
  };

  const handleExportExcel = async () => {
    try {
      const virementsBruts = await getVirementsBruts();
      ExportImportService.exporterExcel(lieux, journees, virementsBruts);
      setMessage("Export Excel réussi !");
      setImportStatus("success");
    } catch (error) {
      setMessage("Erreur lors de l'export Excel");
      setImportStatus("error");
      console.error(error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus("loading");
    setMessage("Import en cours...");

    try {
      const {
        lieux: lieuxImportes,
        journees: journeesImportees,
<<<<<<< Updated upstream
        virements: virementsImportes,
=======
        virements: virementsImportes
>>>>>>> Stashed changes
      } = await ExportImportService.importerDonnees(file);

      setMessage("Import des lieux...");
      await importLieux(lieuxImportes);
<<<<<<< Updated upstream

      setMessage("Import des journées...");
      await importJournees(journeesImportees);

      setMessage("Import des virements...");
      await importVirements(virementsImportes);

      setMessage(
        `Import réussi ! ${lieuxImportes.length} lieux, ${journeesImportees.length} journées et ${virementsImportes.length} virements importés.`
=======
      await importJournees(journeesImportees);
      await importVirements(virementsImportes);

      toast.success(
        `Import réussi ! ${lieuxImportes.length} lieux, ${journeesImportees.length} journées et ${virementsImportes.length} virements actes importés.`
>>>>>>> Stashed changes
      );
      setImportStatus("success");
    } catch (error) {
      console.error("Erreur détaillée import:", error);
      setMessage("Erreur lors de l'import : " + (error as Error).message);
      setImportStatus("error");
    }

    // Reset input file
    event.target.value = "";
  };

  const stats = {
    totalLieux: lieux.length,
    totalJournees: journees.length,
    totalVirements: virements.length,
    totalHonorairesTheoriques: journees.reduce(
      (sum, j) => sum + j.honorairesTheoriques,
      0
    ),
    totalVirementsReels: virements.reduce((sum, v) => sum + v.montantRecu, 0),
    virementsEnAttente: virements.filter((v) => v.statut === "attente").length,
    virementsPartiels: virements.filter((v) => v.statut === "partiel").length,
    derniereJournee:
      journees.length > 0
        ? new Date(journees[0].date).toLocaleDateString("fr-FR")
        : "Aucune",
    dernierVirement:
      virements.length > 0
        ? new Date(virements[0].dateReception).toLocaleDateString("fr-FR")
        : "Aucun",
  };

  const differenceTheorieRealite =
    stats.totalVirementsReels - stats.totalHonorairesTheoriques;
  const tauxCorrespondance =
    stats.totalHonorairesTheoriques > 0
      ? (stats.totalVirementsReels / stats.totalHonorairesTheoriques) * 100
      : 0;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Sauvegarde des données
        </h1>
        <p className="text-slate-600">
          Exportez et importez vos données complètes (lieux, journées et
          virements)
        </p>
      </div>

      {/* Statistiques complètes */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalLieux}
              </div>
              <div className="text-sm text-slate-600">Lieux</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {stats.totalJournees}
              </div>
              <div className="text-sm text-slate-600">Journées</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {stats.totalVirements}
              </div>
              <div className="text-sm text-slate-600">Virements</div>
            </div>
            <div>
              <div
                className={`text-lg font-bold ${
                  tauxCorrespondance >= 95
                    ? "text-green-600"
                    : tauxCorrespondance >= 80
                    ? "text-amber-600"
                    : "text-red-600"
                }`}
              >
                {tauxCorrespondance.toFixed(1)}%
              </div>
              <div className="text-sm text-slate-600">Correspondance</div>
            </div>
          </div>

          {/* Détails financiers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-slate-600 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span>Théorique</span>
              </div>
              <div className="text-lg font-bold text-blue-600">
                {stats.totalHonorairesTheoriques.toFixed(2)} €
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-slate-600 mb-1">
                <Euro className="h-4 w-4" />
                <span>Réel</span>
              </div>
              <div className="text-lg font-bold text-green-600">
                {stats.totalVirementsReels.toFixed(2)} €
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-slate-600 mb-1">
                <Building className="h-4 w-4" />
                <span>Écart</span>
              </div>
              <div
                className={`text-lg font-bold ${
                  differenceTheorieRealite === 0
                    ? "text-slate-600"
                    : differenceTheorieRealite > 0
                    ? "text-green-600"
                    : "text-amber-600"
                }`}
              >
                {differenceTheorieRealite > 0 ? "+" : ""}
                {differenceTheorieRealite.toFixed(2)} €
              </div>
            </div>
          </div>

          {/* Alertes pour virements en attente */}
          {(stats.virementsEnAttente > 0 || stats.virementsPartiels > 0) && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>
                  <strong>Attention :</strong> {stats.virementsEnAttente}{" "}
                  virement(s) en attente et {stats.virementsPartiels}{" "}
                  virement(s) partiel(s)
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Exporter les données
            </CardTitle>
            <CardDescription>
              Téléchargez vos données complètes en format JSON ou Excel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleExportJSON}
              className="w-full"
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              Exporter en JSON (Complet)
            </Button>

            <Button
              onClick={handleExportExcel}
              className="w-full"
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              Exporter en Excel (3 feuilles)
            </Button>

            <div className="text-xs text-slate-500 space-y-2 p-3 bg-slate-50 rounded-lg">
              <p>
                <strong>Contenu de l&apos;export :</strong>
              </p>
              <ul className="space-y-1">
                <li>
                  • <strong>Lieux</strong> : {stats.totalLieux} cabinet(s) avec
                  leurs pourcentages
                </li>
                <li>
                  • <strong>Journées</strong> : {stats.totalJournees} journée(s)
                  de travail
                </li>
                <li>
                  • <strong>Virements</strong> : {stats.totalVirements}{" "}
                  virement(s) enregistré(s)
                </li>
              </ul>
              <p className="mt-2">
                <strong>JSON</strong> : Format complet pour
                sauvegarde/restauration
                <br />
                <strong>Excel</strong> : Format simple pour consultation (3
                feuilles)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Importer des données
            </CardTitle>
            <CardDescription>
              Restaurez vos données complètes à partir d&apos;un fichier JSON
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <label htmlFor="import-file" className="cursor-pointer block">
                <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <div className="text-sm text-slate-600">
                  Cliquez pour sélectionner un fichier JSON
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Format exporté depuis cette application
                </div>
              </label>
            </div>

            <div className="text-xs text-slate-500 space-y-2 p-3 bg-amber-50 rounded-lg">
              <p className="flex items-center gap-1 text-amber-700">
                <AlertTriangle className="h-3 w-3" />
                <strong>Attention :</strong> L&apos;import remplace TOUTES les
                données existantes
              </p>
              <ul className="text-amber-700 space-y-1">
                <li>• Tous les lieux actuels seront supprimés</li>
                <li>• Toutes les journées actuelles seront supprimées</li>
                <li>• Tous les virements actuels seront supprimés</li>
                <li>• Les données du fichier seront importées</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message de statut */}
      {importStatus !== "idle" && (
        <Card
          className={`mt-6 ${
            importStatus === "success"
              ? "bg-green-50 border-green-200"
              : importStatus === "error"
              ? "bg-red-50 border-red-200"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {importStatus === "loading" && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              )}
              {importStatus === "success" && (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              )}
              {importStatus === "error" && (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <span
                className={
                  importStatus === "success"
                    ? "text-green-800"
                    : importStatus === "error"
                    ? "text-red-800"
                    : "text-blue-800"
                }
              >
                {message}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions mises à jour */}
      <Card className="mt-6 bg-slate-50">
        <CardHeader>
          <CardTitle className="text-sm">Instructions de sauvegarde</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-600 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold mb-2">📅 Sauvegarde régulière</p>
                <ul className="space-y-1">
                  <li>• Exportez après chaque saisie importante</li>
                  <li>• Exportez après chaque enregistrement de virement</li>
                  <li>• Conservez plusieurs versions dans le temps</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-2">
                  🔄 Transfert d&apos;appareil
                </p>
                <ul className="space-y-1">
                  <li>• Exportez depuis l&apos;ancien appareil</li>
                  <li>• Importez sur le nouveau appareil</li>
                  <li>• Vérifiez l&apos;intégrité des données</li>
                </ul>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-200">
              <p className="font-semibold">🛡️ Sécurité des données</p>
              <p>
                Conservez vos exports dans un endroit sécurisé (cloud chiffré,
                disque dur externe).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
