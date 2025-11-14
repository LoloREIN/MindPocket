'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient, type WellnessItem } from '@/lib/api-client';
import { RecipeView } from '@/components/item-detail/recipe-view';
import { WorkoutView } from '@/components/item-detail/workout-view';
import { PendingView } from '@/components/item-detail/pending-view';
import { StatusBadge } from '@/components/status-badge';
import { MobileHeader } from '@/components/mobile-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, ChevronLeft, AlertCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// This tells Next.js to generate a 404.html fallback for dynamic routes
export const dynamicParams = true;

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.itemId as string;

  const [item, setItem] = useState<WellnessItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const data = await apiClient.getItem(itemId);
        setItem(data);
      } catch (err: any) {
        console.error('Failed to fetch item:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [itemId]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <MobileHeader title="Loading..." />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen">
        <MobileHeader title="Error" />
        <div className="p-4">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="mx-auto h-12 w-12 mb-4 text-destructive" />
              <p className="text-lg font-medium mb-2">Failed to load item</p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => router.back()}>Go Back</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <MobileHeader title={item.title || 'Item Detail'} />
      
      <div className="p-4 space-y-6">
        {/* Status & Meta */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <StatusBadge status={item.status} />
              <Badge variant="secondary" className="capitalize">
                {item.type}
              </Badge>
            </div>

            {item.sourceUrl && (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                View original TikTok
              </a>
            )}

            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Created {new Date(item.createdAt).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Content based on type */}
        {item.status === 'READY' ? (
          <>
            {item.type === 'recipe' && <RecipeView item={item} />}
            {item.type === 'workout' && <WorkoutView item={item} />}
            {item.type === 'pending' && <PendingView item={item} />}
            {item.type === 'other' && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <p>Content type: Other</p>
                  <p className="text-sm mt-2">
                    This item doesn't fit into recipe, workout, or pending categories.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="mx-auto h-12 w-12 mb-4 animate-spin text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                {item.status === 'PENDING_DOWNLOAD' && 'Downloading video...'}
                {item.status === 'MEDIA_STORED' && 'Video downloaded'}
                {item.status === 'TRANSCRIBING' && 'Transcribing audio...'}
                {item.status === 'ENRICHING' && 'AI is analyzing the content...'}
                {(item.status === 'ERROR' || item.status === 'ENRICH_ERROR') && 'Processing failed'}
              </p>
              <p className="text-sm text-muted-foreground">
                {item.status === 'ERROR' || item.status === 'ENRICH_ERROR' 
                  ? item.errorMessage || 'An error occurred during processing'
                  : 'This may take a minute. The page will update automatically.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Transcript */}
        {item.transcriptPreview && (
          <Collapsible open={isTranscriptOpen} onOpenChange={setIsTranscriptOpen}>
            <Card>
              <CollapsibleTrigger className="w-full p-4 text-left hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Transcript</h3>
                  <ChevronLeft className={`h-4 w-4 transition-transform ${isTranscriptOpen ? '-rotate-90' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {item.transcriptPreview}
                  </p>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}
      </div>
    </div>
  );
}
