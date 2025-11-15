# 🚀 Mejoras Pendientes - MindPocket

Este documento lista todas las mejoras identificadas y su estado de implementación.

## ✅ Completadas

### Backend
- [x] Lambda `process-tiktok` con transcripción real (Google Speech)
- [x] Clasificación automática con Bedrock Claude
- [x] Extracción de datos estructurados (recetas, rutinas, pendientes)
- [x] Generación automática de tags
- [x] Lambda `get-items` y `get-item`
- [x] Lambda `ingest-link` con SQS
- [x] Lambda `update-item` (creado, falta desplegar)
- [x] Lambda `delete-item` (creado, falta desplegar)

### Frontend
- [x] Dashboard con contadores por categoría
- [x] Estadísticas en tiempo real
- [x] Recomendaciones diarias
- [x] Filtro "En proceso" en library
- [x] Navegación con filtros desde home
- [x] Vista de detalle básica con transcripción
- [x] Sistema de tipos actualizado (COMPLETED, UNKNOWN)
- [x] Manejo de estados de error

## 🔧 En Proceso

### 1. CRUD Completo - Backend

#### A. Desplegar Lambdas Nuevos en Pulumi

**Archivo**: `/Infra/Pulumi.yaml`

**Agregar después del Lambda `get-item`**:

```yaml
  # IAM Role for UpdateItem Lambda
  update-item-lambda-role:
    type: aws:iam:Role
    properties:
      assumeRolePolicy: |
        {
          "Version": "2012-10-17",
          "Statement": [{
            "Action": "sts:AssumeRole",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Effect": "Allow"
          }]
        }
      managedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

  # IAM Policy for UpdateItem Lambda
  update-item-lambda-policy:
    type: aws:iam:RolePolicy
    properties:
      role: ${update-item-lambda-role.id}
      policy: |
        {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "dynamodb:GetItem",
                "dynamodb:UpdateItem"
              ],
              "Resource": "${wellness-items-table.arn}"
            }
          ]
        }

  # UpdateItem Lambda
  update-item-lambda:
    type: aws:lambda:Function
    properties:
      name: mindpocket-update-item
      runtime: nodejs20.x
      handler: index.handler
      role: ${update-item-lambda-role.arn}
      code:
        fn::fileArchive: ./lambdas/update-item
      timeout: 30
      memorySize: 256
      environment:
        variables:
          WELLNESS_ITEMS_TABLE: ${wellness-items-table.name}

  # IAM Role for DeleteItem Lambda
  delete-item-lambda-role:
    type: aws:iam:Role
    properties:
      assumeRolePolicy: |
        {
          "Version": "2012-10-17",
          "Statement": [{
            "Action": "sts:AssumeRole",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Effect": "Allow"
          }]
        }
      managedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

  # IAM Policy for DeleteItem Lambda
  delete-item-lambda-policy:
    type: aws:iam:RolePolicy
    properties:
      role: ${delete-item-lambda-role.id}
      policy: |
        {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "dynamodb:GetItem",
                "dynamodb:DeleteItem"
              ],
              "Resource": "${wellness-items-table.arn}"
            },
            {
              "Effect": "Allow",
              "Action": [
                "s3:DeleteObject"
              ],
              "Resource": "${raw-media-bucket.arn}/*"
            }
          ]
        }

  # DeleteItem Lambda
  delete-item-lambda:
    type: aws:lambda:Function
    properties:
      name: mindpocket-delete-item
      runtime: nodejs20.x
      handler: index.handler
      role: ${delete-item-lambda-role.arn}
      code:
        fn::fileArchive: ./lambdas/delete-item
      timeout: 30
      memorySize: 256
      environment:
        variables:
          WELLNESS_ITEMS_TABLE: ${wellness-items-table.name}
          RAW_MEDIA_BUCKET: ${raw-media-bucket.id}
```

#### B. Agregar Rutas a API Gateway

**Buscar la sección de rutas y agregar**:

