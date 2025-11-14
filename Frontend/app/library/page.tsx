'use client'

import { MobileHeader } from '@/components/mobile-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UtensilsCrossed, Dumbbell, ListTodo, Sparkles, Calendar, CheckCircle2, Circle, Clock } from 'lucide-react'
import { useState } from 'react'

const items = [
  {
    id: 1,
    type: 'Receta',
    title: 'Pasta cremosa saludable',
    tags: ['rápido', 'alto en proteína'],
    date: 'hace 2 horas',
    status: 'pending',
    origin: 'TikTok',
    icon: UtensilsCrossed,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    duration: '20 min'
  },
  {
    id: 2,
    type: 'Rutina',
    title: 'Pierna 20 min',
    tags: ['full body', 'sin equipo'],
    date: 'hace 1 día',
    status: 'done',
    origin: 'TikTok',
    icon: Dumbbell,
    iconColor: 'text-success',
    iconBg: 'bg-success/10',
    duration: '20 min'
  },
  {
    id: 3,
    type: 'Libro',
    title: 'Atomic Habits',
    tags: ['desarrollo personal'],
    date: 'hace 3 días',
    status: 'pending',
    origin: 'TikTok',
    icon: ListTodo,
    iconColor: 'text-chart-3',
    iconBg: 'bg-chart-3/10',
    duration: '320 páginas'
  },
  {
    id: 4,
    type: 'Receta',
    title: 'Bowl de quinoa mediterráneo',
    tags: ['vegano', 'saludable'],
    date: 'hace 5 días',
    status: 'done',
    origin: 'TikTok',
    icon: UtensilsCrossed,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    duration: '15 min'
  },
  {
    id: 5,
    type: 'Rutina',
    title: 'Core y abdomen intenso',
    tags: ['core', 'intermedio'],
    date: 'hace 1 semana',
    status: 'pending',
    origin: 'TikTok',
    icon: Dumbbell,
    iconColor: 'text-success',
    iconBg: 'bg-success/10',
    duration: '15 min'
  },
  {
    id: 6,
    type: 'Película',
    title: 'The Social Dilemma',
    tags: ['documental', 'tecnología'],
    date: 'hace 1 semana',
    status: 'pending',
    origin: 'TikTok',
    icon: ListTodo,
    iconColor: 'text-chart-3',
    iconBg: 'bg-chart-3/10',
    duration: '94 min'
  },
  {
    id: 7,
    type: 'Otro',
    title: 'Tips de productividad',
    tags: ['productividad', 'trabajo'],
    date: 'hace 2 semanas',
    status: 'done',
    origin: 'TikTok',
    icon: Sparkles,
    iconColor: 'text-chart-4',
    iconBg: 'bg-chart-4/10',
    duration: ''
  },
  {
    id: 8,
    type: 'Receta',
    title: 'Smoothie energético pre-workout',
    tags: ['bebida', 'energético'],
    date: 'hace 2 semanas',
    status: 'pending',
    origin: 'TikTok',
    icon: UtensilsCrossed,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    duration: '5 min'
  },
]

export default function LibraryPage() {
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent')

  const filteredItems = items.filter(item => {
    if (selectedFilter === 'all') return true
    return item.type.toLowerCase() === selectedFilter.toLowerCase()
  })

  return (
    <div className="min-h-screen">
      <MobileHeader title="Biblioteca" />
      
      <div className="p-4 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={selectedFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('all')}
          >
            Todos
          </Button>
          <Button
            variant={selectedFilter === 'receta' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('receta')}
          >
            Recetas
          </Button>
          <Button
            variant={selectedFilter === 'rutina' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('rutina')}
          >
            Rutinas
          </Button>
          <Button
            variant={selectedFilter === 'libro' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('libro')}
          >
            Pendientes
          </Button>
        </div>

        {/* Items List - Simplified for mobile */}
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.id} className="glass-card p-4 cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${item.iconBg}`}>
                    <Icon className={`h-5 w-5 ${item.iconColor}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {item.type}
                      </Badge>
                      {item.status === 'done' && (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      )}
                    </div>
                    <h3 className="font-semibold text-foreground text-sm mb-1">
                      {item.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {item.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {item.duration}
                        </span>
                      )}
                      <span>{item.date}</span>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            {filteredItems.length} de {items.length} items
          </p>
        </div>
      </div>
    </div>
  )
}
