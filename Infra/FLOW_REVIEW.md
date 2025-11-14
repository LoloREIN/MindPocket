# MindPocket - Revisión Completa del Flujo Phase 3

## 🔄 Flujo End-to-End Completo

### **1. Frontend → API Ingestion**
```
Frontend (Amplify) → POST /items/ingest → API Gateway → IngestLambda
```
**✅ Configuración:**
- Amplify env vars: `NEXT_PUBLIC_API_URL` ← **AGREGADO**
- API Gateway route: `POST /items/ingest` ← **CONFIGURADO**
- Cognito JWT autorization ← **CONFIGURADO**
- IngestLambda integration ← **CONFIGURADO**

### **2. Data Persistence & Queue**
```
IngestLambda → DynamoDB (WellnessItems) + SQS (ProcessTikTokQueue)
```
**✅ Configuración:**
- DynamoDB table: `WellnessItems` ← **CONFIGURADO**
- Item structure: `userId (PK), itemId (SK), status, sourceUrl` ← **CONFIGURADO**
- SQS queue: `mindpocket-process-tiktok-queue` ← **CONFIGURADO**
- IAM permissions: DynamoDB PutItem, SQS SendMessage ← **CONFIGURADO**

### **3. Async TikTok Processing**
```
SQS → ProcessTikTokLambda → @tobyg74/tiktok-api-dl → S3 → AWS Transcribe
```
**✅ Configuración:**
- SQS event source mapping ← **CONFIGURADO** (batch size: 1)
- TikTok downloader: `@tobyg74/tiktok-api-dl` ← **CONFIGURADO**
- S3 upload: `raw-media-bucket/${userId}/${itemId}/audio.mp3` ← **CONFIGURADO**
- Transcribe job: `mindpocket-${userId}-${itemId}` ← **CONFIGURADO**
- IAM permissions: S3 PutObject, Transcribe StartJob ← **CONFIGURADO**

### **4. AI-Powered Analysis**
```
S3 (transcripts) → TranscribeCallbackLambda → Claude Sonnet → DynamoDB (enriched)
```
**✅ Configuración:**
- S3 trigger: ObjectCreated on transcripts bucket ← **CONFIGURADO**
- Bedrock client: Claude Sonnet 3 ← **CONFIGURADO**
- Structured prompt: Recipe/Workout/Pending extraction ← **CONFIGURADO**
- DynamoDB updates: `enrichedData`, `type`, `title`, `tags` ← **CONFIGURADO**
- IAM permissions: Bedrock InvokeModel ← **CONFIGURADO**

### **5. Data Retrieval**
```
Frontend → GET /items → API Gateway → GetItemsLambda → DynamoDB
Frontend → GET /items/{id} → API Gateway → GetItemLambda → DynamoDB
```
**✅ Configuración:**
- API routes: `GET /items`, `GET /items/{itemId}` ← **CONFIGURADO**
- Response format: Includes `enrichedData`, `title`, `tags` ← **CONFIGURADO**
- Pagination support: `lastEvaluatedKey` ← **CONFIGURADO**

## 🔧 Variables de Environment - Revisión

### **Amplify App Environment Variables**
```yaml
environmentVariables:
  NODE_ENV: production
  NEXT_PUBLIC_COGNITO_USER_POOL_ID: ${mindpocket-user-pool.id}
  NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID: ${mindpocket-user-pool-client.id}
  NEXT_PUBLIC_COGNITO_REGION: ${aws:region}
  NEXT_PUBLIC_API_URL: ${mindpocket-api.apiEndpoint}      # ← AGREGADO
  NEXT_PUBLIC_API_REGION: ${aws:region}                   # ← AGREGADO
```

### **Lambda Environment Variables**

**IngestLambda:**
```yaml
WELLNESS_ITEMS_TABLE: ${wellness-items-table.name}
PROCESS_TIKTOK_QUEUE_URL: ${process-tiktok-queue.url}
```

**ProcessTikTokLambda:**
```yaml
WELLNESS_ITEMS_TABLE: ${wellness-items-table.name}
RAW_MEDIA_BUCKET: ${raw-media-bucket.id}
TRANSCRIPTS_BUCKET: ${transcripts-bucket.id}
```

