const { DynamoDBClient, UpdateItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
    console.log('UpdateItem Lambda triggered:', JSON.stringify(event, null, 2));
    
    try {
        // Extract userId from JWT claims
        const userId = event.requestContext?.authorizer?.claims?.sub || 
                      event.requestContext?.authorizer?.jwt?.claims?.sub;
        
        if (!userId) {
            return {
                statusCode: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'PUT,OPTIONS'
                },
                body: JSON.stringify({ error: 'Unauthorized' }),
            };
        }

        // Parse request body
        const body = JSON.parse(event.body || '{}');
        const { itemId, title, tags, type, isFavorite } = body;

        if (!itemId) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'PUT,OPTIONS'
                },
                body: JSON.stringify({ error: 'itemId is required' })
            };
        }

        // Verify item exists and belongs to user
        const getParams = {
            TableName: process.env.WELLNESS_ITEMS_TABLE,
            Key: {
                userId: { S: userId },
                itemId: { S: itemId }
            }
        };

        const existingItem = await dynamoClient.send(new GetItemCommand(getParams));
        
        if (!existingItem.Item) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'PUT,OPTIONS'
                },
                body: JSON.stringify({ error: 'Item not found' })
            };
        }

        // Build update expression
        const updateExpressions = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {
            ':updatedAt': { S: new Date().toISOString() }
        };

        if (title !== undefined) {
            updateExpressions.push('#title = :title');
            expressionAttributeNames['#title'] = 'title';
            expressionAttributeValues[':title'] = { S: title };
        }

        if (tags !== undefined) {
            updateExpressions.push('#tags = :tags');
            expressionAttributeNames['#tags'] = 'tags';
            expressionAttributeValues[':tags'] = { L: tags.map(t => ({ S: t })) };
        }

        if (type !== undefined) {
            updateExpressions.push('#type = :type');
            expressionAttributeNames['#type'] = 'type';
            expressionAttributeValues[':type'] = { S: type };
        }

        if (isFavorite !== undefined) {
            updateExpressions.push('#isFavorite = :isFavorite');
            expressionAttributeNames['#isFavorite'] = 'isFavorite';
            expressionAttributeValues[':isFavorite'] = { BOOL: isFavorite };
        }

        updateExpressions.push('#updatedAt = :updatedAt');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';

        // Update item
        const updateParams = {
            TableName: process.env.WELLNESS_ITEMS_TABLE,
            Key: {
                userId: { S: userId },
                itemId: { S: itemId }
            },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW'
        };

        const result = await dynamoClient.send(new UpdateItemCommand(updateParams));
        
        console.log('Item updated successfully:', itemId);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'PUT,OPTIONS'
            },
            body: JSON.stringify({
                message: 'Item updated successfully',
                item: result.Attributes
            })
        };

    } catch (error) {
        console.error('Error updating item:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'PUT,OPTIONS'
            },
            body: JSON.stringify({ error: 'Failed to update item' })
        };
    }
};
