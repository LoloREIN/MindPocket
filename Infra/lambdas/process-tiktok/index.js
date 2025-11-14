const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
    console.log('ProcessTikTok Lambda triggered:', JSON.stringify(event, null, 2));
    
    try {
        // Process each SQS record
        for (const record of event.Records) {
            const messageBody = JSON.parse(record.body);
            console.log('Processing message:', messageBody);
            
            const { userId, itemId, sourceUrl } = messageBody;
            
            // Phase 1: Just update status to show processing started
            const updateParams = {
                TableName: process.env.WELLNESS_ITEMS_TABLE,
                Key: {
                    userId: { S: userId },
                    itemId: { S: itemId }
                },
                UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
                ExpressionAttributeNames: {
                    '#status': 'status'
                },
                ExpressionAttributeValues: {
                    ':status': { S: 'IN_QUEUE' },
                    ':updatedAt': { S: new Date().toISOString() }
                }
            };
            
            await dynamoClient.send(new UpdateItemCommand(updateParams));
            console.log(`Updated item ${itemId} status to IN_QUEUE`);
            
            // Phase 1: Log the URL for now
            console.log(`Would process TikTok URL: ${sourceUrl}`);
            
            // TODO Phase 2: Add actual TikTok processing logic
            // - Use @tobyg74/tiktok-api-dl to download
            // - Upload audio to S3
            // - Start Transcribe job
        }
        
        return { statusCode: 200, body: 'Messages processed successfully' };
        
    } catch (error) {
        console.error('Error in ProcessTikTok Lambda:', error);
        throw error; // Let SQS handle retry logic
    }
};
