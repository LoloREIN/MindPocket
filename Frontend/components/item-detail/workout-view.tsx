'use client';

import { type WellnessItem } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Dumbbell, Target } from 'lucide-react';

interface WorkoutViewProps {
  item: WellnessItem;
}

export function WorkoutView({ item }: WorkoutViewProps) {
  const workout = item.enrichedData?.workout;

  if (!workout) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>Workout data not available yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workout Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Dumbbell className="h-6 w-6" />
            <CardTitle className="text-2xl">{workout.name}</CardTitle>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {workout.duration_minutes && (
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                {workout.duration_minutes} min
              </Badge>
            )}
            {workout.level && (
              <Badge variant="outline">{workout.level}</Badge>
            )}
            {workout.focus && workout.focus.length > 0 && (
              workout.focus.map((f, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  <Target className="h-3 w-3" />
                  {f}
                </Badge>
              ))
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Exercises */}
      <Card>
        <CardHeader>
          <CardTitle>Exercises</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workout.blocks.map((block, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-lg">{block.exercise}</h3>
                    
                    <div className="flex flex-wrap gap-2">
                      {block.reps && (
                        <Badge variant="secondary">
                          {block.reps}
                        </Badge>
                      )}
                      {block.sets && (
                        <Badge variant="secondary">
                          {block.sets} {block.sets === 1 ? 'set' : 'sets'}
                        </Badge>
                      )}
                    </div>
                    
                    {block.notes && (
                      <p className="text-sm text-muted-foreground">{block.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
