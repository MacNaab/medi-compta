/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Bell, Calendar, AlertCircle, CheckCircle2, Plus, Trash2, BellRing, BellOff, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  getReminders, 
  saveReminder, 
  updateReminder, 
  deleteReminder, 
  Reminder 
} from '@/lib/storage';
import { useNotifications, getSystemReminders } from '@/hooks/use-notifications';
import { format, parseISO, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { NumberInput } from '../ui/number-input';

type ReminderStatus = 'upcoming' | 'urgent' | 'completed';

interface DisplayReminder extends Reminder {
  status: ReminderStatus;
  daysUntilDue: number | null;
}

const statusConfig = {
  upcoming: {
    icon: Calendar,
    color: 'bg-info/10 text-info border-info/20',
    badge: 'À venir',
    badgeVariant: 'secondary' as const,
  },
  urgent: {
    icon: AlertCircle,
    color: 'bg-warning/10 text-warning border-warning/20',
    badge: 'Urgent',
    badgeVariant: 'destructive' as const,
  },
  completed: {
    icon: CheckCircle2,
    color: 'bg-success/10 text-success border-success/20',
    badge: 'Complété',
    badgeVariant: 'default' as const,
  },
};

const frequencyLabels: Record<string, string> = {
  ponctuel: 'Ponctuel',
  mensuel: 'Mensuel',
  trimestriel: 'Trimestriel',
  annuel: 'Annuel',
};

export function Reminders() {
  const [reminders, setReminders] = useState<DisplayReminder[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<DisplayReminder | null>(null);
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    frequency: 'ponctuel' as const,
    dueDate: '',
    notificationsEnabled: false, // Off by default
    notifyDaysBefore: 7,
  });
  
  const { isSupported, permission, requestPermission, checkUpcomingReminders, showUpcomingDeadlineToasts } = useNotifications();

  const loadReminders = () => {
    const stored = getReminders();
    
    // Initialize system reminders if not present
    const systemReminders = getSystemReminders();
    systemReminders.forEach((sr) => {
      const exists = stored.find(r => r.isSystem && r.title === sr.title);
      if (!exists) {
        const saved = saveReminder(sr);
        stored.push(saved);
      }
    });
    
    // Calculate status for each reminder
    const today = new Date();
    const displayReminders: DisplayReminder[] = stored.map((r) => {
      let status: ReminderStatus = 'upcoming';
      let daysUntilDue: number | null = null;
      
      if (r.completedAt) {
        status = 'completed';
      } else if (r.dueDate) {
        const dueDate = parseISO(r.dueDate);
        daysUntilDue = differenceInDays(dueDate, today);
        
        // Use notifyDaysBefore if set, otherwise default to 14 days
        const urgentThreshold = r.notifyDaysBefore || 14;
        
        if (daysUntilDue <= urgentThreshold && daysUntilDue >= 0) {
          status = 'urgent';
        } else if (daysUntilDue < 0) {
          status = 'urgent';
        }
      }
      
      return { ...r, status, daysUntilDue };
    });
    
    // Sort: urgent first, then upcoming, then completed
    displayReminders.sort((a, b) => {
      const order = { urgent: 0, upcoming: 1, completed: 2 };
      return order[a.status] - order[b.status];
    });
    
    setReminders(displayReminders);
  };

  useEffect(() => {
    loadReminders();
    
    // Always show toast notifications for upcoming deadlines
    showUpcomingDeadlineToasts();
    
    // Check for push notifications on mount if permission granted
    if (permission === 'granted') {
      checkUpcomingReminders();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddReminder = () => {
    if (!newReminder.title.trim()) {
      toast.error('Le titre est obligatoire');
      return;
    }
    
    saveReminder({
      ...newReminder,
      isSystem: false,
      dueDate: newReminder.dueDate || undefined,
    });
    
    setNewReminder({
      title: '',
      description: '',
      frequency: 'ponctuel',
      dueDate: '',
      notificationsEnabled: false, // Off by default
      notifyDaysBefore: 7,
    });
    setIsAddDialogOpen(false);
    loadReminders();
    toast.success('Rappel ajouté');
  };

  const handleEditReminder = () => {
    if (!editingReminder) return;
    if (!editingReminder.title.trim()) {
      toast.error('Le titre est obligatoire');
      return;
    }
    
    updateReminder(editingReminder.id, {
      title: editingReminder.title,
      description: editingReminder.description,
      frequency: editingReminder.frequency,
      dueDate: editingReminder.dueDate || undefined,
      notificationsEnabled: editingReminder.notificationsEnabled,
      notifyDaysBefore: editingReminder.notifyDaysBefore,
    });
    
    setIsEditDialogOpen(false);
    setEditingReminder(null);
    loadReminders();
    toast.success('Rappel modifié');
  };

  const openEditDialog = (reminder: DisplayReminder) => {
    setEditingReminder({ ...reminder });
    setIsEditDialogOpen(true);
  };

  const handleToggleComplete = (reminder: DisplayReminder) => {
    if (reminder.completedAt) {
      updateReminder(reminder.id, { 
        completedAt: undefined,
        completedForPeriod: undefined,
      });
    } else {
      updateReminder(reminder.id, { 
        completedAt: new Date().toISOString(),
        completedForPeriod: format(new Date(), 'yyyy-MM'),
      });
    }
    loadReminders();
    toast.success(reminder.completedAt ? 'Rappel réactivé' : 'Rappel marqué comme complété');
  };

  const handleToggleNotifications = async (reminder: DisplayReminder) => {
    if (!reminder.notificationsEnabled && permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) {
        toast.error(
          'Notifications bloquées par le navigateur',
          {
            description: 'Pour activer les notifications : cliquez sur l\'icône de cadenas 🔒 à gauche de la barre d\'adresse, puis autorisez les notifications pour ce site.',
            duration: 10000,
          }
        );
        return;
      }
    }
    
    updateReminder(reminder.id, { 
      notificationsEnabled: !reminder.notificationsEnabled 
    });
    loadReminders();
    toast.success(reminder.notificationsEnabled ? 'Notifications désactivées' : 'Notifications activées');
  };

  const handleDeleteReminder = (id: string) => {
    deleteReminder(id);
    loadReminders();
    toast.success('Rappel supprimé');
  };

  const handleRequestNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success('Notifications push activées avec succès !');
      checkUpcomingReminders();
    } else {
      toast.error(
        'Notifications bloquées par le navigateur',
        {
          description: 'Pour activer les notifications : cliquez sur l\'icône de cadenas 🔒 à gauche de la barre d\'adresse, puis autorisez les notifications pour ce site.',
          duration: 10000,
        }
      );
    }
  };

  const getDueDateDisplay = (reminder: DisplayReminder) => {
    if (!reminder.dueDate) return frequencyLabels[reminder.frequency] || reminder.frequency;
    
    const dueDate = parseISO(reminder.dueDate);
    const formattedDate = format(dueDate, 'd MMMM yyyy', { locale: fr });
    
    if (reminder.daysUntilDue === null) return formattedDate;
    if (reminder.daysUntilDue < 0) return `En retard (${formattedDate})`;
    if (reminder.daysUntilDue === 0) return `Aujourd'hui`;
    if (reminder.daysUntilDue === 1) return `Demain`;
    return `Dans ${reminder.daysUntilDue} jours`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Rappels & Obligations</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isSupported && permission !== 'granted' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestNotifications}
                className="text-xs"
              >
                <BellRing className="w-4 h-4 mr-1" />
                Activer les notifications
              </Button>
            )}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouveau rappel</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre *</Label>
                    <Input
                      id="title"
                      value={newReminder.title}
                      onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                      placeholder="Ex: Renouvellement assurance"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newReminder.description}
                      onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                      placeholder="Détails supplémentaires..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Fréquence</Label>
                      <Select 
                        value={newReminder.frequency} 
                        onValueChange={(v) => setNewReminder({ ...newReminder, frequency: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ponctuel">Ponctuel</SelectItem>
                          <SelectItem value="mensuel">Mensuel</SelectItem>
                          <SelectItem value="trimestriel">Trimestriel</SelectItem>
                          <SelectItem value="annuel">Annuel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Date d'échéance</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={newReminder.dueDate}
                        onChange={(e) => setNewReminder({ ...newReminder, dueDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notifications</Label>
                      <p className="text-xs text-muted-foreground">
                        Recevoir un rappel {newReminder.notifyDaysBefore} jours avant
                      </p>
                    </div>
                    <Switch
                      checked={newReminder.notificationsEnabled}
                      onCheckedChange={(checked) => setNewReminder({ ...newReminder, notificationsEnabled: checked })}
                    />
                  </div>
                  {newReminder.notificationsEnabled && (
                    <div className="space-y-2">
                      <Label htmlFor="notifyDays">Jours avant l'échéance</Label>
                      <NumberInput
                        id="notifyDays"
                        min={1}
                        max={30}
                        value={newReminder.notifyDaysBefore}
                        onValueChange={(e) => setNewReminder({ ...newReminder, notifyDaysBefore: e || 7 })}
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleAddReminder}>
                    Ajouter
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {reminders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun rappel configuré
          </p>
        ) : (
          reminders.map((reminder) => {
            const config = statusConfig[reminder.status];
            const Icon = config.icon;
            
            return (
              <div
                key={reminder.id}
                className={`p-3 rounded-lg border ${config.color} ${reminder.completedAt ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <Icon className="w-5 h-5 mt-0.5 shrink-0" />
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`font-medium text-foreground ${reminder.completedAt ? 'line-through' : ''}`}>
                          {reminder.title}
                        </h4>
                        <Badge variant={config.badgeVariant} className="text-xs">
                          {config.badge}
                        </Badge>
                        {reminder.isSystem && (
                          <Badge variant="outline" className="text-xs">
                            Système
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{reminder.description}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{frequencyLabels[reminder.frequency] || reminder.frequency}</span>
                        <span>•</span>
                        <span>{getDueDateDisplay(reminder)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(reminder)}
                      title="Modifier"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggleNotifications(reminder)}
                      title={reminder.notificationsEnabled ? 'Désactiver les notifications' : 'Activer les notifications'}
                    >
                      {reminder.notificationsEnabled ? (
                        <BellRing className="w-4 h-4 text-primary" />
                      ) : (
                        <BellOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggleComplete(reminder)}
                      title={reminder.completedAt ? 'Marquer comme non complété' : 'Marquer comme complété'}
                    >
                      <CheckCircle2 className={`w-4 h-4 ${reminder.completedAt ? 'text-success' : 'text-muted-foreground'}`} />
                    </Button>
                    {!reminder.isSystem && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer ce rappel ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible. Le rappel "{reminder.title}" sera définitivement supprimé.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteReminder(reminder.id)}>
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le rappel</DialogTitle>
          </DialogHeader>
          {editingReminder && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Titre *</Label>
                <Input
                  id="edit-title"
                  value={editingReminder.title}
                  onChange={(e) => setEditingReminder({ ...editingReminder, title: e.target.value })}
                  placeholder="Ex: Renouvellement assurance"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingReminder.description || ''}
                  onChange={(e) => setEditingReminder({ ...editingReminder, description: e.target.value })}
                  placeholder="Détails supplémentaires..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-frequency">Fréquence</Label>
                  <Select 
                    value={editingReminder.frequency} 
                    onValueChange={(v) => setEditingReminder({ ...editingReminder, frequency: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ponctuel">Ponctuel</SelectItem>
                      <SelectItem value="mensuel">Mensuel</SelectItem>
                      <SelectItem value="trimestriel">Trimestriel</SelectItem>
                      <SelectItem value="annuel">Annuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-dueDate">Date d'échéance</Label>
                  <Input
                    id="edit-dueDate"
                    type="date"
                    value={editingReminder.dueDate ? editingReminder.dueDate.split('T')[0] : ''}
                    onChange={(e) => setEditingReminder({ ...editingReminder, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Recevoir un rappel {editingReminder.notifyDaysBefore} jours avant
                  </p>
                </div>
                <Switch
                  checked={editingReminder.notificationsEnabled}
                  onCheckedChange={(checked) => setEditingReminder({ ...editingReminder, notificationsEnabled: checked })}
                />
              </div>
              {editingReminder.notificationsEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="edit-notifyDays">Jours avant l'échéance</Label>
                  <NumberInput
                    id="edit-notifyDays"
                    min={1}
                    max={30}
                    value={editingReminder.notifyDaysBefore}
                    onValueChange={(e) => setEditingReminder({ ...editingReminder, notifyDaysBefore: e || 7 })}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditReminder}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}