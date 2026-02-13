import { useCallback, useEffect, useState, useRef } from 'react';
import { getReminders, updateProfile, getProfile, Reminder } from '@/lib/storage';
import { differenceInDays, parseISO } from 'date-fns';
import { toast } from 'sonner';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const toastsShownRef = useRef(false);

  useEffect(() => {
    setIsSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      updateProfile({ notificationsEnabled: result === 'granted' });
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') return null;
    
    try {
      return new Notification(title, {
        icon: '/favicon.ico',
        ...options,
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }, [isSupported, permission]);

  const checkUpcomingReminders = useCallback(() => {
    if (permission !== 'granted') return;
    
    const reminders = getReminders();
    const today = new Date();
    
    reminders.forEach((reminder) => {
      if (!reminder.notificationsEnabled || !reminder.dueDate) return;
      if (reminder.completedAt) return;
      
      const dueDate = parseISO(reminder.dueDate);
      const daysUntilDue = differenceInDays(dueDate, today);
      
      if (daysUntilDue >= 0 && daysUntilDue <= reminder.notifyDaysBefore) {
        const lastNotified = localStorage.getItem(`notified-${reminder.id}`);
        const lastNotifiedDate = lastNotified ? parseISO(lastNotified) : null;
        
        // Don't notify more than once per day
        if (lastNotifiedDate && differenceInDays(today, lastNotifiedDate) < 1) return;
        
        sendNotification(`Rappel: ${reminder.title}`, {
          body: daysUntilDue === 0 
            ? `Échéance aujourd'hui!` 
            : `Échéance dans ${daysUntilDue} jour${daysUntilDue > 1 ? 's' : ''}`,
          tag: reminder.id,
        });
        
        localStorage.setItem(`notified-${reminder.id}`, today.toISOString());
      }
    });
  }, [permission, sendNotification]);

  // Show toast notifications for upcoming deadlines (works without browser permission)
  const showUpcomingDeadlineToasts = useCallback(() => {
    // Only show once per session
    if (toastsShownRef.current) return;
    toastsShownRef.current = true;
    
    const reminders = getReminders();
    const today = new Date();
    
    const urgentReminders = reminders.filter((reminder) => {
      if (!reminder.dueDate || reminder.completedAt) return false;
      
      const dueDate = parseISO(reminder.dueDate);
      const daysUntilDue = differenceInDays(dueDate, today);
      
      // Use notifyDaysBefore if set, otherwise default to 14 days
      const urgentThreshold = reminder.notifyDaysBefore || 14;
      return daysUntilDue <= urgentThreshold;
    });
    
    // Show toasts with slight delay between each
    urgentReminders.forEach((reminder, index) => {
      const dueDate = parseISO(reminder.dueDate!);
      const daysUntilDue = differenceInDays(dueDate, today);
      
      setTimeout(() => {
        if (daysUntilDue < 0) {
          toast.error(`⚠️ ${reminder.title}`, {
            description: `En retard de ${Math.abs(daysUntilDue)} jour${Math.abs(daysUntilDue) > 1 ? 's' : ''} !`,
            duration: 8000,
          });
        } else if (daysUntilDue === 0) {
          toast.warning(`📅 ${reminder.title}`, {
            description: `Échéance aujourd'hui !`,
            duration: 8000,
          });
        } else if (daysUntilDue <= 7) {
          toast.warning(`📅 ${reminder.title}`, {
            description: `Échéance dans ${daysUntilDue} jour${daysUntilDue > 1 ? 's' : ''}`,
            duration: 6000,
          });
        } else {
          toast.info(`📅 ${reminder.title}`, {
            description: `Échéance dans ${daysUntilDue} jours`,
            duration: 5000,
          });
        }
      }, index * 1500); // Stagger toasts by 1.5 seconds
    });
  }, []);

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    checkUpcomingReminders,
    showUpcomingDeadlineToasts,
  };
}

// Helper to get next due date for system reminders
export function getNextDueDate(frequency: string, baseMonth?: number): Date {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  switch (frequency) {
    case 'ordre-medecins':
      // Due in January
      if (month >= 1) {
        return new Date(year + 1, 0, 31);
      }
      return new Date(year, 0, 31);
      
    case 'urssaf':
      // Quarterly: end of Apr, Jul, Oct, Jan
      if (month < 3) return new Date(year, 3, 30);
      if (month < 6) return new Date(year, 6, 31);
      if (month < 9) return new Date(year, 9, 31);
      return new Date(year + 1, 0, 31);
      
    case 'carmf':
      // Quarterly: Feb, May, Aug, Nov
      if (month < 1) return new Date(year, 1, 28);
      if (month < 4) return new Date(year, 4, 31);
      if (month < 7) return new Date(year, 7, 31);
      if (month < 10) return new Date(year, 10, 30);
      return new Date(year + 1, 1, 28);
      
    default:
      return now;
  }
}

export function getSystemReminders(): Omit<Reminder, 'id' | 'createdAt'>[] {
  return [
    {
      title: 'Ordre des Médecins',
      description: 'Cotisation annuelle à l\'Ordre des Médecins',
      frequency: 'annuel',
      dueDate: getNextDueDate('ordre-medecins').toISOString(),
      isSystem: true,
      notificationsEnabled: false, // Off by default
      notifyDaysBefore: 14,
    },
    {
      title: 'Déclaration URSSAF',
      description: 'Déclaration trimestrielle des revenus',
      frequency: 'trimestriel',
      dueDate: getNextDueDate('urssaf').toISOString(),
      isSystem: true,
      notificationsEnabled: false, // Off by default
      notifyDaysBefore: 14,
    },
    {
      title: 'Cotisations CARMF',
      description: 'Caisse Autonome de Retraite des Médecins de France',
      frequency: 'trimestriel',
      dueDate: getNextDueDate('carmf').toISOString(),
      isSystem: true,
      notificationsEnabled: false, // Off by default
      notifyDaysBefore: 14,
    },
  ];
}