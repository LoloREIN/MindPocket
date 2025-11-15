'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiClient, type WellnessItem } from '@/lib/api-client'
import { MobileHeader } from '@/components/mobile-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, ExternalLink, Clock, Tag } from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
export default function ItemDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [item, setItem] = useState<WellnessItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchItem()
  }, [params.id])

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

  // Default view for 'other' or items without enriched data
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

        {/* Transcript */}
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
