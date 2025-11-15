const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const speech = require('@google-cloud/speech');
const fetch = require('node-fetch');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION });

// Initialize Google Speech client with Service Account credentials
let speechClient = null;
if (process.env.GOOGLE_CREDENTIALS_JSON) {
    try {
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
        speechClient = new speech.SpeechClient({ credentials });
        console.log('✅ Google Speech client initialized');
    } catch (error) {
        console.error('❌ Failed to initialize Google Speech:', error.message);
    }
} else {
    console.warn('⚠️ GOOGLE_CREDENTIALS_JSON not set');
}

async function downloadTikTokAudio(url) {
    console.log('Downloading TikTok audio from:', url);
    
    try {
        // Use tikwm.com API - more reliable and no rate limits
        const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`;
        
        console.log('Calling tikwm API:', apiUrl);
        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('API response code:', result.code);
        console.log('API response keys:', Object.keys(result.data || {}));
        
        if (result.code !== 0) {
            throw new Error(`TikTok API error: ${result.msg || 'Unknown error'}`);
        }
        
        const data = result.data;
        if (!data) {
            throw new Error('No data in TikTok response');
        }
        
        // Extract title and audio URL
        const title = data.title || 'Untitled TikTok';
        console.log('TikTok title:', title);
        
        // Try to get audio/video URL
        // Priority: music > hdplay > play
        let audioUrl = null;
        
        if (data.music) {
            audioUrl = data.music;
            console.log('Using music URL');
        } else if (data.hdplay) {
            audioUrl = data.hdplay;
            console.log('Using HD video URL');
        } else if (data.play) {
            audioUrl = data.play;
            console.log('Using standard video URL');
        }
        
        if (!audioUrl) {
            console.error('Available data fields:', Object.keys(data));
            throw new Error('No audio/video URL found in response');
        }

        // Download the audio/video file
        console.log('Downloading from:', audioUrl);
        const mediaResponse = await fetch(audioUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.tiktok.com/'
            }
        });
        
        if (!mediaResponse.ok) {
            throw new Error(`Media download failed: ${mediaResponse.status} ${mediaResponse.statusText}`);
        }

        const arrayBuffer = await mediaResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        console.log('Downloaded media buffer size:', buffer.length, 'bytes');
        return { buffer, title };
        
    } catch (error) {
        console.error('Error downloading TikTok audio:', error);
        throw new Error(`TikTok download failed: ${error.message}`);
    }
}

async function transcribeAudio(audioBuffer) {
    console.log('Starting audio transcription with Google Speech-to-Text...');
    
    try {
        if (!speechClient) {
            throw new Error('Google Speech client not initialized');
        }
        
        // Convert audio buffer to base64
        const audioBytes = audioBuffer.toString('base64');

        // Configure request for Spanish audio
        const request = {
            audio: {
                content: audioBytes,
            },
            config: {
                encoding: 'MP3',
                sampleRateHertz: 16000,
                languageCode: 'es-MX',
                alternativeLanguageCodes: ['es-ES', 'es-US'],
                enableAutomaticPunctuation: true,
                model: 'default',
            },
        };

        console.log('Sending audio to Google Speech API...');
        const [response] = await speechClient.recognize(request);
        
        if (!response.results || response.results.length === 0) {
            throw new Error('No transcription results returned');
        }
        
        const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');

        if (!transcription || transcription.trim().length === 0) {
            throw new Error('Empty transcription result');
        }

        console.log('Transcription successful:', transcription.substring(0, 100) + '...');
        return transcription;
        
    } catch (error) {
        console.error('Google Speech transcription failed:', error);
        throw error;
    }
}

async function enhanceTranscriptWithBedrock(transcript, title) {
    console.log('Enhancing transcript with Bedrock Claude...');
    
    try {
        const prompt = `Tienes esta transcripción de un TikTok titulado "${title}":

${transcript}

Genera un resumen estructurado en español que incluya:
1. Tema principal
2. Puntos clave mencionados
3. Consejos o pasos específicos
4. Categoría (receta, rutina, consejo, etc.)

Mantén el resumen conciso, máximo 300 palabras.`;

        const body = {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 400,
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ]
        };

        const command = new InvokeModelCommand({
            modelId: "anthropic.claude-3-haiku-20240307-v1:0",
            contentType: "application/json",
            body: JSON.stringify(body)
        });

        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        
        const enhancement = responseBody.content[0].text;
        console.log('Transcript enhanced successfully');
        
        return `${enhancement}\n\n--- Transcripción completa ---\n${transcript}`;
        
    } catch (error) {
        console.error('Bedrock enhancement failed:', error);
        // Return just the transcript if enhancement fails
        return transcript;
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
                const { buffer: audioBuffer, title } = await downloadTikTokAudio(sourceUrl);
                
                console.log(`Downloaded TikTok: "${title}"`);
                
                // 2) Upload to S3
                const mediaKey = `${userId}/${itemId}/audio.mp3`;
                await s3Client.send(new PutObjectCommand({
                    Bucket: process.env.RAW_MEDIA_BUCKET,
                    Key: mediaKey,
                    Body: audioBuffer,
                    ContentType: "audio/mpeg"
                }));
                
                console.log(`Uploaded audio to S3: ${mediaKey}`);
                
                // 3) Update DynamoDB: status = MEDIA_STORED, save title
                await updateItemStatus(userId, itemId, {
                    status: "MEDIA_STORED",
                    mediaS3Key: mediaKey,
                    title: title
                });
                
                // 4) Transcribe audio with Google Speech-to-Text
                let transcript = null;
                let transcriptionMethod = 'fallback';
                
                try {
                    console.log('Transcribing audio with Google Speech...');
                    const rawTranscript = await transcribeAudio(audioBuffer);
                    console.log('Audio transcribed successfully');
                    
                    // 5) Enhance transcript with Bedrock Claude
                    try {
                        transcript = await enhanceTranscriptWithBedrock(rawTranscript, title);
                        transcriptionMethod = 'google-speech + bedrock';
                    } catch (enhanceError) {
                        console.warn('Transcript enhancement failed:', enhanceError.message);
                        transcript = rawTranscript;
                        transcriptionMethod = 'google-speech';
                    }
                } catch (transcribeError) {
                    console.warn('Audio transcription failed:', transcribeError.message);
                    // Fallback: use title only
                    transcript = `Contenido de TikTok: ${title}\n\nNo se pudo transcribir el audio automáticamente.`;
                    transcriptionMethod = 'fallback';
                }
                
                // 6) Update DynamoDB: status = COMPLETED with transcript
                await updateItemStatus(userId, itemId, {
                    status: "COMPLETED",
                    transcript: transcript,
                    transcriptionMethod: transcriptionMethod
                });
                
                console.log(`Successfully processed ${itemId}: COMPLETED`);
                
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
