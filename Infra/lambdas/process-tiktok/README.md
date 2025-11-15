# Process TikTok Lambda - Transcripción con Google Speech-to-Text

## 🎯 Características

- ✅ **60 minutos gratis/mes** - Google Cloud Speech-to-Text
- ✅ **Alta precisión** - Mejor que soluciones offline
- ✅ **Transcripción real** - Convierte audio a texto en español
- ✅ **Enhancement con Bedrock** - Mejora la transcripción con Claude

## 📦 Configuración de Google Cloud

### 1. Crear proyecto
```
1. Ve a: https://console.cloud.google.com
2. Crea proyecto: "mindpocket-transcription"
3. Anota el PROJECT_ID
```

### 2. Activar API
```
1. APIs & Services → Library
2. Busca "Cloud Speech-to-Text API"
3. Click "Enable"
```

### 3. Crear Service Account
```
1. IAM & Admin → Service Accounts
2. Create Service Account
3. Nombre: "mindpocket-transcription"
4. Role: "Cloud Speech Client"
5. Create Key → JSON
6. Descarga el archivo
```

### 4. Configurar en Pulumi
```bash
cd /Users/lorenzoreinoso/Desktop/MindPocket/Infra

# Guardar credenciales como secret
pulumi config set --secret google-credentials-json "$(cat ~/Downloads/tu-archivo-credentials.json)"
```

## 🚀 Despliegue

```bash
# 1. Instalar dependencias
npm install

# 2. Desplegar con Pulumi (desde /Infra)
cd ../..
pulumi up
```

## 🔧 Cómo funciona

1. **Descarga TikTok** → Obtiene audio MP3
2. **Sube a S3** → Guarda el audio
3. **Transcribe con Google** → Speech-to-Text procesa el audio
4. **Mejora con Claude** → Bedrock genera resumen estructurado
5. **Guarda en DynamoDB** → Transcripción completa + resumen

## ⚙️ Configuración

- **Timeout:** 300 segundos (5 min)
- **Memoria:** 512 MB
- **Tier gratuito:** 60 minutos/mes

## 📝 Notas

- Fallback automático si Google Speech falla
- Bedrock mejora la transcripción con contexto
- Soporte para español de México, España y US
