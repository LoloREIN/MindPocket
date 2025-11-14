import { MobileHeader } from '@/components/mobile-header'
import { UtensilsCrossed, Dumbbell, ListTodo, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <MobileHeader title="MindBucket" />
      
      <div className="p-4 space-y-6">
        {/* Welcome Header */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-1">Hola, John</h2>
          <p className="text-sm text-muted-foreground">
            Tu colección de wellness
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="text-2xl font-bold text-foreground">127</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Esta semana</p>
            <p className="text-2xl font-bold text-success">+18</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="glass-card glass-card-hover p-6 cursor-pointer">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-0.5">48</h3>
            <p className="text-xs text-muted-foreground">Recetas</p>
          </Card>

          <Card className="glass-card glass-card-hover p-6 cursor-pointer">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 mb-3">
              <Dumbbell className="h-5 w-5 text-success" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-0.5">32</h3>
            <p className="text-xs text-muted-foreground">Rutinas</p>
          </Card>

          <Card className="glass-card glass-card-hover p-6 cursor-pointer">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10 mb-3">
              <ListTodo className="h-5 w-5 text-chart-3" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-0.5">35</h3>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </Card>

          <Card className="glass-card glass-card-hover p-6 cursor-pointer">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/10 mb-3">
              <Sparkles className="h-5 w-5 text-chart-4" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-0.5">12</h3>
            <p className="text-xs text-muted-foreground">Otros</p>
          </Card>
        </div>

        {/* Quick Access Section */}
        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">Sugerido hoy</h3>
          
          <div className="space-y-3">
            <Card className="glass-card p-4 cursor-pointer">
              <div className="flex gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <UtensilsCrossed className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground text-sm mb-1 truncate">
                    Pasta cremosa saludable
                  </h4>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">Receta</Badge>
                    <span className="text-xs text-muted-foreground">20 min</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    Receta rápida y deliciosa. Alta en proteína y perfecta después del ejercicio.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-4 cursor-pointer">
              <div className="flex gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-success/10">
                  <Dumbbell className="h-5 w-5 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground text-sm mb-1 truncate">
                    Rutina pierna 20 min
                  </h4>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">Rutina</Badge>
                    <span className="text-xs text-muted-foreground">20 min</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    Entrenamiento completo sin equipo. Ideal para hacer en casa.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Actividad reciente</h2>
          
          <Card className="glass-card p-4">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <UtensilsCrossed className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    Guardaste una receta <span className="font-semibold">Pasta cremosa saludable</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">hace 2 horas</p>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      Procesado por IA
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/10">
                  <Dumbbell className="h-4 w-4 text-success" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    Se creó una rutina <span className="font-semibold">Pierna 20 min</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">hace 1 día</p>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      Procesado por IA
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-chart-3/10">
                  <ListTodo className="h-4 w-4 text-chart-3" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    Agregaste <span className="font-semibold">Atomic Habits</span> a tu lista de lectura
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">hace 3 días</p>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      From TikTok
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <UtensilsCrossed className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    Completaste la receta <span className="font-semibold">Bowl de quinoa</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">hace 5 días</p>
                    <Badge variant="outline" className="text-[10px] text-success border-success/30">
                      Completado
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
