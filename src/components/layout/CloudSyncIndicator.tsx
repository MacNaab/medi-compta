/* eslint-disable react-hooks/exhaustive-deps */
import { Cloud, CloudOff, Loader2, CheckCircle2, AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import { useCloudSync, setGlobalSyncCallback } from '@/hooks/use-cloud-sync';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { processQueue, getQueueCount, clearQueue } from '@/lib/offlineQueue';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { syncWithCloud } from '@/lib/cloudSync';

export function CloudSyncIndicator() {
  const { user } = useAuth();
  const { 
    isSyncing, 
    lastSyncTime, 
    error, 
    failedOperations,
    queuedOperations,
    isOnline,
    startSync, 
    endSync, 
    clearError,
    clearFailedOperations,
    refreshQueue,
  } = useCloudSync();
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const wasOffline = useRef(!navigator.onLine);

  // Show toast on error
  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur de synchronisation",
        description: error,
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRetry}
            className="border-destructive-foreground text-destructive-foreground hover:bg-destructive-foreground hover:text-destructive"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Réessayer
          </Button>
        ),
      });
    }
  }, [error, toast]);

  // Auto-process queue when coming back online
  useEffect(() => {
    if (!user) return;
    
    // If we were offline and now we're online, process the queue
    if (wasOffline.current && isOnline) {
      const queueCount = getQueueCount();
      if (queueCount > 0) {
        toast({
          title: "Connexion rétablie",
          description: `Synchronisation de ${queueCount} opération(s) en attente...`,
        });
        handleProcessQueue();
      }
    }
    wasOffline.current = !isOnline;
  }, [isOnline, user]);

  // Connect the global sync notifier to the React context
  useEffect(() => {
    setGlobalSyncCallback((syncing, errorMsg) => {
      if (syncing) {
        startSync();
      } else {
        endSync(!errorMsg, errorMsg);
        if (!errorMsg) {
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 2000);
        }
      }
    });

    return () => setGlobalSyncCallback(null);
  }, [startSync, endSync]);

  const handleProcessQueue = useCallback(async () => {
    if (isProcessingQueue || !user) return;
    
    setIsProcessingQueue(true);
    try {
      const result = await processQueue();
      refreshQueue();
      
      if (result.success > 0) {
        toast({
          title: "Synchronisation terminée",
          description: `${result.success} opération(s) synchronisée(s) avec succès.`,
        });
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }
      
      if (result.failed > 0) {
        toast({
          variant: "destructive",
          title: "Erreurs de synchronisation",
          description: `${result.failed} opération(s) ont échoué après plusieurs tentatives.`,
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de traiter la file d'attente.",
      });
    } finally {
      setIsProcessingQueue(false);
    }
  }, [isProcessingQueue, user, refreshQueue, toast]);

  const handleRetry = useCallback(async () => {
    if (!user || isRetrying) return;
    
    setIsRetrying(true);
    clearError();
    
    try {
      const result = await syncWithCloud(user.id);
      
      if (result.success) {
        clearFailedOperations();
        toast({
          title: "Synchronisation réussie",
          description: "Toutes les données ont été synchronisées avec le cloud.",
        });
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      } else {
        toast({
          variant: "destructive",
          title: "Échec de la synchronisation",
          description: result.error || "Une erreur est survenue lors de la synchronisation.",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de se reconnecter au cloud.",
      });
    } finally {
      setIsRetrying(false);
      setPopoverOpen(false);
    }
  }, [user, isRetrying, clearError, clearFailedOperations, toast]);

  // Don't show if not logged in
  if (!user) return null;

  const hasError = error || failedOperations.length > 0;
  const hasQueuedOps = queuedOperations.length > 0;
  const isOffline = !isOnline;

  const getTooltipContent = () => {
    if (isOffline) {
      return hasQueuedOps 
        ? `Hors ligne • ${queuedOperations.length} opération(s) en attente`
        : 'Hors ligne';
    }
    if (hasQueuedOps) return `${queuedOperations.length} opération(s) en attente de sync`;
    if (hasError) return 'Cliquer pour voir les erreurs';
    if (isSyncing || isRetrying || isProcessingQueue) return 'Synchronisation en cours...';
    if (showSuccess) return 'Synchronisé !';
    if (lastSyncTime) {
      return `Dernière sync: ${lastSyncTime.toLocaleTimeString('fr-FR')}`;
    }
    return 'Connecté au cloud';
  };

  const getIcon = () => {
    if (isOffline) {
      return (
        <div className="relative">
          <CloudOff className="h-4 w-4 text-muted-foreground" />
          {hasQueuedOps && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-white">
              {queuedOperations.length > 9 ? '9+' : queuedOperations.length}
            </span>
          )}
        </div>
      );
    }
    if (hasQueuedOps && !isProcessingQueue) {
      return (
        <div className="relative">
          <Cloud className="h-4 w-4 text-amber-500" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-white">
            {queuedOperations.length > 9 ? '9+' : queuedOperations.length}
          </span>
        </div>
      );
    }
    if (hasError) {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
    if (isSyncing || isRetrying || isProcessingQueue) {
      return (
        <div className="relative">
          <Cloud className="h-4 w-4 text-primary" />
          <Loader2 className="h-3 w-3 text-primary absolute -bottom-1 -right-1 animate-spin" />
        </div>
      );
    }
    if (showSuccess) {
      return (
        <div className="relative">
          <Cloud className="h-4 w-4 text-primary" />
          <CheckCircle2 className="h-3 w-3 text-primary absolute -bottom-1 -right-1" />
        </div>
      );
    }
    return <Cloud className="h-4 w-4 text-muted-foreground" />;
  };

  const indicator = (
    <div
      className={cn(
        "flex items-center justify-center w-8 h-8 rounded-md transition-colors cursor-pointer",
        isOffline && "bg-muted",
        hasQueuedOps && !isOffline && "bg-amber-500/10",
        hasError && !hasQueuedOps && "bg-destructive/10",
        (isSyncing || isRetrying || isProcessingQueue) && !hasError && !hasQueuedOps && "bg-primary/10",
        showSuccess && !hasError && !hasQueuedOps && "bg-primary/10"
      )}
    >
      {getIcon()}
    </div>
  );

  // Show popover for offline mode with queued operations
  if (isOffline && hasQueuedOps) {
    return (
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          {indicator}
        </PopoverTrigger>
        <PopoverContent className="w-72" align="end">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <WifiOff className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="space-y-1">
                <h4 className="font-medium text-sm">Mode hors-ligne</h4>
                <p className="text-xs text-muted-foreground">
                  {queuedOperations.length} opération(s) en attente de synchronisation.
                  Elles seront envoyées automatiquement quand la connexion sera rétablie.
                </p>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground border-t pt-2">
              <p className="font-medium mb-1">En attente:</p>
              <ul className="space-y-0.5">
                {queuedOperations.slice(0, 3).map(op => (
                  <li key={op.id} className="flex items-center gap-1">
                    <span className="capitalize">{op.type === 'create' ? 'Créer' : op.type === 'update' ? 'Modifier' : 'Supprimer'}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="capitalize">{op.entity}</span>
                  </li>
                ))}
                {queuedOperations.length > 3 && (
                  <li className="text-muted-foreground">
                    +{queuedOperations.length - 3} autre(s)
                  </li>
                )}
              </ul>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => {
                clearQueue();
                refreshQueue();
                setPopoverOpen(false);
                toast({
                  title: "File d'attente vidée",
                  description: "Les opérations en attente ont été supprimées.",
                });
              }}
            >
              Vider la file d'attente
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Show popover for queued operations while online
  if (hasQueuedOps && !isOffline) {
    return (
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          {indicator}
        </PopoverTrigger>
        <PopoverContent className="w-72" align="end">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Cloud className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <h4 className="font-medium text-sm">Opérations en attente</h4>
                <p className="text-xs text-muted-foreground">
                  {queuedOperations.length} opération(s) à synchroniser avec le cloud.
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => {
                  clearQueue();
                  refreshQueue();
                  setPopoverOpen(false);
                }}
              >
                Ignorer
              </Button>
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => {
                  handleProcessQueue();
                  setPopoverOpen(false);
                }}
                disabled={isProcessingQueue}
              >
                {isProcessingQueue ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Sync...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Synchroniser
                  </>
                )}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // If there's an error, show popover with retry option
  if (hasError) {
    return (
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          {indicator}
        </PopoverTrigger>
        <PopoverContent className="w-72" align="end">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div className="space-y-1">
                <h4 className="font-medium text-sm">Erreur de synchronisation</h4>
                <p className="text-xs text-muted-foreground">
                  {error || `${failedOperations.length} opération(s) en échec`}
                </p>
              </div>
            </div>
            
            {failedOperations.length > 0 && (
              <div className="text-xs text-muted-foreground border-t pt-2">
                <p className="font-medium mb-1">Opérations en attente:</p>
                <ul className="space-y-0.5">
                  {failedOperations.slice(0, 3).map(op => (
                    <li key={op.id} className="flex items-center gap-1">
                      <span className="capitalize">{op.type}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="capitalize">{op.entity}</span>
                    </li>
                  ))}
                  {failedOperations.length > 3 && (
                    <li className="text-muted-foreground">
                      +{failedOperations.length - 3} autre(s)
                    </li>
                  )}
                </ul>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => {
                  clearError();
                  clearFailedOperations();
                  setPopoverOpen(false);
                }}
              >
                Ignorer
              </Button>
              <Button 
                size="sm" 
                className="flex-1"
                onClick={handleRetry}
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Sync...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Réessayer
                  </>
                )}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Normal state - just show tooltip
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {indicator}
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">{getTooltipContent()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
