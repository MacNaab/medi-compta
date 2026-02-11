import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Cloud, LogIn, LogOut, RefreshCw, Download, Upload, Trash2, AlertTriangle, Check, Loader2, Mail, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { useCloudProfile } from '@/hooks/use-cloud-profile';
import { syncWithCloud, pushLocalToCloud, pullFromCloud, clearLocalData } from '@/lib/cloudSync';
import { Checkbox } from '@/components/ui/checkbox';
import { z } from 'zod';

const emailSchema = z.string().email('Format email invalide');
const passwordSchema = z.string().min(6, 'Mot de passe minimum 6 caractères');

export function CloudSection() {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const { refetch: refetchProfile } = useCloudProfile();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [clearLocalBeforeSync, setClearLocalBeforeSync] = useState(false);
  const [syncOnLogin, setSyncOnLogin] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const validateInputs = (includeFullName = false) => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (includeFullName && !fullName.trim()) {
        setAuthError('Le nom est requis');
        return false;
      }
      setAuthError(null);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setAuthError(error.errors[0].message);
      }
      return false;
    }
  };

  const handleSignIn = async () => {
    if (!validateInputs()) return;
    
    setIsLoading(true);
    setAuthError(null);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setAuthError('Email ou mot de passe incorrect');
      } else if (error.message.includes('Email not confirmed')) {
        setAuthError('Veuillez confirmer votre email');
      } else {
        setAuthError(error.message);
      }
      setIsLoading(false);
    } else {
      toast.success('Connexion réussie');
      setEmail('');
      setPassword('');
      
      // Get the user from the session for sync
      const { data: { session } } = await supabase.auth.getSession();
      
      if (syncOnLogin && session?.user) {
        setIsSyncing(true);
        const result = await syncWithCloud(session.user.id, false);
        if (result.success) {
          toast.success(`Synchronisation réussie ! ${result.stats?.lieuxSynced || 0} cabinets, ${result.stats?.journeesSynced || 0} journées.`);
        }
        setIsSyncing(false);
      }
      
      // Refresh profile to update the display name
      await refetchProfile();
      
      setIsLoading(false);
      
      if (syncOnLogin) {
        window.location.reload();
      }
    }
  };

  const handleSignUp = async () => {
    if (!validateInputs(true)) return;
    
    setIsLoading(true);
    setAuthError(null);
    
    const { error } = await signUp(email, password, fullName);
    
    if (error) {
      if (error.message.includes('User already registered')) {
        setAuthError('Un compte existe déjà avec cet email');
      } else {
        setAuthError(error.message);
      }
    } else {
      toast.success('Compte créé avec succès');
      setEmail('');
      setPassword('');
      setFullName('');
    }
    
    setIsLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Déconnexion réussie');
  };

  const handleSync = async () => {
    if (!user) return;
    
    setIsSyncing(true);
    const result = await syncWithCloud(user.id, clearLocalBeforeSync);
    
    if (result.success) {
      toast.success(`Synchronisation réussie ! ${result.stats?.lieuxSynced || 0} cabinets, ${result.stats?.journeesSynced || 0} journées synchronisées.`);
      // Reload page to reflect changes
      window.location.reload();
    } else {
      toast.error(result.error || 'Erreur de synchronisation');
    }
    
    setIsSyncing(false);
  };

  const handlePushToCloud = async () => {
    if (!user) return;
    
    setIsSyncing(true);
    const result = await pushLocalToCloud(user.id);
    
    if (result.success) {
      toast.success(`Données envoyées au cloud ! ${result.stats?.lieuxSynced || 0} cabinets, ${result.stats?.journeesSynced || 0} journées.`);
    } else {
      toast.error(result.error || 'Erreur lors de l\'envoi');
    }
    
    setIsSyncing(false);
  };

  const handlePullFromCloud = async () => {
    if (!user) return;
    
    setIsSyncing(true);
    const result = await pullFromCloud(user.id);
    
    if (result.success) {
      toast.success(`Données récupérées du cloud ! ${result.stats?.lieuxSynced || 0} cabinets, ${result.stats?.journeesSynced || 0} journées.`);
      window.location.reload();
    } else {
      toast.error(result.error || 'Erreur lors de la récupération');
    }
    
    setIsSyncing(false);
  };

  const handleClearLocalAndPull = async () => {
    if (!user) return;
    
    setIsSyncing(true);
    clearLocalData();
    const result = await pullFromCloud(user.id);
    
    if (result.success) {
      toast.success('Données locales effacées et remplacées par le cloud');
      window.location.reload();
    } else {
      toast.error(result.error || 'Erreur lors de la récupération');
    }
    
    setIsSyncing(false);
  };

  if (authLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-lg bg-primary/10">
          <Cloud className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Mode Cloud</h2>
          <p className="text-sm text-muted-foreground">
            {user ? 'Synchronisez vos données' : 'Connectez-vous pour synchroniser'}
          </p>
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm text-success font-medium">Connecté</span>
          </div>
        )}
      </div>

      {!user ? (
        // Login/Signup Forms
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Connexion</TabsTrigger>
            <TabsTrigger value="signup">Inscription</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="login-password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Mot de passe
              </Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            
            {authError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                {authError}
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sync-on-login"
                checked={syncOnLogin}
                onCheckedChange={(checked) => setSyncOnLogin(checked === true)}
              />
              <Label htmlFor="sync-on-login" className="text-sm font-normal cursor-pointer">
                Synchroniser les données à la connexion
              </Label>
            </div>
            
            <Button 
              onClick={handleSignIn} 
              disabled={isLoading || isSyncing}
              className="w-full"
            >
              {isLoading || isSyncing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4 mr-2" />
              )}
              {isSyncing ? 'Synchronisation...' : 'Se connecter'}
            </Button>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Nom complet
              </Label>
              <Input
                id="signup-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Jean Dupont"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="signup-email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="signup-password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Mot de passe
              </Label>
              <Input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <p className="text-xs text-muted-foreground">Minimum 6 caractères</p>
            </div>
            
            {authError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                {authError}
              </div>
            )}
            
            <Button 
              onClick={handleSignUp} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Créer un compte
            </Button>
          </TabsContent>
        </Tabs>
      ) : (
        // Connected state - Sync options
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{user.email}</p>
              <p className="text-sm text-muted-foreground">Compte Cloud actif</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>

          {/* Sync Actions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Synchroniser</p>
                  <p className="text-sm text-muted-foreground">Fusionner local et cloud (le plus récent gagne)</p>
                </div>
              </div>
              <Button onClick={handleSync} disabled={isSyncing}>
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Synchroniser'}
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Upload className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Envoyer vers le Cloud</p>
                  <p className="text-sm text-muted-foreground">Envoyer toutes les données locales</p>
                </div>
              </div>
              <Button variant="outline" onClick={handlePushToCloud} disabled={isSyncing}>
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Envoyer'}
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Récupérer du Cloud</p>
                  <p className="text-sm text-muted-foreground">Ajouter les données cloud au local</p>
                </div>
              </div>
              <Button variant="outline" onClick={handlePullFromCloud} disabled={isSyncing}>
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Récupérer'}
              </Button>
            </div>

            {/* Clear and Pull option */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-warning/5 border border-warning/20">
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-warning" />
                <div>
                  <p className="font-medium">Remplacer par le Cloud</p>
                  <p className="text-sm text-muted-foreground">Supprimer le local et récupérer du cloud</p>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={isSyncing}>
                    {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Remplacer'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-warning" />
                      Remplacer les données locales ?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action supprimera <strong>toutes vos données locales</strong> et les remplacera par les données du cloud.
                      Utilisez cette option si vous changez de compte ou si vous voulez récupérer vos données sur un nouvel appareil.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearLocalAndPull} className="bg-warning text-warning-foreground hover:bg-warning/90">
                      Remplacer tout
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center pt-2">
            💡 La synchronisation fusionne automatiquement vos données en gardant la version la plus récente.
          </p>
        </div>
      )}
    </div>
  );
}
