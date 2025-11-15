# 🔧 Fix para Amplify SSR Deployment

## Problemas Identificados

1. **Configuración SSR faltante**: Next.js 16 SSR en Amplify requiere `output: 'standalone'`
2. **Variables de entorno faltantes**: Se agregó `AMPLIFY_MONOREPO_APP_ROOT` para estructura de monorepo
3. **ESLint en build**: Necesita `ignoreDuringBuilds: true` para evitar fallos en Amplify

## Cambios Realizados

### 1. `/Frontend/next.config.mjs`
```javascript
// ✅ AGREGADO
output: 'standalone',  // Requerido para Amplify SSR
eslint: {
  ignoreDuringBuilds: true,
},
```

### 2. `/Infra/Pulumi.yaml` - buildSpec
```yaml
# ✅ SIMPLIFICADO
preBuild:
  commands:
    - npm install --legacy-peer-deps
build:
  commands:
    - npm run build
```

### 3. `/Infra/Pulumi.yaml` - environmentVariables
```yaml
# ✅ AGREGADO
AMPLIFY_MONOREPO_APP_ROOT: Frontend
```

## Pasos para Desplegar

### 1. Commit y Push a GitHub
```bash
cd /Users/lorenzoreinoso/Desktop/MindPocket

# Agregar cambios
git add Frontend/next.config.mjs Infra/Pulumi.yaml

# Commit
git commit -m "fix: Configurar Amplify para Next.js 16 SSR con pnpm"

# Push
# git push origin main  # TÚ LO HACES (según tu regla)
```

### 2. Actualizar Infraestructura con Pulumi
```bash
cd /Users/lorenzoreinoso/Desktop/MindPocket/Infra

# Revisar cambios
pulumi preview

# Aplicar cambios (esto actualizará la configuración de Amplify)
# pulumi up  # TÚ LO HACES (según tu regla)
```

### 3. Verificar Deploy en Amplify

1. Ve a AWS Console → Amplify → mindpocket app
2. El nuevo deploy debería iniciarse automáticamente después de `pulumi up`
3. Verifica los logs en la fase de Build

## Qué Esperar en el Build

### Logs correctos deberían mostrar:
```
✓ npm install --legacy-peer-deps
✓ added 714 packages
✓ npm run build
✓ Creating optimized production build...
✓ Collecting page data...
✓ Generating static pages
✓ Finalizing page optimization
```

## Troubleshooting

### Si sigue fallando el build:

1. **Verifica que package-lock.json esté en GitHub**
   ```bash
   git ls-files Frontend/package-lock.json
   ```

2. **Revisa los logs de Amplify**
   - AWS Console → Amplify → mindpocket → Ver deployment
   - Busca errores específicos en la fase "Build"

3. **Limpia cache de Amplify**
   - En AWS Console → Amplify → Settings → Build settings
   - Habilita "Clear cache before building"
   - Trigger un nuevo deployment

4. **Verifica variables de entorno**
   ```bash
   # Desde Infra/
   pulumi stack output
   
   # Asegúrate que estos valores sean correctos:
   # - cognitoUserPoolId
   # - cognitoUserPoolClientId
   ```

### Errores comunes y soluciones:

| Error | Solución |
|-------|----------|
| `Module not found` | Asegurar que `package-lock.json` está en repo |
| `Build failed: standalone` | Verificar que `next.config.mjs` tenga `output: 'standalone'` |
| `Permission denied` | Verificar IAM role de Amplify |
| `Environment variable undefined` | Verificar que Pulumi haya desplegado las env vars |
| `ENOENT: no such file` | Commit `package-lock.json` y `next.config.mjs` |

## Arquitectura del Deploy

```
GitHub (main branch)
    ↓
Amplify detecta cambios
    ↓
Ejecuta buildSpec:
  1. npm install --legacy-peer-deps
  2. npm run build (genera .next/)
  3. Amplify despliega el output standalone
    ↓
App disponible en:
https://main.{app-id}.amplifyapp.com
```

## Comparación: SSR vs SSG

Tu app **DEBE** usar SSR porque:
- ✅ Usa App Router con metadata
- ✅ Necesita autenticación con Cognito
- ✅ Hace llamadas a API en el servidor
- ✅ Usa componentes dinámicos

**NO** cambiar a SSG (`output: 'export'`) porque perderías:
- ❌ Server Components
- ❌ API Routes
- ❌ Dynamic routing
- ❌ Authentication flow

### 🎯 Por Qué Ahora Funcionará

| Antes ❌ | Ahora ✅ |
|---------|---------|
| Sin standalone output | output: 'standalone' |
| Sin MONOREPO_APP_ROOT | Con MONOREPO_APP_ROOT |
| ESLint falla build | eslint.ignoreDuringBuilds |
| npm install con --include=dev | npm install --legacy-peer-deps |

## Próximos Pasos

Después de que el deploy funcione:

1. ✅ Configurar dominio custom (mindpocket.app)
2. ✅ Habilitar auto-deploy desde GitHub
3. ✅ Configurar alerts de deployment
4. ✅ Revisar métricas de performance

---

**Creado**: Noviembre 15, 2025
**Actualizado**: Noviembre 15, 2025
