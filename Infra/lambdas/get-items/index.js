const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
    console.log('GetItems Lambda triggered:', JSON.stringify(event, null, 2));
    
    try {
        // Extract userId from Cognito JWT claims
        const userId = event.requestContext?.authorizer?.claims?.sub;
        if (!userId) {
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

        // Query parameters for pagination and filtering
        const queryParams = event.queryStringParameters || {};
        const limit = parseInt(queryParams.limit) || 50;
        const lastEvaluatedKey = queryParams.lastKey ? JSON.parse(decodeURIComponent(queryParams.lastKey)) : undefined;

        // Query DynamoDB for user's items
        const queryCommandParams = {
            TableName: process.env.WELLNESS_ITEMS_TABLE,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': { S: userId }
            },
            Limit: limit,
            ScanIndexForward: false, // Sort by itemId descending (newest first)
        };

        if (lastEvaluatedKey) {
            queryCommandParams.ExclusiveStartKey = lastEvaluatedKey;
        }

        const result = await dynamoClient.send(new QueryCommand(queryCommandParams));
        
        // Transform DynamoDB items to plain objects
        const items = result.Items?.map(item => ({
            userId: item.userId?.S,
            itemId: item.itemId?.S,
            sourceUrl: item.sourceUrl?.S,
            status: item.status?.S,
            type: item.type?.S,
            createdAt: item.createdAt?.S,
            updatedAt: item.updatedAt?.S
        })) || [];

        // Prepare response
        const response = {
            items,
            count: items.length,
            lastEvaluatedKey: result.LastEvaluatedKey
        };

        if (result.LastEvaluatedKey) {
            response.nextPageToken = encodeURIComponent(JSON.stringify(result.LastEvaluatedKey));
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,OPTIONS'
            },
            body: JSON.stringify(response)
        };

    } catch (error) {
        console.error('Error in GetItems Lambda:', error);
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
