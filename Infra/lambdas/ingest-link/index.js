const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { v4: uuidv4 } = require('uuid');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
    console.log('IngestLink Lambda triggered:', JSON.stringify(event, null, 2));
    
    try {
        // Extract userId from Cognito JWT claims
        console.log('Authorizer context:', event.requestContext?.authorizer);
        console.log('JWT claims:', event.requestContext?.authorizer?.claims);
        
        const userId = event.requestContext?.authorizer?.claims?.sub 
                    || event.requestContext?.authorizer?.jwt?.claims?.sub;
        
        console.log('Extracted userId:', userId);
        
        if (!userId) {
            console.error('No userId found in token claims');
            return {
                statusCode: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS'
                },
                body: JSON.stringify({ error: 'Unauthorized' })
            };
        }

        // Parse request body
        const body = JSON.parse(event.body || '{}');
        const { sourceUrl } = body;
        
        if (!sourceUrl) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS'
                },
                body: JSON.stringify({ error: 'sourceUrl is required' })
            };
        }

        // Generate itemId
        const itemId = uuidv4();
        const now = new Date().toISOString();

        // Create item in DynamoDB
        const putItemParams = {
            TableName: process.env.WELLNESS_ITEMS_TABLE,
            Item: {
                userId: { S: userId },
                itemId: { S: itemId },
                sourceUrl: { S: sourceUrl },
                status: { S: 'PENDING_DOWNLOAD' },
                type: { S: 'UNKNOWN' },
                createdAt: { S: now },
                updatedAt: { S: now }
            }
        };

        await dynamoClient.send(new PutItemCommand(putItemParams));
        console.log('Item created in DynamoDB:', itemId);

        // Send message to SQS
        const sqsMessage = {
            QueueUrl: process.env.PROCESS_TIKTOK_QUEUE_URL,
            MessageBody: JSON.stringify({
                userId,
                itemId,
                sourceUrl,
                timestamp: now
            })
        };

        await sqsClient.send(new SendMessageCommand(sqsMessage));
        console.log('Message sent to SQS for processing');

        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'POST,OPTIONS'
            },
            body: JSON.stringify({
                itemId,
                status: 'PENDING_DOWNLOAD',
                message: 'Item queued for processing'
            })
        };

    } catch (error) {
        console.error('Error in IngestLink Lambda:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'POST,OPTIONS'
            },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
