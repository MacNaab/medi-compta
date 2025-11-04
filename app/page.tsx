// app/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building, Plus, BarChart3, HandCoins } from "lucide-react";

export default function HomePage() {
  return (
    <div className="container mx-auto px-6">
      {/* Hero section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-800 mb-4">
          Suivi des Honoraires Médecin
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Gérez facilement vos déclarations quotidiennes, lieux de travail et
          déclarations URSSAF
        </p>
      </div>

      {/* Cartes de fonctionnalités */}
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Building className="h-8 w-8 text-blue-600 mb-2" />
            <CardTitle>Lieux de travail</CardTitle>
            <CardDescription>
              Gérez vos cabinets et pourcentages de rétrocession
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/lieux">
                <Plus className="h-4 w-4 mr-2" />
                Gérer les lieux
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <BarChart3 className="h-8 w-8 text-green-600 mb-2" />
            <CardTitle>Saisie quotidienne</CardTitle>
            <CardDescription>
              Déclarez vos revenus journaliers par lieu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/saisie">Commencer la saisie</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <HandCoins className="h-8 w-8 text-purple-600 mb-2" />
            <CardTitle>Rapports URSSAF</CardTitle>
            <CardDescription>
              Génération automatique des déclarations trimestrielles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/rapports">Voir les rapports</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
