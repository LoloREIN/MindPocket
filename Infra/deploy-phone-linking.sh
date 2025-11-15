#!/bin/bash

# Script para desplegar vinculación por número de teléfono
set -e

echo "🚀 Desplegando vinculación de Telegram con número de teléfono"
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Paso 1: Instalar dependencias del bot
echo -e "${BLUE}📦 Paso 1/5: Instalando dependencias del bot...${NC}"
cd lambdas/telegram-webhook
npm install
cd ../..
echo -e "${GREEN}✅ Dependencias instaladas${NC}"
echo ""

# Paso 2: Desplegar infraestructura (solo si no existe DEFAULT_USER_ID)
echo -e "${BLUE}🏗️  Paso 2/5: Desplegando infraestructura...${NC}"
echo "   → Creando tabla TelegramUserMappings"
echo "   → Actualizando permisos IAM"
echo "   → Configurando variables de entorno"
echo ""
echo "⚠️  Ejecuta: pulumi up"
echo ""
read -p "¿Ya ejecutaste 'pulumi up'? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${YELLOW}Por favor ejecuta 'pulumi up' y vuelve a ejecutar este script${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Infraestructura desplegada${NC}"
echo ""

# Paso 3: Preguntar si quiere reemplazar el código
echo -e "${BLUE}🔄 Paso 3/5: Reemplazando código del bot...${NC}"
echo ""
echo "Opciones:"
echo "  1) Usar vinculación por teléfono (recomendado para producción)"
echo "  2) Mantener DEFAULT_USER_ID (actual - solo para ti)"
echo ""
read -p "¿Qué opción prefieres? (1/2): " option
echo ""

if [ "$option" = "1" ]; then
    echo "📝 Reemplazando código..."
    cd lambdas/telegram-webhook
    
    # Backup del código actual
    if [ -f "index.js" ]; then
        cp index.js index-backup-$(date +%Y%m%d-%H%M%S).js
        echo "   → Backup creado"
    fi
    
    # Copiar nuevo código
    cp index-with-phone.js index.js
    echo "   → Código actualizado"
    
    cd ../..
    echo -e "${GREEN}✅ Código reemplazado${NC}"
    echo ""
    
    echo -e "${YELLOW}⚠️  IMPORTANTE: Ahora ejecuta 'pulumi up' para desplegar el nuevo código${NC}"
    echo ""
    read -p "¿Ya ejecutaste 'pulumi up'? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]
    then
        echo -e "${YELLOW}Por favor ejecuta 'pulumi up' para desplegar el nuevo código${NC}"
        exit 1
    fi
else
    echo "Manteniendo configuración actual con DEFAULT_USER_ID"
fi

echo -e "${GREEN}✅ Deployment completado${NC}"
echo ""

# Paso 4: Verificar deployment
echo -e "${BLUE}🔍 Paso 4/5: Verificando deployment...${NC}"

# Verificar tabla
echo "   → Verificando tabla TelegramUserMappings..."
if aws dynamodb describe-table --table-name TelegramUserMappings --region us-east-1 &> /dev/null; then
    echo -e "      ${GREEN}✓${NC} Tabla creada"
else
    echo -e "      ${YELLOW}⚠${NC} Tabla no encontrada"
fi

# Verificar Lambda
echo "   → Verificando Lambda telegram-webhook..."
if aws lambda get-function --function-name mindpocket-telegram-webhook --region us-east-1 &> /dev/null; then
    echo -e "      ${GREEN}✓${NC} Lambda desplegada"
    
    # Verificar variables de entorno
    ENV_VARS=$(aws lambda get-function-configuration --function-name mindpocket-telegram-webhook --region us-east-1 --query 'Environment.Variables' --output json)
    
    if echo "$ENV_VARS" | grep -q "TELEGRAM_USERS_TABLE"; then
        echo -e "      ${GREEN}✓${NC} Variable TELEGRAM_USERS_TABLE configurada"
    else
        echo -e "      ${YELLOW}⚠${NC} Variable TELEGRAM_USERS_TABLE no encontrada"
    fi
    
    if echo "$ENV_VARS" | grep -q "COGNITO_USER_POOL_ID"; then
        echo -e "      ${GREEN}✓${NC} Variable COGNITO_USER_POOL_ID configurada"
    else
        echo -e "      ${YELLOW}⚠${NC} Variable COGNITO_USER_POOL_ID no encontrada"
    fi
else
    echo -e "      ${YELLOW}⚠${NC} Lambda no encontrada"
fi

echo ""
echo -e "${GREEN}✅ Verificación completada${NC}"
echo ""

# Paso 5: Instrucciones de prueba
echo -e "${BLUE}🧪 Paso 5/5: Probar el flujo completo${NC}"
echo ""
echo "Para probar la vinculación:"
echo ""
echo "1️⃣  En el FRONTEND (web):"
echo "   • Regístrate con un nuevo usuario"
echo "   • Usa tu número de teléfono en formato: +521234567890"
echo "   • Verifica tu email y completa el registro"
echo ""
echo "2️⃣  En TELEGRAM:"
echo "   • Abre el bot: @MindBucketBot"
echo "   • Envía: /link"
echo "   • Presiona el botón 'Compartir mi número'"
echo "   • Acepta compartir tu contacto"
echo "   • Deberías ver: ✅ ¡Cuenta vinculada!"
echo ""
echo "3️⃣  Prueba con un TIKTOK:"
echo "   • Envía un link de TikTok al bot"
echo "   • Espera 1-2 minutos"
echo "   • Refresca tu dashboard web"
echo "   • ¡El TikTok debería aparecer!"
echo ""
echo -e "${GREEN}🎉 ¡Deployment completado exitosamente!${NC}"
echo ""
echo "📚 Para más información, consulta: PHONE_LINKING_GUIDE.md"
echo ""
