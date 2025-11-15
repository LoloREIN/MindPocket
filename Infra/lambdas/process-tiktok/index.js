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

async function classifyAndEnrichContent(transcript, title) {
    console.log('Classifying and enriching content with Bedrock Claude...');
    
    try {
        const prompt = `Analiza esta transcripción de un TikTok titulado "${title}":

${transcript}

Clasifica el contenido y extrae información estructurada. Responde SOLO con un JSON válido (sin markdown, sin explicaciones) con esta estructura:

{
  "type": "recipe" | "workout" | "pending" | "other",
  "summary": "resumen breve del contenido",
  "tags": ["tag1", "tag2", "tag3"],
  "enrichedData": {
    // Si es recipe:
    "recipe": {
      "name": "nombre del platillo",
      "ingredients": [{"item": "ingrediente", "quantity": "cantidad"}],
      "steps": ["paso 1", "paso 2"],
      "time_minutes": 30,
      "servings": 4,
      "difficulty": "fácil"
    },
    // Si es workout:
    "workout": {
      "name": "nombre de la rutina",
      "duration_minutes": 20,
      "level": "principiante",
      "focus": ["cardio", "fuerza"],
      "blocks": [{"exercise": "ejercicio", "reps": "10-12", "sets": 3}]
    },
    // Si es pending (libro, película, curso):
    "pending": {
      "category": "movie" | "book" | "course" | "other",
      "name": "nombre",
      "author": "autor/director",
      "description": "descripción"
    }
  }
}

IMPORTANTE: 
- Responde SOLO el JSON, sin texto adicional
- Si no es receta/workout/pending, usa type: "other" y omite enrichedData
- Extrae solo la información que esté explícita en la transcripción`;

        const body = {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 1500,
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
        
        const aiResponse = responseBody.content[0].text;
        console.log('AI Response:', aiResponse.substring(0, 200) + '...');
        
        // Parse JSON response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in AI response');
        }
        
        const enrichedData = JSON.parse(jsonMatch[0]);
        console.log('Content classified as:', enrichedData.type);
        
        return enrichedData;
        
    } catch (error) {
        console.error('Bedrock classification failed:', error);
        // Return basic classification
        return {
            type: 'other',
            summary: transcript.substring(0, 200),
            tags: [],
            enrichedData: null
        };
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
                let rawTranscript = null;
                let enrichedContent = null;
                
                try {
                    console.log('Transcribing audio with Google Speech...');
                    rawTranscript = await transcribeAudio(audioBuffer);
                    console.log('Audio transcribed successfully');
                    
                    // 5) Classify and enrich content with Bedrock Claude
                    try {
                        console.log('Classifying and enriching content...');
                        enrichedContent = await classifyAndEnrichContent(rawTranscript, title);
                        console.log('Content enriched successfully');
                    } catch (enrichError) {
                        console.warn('Content enrichment failed:', enrichError.message);
                        enrichedContent = {
                            type: 'other',
                            summary: rawTranscript.substring(0, 200),
                            tags: [],
                            enrichedData: null
                        };
                    }
                } catch (transcribeError) {
                    console.warn('Audio transcription failed:', transcribeError.message);
                    // Fallback: use title only
                    rawTranscript = `Contenido de TikTok: ${title}\n\nNo se pudo transcribir el audio automáticamente.`;
                    enrichedContent = {
                        type: 'other',
                        summary: title,
                        tags: [],
                        enrichedData: null
                    };
                }
                
                // 6) Update DynamoDB: status = READY with all data
                const updates = {
                    status: "READY",
                    type: enrichedContent.type,
                    transcript: rawTranscript,
                    tags: enrichedContent.tags || []
                };
                
                // Add enrichedData if available
                if (enrichedContent.enrichedData) {
                    updates.enrichedData = enrichedContent.enrichedData;
                }
                
                await updateItemStatus(userId, itemId, updates);
                
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
