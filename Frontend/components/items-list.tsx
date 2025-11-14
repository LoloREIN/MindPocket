'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, type WellnessItem, type ItemStatus } from '@/lib/api-client';
import { StatusBadge } from '@/components/status-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, ChefHat, Dumbbell, Bookmark, Package } from 'lucide-react';
import Link from 'next/link';

const POLL_INTERVAL = 5000; // 5 seconds
const PROCESSING_STATUSES: ItemStatus[] = ['PENDING_DOWNLOAD', 'MEDIA_STORED', 'TRANSCRIBING', 'ENRICHING'];

const typeIcons = {
  recipe: <ChefHat className="h-4 w-4" />,
  workout: <Dumbbell className="h-4 w-4" />,
  pending: <Bookmark className="h-4 w-4" />,
  other: <Package className="h-4 w-4" />,
};

interface ItemsListProps {
  refreshTrigger?: number;
}

export function ItemsList({ refreshTrigger }: ItemsListProps) {
  const [items, setItems] = useState<WellnessItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchItems = useCallback(async () => {
    try {
      const data = await apiClient.getItems();
      setItems(data);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch items:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems, refreshTrigger]);

  // Polling effect: only poll when there are processing items
  useEffect(() => {
    const hasProcessingItems = items.some(item => 
      PROCESSING_STATUSES.includes(item.status)
    );

    if (!hasProcessingItems) {
      return; // No need to poll
    }

    console.log('🔄 Polling enabled: items are processing');
    const interval = setInterval(() => {
      console.log('🔄 Polling for updates...');
      fetchItems();
    }, POLL_INTERVAL);

    return () => {
      console.log('⏹️  Polling stopped');
      clearInterval(interval);
    };
  }, [items, fetchItems]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p>Failed to load items: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Package className="mx-auto h-12 w-12 mb-4 opacity-20" />
          <p className="text-lg font-medium">No items yet</p>
          <p className="text-sm">Save your first TikTok to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Collection</h2>
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.itemId}>
            <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {typeIcons[item.type]}
                    <CardTitle className="text-lg truncate">
                      {item.title || 'Untitled'}
                    </CardTitle>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <CardDescription className="flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  {new Date(item.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {item.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{item.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                
                {item.transcriptPreview && item.status === 'READY' && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {item.transcriptPreview}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