**TranscribeCallbackLambda:**
```yaml
WELLNESS_ITEMS_TABLE: ${wellness-items-table.name}
BEDROCK_MODEL_ID: anthropic.claude-3-sonnet-20240229-v1:0
BEDROCK_REGION: us-east-1
```

**GetItems/GetItemLambda:**
```yaml
WELLNESS_ITEMS_TABLE: ${wellness-items-table.name}
```

## 🔍 Puntos de Verificación Críticos

### **1. API Gateway → Lambda Connections**
- ✅ IngestLambda integration & permission
- ✅ GetItemsLambda integration & permission  
- ✅ GetItemLambda integration & permission
- ✅ Cognito JWT authorizer configured

### **2. S3 → Lambda Triggers**
- ✅ TranscribeCallbackLambda S3 notification
- ✅ Lambda permission for S3 to invoke
- ✅ S3 bucket policies for Transcribe service

### **3. SQS → Lambda Event Source**
- ✅ ProcessTikTokLambda event source mapping
- ✅ Batch size: 1 (optimal for heavy processing)
- ✅ Visibility timeout: 360s (6x Lambda timeout)

### **4. IAM Permissions Matrix**

| Lambda | DynamoDB | S3 | SQS | Transcribe | Bedrock |
|--------|----------|----|----|------------|---------|
| IngestLambda | PutItem | - | SendMessage | - | - |
| ProcessTikTokLambda | UpdateItem | PutObject | - | StartJob | - |
| TranscribeCallbackLambda | UpdateItem | GetObject | - | - | InvokeModel |
| GetItemsLambda | Query | - | - | - | - |
| GetItemLambda | GetItem | - | - | - | - |

## 🚨 Posibles Puntos de Falla

### **1. Bedrock Model Access**
**Issue:** Claude Sonnet no habilitado en la región
**Fix:** AWS Console → Bedrock → Model access → Enable Anthropic models

### **2. S3 Bucket Policies**
**Issue:** Transcribe service no puede acceder a buckets
**Fix:** Bucket policies ya configuradas para `transcribe.amazonaws.com`

### **3. SQS Dead Letter Queue**
**Issue:** Mensajes fallan y se pierden
**Fix:** DLQ configurado con `maxReceiveCount: 3`

### **4. Lambda Timeouts**
**Issue:** TranscribeCallbackLambda timeout con análisis de IA
**Fix:** Timeout aumentado a 120s para análisis de Bedrock

### **5. API Gateway CORS**
**Issue:** Frontend no puede hacer requests cross-origin
**Fix:** CORS headers configurados en todas las Lambda responses

## 🧪 Testing del Flujo Completo

### **Test Scenarios:**
1. **Recipe TikTok**: URL → RECIPE con ingredients/steps
2. **Workout TikTok**: URL → WORKOUT con exercises/reps  
3. **Book Recommendation**: URL → PENDING con name/platform
4. **Invalid URL**: URL → ERROR con error message
5. **Bedrock Failure**: Mock → ENRICH_ERROR con fallback

### **Status Progression Validation:**
```
PENDING_DOWNLOAD → MEDIA_STORED → TRANSCRIBING → TRANSCRIBED → ENRICHING → READY
```

### **API Endpoint Testing:**
- `POST /items/ingest` - Con JWT token válido
- `GET /items` - Paginación y filtros
- `GET /items/{id}` - Datos enriquecidos completos

## 📊 Outputs para Frontend

```yaml
outputs:
  # Frontend necesita estos valores
  apiUrl: ${mindpocket-api.apiEndpoint}                    # Para API calls
  cognitoUserPoolId: ${mindpocket-user-pool.id}           # Para auth
  cognitoUserPoolClientId: ${mindpocket-user-pool-client.id} # Para auth
  cognitoRegion: ${aws:region}                             # Para auth
  branchUrl: https://${main-branch.branchName}.${mindpocket-app.id}.amplifyapp.com
```

## ✅ Estado del Flujo

- **Phase 1**: ✅ Core infrastructure (DynamoDB, S3, SQS, Lambda skeletons)
- **Phase 2**: ✅ TikTok processing + Transcribe pipeline  
- **Phase 3**: ✅ AI analysis with Claude Sonnet + enriched data
- **Integration**: ✅ API Gateway ↔ Amplify environment variables

**El flujo está COMPLETO y listo para deployment!** 🚀
