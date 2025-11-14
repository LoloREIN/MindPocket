'use client';

import { type WellnessItem } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Film, Book, GraduationCap, Bookmark, Check } from 'lucide-react';

interface PendingViewProps {
  item: WellnessItem;
}

const categoryIcons = {
  movie: <Film className="h-6 w-6" />,
  book: <Book className="h-6 w-6" />,
  course: <GraduationCap className="h-6 w-6" />,
  other: <Bookmark className="h-6 w-6" />,
};

export function PendingView({ item }: PendingViewProps) {
  const pending = item.enrichedData?.pending;

  if (!pending) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>Pending item data not available yet</p>
        </CardContent>
      </Card>
    );
  }

  const category = pending.category || 'other';

  return (
    <div className="space-y-6">
      {/* Pending Item Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            {categoryIcons[category]}
            <CardTitle className="text-2xl">{pending.name}</CardTitle>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="capitalize">
              {category}
            </Badge>
            {pending.platform && (
              <Badge variant="outline">{pending.platform}</Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Details */}
      {pending.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Why this was recommended</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{pending.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-2">
            <Button className="w-full gap-2">
              <Check className="h-4 w-4" />
              Mark as Done
            </Button>
            <Button variant="outline" className="w-full">
              Add Personal Note
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