```yaml
  # PUT /items/{id} - Update Item
  update-item-route:
    type: aws:apigatewayv2:Route
    properties:
      apiId: ${mindpocket-api.id}
      routeKey: PUT /items/{id}
      target: integrations/${update-item-integration.id}
      authorizationType: JWT
      authorizerId: ${cognito-authorizer.id}

  update-item-integration:
    type: aws:apigatewayv2:Integration
    properties:
      apiId: ${mindpocket-api.id}
      integrationType: AWS_PROXY
      integrationUri: ${update-item-lambda.invokeArn}
      payloadFormatVersion: "2.0"

  update-item-lambda-permission:
    type: aws:lambda:Permission
    properties:
      action: lambda:InvokeFunction
      function: ${update-item-lambda.name}
      principal: apigateway.amazonaws.com
      sourceArn: ${mindpocket-api.executionArn}/*/*

  # DELETE /items/{id} - Delete Item
  delete-item-route:
    type: aws:apigatewayv2:Route
    properties:
      apiId: ${mindpocket-api.id}
      routeKey: DELETE /items/{id}
      target: integrations/${delete-item-integration.id}
      authorizationType: JWT
      authorizerId: ${cognito-authorizer.id}

  delete-item-integration:
    type: aws:apigatewayv2:Integration
    properties:
      apiId: ${mindpocket-api.id}
      integrationType: AWS_PROXY
      integrationUri: ${delete-item-lambda.invokeArn}
      payloadFormatVersion: "2.0"

  delete-item-lambda-permission:
    type: aws:lambda:Permission
    properties:
      action: lambda:InvokeFunction
      function: ${delete-item-lambda.name}
      principal: apigateway.amazonaws.com
      sourceArn: ${mindpocket-api.executionArn}/*/*
```

**Comandos para desplegar**:

```bash
cd /Users/lorenzoreinoso/Desktop/MindPocket/Infra
cd lambdas/update-item && npm install && cd ../..
cd lambdas/delete-item && npm install && cd ../..
pulumi up
```

---

### 2. CRUD Completo - Frontend

#### A. Actualizar API Client

**Archivo**: `/Frontend/lib/api-client.ts`

**Agregar métodos**:

```typescript
async updateItem(
  itemId: string,
  updates: {
    title?: string;
    tags?: string[];
    type?: ItemType;
    isFavorite?: boolean;
  }
): Promise<WellnessItem> {
  const token = await this.getAuthToken();
  const response = await fetch(`${this.baseUrl}/items/${itemId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ itemId, ...updates }),
  });

  if (!response.ok) {
    throw new Error('Failed to update item');
  }

  const data = await response.json();
  return this.deserializeItem(data.item);
}

