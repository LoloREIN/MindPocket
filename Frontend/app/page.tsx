'use client';

import { useState, useEffect } from 'react';

import { MobileHeader } from '@/components/mobile-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UtensilsCrossed, Dumbbell, Bookmark, Sparkles, TrendingUp, Loader2 } from 'lucide-react';
import { apiClient, type WellnessItem } from '@/lib/api-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [items, setItems] = useState<WellnessItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchItems();
  }, [refreshKey]);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getItems();
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Calculate counts
  const recipesCount = items.filter(i => i.type === 'recipe').length;
  const workoutsCount = items.filter(i => i.type === 'workout').length;
  const pendingCount = items.filter(i => i.type === 'pending').length;
  const otherCount = items.filter(i => i.type === 'other' || i.type === 'UNKNOWN').length;
  const processingCount = items.filter(i => 
    i.status === 'PENDING_DOWNLOAD' || 
    i.status === 'MEDIA_STORED' || 
    i.status === 'TRANSCRIBING' || 
    i.status === 'ENRICHING'
  ).length;
  const totalCount = items.length;

  // Get daily recommendations (one of each type, random)
  const recipes = items.filter(i => i.type === 'recipe' && i.status === 'READY');
  const workouts = items.filter(i => i.type === 'workout' && i.status === 'READY');
  const pendings = items.filter(i => i.type === 'pending' && i.status === 'READY');
  
  const dailyRecipe = recipes[Math.floor(Math.random() * recipes.length)];
  const dailyWorkout = workouts[Math.floor(Math.random() * workouts.length)];
  const dailyPending = pendings[Math.floor(Math.random() * pendings.length)];

  const categories = [
    {
      type: 'recipe',
      label: 'Recetas',
      count: recipesCount,
      icon: UtensilsCrossed,
      iconColor: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20',
    },
    {
      type: 'workout',
      label: 'Rutinas',
      count: workoutsCount,
      icon: Dumbbell,
      iconColor: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/20',
    },
    {
      type: 'pending',
      label: 'Pendientes',
      count: pendingCount,
      icon: Bookmark,
      iconColor: 'text-chart-3',
      bgColor: 'bg-chart-3/10',
      borderColor: 'border-chart-3/20',
    },
    {
      type: 'other',
      label: 'Otros',
      count: otherCount,
      icon: Sparkles,
      iconColor: 'text-chart-4',
      bgColor: 'bg-chart-4/10',
      borderColor: 'border-chart-4/20',
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <MobileHeader title="MindPocket" onItemAdded={handleItemAdded} />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <MobileHeader title="MindPocket" onItemAdded={handleItemAdded} />
      
      <div className="p-4 space-y-6">
        {/* Category Cards Grid */}
        <div className="grid grid-cols-2 gap-3">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link 
                key={category.type} 
                href={`/library?filter=${category.type}`}
              >
                <Card className={`glass-card p-4 cursor-pointer hover:scale-105 transition-transform border-2 ${category.borderColor}`}>
                  <div className={`w-12 h-12 rounded-lg ${category.bgColor} flex items-center justify-center mb-3`}>
                    <Icon className={`h-6 w-6 ${category.iconColor}`} />
                  </div>
                  <div className="text-3xl font-bold mb-1">{category.count}</div>
                  <div className="text-sm text-muted-foreground">{category.label}</div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Stats Card */}
        <Card className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Estadísticas</h2>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total de links</span>
              <Badge variant="secondary" className="text-base font-semibold">
                {totalCount}
              </Badge>
            </div>
            {processingCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">En proceso</span>
                <Badge variant="outline" className="gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {processingCount}
                </Badge>
              </div>
            )}
          </div>
        </Card>

        {/* Daily Recommendations */}
        {(dailyRecipe || dailyWorkout || dailyPending) && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold px-1">Recomendaciones del día</h2>
            
            {dailyRecipe && (
              <Link href={`/items/${dailyRecipe.itemId}`}>
                <Card className="glass-card p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <UtensilsCrossed className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">Receta</Badge>
                      </div>
                      <h3 className="font-medium truncate">{dailyRecipe.title || 'Sin título'}</h3>
                      {dailyRecipe.tags && dailyRecipe.tags.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {dailyRecipe.tags.slice(0, 2).join(' • ')}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            )}

            {dailyWorkout && (
              <Link href={`/items/${dailyWorkout.itemId}`}>
                <Card className="glass-card p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-success/10">
                      <Dumbbell className="h-5 w-5 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">Rutina</Badge>
                      </div>
                      <h3 className="font-medium truncate">{dailyWorkout.title || 'Sin título'}</h3>
                      {dailyWorkout.tags && dailyWorkout.tags.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {dailyWorkout.tags.slice(0, 2).join(' • ')}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            )}

            {dailyPending && (
              <Link href={`/items/${dailyPending.itemId}`}>
                <Card className="glass-card p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-chart-3/10">
                      <Bookmark className="h-5 w-5 text-chart-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">Pendiente</Badge>
                      </div>
                      <h3 className="font-medium truncate">{dailyPending.title || 'Sin título'}</h3>
                      {dailyPending.tags && dailyPending.tags.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {dailyPending.tags.slice(0, 2).join(' • ')}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
