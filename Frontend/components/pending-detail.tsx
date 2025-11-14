'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { BookOpen, Clock, ExternalLink, Edit, Check } from 'lucide-react'
import { useState } from 'react'

const pending = {
  title: 'Atomic Habits',
  type: 'Libro',
  subtype: 'Libro',
  summary: 'Libro sobre construcción de hábitos positivos y eliminación de malos hábitos con estrategias prácticas y científicamente probadas.',
  author: 'James Clear',
  platform: 'Amazon / Kindle',
  duration: '320 páginas',
  status: 'To read',
  tags: ['desarrollo personal', 'productividad', 'hábitos'],
  description: 'Atomic Habits es una guía práctica sobre cómo construir buenos hábitos y eliminar los malos. James Clear presenta un marco probado para mejorar cada día. El libro explica cómo pequeños cambios pueden conducir a resultados notables a largo plazo.',
  whySaved: 'Este libro fue recomendado por su enfoque práctico en la formación de hábitos. Es perfecto para quienes buscan mejorar su rutina diaria y alcanzar objetivos a largo plazo mediante pequeños cambios consistentes.',
  keyPoints: [
    'Los hábitos son el interés compuesto de la auto-mejora',
    'Enfócate en sistemas, no en objetivos',
    'La regla de los 2 minutos para comenzar nuevos hábitos',
    'Cómo hacer los buenos hábitos inevitables y los malos imposibles'
  ],
  notes: '',
  origin: 'TikTok'
}

export function PendingDetail() {
  const [notes, setNotes] = useState(pending.notes)
  const [status, setStatus] = useState(pending.status)

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {pending.subtype}
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-mono">
                Procesado por IA
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-3 text-balance">
              {pending.title}
            </h1>
            <p className="text-muted-foreground text-balance">
              {pending.summary}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Edit className="h-4 w-4" />
              Editar
            </Button>
            <Button size="sm" className="gap-2">
              <Check className="h-4 w-4" />
              Marcar leído
            </Button>
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
                <BookOpen className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="text-sm font-semibold text-foreground">{pending.subtype}</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Duración</p>
                <p className="text-sm font-semibold text-foreground">{pending.duration}</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <svg className="h-5 w-5 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estado</p>
                <p className="text-sm font-semibold text-foreground">{status}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card className="glass-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Descripción</h2>
              <p className="text-sm text-foreground leading-relaxed">
                {pending.description}
              </p>
            </Card>

            {/* Why Saved */}
            <Card className="glass-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Por qué lo guardaste</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {pending.whySaved}
              </p>
            </Card>

            {/* Key Points */}
            <Card className="glass-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Puntos clave</h2>
              <ul className="space-y-3">
                {pending.keyPoints.map((point, index) => (
                  <li key={index} className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-chart-3/10 text-xs font-semibold text-chart-3">
                      {index + 1}
                    </div>
                    <p className="text-sm text-foreground pt-0.5 leading-relaxed">{point}</p>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Details */}
            <Card className="glass-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Detalles</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Autor</span>
                  <span className="font-semibold text-foreground">{pending.author}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Plataforma</span>
                  <span className="font-semibold text-foreground">{pending.platform}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Páginas</span>
                  <span className="font-semibold text-foreground">{pending.duration}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Estado</span>
                  <span className="font-semibold text-foreground">{status}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Status */}
            <Card className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Cambiar estado</h3>
              <div className="space-y-2">
                <Button
                  variant={status === 'To read' ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setStatus('To read')}
                >
                  To read
                </Button>
                <Button
                  variant={status === 'Reading' ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setStatus('Reading')}
                >
                  Reading
                </Button>
                <Button
                  variant={status === 'Done' ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setStatus('Done')}
                >
                  Done
                </Button>
              </div>
            </Card>

            {/* Tags */}
            <Card className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Etiquetas</h3>
              <div className="flex flex-wrap gap-2">
                {pending.tags.map((tag) => (
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
                placeholder="Añade tus propias notas, reflexiones o comentarios..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[120px] resize-none bg-muted/30"
              />
            </Card>

            {/* Actions */}
            <Card className="glass-card p-5 space-y-3">
              <Button variant="outline" className="w-full justify-start gap-2">
                <ExternalLink className="h-4 w-4" />
                Abrir en {pending.platform.split('/')[0]}
              </Button>
            </Card>

            {/* Origin */}
            <Card className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-2">Origen</h3>
              <Badge variant="secondary" className="text-xs font-mono">
                From {pending.origin}
              </Badge>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
