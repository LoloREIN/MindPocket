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

async function downloadTikTokAudio(url, retries = 3) {
    console.log('Downloading TikTok audio from:', url);
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            // Use tikwm.com API - more reliable and no rate limits
            const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`;
            
            console.log(`Calling tikwm API (attempt ${attempt}/${retries}):`, apiUrl);
            const response = await fetch(apiUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                // If 5xx error and we have retries left, try again
                if (response.status >= 500 && attempt < retries) {
                    const delay = attempt * 2000; // 2s, 4s exponential backoff
                    console.log(`⚠️ API returned ${response.status}, retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
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
        // Priority: hdplay > play > music
        // We prefer video (with voice + music) over just background music
        let audioUrl = null;
        
        if (data.hdplay) {
            audioUrl = data.hdplay;
            console.log('Using HD video URL (contains voice + music)');
        } else if (data.play) {
            audioUrl = data.play;
            console.log('Using standard video URL (contains voice + music)');
        } else if (data.music) {
            audioUrl = data.music;
            console.log('Using music URL (background music only - no voice expected)');
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
            // If this is the last attempt, throw the error
            if (attempt === retries) {
                console.error('Error downloading TikTok audio after all retries:', error);
                throw new Error(`TikTok download failed: ${error.message}`);
            }
            // Otherwise, retry
            const delay = attempt * 2000;
            console.log(`⚠️ Error on attempt ${attempt}, retrying in ${delay}ms:`, error.message);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

async function transcribeAudio(audioBuffer, s3Key) {
    console.log('Starting audio transcription with Google Speech-to-Text...');
    
    try {
        if (!speechClient) {
            throw new Error('Google Speech client not initialized');
        }
        
        // Check audio size - Google Speech API limits
        const audioSizeMB = audioBuffer.length / (1024 * 1024);
        const estimatedDurationSeconds = audioSizeMB * 60; // Rough estimate: ~1MB per minute for MP3
        
        console.log('Audio analysis:', {
            sizeBytes: audioBuffer.length,
            sizeMB: audioSizeMB.toFixed(2),
            estimatedDuration: `${estimatedDurationSeconds.toFixed(0)}s`
        });

        // Google Speech API sync recognition limit: 60 seconds
        // For short videos (< 2MB ≈ 120 seconds), try full audio
        // For longer videos, we'll use the title/description instead
        
        const TWO_MB = 2 * 1024 * 1024;
        if (audioBuffer.length > TWO_MB) {
            console.log(`⚠️ Audio too large (${audioSizeMB.toFixed(2)}MB). Will use title/description instead.`);
            throw new Error('AUDIO_TOO_LARGE'); // Special error code
        }
        
        const audioBytes = audioBuffer.toString('base64');

        // Configure request for multi-language audio (Spanish + English)
        // TikTok audio is typically MP3 format
        const request = {
            audio: {
                content: audioBytes,
            },
            config: {
                encoding: 'MP3',
                languageCode: 'es-MX',  // Primary language
                alternativeLanguageCodes: ['en-US', 'es-ES', 'en-GB'],  // English + Spanish alternatives
                enableAutomaticPunctuation: true,
                model: 'latest_long',  // Better for longer audio (handles music better)
                enableWordTimeOffsets: false,
                enableWordConfidence: false,
                maxAlternatives: 1,
                profanityFilter: false,
            },
        };

        console.log('Sending audio to Google Speech API...', {
            audioSize: audioBuffer.length,
            encoding: request.config.encoding,
            language: request.config.languageCode
        });
        const [response] = await speechClient.recognize(request);
        
        console.log('Google Speech API response:', {
            hasResults: !!response.results,
            resultCount: response.results?.length || 0,
            totalBilledTime: response.totalBilledTime
        });
        
        if (!response.results || response.results.length === 0) {
            throw new Error('No transcription results returned - audio may contain no speech or be too short');
        }
        
        // Debug: log first result structure
        if (response.results.length > 0) {
            console.log('First result sample:', JSON.stringify({
                hasAlternatives: !!response.results[0].alternatives,
                alternativesCount: response.results[0].alternatives?.length || 0,
                firstAltTranscript: response.results[0].alternatives?.[0]?.transcript || 'EMPTY',
                firstAltConfidence: response.results[0].alternatives?.[0]?.confidence,
                isFinal: response.results[0].isFinal
            }));
        }
        
        const transcription = response.results
            .map(result => result.alternatives?.[0]?.transcript || '')
            .filter(text => text.length > 0)
            .join('\n');

        if (!transcription || transcription.trim().length === 0) {
            console.error('All results are empty. Sample results:', 
                response.results.slice(0, 3).map((r, i) => ({
                    index: i,
                    alternatives: r.alternatives?.map(a => ({ transcript: a.transcript, confidence: a.confidence }))
                }))
            );
            throw new Error('Empty transcription result - audio may contain only music or unintelligible speech');
        }

        console.log('Transcription successful:', transcription.substring(0, 100) + '...');
        return transcription;
        
    } catch (error) {
        console.error('Google Speech transcription failed:', error);
        throw error;
    }
}

async function classifyAndEnrichContent(transcript, title) {
    console.log('Classifying and enriching content with Bedrock...');
    
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

        const modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-haiku-20241022-v1:0';
        
        // Use different request format based on model type
        let body, aiResponse;
        
        if (modelId.startsWith('anthropic')) {
            // Claude format
            body = {
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: 1500,
                messages: [{ role: "user", content: prompt }]
            };
        } else if (modelId.startsWith('amazon.titan')) {
            // Titan format
            body = {
                inputText: prompt,
                textGenerationConfig: {
                    maxTokenCount: 1500,
                    temperature: 0.7,
                    topP: 0.9
                }
            };
        }

        const command = new InvokeModelCommand({
            modelId: modelId,
            contentType: "application/json",
            body: JSON.stringify(body)
        });

        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        
        // Extract response based on model type
        if (modelId.startsWith('anthropic')) {
            aiResponse = responseBody.content[0].text;
        } else if (modelId.startsWith('amazon.titan')) {
            aiResponse = responseBody.results[0].outputText;
        }
        
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

// Helper function to convert JavaScript values to DynamoDB format
function toDynamoDBValue(value) {
    if (value === null || value === undefined) {
        return { NULL: true };
    }
    
    if (typeof value === 'string') {
        return { S: value };
    }
    
    if (typeof value === 'number') {
        return { N: String(value) };
    }
    
    if (typeof value === 'boolean') {
        return { BOOL: value };
    }
    
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return { L: [] };
        }
        // Convert array elements
        return { L: value.map(item => toDynamoDBValue(item)) };
    }
    
    if (typeof value === 'object') {
        // Convert object to Map
        const map = {};
        for (const [k, v] of Object.entries(value)) {
            map[k] = toDynamoDBValue(v);
        }
        return { M: map };
    }
    
    // Fallback to string for unknown types
    return { S: String(value) };
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
        expressionAttributeValues[attrValue] = toDynamoDBValue(updates[key]);
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
                    rawTranscript = await transcribeAudio(audioBuffer, mediaKey);
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
                    
                    // Special handling: if video is too long, use title/description
                    if (transcribeError.message === 'AUDIO_TOO_LARGE') {
                        console.log('📝 Using title/description for classification since video is long...');
                        rawTranscript = `📱 TikTok (video largo - usando descripción):\n\n${title}`;
                        
                        // Try to classify using the title/description
                        try {
                            enrichedContent = await classifyAndEnrichContent(title, title);
                            console.log('✅ Content classified successfully using title');
                        } catch (enrichError) {
                            console.warn('Classification from title failed:', enrichError.message);
                            enrichedContent = {
                                type: 'other',
                                summary: title,
                                tags: ['tiktok', 'video-largo'],
                                enrichedData: null
                            };
                        }
                    } else {
                        // Other transcription errors: use fallback
                        rawTranscript = `📱 TikTok: ${title}\n\n⚠️ La transcripción automática no está disponible.\nPosibles razones: el audio solo contiene música, habla poco clara, o audio muy corto.\n\nEl contenido multimedia está guardado y disponible.`;
                        enrichedContent = {
                            type: 'other',
                            summary: title,
                            tags: ['tiktok', 'sin-transcripción'],
                            enrichedData: null
                        };
                    }
                }
                
                // 6) Update DynamoDB: status = READY with all data
                const updates = {
                    status: "READY",
                    type: enrichedContent.type,
                    title: title,  // Add title from TikTok
                    transcriptFull: rawTranscript,  // Full transcript
                    transcriptPreview: rawTranscript.substring(0, 200),  // Preview for list view
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
