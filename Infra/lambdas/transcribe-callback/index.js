const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const bedrockClient = new BedrockRuntimeClient({ region: process.env.BEDROCK_REGION || process.env.AWS_REGION });

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

// Structured prompt template for Claude Sonnet
const ANALYSIS_PROMPT_TEMPLATE = `You are an AI that analyzes wellness content extracted from TikTok videos.

Your job:
1. Read the transcript of the video.
2. Decide if the content is primarily:
   - a recipe
   - a workout / exercise routine
   - a pending item (movie, book, course, etc.)
   - something else
3. Extract structured data following the JSON schema below.

Important rules:
- If some fields don't appear in the transcript, set them to null or an empty list.
- Do NOT invent details that are not clearly implied by the transcript.
- If you are uncertain between categories, choose "other".
- Output ONLY valid JSON. No explanations, no comments, no markdown.

JSON schema (do NOT change keys, only fill values):

{
  "type": "recipe | workout | pending | other",
  "title": "string",
  "tags": ["string"],
  "summary": "string",

  "recipe": {
    "servings": number | null,
    "time_minutes": number | null,
    "difficulty": "easy | medium | hard | null",
    "ingredients": ["string"],
    "steps": ["string"]
  },

  "workout": {
    "duration_minutes": number | null,
    "level": "beginner | intermediate | advanced | null",
    "focus": ["string"],
    "blocks": [
      { "exercise": "string", "reps": "string", "notes": "string" }
    ]
  },

  "pending": {
    "category": "movie | book | course | other | null",
    "name": "string",
    "platform": "string",
    "notes": "string"
  },

  "source": {
    "platform": "tiktok",
    "original_title": "string | null"
  }
}

Now analyze this TikTok transcript:

<<<TRANSCRIPT_START>>>
{{TRANSCRIPT_TEXT}}
<<<TRANSCRIPT_END>>>`;

async function callClaude(transcript) {
    console.log('Calling Claude Sonnet for content analysis...');
    
    const prompt = ANALYSIS_PROMPT_TEMPLATE.replace('{{TRANSCRIPT_TEXT}}', transcript);
    
    const body = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 800,
        temperature: 0.1,
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: prompt
                    }
                ]
            }
        ]
    };

    const command = new InvokeModelCommand({
        modelId: process.env.BEDROCK_MODEL_ID,
        contentType: "application/json",
        accept: "application/json",
        body: new TextEncoder().encode(JSON.stringify(body))
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    // Claude Messages API responses: { content: [ { type:"text", text:"..."} ], ... }
    const textPart = responseBody.content?.find(c => c.type === "text");
    if (!textPart) {
        throw new Error("Claude response missing text content");
    }

    console.log('Claude response received, length:', textPart.text.length);
    return textPart.text;
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
                
                // 4) Update DynamoDB: status = TRANSCRIBED (before AI analysis)
                await updateItemStatus(userId, itemId, {
                    status: "TRANSCRIBED",
                    transcriptPreview: transcript.slice(0, 1000),
                    transcriptS3Key: objectKey,
                    transcriptConfidence: confidence.toString()
                });
                
                console.log(`Transcript saved for item ${itemId}, starting AI analysis...`);
                
                // 5) Update status to ENRICHING before Bedrock call
                await updateItemStatus(userId, itemId, {
                    status: "ENRICHING"
                });
                
                // 6) Call Claude for content analysis
                const rawJsonResponse = await callClaude(transcript);
                
                // 7) Parse and validate JSON response
                let enrichedData;
                try {
                    enrichedData = JSON.parse(rawJsonResponse);
                    console.log('Claude analysis completed:', enrichedData.type, enrichedData.title);
                } catch (parseError) {
                    console.error('Claude returned invalid JSON:', rawJsonResponse);
                    throw new Error(`JSON parse failed: ${parseError.message}`);
                }
                
                // 8) Normalize type to uppercase for DynamoDB
                const contentType = (enrichedData.type || "other").toUpperCase();
                
                // 9) Update DynamoDB with enriched data: status = READY
                const finalUpdates = {
                    status: "READY",
                    type: contentType,
                    enrichedData: JSON.stringify(enrichedData),
                    title: enrichedData.title || null,
                    tags: JSON.stringify(enrichedData.tags || [])
                };
                
                // Add full transcript if it's short enough (under 4KB for DynamoDB item limit)
                if (transcript.length < 4000) {
                    finalUpdates.transcriptFull = transcript;
                }
                
                await updateItemStatus(userId, itemId, finalUpdates);
                
                console.log(`Successfully enriched item ${itemId}: ${contentType} - "${enrichedData.title}"`);
                
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
                            
                            // Determine error type based on processing stage
                            const errorStatus = processingError.message.includes('Claude') || 
                                              processingError.message.includes('JSON parse') || 
                                              processingError.message.includes('Bedrock') ? 
                                              "ENRICH_ERROR" : "ERROR";
                            
                            await updateItemStatus(userId, itemId, {
                                status: errorStatus,
                                errorMessage: `Processing failed: ${processingError.message}`
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
