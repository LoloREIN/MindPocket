import { type ItemStatus } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: ItemStatus;
  showIcon?: boolean;
}

const statusConfig: Record<
  ItemStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }
> = {
  PENDING_DOWNLOAD: {
    label: 'Queued',
    variant: 'secondary',
    icon: <Clock className="h-3 w-3" />,
  },
  MEDIA_STORED: {
    label: 'Downloaded',
    variant: 'outline',
    icon: <Clock className="h-3 w-3" />,
  },
  TRANSCRIBING: {
    label: 'Transcribing audio…',
    variant: 'default',
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  ENRICHING: {
    label: 'Understanding content…',
    variant: 'default',
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  COMPLETED: {
    label: 'Completed',
    variant: 'outline',
    icon: <CheckCircle className="h-3 w-3 text-green-500" />,
  },
  READY: {
    label: 'Ready',
    variant: 'outline',
    icon: <CheckCircle className="h-3 w-3 text-green-500" />,
  },
  ERROR: {
    label: 'Processing error',
    variant: 'destructive',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  ENRICH_ERROR: {
    label: 'AI error',
    variant: 'destructive',
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

export function StatusBadge({ status, showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className="gap-1">
      {showIcon && config.icon}
      {config.label}
    </Badge>
  );
}
