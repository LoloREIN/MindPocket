const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

async function streamToString(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf-8');
}

async function updateItemStatus(userId, itemId, updates) {
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {
        ':updatedAt': { S: new Date().toISOString() }
    };
    
    updateExpression.push('updatedAt = :updatedAt');
    
    Object.keys(updates).forEach((key, index) => {
        const attrName = `#attr${index}`;
        const attrValue = `:val${index}`;
        
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[attrValue] = { S: updates[key] };
        updateExpression.push(`${attrName} = ${attrValue}`);
    });

    const params = {
        TableName: process.env.WELLNESS_ITEMS_TABLE,
        Key: {
            userId: { S: userId },
            itemId: { S: itemId }
        },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues
    };

    await dynamoClient.send(new UpdateItemCommand(params));
}

exports.handler = async (event) => {
    console.log('TranscribeCallback Lambda triggered:', JSON.stringify(event, null, 2));
    
    try {
        // Process each S3 event record
        for (const record of event.Records) {
            const bucketName = record.s3.bucket.name;
            const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
            
            console.log(`Processing S3 object: ${bucketName}/${objectKey}`);
            
            try {
                // 1) Parse jobName & extract userId/itemId from key
                // Expected key format: transcriptions/mindpocket-{userId}-{itemId}/something.json
                const keyParts = objectKey.split('/');
                if (keyParts.length < 2) {
                    console.log('Skipping object - unexpected key format:', objectKey);
                    continue;
                }
                
                const jobName = keyParts[1]; // mindpocket-{userId}-{itemId}
                console.log('Extracted jobName:', jobName);
                
                // Parse userId and itemId from jobName
                const jobNameParts = jobName.split('-');
                if (jobNameParts.length < 3 || jobNameParts[0] !== 'mindpocket') {
                    console.log('Skipping object - unexpected jobName format:', jobName);
                    continue;
                }
                
                const userId = jobNameParts[1];
                const itemId = jobNameParts.slice(2).join('-'); // Handle itemIds with hyphens
                
                console.log('Extracted userId:', userId, 'itemId:', itemId);
                
                // 2) Download transcript JSON from S3
                const getObjectParams = {
                    Bucket: bucketName,
                    Key: objectKey
                };
                
                const data = await s3Client.send(new GetObjectCommand(getObjectParams));
                const body = await streamToString(data.Body);
                
                console.log('Downloaded transcript file, size:', body.length);
                
                // 3) Parse transcript content
                const transcriptJson = JSON.parse(body);
                
                // Extract transcript text from AWS Transcribe format
                const transcript = transcriptJson.results?.transcripts?.[0]?.transcript || "";
                const confidence = transcriptJson.results?.transcripts?.[0]?.confidence || 0;
                
                console.log('Extracted transcript length:', transcript.length);
                console.log('Transcript confidence:', confidence);
                console.log('Transcript preview:', transcript.slice(0, 200));
                
                // 4) Update DynamoDB item with transcript data
                const updates = {
                    status: "TRANSCRIBED",
                    transcriptPreview: transcript.slice(0, 1000), // Store first 1000 chars as preview
                    transcriptS3Key: objectKey,
                    transcriptConfidence: confidence.toString()
                };
                
                // Add full transcript if it's short enough (under 4KB for DynamoDB item limit)
                if (transcript.length < 4000) {
                    updates.transcriptFull = transcript;
                }
                
                await updateItemStatus(userId, itemId, updates);
                
                console.log(`Successfully updated item ${itemId} with transcript data`);
                
            } catch (processingError) {
                console.error('Error processing transcript:', processingError);
                
                // Try to extract userId/itemId for error reporting
                try {
                    const keyParts = objectKey.split('/');
                    if (keyParts.length >= 2) {
                        const jobName = keyParts[1];
                        const jobNameParts = jobName.split('-');
                        if (jobNameParts.length >= 3) {
                            const userId = jobNameParts[1];
                            const itemId = jobNameParts.slice(2).join('-');
                            
                            await updateItemStatus(userId, itemId, {
                                status: "ERROR",
                                errorMessage: `Transcript processing failed: ${processingError.message}`
                            });
                        }
                    }
                } catch (errorUpdateError) {
                    console.error('Failed to update error status:', errorUpdateError);
                }
                
                // Don't throw - continue processing other records
                console.log('Continuing with next record after error');
            }
        }
        
        return { statusCode: 200, body: 'S3 events processed successfully' };
        
    } catch (error) {
        console.error('Error in TranscribeCallback Lambda:', error);
        throw error;
    }
};
