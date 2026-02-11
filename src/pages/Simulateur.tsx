import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Calculator, Info, TrendingDown, TrendingUp, Wallet, Loader2, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { getProfile, getVirements, getJournees, getChargesByYear } from '@/lib/storage';


interface SimulationResult {
  remunerationNette: number;
  impot: number;
  superNet: number;
  cotisationsTotal: number;
  cotisationsUrssaf: number;
  cotisationsRetraite: number;
  participationCpam: number;
}

const SITUATION_FAMILIALE = [
  { value: "'célibataire'", label: "Célibataire / Divorcé(e) / Union libre" },
  { value: "'couple'", label: "Marié(e)s / Pacsé(e)s" },
  { value: "'veuf'", label: "Veuf(ve)" },
];

const NOMBRE_ENFANTS = [
  { value: "0 enfant", label: "0 enfant" },
  { value: "1 enfant", label: "1 enfant" },
  { value: "2 enfants", label: "2+ enfants" },
];

const SECTEUR = [
  { value: "'S1'", label: "Secteur 1" },
  { value: "'S2'", label: "Secteur 2" },
  { value: "'non conventionné'", label: "Non conventionné" },
];

const MICRO_BNC_LIMIT = 77700;

// Calculate default values from previous year's data
const useDefaultValues = () => {
  return useMemo(() => {
    const previousYear = new Date().getFullYear() - 1;
    
    // Get virements received in previous year
    const virements = getVirements();
    const virementsAnneePrecedente = virements.filter(v => {
      if (v.statut !== 'recu' || !v.dateReception) return false;
      const dateReception = new Date(v.dateReception);
      return dateReception.getFullYear() === previousYear;
    });
    const totalVirements = virementsAnneePrecedente.reduce((sum, v) => sum + (v.montantRecu || 0), 0);
    
    // Get honoraires nets from previous year (from journées)
    const journees = getJournees();
    const journeesAnneePrecedente = journees.filter(j => {
      const date = new Date(j.date);
      return date.getFullYear() === previousYear;
    });
    const totalHonoraires = journeesAnneePrecedente.reduce((sum, j) => sum + (j.honorairesTheoriques || 0), 0);
    
    // Determine default CA: virements > honoraires > 50000
    let defaultCA = '50000';
    let caSource: 'virements' | 'honoraires' | 'default' = 'default';
    if (totalVirements > 0) {
      defaultCA = Math.round(totalVirements).toString();
      caSource = 'virements';
    } else if (totalHonoraires > 0) {
      defaultCA = Math.round(totalHonoraires).toString();
      caSource = 'honoraires';
    }
    
    // Get deductible charges from previous year
    const chargesAnneePrecedente = getChargesByYear(previousYear);
    const totalChargesDeductibles = chargesAnneePrecedente
      .filter(c => c.deductible)
      .reduce((sum, c) => sum + c.montant, 0);
    const defaultCharges = totalChargesDeductibles > 0 ? Math.round(totalChargesDeductibles).toString() : '0';
    const chargesSource: 'charges' | 'default' = totalChargesDeductibles > 0 ? 'charges' : 'default';
    
    // Determine default regime based on CA
    const caValue = parseFloat(defaultCA);
    const defaultRegime: 'micro' | 'reel' = caValue < MICRO_BNC_LIMIT ? 'micro' : 'reel';
    
    return { defaultCA, defaultCharges, defaultRegime, caSource, chargesSource, previousYear };
  }, []);
};

