const { DynamoDBClient, DeleteItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const s3Client = new S3Client({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
    console.log('DeleteItem Lambda triggered:', JSON.stringify(event, null, 2));
    
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
                    'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
                },
                body: JSON.stringify({ error: 'Unauthorized' }),
            };
        }

        // Get itemId from path parameters
        const itemId = event.pathParameters?.id;

        if (!itemId) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
                },
                body: JSON.stringify({ error: 'itemId is required' })
            };
        }

        // Get item to check ownership and get S3 keys
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
                    'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
                },
                body: JSON.stringify({ error: 'Item not found' })
            };
        }

        // Delete associated S3 objects if they exist
        const mediaS3Key = existingItem.Item.mediaS3Key?.S;
        if (mediaS3Key) {
            try {
                await s3Client.send(new DeleteObjectCommand({
                    Bucket: process.env.RAW_MEDIA_BUCKET,
                    Key: mediaS3Key
                }));
                console.log('Deleted S3 object:', mediaS3Key);
            } catch (s3Error) {
                console.warn('Failed to delete S3 object:', s3Error.message);
                // Continue with deletion even if S3 cleanup fails
            }
        }

        // Delete item from DynamoDB
        const deleteParams = {
            TableName: process.env.WELLNESS_ITEMS_TABLE,
            Key: {
                userId: { S: userId },
                itemId: { S: itemId }
            }
        };

        await dynamoClient.send(new DeleteItemCommand(deleteParams));
        
        console.log('Item deleted successfully:', itemId);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
            },
            body: JSON.stringify({
                message: 'Item deleted successfully',
                itemId: itemId
            })
        };

    } catch (error) {
        console.error('Error deleting item:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
            },
            body: JSON.stringify({ error: 'Failed to delete item' })
        };
    }
};
