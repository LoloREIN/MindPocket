const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
    console.log('TranscribeCallback Lambda triggered:', JSON.stringify(event, null, 2));
    
    try {
        // Process each S3 event record
        for (const record of event.Records) {
            const bucketName = record.s3.bucket.name;
            const objectKey = record.s3.object.key;
            
            console.log(`Processing S3 object: ${bucketName}/${objectKey}`);
            
            // Phase 1: Just log the event
            console.log('S3 Object created in transcripts bucket');
            console.log('Bucket:', bucketName);
            console.log('Key:', objectKey);
            
            // TODO Phase 2: Add transcript processing logic
            // - Parse objectKey to extract itemId/userId
            // - Download transcript from S3
            // - Parse transcript content
            // - Update DynamoDB with transcript data
            // - Call Bedrock for AI analysis
            
            // For now, just demonstrate we can access the object
            try {
                const getObjectParams = {
                    Bucket: bucketName,
                    Key: objectKey
                };
                
                const response = await s3Client.send(new GetObjectCommand(getObjectParams));
                console.log('Successfully accessed S3 object, ContentLength:', response.ContentLength);
                
            } catch (s3Error) {
                console.error('Error accessing S3 object:', s3Error);
            }
        }
        
        return { statusCode: 200, body: 'S3 events processed successfully' };
        
    } catch (error) {
        console.error('Error in TranscribeCallback Lambda:', error);
        throw error;
    }
};
