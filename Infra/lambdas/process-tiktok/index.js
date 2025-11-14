const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { TranscribeClient, StartTranscriptionJobCommand } = require('@aws-sdk/client-transcribe');
const Tiktok = require('@tobyg74/tiktok-api-dl');
const fetch = require('node-fetch');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const transcribeClient = new TranscribeClient({ region: process.env.AWS_REGION });

async function downloadTikTokAudio(url) {
    console.log('Downloading TikTok audio from:', url);
    
    try {
        const result = await Tiktok.Downloader(url, {
            version: "v1",
            showOriginalResponse: true
        });
        
        console.log('TikTok API response structure:', JSON.stringify(result, null, 2));
        
        const media = result?.result;
        if (!media) {
            throw new Error('No media in TikTok response');
        }

        // Try to find audio URL - check different possible locations
        let audioUrl = null;
        
        // Try music first (common in TikTok responses)
        if (media.music?.url) {
            audioUrl = media.music.url;
            console.log('Found audio URL in music:', audioUrl);
        }
        
        // Try medias array for audio-only content
        if (!audioUrl && Array.isArray(media.medias)) {
            const audioMedia = media.medias.find(m => 
                m.url && (m.type === 'audio' || m.url.includes('audio') || m.url.includes('.mp3'))
            );
            if (audioMedia) {
                audioUrl = audioMedia.url;
                console.log('Found audio URL in medias:', audioUrl);
            }
        }
        
        // Fallback: use video URL (we'll extract audio later if needed)
        if (!audioUrl && media.video?.url) {
            audioUrl = media.video.url;
            console.log('Using video URL as fallback:', audioUrl);
        }

        if (!audioUrl) {
            throw new Error('No audio or video URL found in TikTok result');
        }

        // Download the audio/video file
        console.log('Fetching audio from URL:', audioUrl);
        const response = await fetch(audioUrl);
        
        if (!response.ok) {
            throw new Error(`Audio download failed: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        console.log('Downloaded audio buffer size:', buffer.length);
        return buffer;
        
    } catch (error) {
        console.error('Error downloading TikTok audio:', error);
        throw new Error(`TikTok download failed: ${error.message}`);
    }
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

async function startTranscriptionJob(jobName, mediaKey) {
    const params = {
        TranscriptionJobName: jobName,
        LanguageCode: "es-MX",
        MediaFormat: "mp3",
        Media: {
            MediaFileUri: `s3://${process.env.RAW_MEDIA_BUCKET}/${mediaKey}`
        },
        OutputBucketName: process.env.TRANSCRIPTS_BUCKET,
        OutputKey: `transcriptions/${jobName}/`
    };

    const command = new StartTranscriptionJobCommand(params);
    const result = await transcribeClient.send(command);
    
    console.log('Started transcription job:', result.TranscriptionJob.TranscriptionJobName);
    return result;
}

exports.handler = async (event) => {
    console.log('ProcessTikTok Lambda triggered:', JSON.stringify(event, null, 2));
    
    try {
        // Process each SQS record
        for (const record of event.Records) {
            const messageBody = JSON.parse(record.body);
            console.log('Processing message:', messageBody);
            
            const { userId, itemId, sourceUrl } = messageBody;
            
            try {
                // 1) Download TikTok audio
                console.log(`Starting TikTok processing for ${sourceUrl}`);
                const audioBuffer = await downloadTikTokAudio(sourceUrl);
                
                // 2) Upload to S3
                const mediaKey = `${userId}/${itemId}/audio.mp3`;
                await s3Client.send(new PutObjectCommand({
                    Bucket: process.env.RAW_MEDIA_BUCKET,
                    Key: mediaKey,
                    Body: audioBuffer,
                    ContentType: "audio/mpeg"
                }));
                
                console.log(`Uploaded audio to S3: ${mediaKey}`);
                
                // 3) Update DynamoDB: status = MEDIA_STORED
                await updateItemStatus(userId, itemId, {
                    status: "MEDIA_STORED",
                    mediaS3Key: mediaKey
                });
                
                // 4) Start Transcribe job
                const jobName = `mindpocket-${userId}-${itemId}`;
                await startTranscriptionJob(jobName, mediaKey);
                
                // 5) Update DynamoDB: status = TRANSCRIBING, save jobName
                await updateItemStatus(userId, itemId, {
                    status: "TRANSCRIBING",
                    transcriptionJobName: jobName
                });
                
                console.log(`Successfully processed ${itemId}: TRANSCRIBING`);
                
            } catch (processingError) {
                console.error(`Error processing item ${itemId}:`, processingError);
                
                // Update item status to ERROR
                await updateItemStatus(userId, itemId, {
                    status: "ERROR",
                    errorMessage: processingError.message
                });
                
                // Don't throw - let this record succeed but mark as error
                console.log(`Marked item ${itemId} as ERROR, continuing with next record`);
            }
        }
        
        return { statusCode: 200, body: 'Messages processed successfully' };
        
    } catch (error) {
        console.error('Error in ProcessTikTok Lambda:', error);
        throw error; // Let SQS handle retry logic
    }
};