export default function Simulateur() {
  const { defaultCA, defaultCharges, defaultRegime, caSource, chargesSource, previousYear } = useDefaultValues();
  
  const [revenus, setRevenus] = useState(defaultCA);
  const [charges, setCharges] = useState(defaultCharges);
  const [regime, setRegime] = useState<'micro' | 'reel'>(defaultRegime);
  const [situationFamiliale, setSituationFamiliale] = useState("'célibataire'");
  const [nombreEnfants, setNombreEnfants] = useState("0 enfant");
  const [secteur, setSecteur] = useState("'S1'");
  const [proportionNonConventionne, setProportionNonConventionne] = useState("25");
  const [dateCreationEntreprise, setDateCreationEntreprise] = useState("01/11/2025");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Track previous superNet for animation
  const [superNetDiff, setSuperNetDiff] = useState<number | null>(null);
  const [showDiffAnimation, setShowDiffAnimation] = useState(false);
  const previousSuperNetRef = useRef<number | null>(null);

  // Load date from profile on mount
  useEffect(() => {
    const profile = getProfile();
    if (profile.dateCreationEntreprise) {
      // Convert from ISO to DD/MM/YYYY
      const date = new Date(profile.dateCreationEntreprise);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      setDateCreationEntreprise(`${day}/${month}/${year}`);
    }
  }, []);

  const revenusBruts = parseFloat(revenus) || 0;
  const chargesAnnuelles = parseFloat(charges) || 0;

  // Check if micro-BNC is allowed
  const isMicroAllowed = revenusBruts <= MICRO_BNC_LIMIT;

  // Auto-switch to réel if CA exceeds limit
  useEffect(() => {
    if (regime === 'micro' && !isMicroAllowed) {
      setRegime('reel');
      toast.warning(`Le régime Micro-BNC n'est pas autorisé au-delà de ${MICRO_BNC_LIMIT.toLocaleString('fr-FR')} € de CA`);
    }
  }, [revenusBruts, regime, isMicroAllowed]);

  // Auto-calculate with debounce when parameters change
  useEffect(() => {
    if (revenusBruts <= 0) return;
    
    const timeoutId = setTimeout(() => {
      simuler();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revenusBruts, chargesAnnuelles, regime, situationFamiliale, nombreEnfants, secteur, proportionNonConventionne, dateCreationEntreprise]);

  const formatCurrency = (value: number) => 
    value.toLocaleString('fr-FR', { maximumFractionDigits: 0 });

  const simuler = useCallback(async () => {
    if (revenusBruts <= 0) {
      toast.error("Veuillez saisir un montant de revenus valide");
      return;
    }

    if (regime === 'micro' && !isMicroAllowed) {
      toast.error(`Le régime Micro-BNC n'est pas autorisé au-delà de ${MICRO_BNC_LIMIT.toLocaleString('fr-FR')} € de CA`);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Build situation object based on secteur
    const situation: Record<string, string> = {
      "entreprise . activité . nature . libérale . réglementée": "oui",
      "dirigeant . indépendant . PL . métier": "'santé . médecin'",
      "dirigeant . indépendant . PL . métier . santé . médecin . secteur": secteur,
      "entreprise . imposition . régime . micro-entreprise": regime === 'micro' ? "oui" : "non",
      "entreprise . date de création": dateCreationEntreprise,
      "entreprise . activités . saisonnière": "non",
      "entreprise . activité . nature": "'libérale'",
      "entreprise . catégorie juridique": "'EI'",
      "entreprise . imposition": "'IR'",
      "entreprise . catégorie juridique . EI . auto-entrepreneur": "non",
      "date": "oui",
      "dirigeant . indépendant . PL . CARMF . en retraite": "non",
      "dirigeant . exonérations . ACRE": "non",
      "impôt . méthode de calcul": "'barème standard'",
      "impôt . foyer fiscal . enfants à charge": nombreEnfants,
      "impôt . foyer fiscal . situation de famille": situationFamiliale,
      "impôt . foyer fiscal . revenu imposable . autres revenus imposables": "0 €/an",
      "dirigeant . indépendant . cotisations facultatives": "non",
      "situation personnelle . RSA": "non",
      "dirigeant . indépendant . PL . CNAVPL . exonération incapacité": "non",
      "dirigeant . indépendant . cotisations et contributions . exonérations . pension invalidité": "non",
      "situation personnelle . domiciliation fiscale à l'étranger": "non",
      "dirigeant . indépendant . PL . PAMC . IJSS": "0 €/an",
      "entreprise . chiffre d'affaires": `${revenusBruts} €/an`,
      "entreprise . charges": regime === 'reel' ? `${chargesAnnuelles} €/an` : "0 €/an",
    };

    // Only add proportion for S2
    if (secteur === "'S2'") {
      situation["dirigeant . indépendant . PL . PAMC . proportion recette activité non conventionnée"] = `${proportionNonConventionne}%`;
    } else if (secteur === "'S1'") {
      situation["dirigeant . indépendant . PL . PAMC . proportion recette activité non conventionnée"] = "0%";
    }
    // For "non conventionné", don't add this parameter at all

    const body = {
      situation,
      expressions: [
        "dirigeant . rémunération . net",
        "dirigeant . rémunération . impôt",
        "dirigeant . rémunération . net . après impôt",
        "dirigeant . indépendant . cotisations et contributions",
        "dirigeant . indépendant . PL . cotisations Urssaf",
        "dirigeant . indépendant . PL . cotisations caisse de retraite",
        "dirigeant . indépendant . PL . PAMC . participation CPAM",
      ]
    };

    const fetchPromise = fetch(
      'https://mon-entreprise.urssaf.fr/api/v1/evaluate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    ).then(async (response) => {
      const json = await response.json();

      if (json.situationError) {
        throw new Error(json.situationError.message);
      }

      const values = json.evaluate.map(({ nodeValue }: { nodeValue: number }) => nodeValue);
      
      const newSuperNet = values[2] || 0;
      
      // Calculate diff for animation
      if (previousSuperNetRef.current !== null && previousSuperNetRef.current !== newSuperNet) {
        const diff = newSuperNet - previousSuperNetRef.current;
        setSuperNetDiff(diff);
        setShowDiffAnimation(true);
        
        // Hide animation after it completes
        setTimeout(() => {
          setShowDiffAnimation(false);
          setSuperNetDiff(null);
        }, 1500);
      }
      
      previousSuperNetRef.current = newSuperNet;
      
      setResults({
        remunerationNette: values[0] || 0,
        impot: values[1] || 0,
        superNet: newSuperNet,
        cotisationsTotal: values[3] || 0,
        cotisationsUrssaf: values[4] || 0,
        cotisationsRetraite: values[5] || 0,
        participationCpam: values[6] || 0,
      });

      return newSuperNet;
    });

    toast.promise(fetchPromise, {
      loading: 'Calcul en cours via l\'API URSSAF...',
      success: (superNet) => `Super-Net: ${formatCurrency(superNet)} €`,
      error: (err) => {
        const message = err instanceof Error ? err.message : "Erreur lors de la simulation";
        setError(message);
        return message;
      },
    });

    try {
      await fetchPromise;
    } catch {
      // Error already handled in toast.promise
    } finally {
      setIsLoading(false);
    }
  }, [revenusBruts, chargesAnnuelles, regime, situationFamiliale, nombreEnfants, secteur, proportionNonConventionne, dateCreationEntreprise, isMicroAllowed]);

  const tauxGlobal = results && revenusBruts > 0 
    ? ((revenusBruts - results.superNet) / revenusBruts * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Simulateur Super-Net</h1>
        <p className="text-muted-foreground">
          Estimez ce qu'il vous reste après cotisations et impôts (API URSSAF officielle)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Paramètres
            </h2>

            {/* Régime */}
            <div className="space-y-3">
              <Label>Régime fiscal</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => isMicroAllowed && setRegime('micro')}
                  disabled={!isMicroAllowed}
                  className={cn(
                    'p-4 rounded-xl border-2 text-left transition-all',
                    regime === 'micro' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-muted-foreground/30',
                    !isMicroAllowed && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <p className="font-semibold">Micro-BNC</p>
                  <p className="text-sm text-muted-foreground">Abattement 34%</p>
                  {!isMicroAllowed && (
                    <p className="text-xs text-destructive mt-1">CA max: {MICRO_BNC_LIMIT.toLocaleString('fr-FR')} €</p>
                  )}
                </button>
                <button
                  onClick={() => setRegime('reel')}
                  className={cn(
                    'p-4 rounded-xl border-2 text-left transition-all',
                    regime === 'reel' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-muted-foreground/30'
                  )}
                >
                  <p className="font-semibold">Réel</p>
                  <p className="text-sm text-muted-foreground">Frais réels</p>
                </button>
              </div>
            </div>

            {/* Secteur */}
            <div className="space-y-2">
              <Label>Sur quel secteur êtes-vous conventionné ?</Label>
              <Select value={secteur} onValueChange={setSecteur}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTEUR.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Proportion non conventionnée (only for S2) */}
            {secteur === "'S2'" && (
              <div className="space-y-2">
                <Label htmlFor="proportion">
                  Proportion recette activité non conventionnée (%)
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 ml-1 text-muted-foreground inline" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Pourcentage de vos recettes provenant d'activités non conventionnées</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="proportion"
                  type="number"
                  min="0"
                  max="100"
                  value={proportionNonConventionne}
                  onChange={(e) => setProportionNonConventionne(e.target.value)}
                  placeholder="25"
                />
              </div>
            )}

            {/* Revenus */}
            <div className="space-y-2">
              <Label htmlFor="revenus">
                Chiffre d'affaires annuel (€)
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 ml-1 text-muted-foreground inline" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total des honoraires encaissés sur l'année</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="revenus"
                type="number"
                value={revenus}
                onChange={(e) => setRevenus(e.target.value)}
                placeholder="50000"
              />
              {/* Source indicator */}
              <p className="text-xs text-muted-foreground">
                {caSource === 'virements' && `📥 Basé sur les virements reçus en ${previousYear}`}
                {caSource === 'honoraires' && `📋 Basé sur les honoraires nets de ${previousYear}`}
                {caSource === 'default' && `ℹ️ Valeur par défaut (aucune donnée ${previousYear})`}
              </p>
              {regime === 'micro' && revenusBruts > 0 && (
                <p className={cn(
                  "text-xs",
                  isMicroAllowed ? "text-muted-foreground" : "text-destructive"
                )}>
                  {isMicroAllowed 
                    ? `Limite Micro-BNC: ${MICRO_BNC_LIMIT.toLocaleString('fr-FR')} €`
                    : `CA supérieur à la limite Micro-BNC (${MICRO_BNC_LIMIT.toLocaleString('fr-FR')} €)`
                  }
                </p>
              )}
            </div>

            {/* Charges (only for réel) */}
            {regime === 'reel' && (
              <div className="space-y-2">
                <Label htmlFor="charges">
                  Charges annuelles (€)
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 ml-1 text-muted-foreground inline" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Frais professionnels déductibles</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="charges"
                  type="number"
                  value={charges}
                  onChange={(e) => setCharges(e.target.value)}
                  placeholder="5000"
                />
                <p className="text-xs text-muted-foreground">
                  {chargesSource === 'charges' 
                    ? `📊 Basé sur les charges déductibles de ${previousYear}`
                    : `ℹ️ Valeur par défaut (aucune charge ${previousYear})`
                  }
                </p>
              </div>
            )}

            {/* Situation familiale */}
            <div className="space-y-2">
              <Label>Quelle est votre situation familiale ?</Label>
              <Select value={situationFamiliale} onValueChange={setSituationFamiliale}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SITUATION_FAMILIALE.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Enfants */}
            <div className="space-y-2">
              <Label>Combien d'enfants sont à charge du foyer fiscal ?</Label>
              <Select value={nombreEnfants} onValueChange={setNombreEnfants}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOMBRE_ENFANTS.map(e => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Simulate Button */}
            <Button 
              onClick={simuler} 
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Calcul en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Calculer le Super-Net
                </>
              )}
            </Button>
          </div>

          {/* Warning */}
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-warning mb-1">Source officielle</p>
                <p className="text-muted-foreground">
                  Ce simulateur utilise l'API officielle de l'URSSAF (mon-entreprise.urssaf.fr).
                  Les résultats restent indicatifs, consultez un expert-comptable pour une analyse personnalisée.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {!results && !error && (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Renseignez vos paramètres puis cliquez sur "Calculer le Super-Net"
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
              <p className="text-destructive font-medium">{error}</p>
            </div>
          )}

          {results && (
            <>
              {/* Super Net Card */}
              <div className="rounded-2xl gradient-primary p-6 text-primary-foreground relative overflow-hidden">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-primary-foreground/20">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div className="relative">
                    <p className="text-primary-foreground/80">Super-Net annuel</p>
                    <div className="flex items-center gap-2">
                      <p className="text-3xl font-bold">{formatCurrency(results.superNet)} €</p>
                      
                      {/* Diff animation */}
                      {showDiffAnimation && superNetDiff !== null && (
                        <div 
                          className={cn(
                            "absolute -right-24 top-1/2 -translate-y-1/2 flex items-center gap-1 font-bold text-lg whitespace-nowrap",
                            "animate-diff-fly drop-shadow-lg",
                            superNetDiff > 0 
                              ? "text-success-foreground [text-shadow:_0_0_10px_hsl(var(--success))]" 
                              : "text-destructive-foreground [text-shadow:_0_0_10px_hsl(var(--destructive))]"
                          )}
                        >
                          {superNetDiff > 0 ? (
                            <TrendingUp className="w-5 h-5" />
                          ) : (
                            <TrendingDown className="w-5 h-5" />
                          )}
                          <span>
                            {superNetDiff > 0 ? '+' : ''}{formatCurrency(superNetDiff)} €
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-primary-foreground/20">
                  <span className="text-primary-foreground/80">Taux de prélèvements</span>
                  <span className="text-xl font-semibold">{tauxGlobal.toFixed(1)}%</span>
                </div>
              </div>

              {/* Breakdown */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-semibold mb-4">Détail du calcul</h3>
                <div className="space-y-4">
                  <div className="flex justify-between py-2">
                    <span>Chiffre d'affaires</span>
                    <span className="font-semibold">{formatCurrency(revenusBruts)} €</span>
                  </div>
                  {regime === 'reel' && (
                    <div className="flex justify-between py-2 text-muted-foreground">
                      <span>Charges déductibles</span>
                      <span>- {formatCurrency(chargesAnnuelles)} €</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 text-destructive border-t border-border">
                    <span className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4" />
                      Cotisations et contributions
                    </span>
                    <span>- {formatCurrency(results.cotisationsTotal)} €</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>Rémunération nette</span>
                    <span className="font-semibold">{formatCurrency(results.remunerationNette)} €</span>
                  </div>
                  <div className="flex justify-between py-2 text-destructive">
                    <span className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4" />
                      Impôt sur le revenu
                    </span>
                    <span>- {formatCurrency(results.impot)} €</span>
                  </div>
                  <div className="flex justify-between py-3 border-t-2 border-border font-bold text-lg">
                    <span>Super-Net</span>
                    <span className="text-success">{formatCurrency(results.superNet)} €</span>
                  </div>
                </div>
              </div>

              {/* Cotisations breakdown */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-semibold mb-4">Détail des cotisations</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Cotisations URSSAF</span>
                    <span className="text-destructive">- {formatCurrency(results.cotisationsUrssaf)} €</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Cotisations retraite (CARMF)</span>
                    <span className="text-destructive">- {formatCurrency(results.cotisationsRetraite)} €</span>
                  </div>
                  {results.participationCpam > 0 && (
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Participation CPAM</span>
                      <span className="text-success">+ {formatCurrency(results.participationCpam)} €</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-t border-border font-semibold">
                    <span>Total cotisations</span>
                    <span className="text-destructive">- {formatCurrency(results.cotisationsTotal)} €</span>
                  </div>
                </div>
              </div>

              {/* Monthly breakdown */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-semibold mb-4">Équivalent mensuel</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Rémunération nette</p>
                    <p className="text-xl font-bold">{formatCurrency(results.remunerationNette / 12)} €</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-success/10">
                    <p className="text-sm text-muted-foreground">Super-Net</p>
                    <p className="text-xl font-bold text-success">{formatCurrency(results.superNet / 12)} €</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}