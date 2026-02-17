import { useState, useEffect } from "react";
import {
  User,
  Download,
  Upload,
  Trash2,
  HardDrive,
  AlertTriangle,
  Sun,
  Moon,
  Building,
  XCircle,
  AlertCircle,
  MapPin,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  getProfile,
  updateProfile,
  exportData,
  importData,
  type ImportResult,
  type ImportError,
} from "@/lib/storage";
import { toast } from "sonner";
import { useTheme } from "@/hooks/use-theme";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CloudSection } from "@/components/settings/CloudSection";
import { useCloudProfile } from "@/hooks/use-cloud-profile";
import { cloudUpdateProfile } from "@/lib/cloudOperations";
import { useAuth } from "@/hooks/use-auth";
import { DatePickerInput } from "@/components/ui/date-picker";

const formatDateForInput = (isoDate: string | undefined | null): string => {
  if (!isoDate) return "2025-11-01"; // Default to Nov 1, 2025
  try {
    const date = new Date(isoDate);
    return date.toISOString().split("T")[0];
  } catch {
    return "2025-11-01";
  }
};

export default function Parametres() {
  const { user } = useAuth();
  const { cloudProfile, refetch: refetchCloudProfile } = useCloudProfile();
  const [profile, setProfile] = useState(getProfile());
  const [fullName, setFullName] = useState(profile.fullName);
  const [adresse, setAdresse] = useState(profile.adresse || "");
  const [siren, setSiren] = useState(profile.siren || "");
  const [dateCreationEntreprise, setDateCreationEntreprise] = useState(
    formatDateForInput(profile.dateCreationEntreprise),
  );
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportError[] | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[] | null>(null);
  const { theme, toggleTheme } = useTheme();

  // Sync form with cloud profile when it loads
  useEffect(() => {
    if (cloudProfile && user) {
      setFullName(cloudProfile.fullName || "");
      setAdresse(cloudProfile.adresse || "");
      setSiren(cloudProfile.siren || "");
      setDateCreationEntreprise(
        formatDateForInput(cloudProfile.dateCreationEntreprise),
      );
    }
  }, [cloudProfile, user]);

  const handleSaveProfile = async () => {
    const updatedProfile = {
      fullName,
      adresse,
      siren: siren.replace(/\s/g, ""), // Remove spaces from SIREN
      dateCreationEntreprise: new Date(dateCreationEntreprise).toISOString(),
    };

    // Save to local storage
    updateProfile(updatedProfile);
    setProfile(getProfile());

    // If connected, also save to cloud
    if (user) {
      const success = await cloudUpdateProfile({
        ...updatedProfile,
        updatedAt: new Date().toISOString(),
      });
      if (success) {
        refetchCloudProfile();
      }
    }

    toast.success("Profil enregistré");
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `remplacant-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Données exportées");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous errors/warnings
    setImportErrors(null);
    setImportWarnings(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result: ImportResult = importData(content);

      if (result.success) {
        const newProfile = getProfile();
        setProfile(newProfile);
        setFullName(newProfile.fullName);
        setAdresse(newProfile.adresse || "");
        setSiren(newProfile.siren || "");
        setDateCreationEntreprise(
          formatDateForInput(newProfile.dateCreationEntreprise),
        );

        if (result.warnings && result.warnings.length > 0) {
          setImportWarnings(result.warnings);
          toast.success("Données importées avec des avertissements");
        } else {
          toast.success("Données importées avec succès");
          setIsImportDialogOpen(false);
        }
      } else {
        setImportErrors(
          result.errors || [
            { path: "inconnu", message: "Erreur inconnue", code: "unknown" },
          ],
        );
        toast.error("Erreur lors de l'import des données");
      }
    };
    reader.readAsText(file);

    // Reset the input so the same file can be selected again
    e.target.value = "";
  };

  const handleCloseImportDialog = (open: boolean) => {
    setIsImportDialogOpen(open);
    if (!open) {
      setImportErrors(null);
      setImportWarnings(null);
    }
  };

  const handleClearData = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl lg:text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez votre profil et vos données
        </p>
      </div>

      {/* Profile Section */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <User className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Profil</h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">
              Nom complet (Entrepreneur Individuel)
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Dr. Jean Dupont"
            />
            <p className="text-xs text-muted-foreground">
              Sera affiché avec la mention "EI" sur les factures
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adresse" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Adresse professionnelle
            </Label>
            <Input
              id="adresse"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              placeholder="123 Rue de la Médecine, 75001 Paris"
            />
            <p className="text-xs text-muted-foreground">
              Adresse complète pour les factures
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="siren" className="flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Numéro SIREN
            </Label>
            <Input
              id="siren"
              value={siren}
              onChange={(e) => setSiren(e.target.value)}
              placeholder="123 456 789"
              maxLength={11}
            />
            <p className="text-xs text-muted-foreground">
              9 chiffres, obligatoire sur les factures
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="dateCreationEntreprise"
              className="flex items-center gap-2"
            >
              <Building className="w-4 h-4" />
              Date de création d'entreprise
            </Label>
            <DatePickerInput
              id="dateCreationEntreprise"
              value={new Date(dateCreationEntreprise)}
              onChange={(e) => setDateCreationEntreprise(e)}
            />
            <p className="text-xs text-muted-foreground">
              Utilisée dans le simulateur Super-Net pour le calcul des
              cotisations
            </p>
          </div>

          <Button onClick={handleSaveProfile}>Enregistrer</Button>
        </div>
      </div>

      {/* Appearance Section */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-primary/10">
            {theme === "dark" ? (
              <Moon className="w-5 h-5 text-primary" />
            ) : (
              <Sun className="w-5 h-5 text-primary" />
            )}
          </div>
          <h2 className="text-lg font-semibold">Apparence</h2>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <Moon className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Mode sombre</p>
              <p className="text-sm text-muted-foreground">
                Activer le thème sombre pour l'application
              </p>
            </div>
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
        </div>
      </div>

      {/* Data Section */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <HardDrive className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Données</h2>
            <p className="text-sm text-muted-foreground">
              Mode local - Données stockées sur cet appareil
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Export */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Exporter les données</p>
                <p className="text-sm text-muted-foreground">
                  Téléchargez une copie de vos données
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleExport}>
              Exporter
            </Button>
          </div>

          {/* Import */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Importer des données</p>
                <p className="text-sm text-muted-foreground">
                  Restaurez une sauvegarde précédente
                </p>
              </div>
            </div>
            <Dialog
              open={isImportDialogOpen}
              onOpenChange={handleCloseImportDialog}
            >
              <DialogTrigger asChild>
                <Button variant="outline">Importer</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Importer des données</DialogTitle>
                  <DialogDescription>
                    Sélectionnez un fichier de sauvegarde. Attention, cela
                    remplacera toutes vos données actuelles.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {!importErrors && !importWarnings && (
                    <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
                      <div className="flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
                        <p className="text-sm text-muted-foreground">
                          L'import remplacera toutes vos données actuelles.
                          Assurez-vous d'avoir exporté une sauvegarde si
                          nécessaire.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Error display */}
                  {importErrors && importErrors.length > 0 && (
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 space-y-3">
                      <div className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                        <div className="space-y-1 flex-1">
                          <p className="font-medium text-destructive">
                            Échec de l'import : {importErrors.length} erreur
                            {importErrors.length > 1 ? "s" : ""} détectée
                            {importErrors.length > 1 ? "s" : ""}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Le fichier ne correspond pas au format attendu.
                            Corrigez les erreurs suivantes :
                          </p>
                        </div>
                      </div>
                      <ScrollArea className="max-h-48">
                        <ul className="space-y-2 text-sm">
                          {importErrors.map((error, index) => (
                            <li
                              key={index}
                              className="p-2 rounded bg-background/50 border border-border"
                            >
                              <div className="flex items-start gap-2">
                                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded shrink-0">
                                  {error.path}
                                </span>
                              </div>
                              <p className="mt-1 text-muted-foreground">
                                {error.message}
                              </p>
                              {error.expected && (
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  Valeurs attendues :{" "}
                                  <code className="bg-muted px-1 rounded">
                                    {error.expected}
                                  </code>
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                      <p className="text-xs text-muted-foreground border-t border-border pt-2">
                        💡 Astuce : Vérifiez que le fichier a été exporté depuis
                        cette application et qu'il n'a pas été modifié
                        manuellement.
                      </p>
                    </div>
                  )}

                  {/* Warnings display (on success with warnings) */}
                  {importWarnings && importWarnings.length > 0 && (
                    <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 space-y-3">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                        <div className="space-y-1 flex-1">
                          <p className="font-medium text-warning">
                            Import réussi avec {importWarnings.length}{" "}
                            avertissement{importWarnings.length > 1 ? "s" : ""}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Certaines références ont été corrigées
                            automatiquement :
                          </p>
                        </div>
                      </div>
                      <ScrollArea className="max-h-32">
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {importWarnings.map((warning, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-warning">•</span>
                              {warning}
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                      <Button
                        onClick={() => setIsImportDialogOpen(false)}
                        className="w-full"
                      >
                        Fermer
                      </Button>
                    </div>
                  )}

                  {!importWarnings && (
                    <Input
                      className="cursor-pointer"
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                    />
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Clear Data */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/5 border border-destructive/20">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-destructive" />
              <div>
                <p className="font-medium">Supprimer toutes les données</p>
                <p className="text-sm text-muted-foreground">
                  Cette action est irréversible
                </p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Supprimer</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action supprimera définitivement toutes vos données
                    (cabinets, journées, paiements). Cette action est
                    irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Supprimer tout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Cloud Section */}
      <CloudSection />

      {/* App Info */}
      <div className="text-center py-4 text-sm text-muted-foreground">
        <p>Remplaçant Pro v1.0</p>
        <p>Application de gestion pour médecins remplaçants</p>
      </div>
    </div>
  );
}
