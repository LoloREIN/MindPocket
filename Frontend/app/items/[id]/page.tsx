'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiClient, type WellnessItem } from '@/lib/api-client'
import { MobileHeader } from '@/components/mobile-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, ExternalLink, Clock, Tag, Edit, Trash2, Heart, ChefHat, Dumbbell, CheckCircle2 } from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function ItemDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [item, setItem] = useState<WellnessItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Edit dialog
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  
  // Delete
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Favorite
  const [isFavorite, setIsFavorite] = useState(false)
  
  // Checklist for ingredients/exercises
  const [checkedItems, setCheckedItems] = useState<number[]>([])

  useEffect(() => {
    fetchItem()
  }, [params.id])

  useEffect(() => {
    if (item) {
      setEditTitle(item.title || '')
      setIsFavorite(item.isFavorite || false)
    }
  }, [item])

  const fetchItem = async () => {
    try {
      setIsLoading(true)
      const data = await apiClient.getItem(params.id as string)
      setItem(data)
      setError('')
    } catch (err: any) {
      console.error('Failed to fetch item:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!item) return
    try {
      setIsSaving(true)
      await apiClient.updateItem(item.itemId, { title: editTitle })
      setItem({ ...item, title: editTitle })
      setIsEditOpen(false)
    } catch (err: any) {
      console.error('Failed to update item:', err)
      alert('Error al actualizar: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleFavorite = async () => {
    if (!item) return
    try {
      const newFavorite = !isFavorite
      await apiClient.updateItem(item.itemId, { isFavorite: newFavorite })
      setIsFavorite(newFavorite)
      setItem({ ...item, isFavorite: newFavorite })
    } catch (err: any) {
      console.error('Failed to toggle favorite:', err)
      alert('Error al cambiar favorito: ' + err.message)
    }
  }

  const handleDelete = async () => {
    if (!item) return
    try {
      setIsDeleting(true)
      await apiClient.deleteItem(item.itemId)
      router.push('/library')
    } catch (err: any) {
      console.error('Failed to delete item:', err)
      alert('Error al eliminar: ' + err.message)
      setIsDeleting(false)
    }
  }

  const toggleCheckedItem = (index: number) => {
    setCheckedItems(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }

  // Render functions for different content types
  const renderRecipeContent = () => {
    const recipe = item?.enrichedData?.recipe
    if (!recipe) return null

    return (
      <div className="space-y-4">
        {/* Recipe Info */}
        {(recipe.time_minutes || recipe.servings || recipe.difficulty) && (
          <div className="grid grid-cols-3 gap-3">
            {recipe.time_minutes && (
              <Card className="glass-card p-3">
                <div className="text-center">
                  <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-xs text-muted-foreground">Tiempo</p>
                  <p className="text-sm font-semibold">{recipe.time_minutes} min</p>
                </div>
              </Card>
            )}
            {recipe.servings && (
              <Card className="glass-card p-3">
                <div className="text-center">
                  <ChefHat className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-xs text-muted-foreground">Porciones</p>
                  <p className="text-sm font-semibold">{recipe.servings}</p>
                </div>
              </Card>
            )}
            {recipe.difficulty && (
              <Card className="glass-card p-3">
                <div className="text-center">
                  <Badge variant="secondary" className="text-xs">{recipe.difficulty}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">Dificultad</p>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Ingredients */}
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <Card className="glass-card p-5">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              Ingredientes
            </h2>
            <div className="space-y-3">
              {recipe.ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Checkbox
                    id={`ingredient-${index}`}
                    checked={checkedItems.includes(index)}
                    onCheckedChange={() => toggleCheckedItem(index)}
                  />
                  <label
                    htmlFor={`ingredient-${index}`}
                    className={`text-sm cursor-pointer transition-colors ${
                      checkedItems.includes(index)
                        ? 'text-muted-foreground line-through'
                        : 'text-foreground'
                    }`}
                  >
                    {ingredient.quantity ? `${ingredient.quantity} ` : ''}{ingredient.item}
                  </label>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Steps */}
        {recipe.steps && recipe.steps.length > 0 && (
          <Card className="glass-card p-5">
            <h2 className="text-lg font-semibold mb-3">Preparación</h2>
            <ol className="space-y-3">
              {recipe.steps.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {index + 1}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </Card>
        )}
      </div>
    )
  }

  const renderWorkoutContent = () => {
    const workout = item?.enrichedData?.workout
    if (!workout) return null

    return (
      <div className="space-y-4">
        {/* Workout Info */}
        {(workout.duration_minutes || workout.level || workout.focus) && (
          <div className="grid grid-cols-3 gap-3">
            {workout.duration_minutes && (
              <Card className="glass-card p-3">
                <div className="text-center">
                  <Clock className="h-5 w-5 mx-auto mb-1 text-success" />
                  <p className="text-xs text-muted-foreground">Duración</p>
                  <p className="text-sm font-semibold">{workout.duration_minutes} min</p>
                </div>
              </Card>
            )}
            {workout.level && (
              <Card className="glass-card p-3">
                <div className="text-center">
                  <Dumbbell className="h-5 w-5 mx-auto mb-1 text-success" />
                  <p className="text-xs text-muted-foreground">Nivel</p>
                  <p className="text-sm font-semibold">{workout.level}</p>
                </div>
              </Card>
            )}
            {workout.focus && workout.focus.length > 0 && (
              <Card className="glass-card p-3">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Enfoque</p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {workout.focus.slice(0, 2).map((f, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{f}</Badge>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Exercises */}
        {workout.blocks && workout.blocks.length > 0 && (
          <Card className="glass-card p-5">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Ejercicios
            </h2>
            <div className="space-y-3">
              {workout.blocks.map((block, index) => (
                <div key={index} className="flex gap-3 p-3 rounded-lg glass-card">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/10 text-xs font-semibold text-success">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{block.exercise}</h3>
                      {block.reps && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {block.reps}
                        </Badge>
                      )}
                    </div>
                    {block.notes && (
                      <p className="text-xs text-muted-foreground">{block.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    )
  }

  const renderPendingContent = () => {
    const pending = item?.enrichedData?.pending
    if (!pending) return null

    const getCategoryIcon = () => {
      switch (pending.category) {
        case 'movie': return '🎬'
        case 'book': return '📚'
        case 'course': return '🎓'
        default: return '📌'
      }
    }

    return (
      <Card className="glass-card p-5">
        <div className="flex items-start gap-4">
          <div className="text-4xl">{getCategoryIcon()}</div>
          <div className="flex-1">
            <Badge variant="outline" className="mb-2 capitalize">{pending.category}</Badge>
            <h2 className="text-xl font-bold mb-2">{pending.name}</h2>
            {pending.platform && (
              <p className="text-sm text-muted-foreground mb-2">
                Plataforma: <span className="font-medium">{pending.platform}</span>
              </p>
            )}
            {pending.notes && (
              <p className="text-sm text-muted-foreground">{pending.notes}</p>
            )}
          </div>
        </div>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <MobileHeader title="Cargando..." />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="min-h-screen">
        <MobileHeader title="Error" />
        <div className="p-4">
          <Card className="glass-card p-8 text-center">
            <p className="text-muted-foreground">Error al cargar el item</p>
            <Button onClick={() => router.back()} className="mt-4" size="sm">
              Volver
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  // Render view based on item type and enriched data
  return (
    <div className="min-h-screen pb-20">
      <MobileHeader title="Detalle" />
      
      <div className="p-4 space-y-4">
        {/* Header */}
        <Card className="glass-card p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold mb-2">{item.title || 'Sin título'}</h1>
              <div className="flex items-center gap-2">
                <StatusBadge status={item.status} />
                <Badge variant="outline" className="capitalize">
                  {item.type === 'UNKNOWN' ? 'Otro' : item.type}
                </Badge>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFavorite}
                className="h-9 w-9"
              >
                <Heart 
                  className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`}
                />
              </Button>
              
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Edit className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Editar título</DialogTitle>
                    <DialogDescription>
                      Cambia el título del item
                    </DialogDescription>
                  </DialogHeader>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Título del item"
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveEdit} disabled={isSaving}>
                      {isSaving ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar item?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. El item se eliminará permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? 'Eliminando...' : 'Eliminar'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {item.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  <Tag className="h-3 w-3" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </Card>

        {/* Enriched Content - Render based on type */}
        {item.type === 'recipe' && item.enrichedData?.recipe && renderRecipeContent()}
        {item.type === 'workout' && item.enrichedData?.workout && renderWorkoutContent()}
        {item.type === 'pending' && item.enrichedData?.pending && renderPendingContent()}

        {/* Transcript - Show for all types */}
        {item.transcript && (
          <Card className="glass-card p-5">
            <h2 className="text-lg font-semibold mb-3">Transcripción</h2>
            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {item.transcript}
              </p>
            </div>
          </Card>
        )}

        {/* Metadata */}
        <Card className="glass-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Agregado {new Date(item.createdAt).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}</span>
          </div>
          
          {item.sourceUrl && (
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={() => window.open(item.sourceUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              Ver TikTok original
            </Button>
          )}
        </Card>
      </div>
    </div>
  )
}
