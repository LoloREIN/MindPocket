# 🧠 MindPocket

> Tu asistente personal inteligente para organizar contenido de wellness desde TikTok

MindPocket es una aplicación fullstack que te permite guardar y organizar TikToks de bienestar, clasificándolos automáticamente en recetas, rutinas de ejercicio, y contenido pendiente usando IA. El sistema transcribe el audio, clasifica el contenido y extrae información estructurada automáticamente.

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![AWS](https://img.shields.io/badge/AWS-Serverless-orange)](https://aws.amazon.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

## ✨ Características

### 🎯 Funcionalidades Principales

- **📥 Ingesta Automática**: Pega un link de TikTok y el sistema se encarga del resto
- **🎤 Transcripción Real**: Google Speech-to-Text convierte el audio a texto en español
- **🤖 Clasificación Inteligente**: Claude AI clasifica el contenido automáticamente
- **📊 Extracción Estructurada**: Extrae ingredientes, pasos, ejercicios, y más
- **🏷️ Tags Automáticos**: Genera etiquetas relevantes para cada pieza de contenido
- **🔍 Biblioteca Organizada**: Filtra por tipo, búsqueda y estado de procesamiento
- **📱 Mobile-First**: Diseñado para una experiencia móvil óptima
- **🔐 Autenticación Segura**: AWS Cognito para manejo seguro de usuarios

### 🎨 Dashboard Inteligente

- **Contadores por Categoría**: Visualiza cuántas recetas, rutinas y pendientes tienes
- **Estadísticas en Tiempo Real**: Total de links y items en proceso
- **Recomendaciones Diarias**: Sugerencias aleatorias para inspirarte

### 📚 Sistema de Clasificación

El sistema clasifica automáticamente en:
- 🍳 **Recetas**: Extrae ingredientes, pasos, tiempo y porciones
- 💪 **Rutinas**: Identifica ejercicios, repeticiones, series y duración
- 📖 **Pendientes**: Libros, películas, cursos para consumir después
- ✨ **Otros**: Contenido general que no encaja en las categorías anteriores

## 🏗️ Arquitectura

### Stack Tecnológico

#### Frontend
```
├── Next.js 16 (React 19)
├── TypeScript
├── TailwindCSS
├── Shadcn/ui (componentes)
├── AWS Amplify (hosting + auth)
└── Lucide Icons
```

#### Backend (AWS Serverless)
```
├── API Gateway (REST API con JWT)
├── Lambda Functions (Node.js 20)
├── DynamoDB (base de datos NoSQL)
├── S3 (almacenamiento de audio)
├── SQS (cola de procesamiento)
├── Cognito (autenticación)
├── Bedrock (Claude AI)
└── Google Cloud Speech-to-Text
```

#### Infrastructure as Code
```
└── Pulumi (TypeScript/YAML)
```

### Diagrama de Arquitectura

```
┌─────────────┐
│   Usuario   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│         Frontend (Next.js + Amplify)     │
│  • Dashboard con métricas                │
│  • Biblioteca con filtros                │
│  • Detalle de items                      │
└──────┬──────────────────────────────────┘
       │
       │ HTTPS/JWT
       ▼
┌─────────────────────────────────────────┐
│      API Gateway + Cognito JWT Auth     │
└──────┬──────────────────────────────────┘
       │
       ├─── GET /items ──────────┐
       ├─── GET /items/{id} ─────┤
       ├─── POST /ingest-link ───┤
       ├─── PUT /items/{id} ─────┤
       └─── DELETE /items/{id} ──┤
                                  │
                ┌─────────────────┴────────────────────┐
                │                                      │
                ▼                                      ▼
    ┌──────────────────┐              ┌──────────────────────┐
    │  Lambda Functions │              │      DynamoDB        │
    │                   │◄────────────►│  wellness_items      │
    │  • get-items     │              │  • userId (PK)       │
    │  • get-item      │              │  • itemId (SK)       │
    │  • ingest-link   │              │  • type, status      │
    │  • update-item   │              │  • transcript        │
    │  • delete-item   │              │  • enrichedData      │
    └────────┬─────────┘              └──────────────────────┘
             │
             │ Enqueue
             ▼
    ┌──────────────────┐
    │   SQS Queue      │
    │ process-tiktok   │
    └────────┬─────────┘
             │
             │ Trigger
             ▼
    ┌──────────────────────────────────┐
    │  process-tiktok Lambda           │
    │                                   │
    │  1. Download audio from TikTok   │
    │  2. Upload to S3                 │
    │  3. Transcribe (Google Speech)   │
    │  4. Classify & Enrich (Claude)   │
    │  5. Update DynamoDB              │
    └──────┬───────────────────────────┘
           │
           ├──► S3 (audio files)
           │
           ├──► Google Cloud Speech-to-Text
           │
           └──► AWS Bedrock (Claude AI)
```

## 🚀 Instalación

### Prerrequisitos

- Node.js 20+
- npm o yarn
- AWS CLI configurado
- Pulumi CLI
- Cuenta de AWS
- Cuenta de Google Cloud (para Speech-to-Text)

### 1. Clonar el Repositorio

```bash
git clone https://github.com/LoloREIN/MindPocket.git
cd MindPocket
```

### 2. Configurar Backend

#### Instalar Pulumi
```bash
# macOS
brew install pulumi

# Windows
choco install pulumi

# Linux
curl -fsSL https://get.pulumi.com | sh
```

#### Configurar Credenciales de Google Cloud

1. Crear proyecto en Google Cloud Console
2. Activar Speech-to-Text API
3. Crear Service Account con rol "Cloud Speech Client"
4. Descargar credenciales JSON

```bash
cd Infra
pulumi config set --secret google-credentials-json "$(cat ~/path/to/credentials.json)"
```

#### Desplegar Infraestructura

```bash
cd Infra
npm install -g @pulumi/pulumi

# Preview cambios
pulumi preview

# Desplegar
pulumi up
```

Esto creará:
- ✅ API Gateway con endpoints REST
- ✅ 7 Lambdas functions
- ✅ DynamoDB table
- ✅ 2 S3 buckets
- ✅ SQS queue + DLQ
- ✅ Cognito User Pool
- ✅ IAM roles y policies
- ✅ Amplify App

### 3. Configurar Frontend

#### Variables de Entorno

Crea `.env.local` en `/Frontend`:

```bash
NEXT_PUBLIC_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_COGNITO_REGION=us-east-1
```

#### Instalar Dependencias

```bash
cd Frontend
npm install
```

#### Ejecutar en Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

#### Build y Deploy

El frontend se despliega automáticamente con Amplify al hacer push a `main`:

```bash
git add .
git commit -m "Update frontend"
git push origin main
```

## 📖 Guía de Uso

### 1. Registro y Login

1. Visita la aplicación
2. Regístrate con email y contraseña
3. Verifica tu email
4. Inicia sesión

### 2. Agregar TikToks

1. **Desde el Home**: Click en el botón ➕ en el header
2. **Pega el link** del TikTok
3. **Espera**: El sistema procesará automáticamente

```
Flujo de Procesamiento:
Usuario → Pega link → [5-15 segundos] → Contenido listo
```

### 3. Explorar Contenido

#### Dashboard (Home)
- **Bloques de categorías**: Click para ver todos de ese tipo
- **Estadísticas**: Total de links y items en proceso
- **Recomendaciones**: Suggestions diarias aleatorias

#### Biblioteca (Library)
- **Filtros**: Todos, En proceso, Recetas, Rutinas, Pendientes
- **Búsqueda**: (próximamente)
- **Click en item**: Ver detalle completo

#### Detalle de Item
- **Transcripción completa** del audio
- **Datos estructurados** (ingredientes, ejercicios, etc.)
- **Tags automáticos**
- **Link al TikTok original**

## 🔧 Configuración Avanzada

### DynamoDB Schema

```javascript
{
  "userId": "string",        // Partition Key
  "itemId": "string",        // Sort Key (UUID)
  "type": "string",          // recipe | workout | pending | other | UNKNOWN
  "status": "string",        // PENDING_DOWNLOAD | MEDIA_STORED | TRANSCRIBING | ENRICHING | COMPLETED | READY | ERROR
  "sourceUrl": "string",
  "title": "string",
  "tags": ["string"],
  "transcript": "string",
  "enrichedData": {
    "recipe": {
      "name": "string",
      "ingredients": [{ "item": "string", "quantity": "string" }],
      "steps": ["string"],
      "time_minutes": number,
      "servings": number,
      "difficulty": "string"
    },
    "workout": {
      "name": "string",
      "duration_minutes": number,
      "level": "string",
      "focus": ["string"],
      "blocks": [{
        "exercise": "string",
        "reps": "string",
        "sets": number,
        "notes": "string"
      }]
    },
    "pending": {
      "category": "movie | book | course | other",
      "name": "string",
      "author": "string",
      "description": "string"
    }
  },
  "isFavorite": boolean,
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

### Variables de Entorno Lambda

```bash
WELLNESS_ITEMS_TABLE=WellnessItems
RAW_MEDIA_BUCKET=mindpocket-raw-media-...
TRANSCRIPTS_BUCKET=mindpocket-transcripts-...
PROCESS_TIKTOK_QUEUE_URL=https://sqs...
GOOGLE_CREDENTIALS_JSON={"type":"service_account"...}
```

### Timeouts y Límites

```yaml
Lambda Timeouts:
  - get-items: 30s
  - get-item: 30s
  - ingest-link: 30s
  - process-tiktok: 300s (5 min)
  - update-item: 30s
  - delete-item: 30s

Lambda Memory:
  - Standard: 256 MB
  - process-tiktok: 512 MB

SQS:
  - Visibility Timeout: 360s
  - Max Receive Count: 3
```

## 🧪 Testing

### Backend (Lambdas)

```bash
cd Infra/lambdas/get-items
npm test  # (cuando se implementen)
```

### Frontend

```bash
cd Frontend
npm run test  # (cuando se implementen)
```

### Testing Manual

#### Test de Ingesta
```bash
curl -X POST https://your-api.execute-api.us-east-1.amazonaws.com/ingest-link \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sourceUrl": "https://www.tiktok.com/@user/video/123"}'
```

## 📊 Monitoreo

### CloudWatch Metrics

- Lambda invocations
- Error rates
- Duration
- SQS queue depth

### Logs

```bash
# Ver logs de un Lambda
aws logs tail /aws/lambda/mindpocket-process-tiktok --follow

# Ver logs de API Gateway
aws logs tail /aws/apigateway/mindpocket-api --follow
```

## 🔐 Seguridad

### Autenticación
- **JWT tokens** con AWS Cognito
- **Refresh tokens** automático
- **Session management** con Amplify

### Autorización
- Cada request valida el `userId` del token JWT
- Los usuarios solo pueden ver/editar sus propios items
- API Gateway valida tokens antes de invocar Lambdas

### Datos Sensibles
- **Credenciales de Google**: Almacenadas como secrets en Pulumi
- **Variables de entorno**: Encriptadas en Lambda
- **Tokens**: Solo en memoria del cliente, nunca en localStorage

## 🚧 Roadmap

### Próximas Funcionalidades

#### Alta Prioridad
- [ ] Búsqueda full-text en biblioteca
- [ ] Editar y eliminar items desde el UI
- [ ] Favoritos
- [ ] Skeleton loaders
- [ ] Pull-to-refresh

#### Media Prioridad
- [ ] Temporizador para rutinas
- [ ] Checklist para recetas
- [ ] Progreso de pendientes
- [ ] Compartir items
- [ ] Exportar a PDF
- [ ] Colecciones personalizadas

#### Baja Prioridad
- [ ] Soporte para YouTube
- [ ] Soporte para Instagram Reels
- [ ] Recomendaciones basadas en ML
- [ ] Analytics avanzado
- [ ] Modo offline completo

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la Branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es privado y propietario.

## 👥 Autores

- **Lorenzo Reinoso** - [LoloREIN](https://github.com/LoloREIN)

## 🙏 Agradecimientos

- TikTok por la inspiración
- AWS por la infraestructura serverless
- Google Cloud por Speech-to-Text
- Anthropic Claude por la clasificación inteligente
- La comunidad de Next.js y React

## 📞 Soporte

Para reportar bugs o sugerir features, abre un Issue en GitHub.

---

**Hecho con ❤️ para organizar tu contenido de wellness**