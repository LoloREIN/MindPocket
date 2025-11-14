import { MobileHeader } from '@/components/mobile-header'
import { Card } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'

export default function OtherPage() {
  return (
    <div className="min-h-screen">
      <MobileHeader title="Otros" />
      
      <div className="p-4">
        <Card className="glass-card p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-chart-4/10 mx-auto mb-3">
            <Sparkles className="h-7 w-7 text-chart-4" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">No hay items todavía</h2>
          <p className="text-sm text-muted-foreground">
            Ideas, tips y otros contenidos que no encajan en las otras categorías.
          </p>
        </Card>
      </div>
    </div>
  )
}
