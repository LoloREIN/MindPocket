#!/bin/bash

# Script para instalar dependencias de las lambdas de notificaciones

set -e

echo "📦 Instalando dependencias para Lambda: weekly-summary..."
cd lambdas/weekly-summary
npm install
echo "✅ Dependencias de weekly-summary instaladas"

echo ""
echo "📦 Instalando dependencias para Lambda: daily-recommendations..."
cd ../daily-recommendations
npm install
echo "✅ Dependencias de daily-recommendations instaladas"

echo ""
echo "🎉 ¡Todas las dependencias instaladas correctamente!"
echo ""
echo "Próximos pasos:"
echo "1. Verifica tu email en AWS SES:"
echo "   aws ses verify-email-identity --email-address tu-email@ejemplo.com --region us-east-1"
echo ""
echo "2. Configura el email en Pulumi:"
echo "   pulumi config set ses:fromEmail 'MindPocket <tu-email@ejemplo.com>'"
echo ""
echo "3. Despliega con Pulumi:"
echo "   pulumi up"
