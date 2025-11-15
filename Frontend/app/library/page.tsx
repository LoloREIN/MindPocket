'use client'

import { MobileHeader } from '@/components/mobile-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { UtensilsCrossed, Dumbbell, Bookmark, Sparkles, Clock, Loader2, Package, Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiClient, type WellnessItem, type ItemType } from '@/lib/api-client'
import Link from 'next/link'
import { StatusBadge } from '@/components/status-badge'

const typeConfig = {
  recipe: {
    label: 'Receta',
    icon: UtensilsCrossed,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
  },
  workout: {
    label: 'Rutina',
    icon: Dumbbell,
    iconColor: 'text-success',
    iconBg: 'bg-success/10',
  },
  pending: {
    label: 'Pendiente',
    icon: Bookmark,
    iconColor: 'text-chart-3',
    iconBg: 'bg-chart-3/10',
  },
  other: {
    label: 'Otro',
    icon: Sparkles,
    iconColor: 'text-chart-4',
    iconBg: 'bg-chart-4/10',
  },
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 60) return `hace ${diffMins} min`
  if (diffHours < 24) return `hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`
  if (diffDays < 7) return `hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`
  if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) !== 1 ? 's' : ''}`
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default function LibraryPage() {
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const initialFilter = searchParams.get('filter') || 'all'
  
  const [items, setItems] = useState<WellnessItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<ItemType | 'all' | 'processing'>(initialFilter as any)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      setIsLoading(true)
      const data = await apiClient.getItems()
      setItems(data)
      setError('')
    } catch (err: any) {
      console.error('Failed to fetch items:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredItems = items.filter(item => {
    // Filter by type/status
    let matchesFilter = true
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'processing') {
        matchesFilter = item.status === 'PENDING_DOWNLOAD' || 
                       item.status === 'MEDIA_STORED' || 
                       item.status === 'TRANSCRIBING' || 
                       item.status === 'ENRICHING'
      } else {
        matchesFilter = item.type === selectedFilter
      }
    }
    
    // Filter by search query
    let matchesSearch = true
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      matchesSearch = Boolean(
        item.title?.toLowerCase().includes(query) ||
        item.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        item.transcript?.toLowerCase().includes(query)
      )
    }
    
    return matchesFilter && matchesSearch
  })

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <MobileHeader title="Biblioteca" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <MobileHeader title="Biblioteca" />
        <div className="p-4">
          <Card className="glass-card p-8 text-center">
            <p className="text-muted-foreground">Error al cargar items: {error}</p>
            <Button onClick={fetchItems} className="mt-4" size="sm">
              Reintentar
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <MobileHeader title="Biblioteca" />
        <div className="p-4">
          <Card className="glass-card p-8 text-center">
            <Package className="mx-auto h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">No hay items</p>
            <p className="text-sm text-muted-foreground">Agrega tu primer TikTok para comenzar</p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <MobileHeader title="Biblioteca" onItemAdded={fetchItems} />
      
      <div className="p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, tags o contenido..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 glass-card"
          />
        </div>

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
            variant={selectedFilter === 'processing' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('processing')}
            className="gap-1"
          >
            <Loader2 className="h-3 w-3" />
            En proceso
          </Button>
          <Button
            variant={selectedFilter === 'recipe' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('recipe')}
          >
            Recetas
          </Button>
          <Button
            variant={selectedFilter === 'workout' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('workout')}
          >
            Rutinas
          </Button>
          <Button
            variant={selectedFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('pending')}
          >
            Pendientes
          </Button>
        </div>

        {/* Items List - Simplified for mobile */}
        <div className="space-y-3">
          {filteredItems.map((item) => {
            // Use 'other' as fallback for unknown types
            const itemType = (item.type === 'UNKNOWN' || !typeConfig[item.type]) ? 'other' : item.type
            const config = typeConfig[itemType]
            const Icon = config.icon
            
            return (
              <Link key={item.itemId} href={`/items/${item.itemId}`}>
                <Card className="glass-card p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${config.iconBg}`}>
                      <Icon className={`h-5 w-5 ${config.iconColor}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {config.label}
                        </Badge>
                        <StatusBadge status={item.status} />
                      </div>
                      <h3 className="font-semibold text-foreground text-sm mb-1 line-clamp-2">
                        {item.title || 'Sin título'}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.slice(0, 3).map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
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
