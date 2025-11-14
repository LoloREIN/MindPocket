'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface MobileHeaderProps {
  title: string
  onItemAdded?: () => void
}

export function MobileHeader({ title, onItemAdded }: MobileHeaderProps) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess(false)

    try {
      if (!url.includes('tiktok.com')) {
        throw new Error('Por favor ingresa una URL válida de TikTok')
      }

      const result = await apiClient.ingestTikTok(url)
      
      console.log('✅ TikTok guardado:', result)
      
      setSuccess(true)
      setUrl('')
      
      setTimeout(() => {
        onItemAdded?.()
        setSuccess(false)
        setOpen(false)
      }, 2000)
      
    } catch (err: any) {
      console.error('❌ Error al guardar TikTok:', err)
      setError(err.message || 'Error al guardar TikTok. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 glass-card border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9 gap-2">
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar TikTok</DialogTitle>
              <DialogDescription>
                Pega una URL de TikTok para extraer recetas, rutinas o recomendaciones
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://www.tiktok.com/@user/video/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isLoading}
                  required
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading || !url}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar'
                  )}
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-600 dark:text-green-400">
                    ¡TikTok guardado! Procesando audio y extrayendo contenido…
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  )
}
