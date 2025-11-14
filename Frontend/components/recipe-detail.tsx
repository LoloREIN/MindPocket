'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Clock, ChefHat, Flame, ExternalLink, Edit, Check } from 'lucide-react'
import { useState } from 'react'

const recipe = {
  title: 'Pasta cremosa saludable',
  type: 'Receta',
  summary: 'Una receta rápida y deliciosa con ingredientes simples. Alta en proteína y perfecta para después del ejercicio.',
  time: '20 min',
  difficulty: 'Fácil',
  servings: '2 porciones',
  calories: '450 kcal',
  protein: '28g',
  tags: ['rápido', 'alto en proteína', 'saludable'],
  ingredients: [
    '200g pasta integral',
    '150g pechuga de pollo',
    '100ml crema light',
    '50g queso parmesano',
    '2 dientes de ajo',
    'Espinacas frescas',
    'Sal y pimienta al gusto'
  ],
  steps: [
    'Cocina la pasta según las instrucciones del paquete. Reserva 1 taza del agua de cocción.',
    'Mientras tanto, corta el pollo en cubos pequeños y sazónalo con sal y pimienta.',
    'En una sartén grande, cocina el ajo picado hasta que esté dorado.',
    'Añade el pollo y cocina hasta que esté bien dorado por todos lados.',
    'Agrega las espinacas y cocina hasta que se marchiten.',
    'Incorpora la crema y el queso parmesano, mezclando bien.',
    'Añade la pasta cocida y un poco del agua de cocción para lograr la consistencia cremosa deseada.',
    'Ajusta la sazón y sirve inmediatamente con más queso parmesano por encima.'
  ],
  notes: '',
  origin: 'TikTok'
}

export function RecipeDetail() {
  const [checkedIngredients, setCheckedIngredients] = useState<number[]>([])
  const [notes, setNotes] = useState(recipe.notes)

  const toggleIngredient = (index: number) => {
    setCheckedIngredients(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {recipe.type}
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-mono">
                Procesado por IA
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-3 text-balance">
              {recipe.title}
            </h1>
            <p className="text-muted-foreground text-balance">
              {recipe.summary}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Edit className="h-4 w-4" />
              Editar
            </Button>
            <Button size="sm" className="gap-2">
              <ChefHat className="h-4 w-4" />
              Modo cocina
            </Button>
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tiempo</p>
                <p className="text-sm font-semibold text-foreground">{recipe.time}</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <ChefHat className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dificultad</p>
                <p className="text-sm font-semibold text-foreground">{recipe.difficulty}</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
                <Flame className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Calorías</p>
                <p className="text-sm font-semibold text-foreground">{recipe.calories}</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/10">
                <svg className="h-5 w-5 text-chart-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Proteína</p>
                <p className="text-sm font-semibold text-foreground">{recipe.protein}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ingredients */}
            <Card className="glass-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Ingredientes</h2>
              <div className="space-y-3">
                {recipe.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Checkbox
                      id={`ingredient-${index}`}
                      checked={checkedIngredients.includes(index)}
                      onCheckedChange={() => toggleIngredient(index)}
                    />
                    <label
                      htmlFor={`ingredient-${index}`}
                      className={`text-sm cursor-pointer transition-colors ${
                        checkedIngredients.includes(index)
                          ? 'text-muted-foreground line-through'
                          : 'text-foreground'
                      }`}
                    >
                      {ingredient}
                    </label>
                  </div>
                ))}
              </div>
            </Card>

            {/* Steps */}
            <Card className="glass-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Preparación</h2>
              <ol className="space-y-4">
                {recipe.steps.map((step, index) => (
                  <li key={index} className="flex gap-4">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <p className="text-sm text-foreground pt-0.5 leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>
            </Card>

            {/* Nutrition Info */}
            <Card className="glass-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Información nutricional</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Calorías</span>
                  <span className="font-semibold text-foreground">{recipe.calories}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Proteína</span>
                  <span className="font-semibold text-foreground">{recipe.protein}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Porciones</span>
                  <span className="font-semibold text-foreground">{recipe.servings}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Dificultad</span>
                  <span className="font-semibold text-foreground">{recipe.difficulty}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Tags */}
            <Card className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Etiquetas</h3>
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag) => (
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
                <Check className="h-4 w-4" />
                Marcar como hecho
              </Button>
            </Card>

            {/* Origin */}
            <Card className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-2">Origen</h3>
              <Badge variant="secondary" className="text-xs font-mono">
                From {recipe.origin}
              </Badge>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
