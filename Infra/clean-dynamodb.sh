#!/bin/bash

# Script para limpiar todos los items de DynamoDB

TABLE_NAME="WellnessItems"
USER_ID="d4280448-a0d1-70f3-08cd-319089b00c51"

echo "🗑️  Limpiando items de DynamoDB..."

# Obtener todos los items del usuario
ITEMS=$(aws dynamodb query \
  --table-name $TABLE_NAME \
  --key-condition-expression "userId = :userId" \
  --expression-attribute-values '{":userId":{"S":"'$USER_ID'"}}' \
  --projection-expression "itemId" \
  --output json | jq -r '.Items[].itemId.S')

# Eliminar cada item
for ITEM_ID in $ITEMS; do
  echo "Eliminando item: $ITEM_ID"
  aws dynamodb delete-item \
    --table-name $TABLE_NAME \
    --key '{"userId":{"S":"'$USER_ID'"},"itemId":{"S":"'$ITEM_ID'"}}'
done

echo "✅ Base de datos limpiada"
