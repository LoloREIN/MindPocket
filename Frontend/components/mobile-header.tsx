'use client'

import { Menu, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MobileHeaderProps {
  title: string
}

export function MobileHeader({ title }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 glass-card border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        <Button size="sm" className="h-9 gap-2">
          <Plus className="h-4 w-4" />
          Agregar
        </Button>
      </div>
    </header>
  )
}
