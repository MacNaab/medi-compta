import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/hooks/use-auth";
import { CloudSyncProvider } from "@/hooks/use-cloud-sync";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Cabinets from "./pages/Cabinets";
import Calendrier from "./pages/Calendrier";
import Historique from "./pages/Historique";
import Paiements from "./pages/Paiements";
import Revenus from "./pages/Revenus";
import Simulateur from "./pages/Simulateur";
import Ressources from "./pages/Ressources";
import Parametres from "./pages/Parametres";
import Factures from "./pages/Factures";
import Charges from "./pages/Charges";
import DeclarationFiscale from "./pages/DeclarationFiscale";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <CloudSyncProvider>
          <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/cabinets" element={<Cabinets />} />
              <Route path="/calendrier" element={<Calendrier />} />
              <Route path="/historique" element={<Historique />} />
              <Route path="/paiements" element={<Paiements />} />
              <Route path="/revenus" element={<Revenus />} />
              <Route path="/simulateur" element={<Simulateur />} />
              <Route path="/factures" element={<Factures />} />
              <Route path="/charges" element={<Charges />} />
              <Route path="/declaration-fiscale" element={<DeclarationFiscale />} />
              <Route path="/ressources" element={<Ressources />} />
              <Route path="/parametres" element={<Parametres />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
          </TooltipProvider>
        </CloudSyncProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
