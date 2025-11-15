const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

// Helper function to convert DynamoDB format to JavaScript values
function fromDynamoDBValue(value) {
    if (!value) return null;
    
    if (value.S !== undefined) return value.S;
    if (value.N !== undefined) return Number(value.N);
    if (value.BOOL !== undefined) return value.BOOL;
    if (value.NULL !== undefined) return null;
    
    if (value.L !== undefined) {
        return value.L.map(item => fromDynamoDBValue(item));
    }
    
    if (value.M !== undefined) {
        const obj = {};
        for (const [k, v] of Object.entries(value.M)) {
            obj[k] = fromDynamoDBValue(v);
        }
        return obj;
    }
    
    return null;
}

exports.handler = async (event) => {
    console.log('GetItem Lambda triggered:', JSON.stringify(event, null, 2));
    
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
                    'Access-Control-Allow-Methods': 'GET,OPTIONS'
                },
                body: JSON.stringify({ error: 'Unauthorized' })
            };
        }

        // Extract itemId from path parameters
        const itemId = event.pathParameters?.itemId;
        if (!itemId) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,OPTIONS'
                },
                body: JSON.stringify({ error: 'itemId is required' })
            };
        }

        // Get item from DynamoDB
        const getItemParams = {
            TableName: process.env.WELLNESS_ITEMS_TABLE,
            Key: {
                userId: { S: userId },
                itemId: { S: itemId }
            }
        };

        const result = await dynamoClient.send(new GetItemCommand(getItemParams));
        
        if (!result.Item) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,OPTIONS'
                },
                body: JSON.stringify({ error: 'Item not found' })
            };
        }

        // Transform DynamoDB item to plain object
        const item = {
            userId: result.Item?.userId?.S,
            itemId: result.Item?.itemId?.S,
            sourceUrl: result.Item?.sourceUrl?.S,
            status: result.Item?.status?.S,
            type: result.Item?.type?.S,
            title: result.Item?.title?.S,
            notes: result.Item?.notes?.S,  // Optional notes/tips for UI
            tags: fromDynamoDBValue(result.Item?.tags) || [],
            transcriptPreview: result.Item?.transcriptPreview?.S,
            transcriptFull: result.Item?.transcriptFull?.S,
            transcript: result.Item?.transcriptFull?.S,  // Alias for frontend compatibility
            transcriptConfidence: result.Item?.transcriptConfidence?.S,
            transcriptS3Key: result.Item?.transcriptS3Key?.S,
            enrichedData: fromDynamoDBValue(result.Item?.enrichedData),
            mediaS3Key: result.Item?.mediaS3Key?.S,
            transcriptionJobName: result.Item?.transcriptionJobName?.S,
            errorMessage: result.Item?.errorMessage?.S,
            createdAt: result.Item?.createdAt?.S,
            updatedAt: result.Item?.updatedAt?.S
        };

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,OPTIONS'
            },
            body: JSON.stringify(item)
        };

    } catch (error) {
        console.error('Error in GetItem Lambda:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,OPTIONS'
            },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
