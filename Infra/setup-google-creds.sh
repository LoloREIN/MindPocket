#!/bin/bash

# Script para configurar credenciales de Google Cloud en Pulumi

cd "$(dirname "$0")"

# Leer el archivo JSON y configurarlo como secret
pulumi config set --secret google-credentials-json "$(cat ../linen-works-470420-a8-55808be5bd64.json)"

echo "✅ Credenciales de Google Cloud configuradas correctamente"
