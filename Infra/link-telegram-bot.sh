#!/bin/bash

# Script para vincular el bot de Telegram con tu cuenta de MindPocket
# Uso: ./link-telegram-bot.sh <YOUR_COGNITO_USER_ID>

set -e

if [ -z "$1" ]; then
    echo ""
    echo "❌ Error: Debes proporcionar tu userId de Cognito"
    echo ""
    echo "📋 Para obtener tu userId:"
    echo "   1. Abre tu dashboard de MindPocket en el navegador"
    echo "   2. Abre la consola de desarrollador (F12)"
    echo "   3. Ve a la tab 'Console'"
    echo "   4. Pega este código:"
    echo ""
    echo "      import('aws-amplify/auth').then(({ fetchAuthSession }) => "
    echo "        fetchAuthSession().then(session => {"
    echo "          const userId = session.tokens?.idToken?.payload?.sub;"
    echo "          console.log('======================');"
    echo "          console.log('TU USER ID:', userId);"
    echo "          console.log('======================');"
    echo "        })"
    echo "      )"
    echo ""
    echo "   5. Copia el userId y ejecuta:"
    echo "      ./link-telegram-bot.sh <TU_USER_ID>"
    echo ""
    exit 1
fi

USER_ID="$1"

echo "🔗 Vinculando bot de Telegram con usuario: $USER_ID"
echo ""

# Configurar el userId en Pulumi
echo "📝 Configurando Pulumi..."
pulumi config set telegram:defaultUserId "$USER_ID"

echo "✅ Configuración guardada"
echo ""
echo "⚠️  IMPORTANTE: Recuerda desplegar los cambios:"
echo "   pulumi up"
echo ""
echo "Después de desplegar:"
echo "   1. Envía un link de TikTok al bot"
echo "   2. Espera 1-2 minutos"
echo "   3. Refresca tu dashboard web"
echo "   4. ¡El item debería aparecer!"
echo ""