async deleteItem(itemId: string): Promise<void> {
  const token = await this.getAuthToken();
  const response = await fetch(`${this.baseUrl}/items/${itemId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete item');
  }
}
```

#### B. Agregar UI de Edición/Eliminación

**Archivo**: `/Frontend/app/items/[id]/page.tsx`

**Agregar imports**:

```typescript
import { Edit, Trash2, Heart, HeartOff } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
```

**Agregar estados**:

```typescript
const [isEditing, setIsEditing] = useState(false)
const [editTitle, setEditTitle] = useState(item?.title || '')
const [isFavorite, setIsFavorite] = useState(item?.isFavorite || false)
const [isDeleting, setIsDeleting] = useState(false)
```

**Agregar funciones**:

```typescript
const handleSaveEdit = async () => {
  try {
    await apiClient.updateItem(item!.itemId, { title: editTitle })
    setItem({ ...item!, title: editTitle })
    setIsEditing(false)
  } catch (error) {
    console.error('Failed to update item:', error)
  }
}

const handleToggleFavorite = async () => {
  try {
    await apiClient.updateItem(item!.itemId, { isFavorite: !isFavorite })
    setIsFavorite(!isFavorite)
  } catch (error) {
    console.error('Failed to toggle favorite:', error)
  }
}

const handleDelete = async () => {
  try {
    setIsDeleting(true)
    await apiClient.deleteItem(item!.itemId)
    router.push('/library')
  } catch (error) {
    console.error('Failed to delete item:', error)
    setIsDeleting(false)
  }
}
```

**Agregar botones en el header**:

```tsx
<div className="flex gap-2">
  <Button
    variant="ghost"
    size="icon"
    onClick={handleToggleFavorite}
  >
    {isFavorite ? (
      <Heart className="h-5 w-5 fill-red-500 text-red-500" />
    ) : (
      <HeartOff className="h-5 w-5" />
    )}
  </Button>
  
  <Button
    variant="ghost"
    size="icon"
    onClick={() => setIsEditing(true)}
  >
    <Edit className="h-5 w-5" />
  </Button>
  
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant="ghost" size="icon">
        <Trash2 className="h-5 w-5 text-destructive" />
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>¿Eliminar item?</AlertDialogTitle>
        <AlertDialogDescription>
          Esta acción no se puede deshacer.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? 'Eliminando...' : 'Eliminar'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</div>
```

---

### 3. Búsqueda en Library

**Archivo**: `/Frontend/app/library/page.tsx`

**Agregar estado y función de búsqueda**:

```typescript
const [searchQuery, setSearchQuery] = useState('')

const filteredItems = items.filter(item => {
  // Filter by type/status
  if (selectedFilter === 'all') return true
  if (selectedFilter === 'processing') {
    return item.status === 'PENDING_DOWNLOAD' || 
           item.status === 'MEDIA_STORED' || 
           item.status === 'TRANSCRIBING' || 
           item.status === 'ENRICHING'
  }
  if (item.type !== selectedFilter) return false
  
  // Filter by search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    return (
      item.title?.toLowerCase().includes(query) ||
      item.tags?.some(tag => tag.toLowerCase().includes(query)) ||
      item.transcript?.toLowerCase().includes(query)
    )
  }
  
  return true
})
```

**Agregar barra de búsqueda**:

```tsx
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

<div className="relative">
  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <Input
    placeholder="Buscar por título, tags o contenido..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="pl-10"
  />
</div>
```

---

### 4. Skeleton Loaders

**Crear componente**: `/Frontend/components/skeleton-item.tsx`

```typescript
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function SkeletonItem() {
  return (
    <Card className="glass-card p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    </Card>
  )
}
```

**Usar en library**:

```tsx
{isLoading && (
  <div className="space-y-3">
    {[1, 2, 3, 4, 5].map(i => (
      <SkeletonItem key={i} />
    ))}
  </div>
)}
```

---

### 5. Pull-to-Refresh

**Instalar dependencia**:

```bash
npm install react-pull-to-refresh
```

**Implementar en library**:

```tsx
import PullToRefresh from 'react-pull-to-refresh'

<PullToRefresh
  onRefresh={async () => {
    await fetchItems()
  }}
>
  {/* content */}
</PullToRefresh>
```

---

## 📋 Pendientes (No Implementadas)

### Alta Prioridad

#### 1. Favoritos Completos
- [ ] Agregar campo `isFavorite` a DynamoDB schema
- [ ] Filtro de favoritos en library
- [ ] Sección de favoritos en home

#### 2. Ordenamiento
- [ ] Dropdown de ordenamiento
- [ ] Por fecha (newest/oldest)
- [ ] Por nombre (A-Z/Z-A)
- [ ] Por tipo

#### 3. Filtros Avanzados
- [ ] Filtros múltiples combinados
- [ ] Chips de filtros activos
- [ ] Clear all filters

### Media Prioridad

#### 4. Visualización Mejorada
- [ ] Checklist interactivo para recetas
- [ ] Temporizador para rutinas
- [ ] Barra de progreso para pendientes
- [ ] Vista de grid alternativa

#### 5. Compartir y Exportar
- [ ] Share button con Web Share API
- [ ] Generar PDF con jsPDF
- [ ] Copiar transcripción al portapapeles
- [ ] Compartir vía WhatsApp/Email

#### 6. Analytics
- [ ] Lambda para tracking de vistas
- [ ] Contador de vistas por item
- [ ] Items más vistos
- [ ] Estadísticas de uso

### Baja Prioridad

#### 7. Colecciones
- [ ] Crear colecciones personalizadas
- [ ] Agregar items a colecciones
- [ ] Compartir colecciones

#### 8. Notificaciones
- [ ] Push notifications cuando item esté listo
- [ ] Email notifications
- [ ] Recordatorios

#### 9. Integraciones
- [ ] YouTube videos
- [ ] Instagram Reels
- [ ] Web articles (scraping)
- [ ] Podcasts

---

## 🎯 Plan de Implementación Recomendado

### Sprint 1 (Esta semana)
1. Desplegar update-item y delete-item Lambdas
2. Implementar UI de editar/eliminar
3. Agregar búsqueda en library
4. Implementar skeleton loaders

### Sprint 2 (Próxima semana)
5. Favoritos completos
6. Pull-to-refresh
7. Ordenamiento

### Sprint 3 (Siguiente)
8. Visualización mejorada
9. Compartir básico
10. Analytics básico

---

## 📝 Notas de Implementación

### Testing
- Probar cada Lambda individualmente antes de desplegar
- Usar Postman/curl para testing de API
- Verificar permisos IAM correctos

### Performance
- Considerar implementar cache con React Query
- Lazy loading para listas largas
- Image optimization con Next.js Image

### UX
- Feedback visual para todas las acciones
- Loading states apropiados
- Error handling con mensajes claros
- Confirmaciones para acciones destructivas

---

**Última actualización**: 14 de Noviembre, 2025
