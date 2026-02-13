import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning';
  className?: string;
}

const variants = {
  default: 'bg-card',
  primary: 'gradient-primary text-primary-foreground',
  success: 'gradient-success text-success-foreground',
  warning: 'bg-warning/10 border-warning/20',
};

const iconVariants = {
  default: 'bg-primary/10 text-primary',
  primary: 'bg-primary-foreground/20 text-primary-foreground',
  success: 'bg-success-foreground/20 text-success-foreground',
  warning: 'bg-warning/20 text-warning',
};

export function StatCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  trend, 
  variant = 'default',
  className 
}: StatCardProps) {
  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl p-5 shadow-card transition-all duration-300 hover:shadow-card-hover',
      variant === 'default' && 'border border-border',
      variants[variant],
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className={cn(
            'text-sm font-medium',
            variant === 'default' ? 'text-muted-foreground' : 'opacity-80'
          )}>
            {title}
          </p>
          <p className="text-2xl lg:text-3xl font-bold tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className={cn(
              'text-sm',
              variant === 'default' ? 'text-muted-foreground' : 'opacity-70'
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1">
              <span className={cn(
                'text-sm font-medium',
                trend.value >= 0 ? 'text-success' : 'text-destructive'
              )}>
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </span>
              <span className={cn(
                'text-xs',
                variant === 'default' ? 'text-muted-foreground' : 'opacity-60'
              )}>
                {trend.label}
              </span>
            </div>
          )}
        </div>
        <div className={cn(
          'p-3 rounded-xl',
          iconVariants[variant]
        )}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
