'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Clock, Zap, Target, ExternalLink, Edit, Play } from 'lucide-react'
import { useState } from 'react'

const routine = {
  title: 'Pierna 20 min',
  type: 'Rutina',
  summary: 'Entrenamiento de pierna completo sin equipo. Ideal para hacer en casa con ejercicios de peso corporal.',
  duration: '20 min',
  level: 'Intermedio',
  focus: 'Full body - Pierna',
  tags: ['full body', 'sin equipo', 'pierna'],
  exercises: [
    {
      name: 'Sentadillas',
      reps: '4 series x 15 reps',
      notes: 'Mantén la espalda recta y baja hasta que los muslos estén paralelos al suelo. Respira al subir.'
    },
    {
      name: 'Zancadas alternas',
      reps: '3 series x 12 reps cada pierna',
      notes: 'Da un paso largo hacia adelante, baja la rodilla trasera casi hasta el suelo. Alterna piernas.'
    },
    {
      name: 'Sentadilla sumo',
      reps: '4 series x 12 reps',
      notes: 'Pies más separados que el ancho de hombros, pies apuntando hacia afuera. Enfoca en los glúteos.'
    },
    {
      name: 'Elevación de talones',
      reps: '3 series x 20 reps',
      notes: 'De pie, eleva los talones lo más alto posible. Mantén el equilibrio y contrae las pantorrillas.'
    },
    {
      name: 'Puente de glúteos',
      reps: '4 series x 15 reps',
      notes: 'Acostado boca arriba, levanta la cadera. Aprieta los glúteos en la parte superior del movimiento.'
    },
    {
      name: 'Estiramiento final',
      reps: '5 minutos',
      notes: 'Estira cuádriceps, isquiotibiales y pantorrillas. Mantén cada estiramiento 30 segundos.'
    }
  ],
  notes: '',
  origin: 'TikTok'
}

export function RoutineDetail() {
  const [notes, setNotes] = useState(routine.notes)

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {routine.type}
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-mono">
                Procesado por IA
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-3 text-balance">
              {routine.title}
            </h1>
            <p className="text-muted-foreground text-balance">
              {routine.summary}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Edit className="h-4 w-4" />
              Editar
            </Button>
            <Button size="sm" className="gap-2 bg-success hover:bg-success/90 text-success-foreground">
              <Play className="h-4 w-4" />
              Iniciar rutina
            </Button>
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Clock className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Duración</p>
                <p className="text-sm font-semibold text-foreground">{routine.duration}</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
                <Zap className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Nivel</p>
                <p className="text-sm font-semibold text-foreground">{routine.level}</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Enfoque</p>
                <p className="text-sm font-semibold text-foreground">{routine.focus}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Exercises */}
            <Card className="glass-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Ejercicios</h2>
              <div className="space-y-4">
                {routine.exercises.map((exercise, index) => (
                  <div key={index} className="flex gap-4 p-4 rounded-lg glass-card">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/10 text-sm font-semibold text-success">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="font-semibold text-foreground">{exercise.name}</h3>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {exercise.reps}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {exercise.notes}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Tips */}
            <Card className="glass-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Tips importantes</h2>
              <ul className="space-y-3">
                <li className="flex gap-3 text-sm text-foreground">
                  <span className="text-success">•</span>
                  <span>Calienta 5 minutos antes de empezar con movimientos dinámicos</span>
                </li>
                <li className="flex gap-3 text-sm text-foreground">
                  <span className="text-success">•</span>
                  <span>Mantén una respiración constante durante todo el ejercicio</span>
                </li>
                <li className="flex gap-3 text-sm text-foreground">
                  <span className="text-success">•</span>
                  <span>Descansa 30-45 segundos entre series</span>
                </li>
                <li className="flex gap-3 text-sm text-foreground">
                  <span className="text-success">•</span>
                  <span>Enfócate en la forma correcta antes que en la velocidad</span>
                </li>
              </ul>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Tags */}
            <Card className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Etiquetas</h3>
              <div className="flex flex-wrap gap-2">
                {routine.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  + Añadir
                </Button>
              </div>
            </Card>

            {/* Notes */}
            <Card className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Notas personales</h3>
              <Textarea
                placeholder="Añade tus propias notas, modificaciones o comentarios..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[120px] resize-none bg-muted/30"
              />
            </Card>

            {/* Actions */}
            <Card className="glass-card p-5 space-y-3">
              <Button variant="outline" className="w-full justify-start gap-2">
                <ExternalLink className="h-4 w-4" />
                Ver video original
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Play className="h-4 w-4" />
                Marcar como hecho
              </Button>
            </Card>

            {/* Origin */}
            <Card className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-2">Origen</h3>
              <Badge variant="secondary" className="text-xs font-mono">
                From {routine.origin}
              </Badge>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
