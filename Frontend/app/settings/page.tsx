'use client'

import { MobileHeader } from '@/components/mobile-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, MessageSquare, Globe, Bell, Download, Trash2, CheckCircle2, XCircle } from 'lucide-react'
import { useState } from 'react'

export default function SettingsPage() {
  const [whatsappConnected, setWhatsappConnected] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [weeklyDigest, setWeeklyDigest] = useState(true)

  return (
    <div className="min-h-screen">
      <MobileHeader title="Ajustes" />
      
      <div className="p-4 space-y-4">
        {/* Profile Section */}
        <Card className="glass-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Perfil</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-16 w-16">
                <AvatarImage src="/placeholder.svg" alt="John Doe" />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  JD
                </AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" size="sm">
                  Cambiar foto
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs">Nombre completo</Label>
                <Input id="name" defaultValue="John Doe" className="bg-muted/30 h-9" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs">Correo electrónico</Label>
                <Input id="email" type="email" defaultValue="john@example.com" className="bg-muted/30 h-9" />
              </div>
            </div>

            <Button size="sm" className="w-full">Guardar cambios</Button>
          </div>
        </Card>

        {/* Integrations Section */}
        <Card className="glass-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Integraciones</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg glass-card">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
                  <MessageSquare className="h-5 w-5 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-foreground text-sm">WhatsApp</h3>
                    {whatsappConnected && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    Envía enlaces para procesar
                  </p>
                </div>
              </div>
              <Button
                variant={whatsappConnected ? 'outline' : 'default'}
                size="sm"
                onClick={() => setWhatsappConnected(!whatsappConnected)}
              >
                {whatsappConnected ? 'Off' : 'On'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Preferences Section */}
        <Card className="glass-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Preferencias</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="language" className="text-sm">Idioma</Label>
                <p className="text-xs text-muted-foreground">
                  Idioma de la interfaz
                </p>
              </div>
              <Select defaultValue="es">
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="units" className="text-sm">Unidades</Label>
                <p className="text-xs text-muted-foreground">
                  Sistema de medidas
                </p>
              </div>
              <Select defaultValue="metric">
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metric">Métrico</SelectItem>
                  <SelectItem value="imperial">Imperial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Notifications Section */}
        <Card className="glass-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Notificaciones</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications" className="text-sm">Notificaciones</Label>
                <p className="text-xs text-muted-foreground">
                  Alertas sobre nuevos items
                </p>
              </div>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weekly" className="text-sm">Resumen semanal</Label>
                <p className="text-xs text-muted-foreground">
                  Actividad semanal por email
                </p>
              </div>
              <Switch
                id="weekly"
                checked={weeklyDigest}
                onCheckedChange={setWeeklyDigest}
              />
            </div>
          </div>
        </Card>

        {/* Data & Privacy Section */}
        <Card className="glass-card p-4">
          <div className="space-y-3">
            <Button variant="outline" size="sm" className="w-full justify-start gap-2">
              <Download className="h-4 w-4" />
              Exportar datos
            </Button>

            <Button variant="outline" size="sm" className="w-full justify-start gap-2 border-destructive/30 text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
              Eliminar cuenta
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
