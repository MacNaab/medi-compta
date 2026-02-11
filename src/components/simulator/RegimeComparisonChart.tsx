import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { BarChart3, Loader2, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface ChartDataPoint {
  ca: number;
  microBNC: number | null;
  reel: number | null;
}

interface RegimeComparisonChartProps {
  chargesAnnuelles: number;
  situationFamiliale: string;
  nombreEnfants: string;
  secteur: string;
  proportionNonConventionne: string;
  dateCreationEntreprise: string;
  currentCA?: number;
}

const MICRO_BNC_LIMIT = 77700;

// CA values to simulate
const CA_STEPS = [20000, 30000, 40000, 50000, 60000, 70000, 77700, 90000, 100000, 120000, 150000];

// Max charges for slider (percentage of max CA)
const MAX_CHARGES = 50000;

export function RegimeComparisonChart({
  chargesAnnuelles: initialCharges,
  situationFamiliale,
  nombreEnfants,
  secteur,
  proportionNonConventionne,
  dateCreationEntreprise,
  currentCA,
}: RegimeComparisonChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [sliderCharges, setSliderCharges] = useState(initialCharges);
  const [displayCharges, setDisplayCharges] = useState(initialCharges);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Build situation object for API call
  const buildSituation = useCallback((ca: number, regime: 'micro' | 'reel', charges: number): Record<string, string> => {
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
      "entreprise . chiffre d'affaires": `${ca} €/an`,
      "entreprise . charges": regime === 'reel' ? `${charges} €/an` : "0 €/an",
    };

    if (secteur === "'S2'") {
      situation["dirigeant . indépendant . PL . PAMC . proportion recette activité non conventionnée"] = `${proportionNonConventionne}%`;
    } else if (secteur === "'S1'") {
      situation["dirigeant . indépendant . PL . PAMC . proportion recette activité non conventionnée"] = "0%";
    }

    return situation;
  }, [secteur, dateCreationEntreprise, nombreEnfants, situationFamiliale, proportionNonConventionne]);

  const fetchSimulation = useCallback(async (ca: number, regime: 'micro' | 'reel', charges: number): Promise<number> => {
    const situation = buildSituation(ca, regime, charges);

    const body = {
      situation,
      expressions: ["dirigeant . rémunération . net . après impôt"]
    };

    const response = await fetch('https://mon-entreprise.urssaf.fr/api/v1/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const json = await response.json();
    if (json.situationError) {
      throw new Error(json.situationError.message);
    }

    return json.evaluate[0]?.nodeValue || 0;
  }, [buildSituation]);

  const loadChartData = useCallback(async (charges: number) => {
    setIsLoading(true);
    
    try {
      const data: ChartDataPoint[] = [];
      
      // Fetch all simulations
      for (const ca of CA_STEPS) {
        const promises: Promise<number | null>[] = [];
        
        // Micro-BNC only if CA <= limit
        if (ca <= MICRO_BNC_LIMIT) {
          promises.push(fetchSimulation(ca, 'micro', charges));
        } else {
          promises.push(Promise.resolve(null));
        }
        
        // Réel always available
        promises.push(fetchSimulation(ca, 'reel', charges));
        
        const [microResult, reelResult] = await Promise.all(promises);
        
        data.push({
          ca,
          microBNC: microResult,
          reel: reelResult,
        });
      }
      
      setChartData(data);
      setDisplayCharges(charges);
      setHasLoaded(true);
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchSimulation]);

  // Handle slider change with debounce
  const handleSliderChange = useCallback((value: number[]) => {
    const newCharges = value[0];
    setSliderCharges(newCharges);
    
    // Debounce the API call
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      if (hasLoaded) {
        loadChartData(newCharges);
      }
    }, 800);
  }, [hasLoaded, loadChartData]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Sync with parent charges when it changes (initial load or external change)
  useEffect(() => {
    setSliderCharges(initialCharges);
  }, [initialCharges]);

  const formatCurrency = (value: number) => 
    value.toLocaleString('fr-FR', { maximumFractionDigits: 0 });

  const formatCAAxis = (value: number) => `${(value / 1000).toFixed(0)}k`;

  // Find crossover point (where Réel becomes better than Micro-BNC)
  const crossoverCA = useMemo(() => {
    for (let i = 1; i < chartData.length; i++) {
      const prev = chartData[i - 1];
      const curr = chartData[i];
      
      if (prev.microBNC !== null && curr.microBNC !== null && 
          prev.reel !== null && curr.reel !== null) {
        // Check if réel becomes better
        if (prev.microBNC >= prev.reel && curr.microBNC < curr.reel) {
          // Linear interpolation to find approximate crossover
          const ratio = (prev.microBNC - prev.reel) / ((curr.reel - curr.microBNC) + (prev.microBNC - prev.reel));
          return Math.round(prev.ca + ratio * (curr.ca - prev.ca));
        }
      }
    }
    return null;
  }, [chartData]);

  // Calculate the Micro-BNC equivalent charges (34% abatement)
  const microBNCEquivalentCharges = useMemo(() => {
    // Micro-BNC gives 34% abatement, so equivalent charges = CA * 0.34
    // We show at what charge level Réel becomes interesting
    return Math.round(MICRO_BNC_LIMIT * 0.34);
  }, []);

  if (!hasLoaded) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Comparaison Micro-BNC vs Réel
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-muted-foreground mb-4">
            Visualisez l'évolution du Super-Net selon votre CA pour les deux régimes
          </p>
          <Button onClick={() => loadChartData(sliderCharges)} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Chargement...
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4 mr-2" />
                Charger le graphique
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Comparaison Micro-BNC vs Réel
        </h3>
        <Button variant="outline" size="sm" onClick={() => loadChartData(sliderCharges)} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Actualiser'
          )}
        </Button>
      </div>

      {/* Charges Slider */}
      <div className="mb-6 p-4 rounded-lg bg-muted/30 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          <Label className="font-medium">Charges annuelles (Réel)</Label>
        </div>
        <div className="space-y-3">
          <Slider
            value={[sliderCharges]}
            onValueChange={handleSliderChange}
            max={MAX_CHARGES}
            min={0}
            step={500}
            className="w-full"
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">0 €</span>
            <div className="text-center">
              <span className="text-lg font-bold text-primary">
                {formatCurrency(sliderCharges)} €
              </span>
              {isLoading && sliderCharges !== displayCharges && (
                <span className="ml-2 text-xs text-muted-foreground">(mise à jour...)</span>
              )}
            </div>
            <span className="text-sm text-muted-foreground">{formatCurrency(MAX_CHARGES)} €</span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Ajustez les charges pour voir l'impact sur le régime Réel
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Recalcul avec {formatCurrency(sliderCharges)} € de charges...</p>
          </div>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="ca" 
                tickFormatter={formatCAAxis}
                className="text-xs fill-muted-foreground"
                label={{ value: 'CA annuel (€)', position: 'insideBottom', offset: -5, className: 'fill-muted-foreground text-xs' }}
              />
              <YAxis 
                tickFormatter={formatCAAxis}
                className="text-xs fill-muted-foreground"
                label={{ value: 'Super-Net (€)', angle: -90, position: 'insideLeft', className: 'fill-muted-foreground text-xs' }}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `${formatCurrency(value)} €`,
                  name === 'microBNC' ? 'Micro-BNC' : 'Réel'
                ]}
                labelFormatter={(ca: number) => `CA: ${formatCurrency(ca)} €`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
              />
              <Legend 
                formatter={(value) => value === 'microBNC' ? 'Micro-BNC' : 'Réel'}
              />
              
              {/* Reference line for Micro-BNC limit */}
              <ReferenceLine 
                x={MICRO_BNC_LIMIT} 
                stroke="hsl(var(--warning))" 
                strokeDasharray="5 5"
                label={{ 
                  value: 'Limite Micro-BNC', 
                  position: 'top',
                  className: 'fill-warning text-xs'
                }}
              />
              
              {/* Current CA indicator */}
              {currentCA && currentCA > 0 && (
                <ReferenceLine 
                  x={currentCA} 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  label={{ 
                    value: 'Votre CA', 
                    position: 'top',
                    className: 'fill-primary text-xs font-semibold'
                  }}
                />
              )}
              
              <Line 
                type="monotone" 
                dataKey="microBNC" 
                stroke="hsl(var(--info))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--info))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
              <Line 
                type="monotone" 
                dataKey="reel" 
                stroke="hsl(var(--success))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          
          {/* Insights */}
          <div className="mt-4 p-4 rounded-lg bg-muted/50 space-y-2">
            <p className="text-sm font-medium">💡 Analyse (avec {formatCurrency(displayCharges)} € de charges)</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                • Le <span className="text-info font-medium">Micro-BNC</span> est limité à {formatCurrency(MICRO_BNC_LIMIT)} € de CA (abattement forfaitaire de 34%)
              </li>
              {crossoverCA ? (
                <li>
                  • Le régime <span className="text-success font-medium">Réel</span> devient plus avantageux à partir de ~{formatCurrency(crossoverCA)} € de CA
                </li>
              ) : displayCharges < microBNCEquivalentCharges ? (
                <li>
                  • Avec vos charges actuelles, le <span className="text-info font-medium">Micro-BNC</span> reste généralement plus avantageux
                </li>
              ) : null}
              {displayCharges === 0 && (
                <li className="text-warning">
                  • ⚠️ Aucune charge déclarée. Essayez d'ajuster le slider pour simuler différents niveaux de charges.
                </li>
              )}
              {displayCharges >= microBNCEquivalentCharges && (
                <li className="text-success">
                  • ✓ Vos charges ({formatCurrency(displayCharges)} €) dépassent l'abattement Micro-BNC équivalent (~{formatCurrency(microBNCEquivalentCharges)} €)
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
