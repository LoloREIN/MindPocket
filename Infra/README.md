 # MindPocket Infrastructure - Phase 3 (AI-Powered)

This Pulumi program deploys the complete Phase 3 infrastructure for MindPocket, including **AI-powered content analysis** with Amazon Bedrock and Claude Sonnet.

## 🏗️ Architecture Overview

### Phase 3 Components
- **Cognito User Pool** - Authentication & authorization
- **API Gateway** - RESTful API with JWT authorization
- **DynamoDB** - WellnessItems table with enriched AI data
- **S3 Buckets** - Raw media storage & transcripts
- **SQS** - Async processing queue with DLQ
- **Lambda Functions** - Complete TikTok → AI analysis pipeline
- **AWS Transcribe** - Speech-to-text processing
- **Amazon Bedrock** - Claude Sonnet 3 for content analysis

### Data Flow
```
Frontend → API Gateway → IngestLambda → DynamoDB + SQS
                                           ↓
SQS → ProcessTikTokLambda → TikTok API → S3 → Transcribe
                                           ↓
S3 (transcripts) → TranscribeCallbackLambda → Claude Sonnet → DynamoDB (READY)
```

### Status Progression
```
PENDING_DOWNLOAD → MEDIA_STORED → TRANSCRIBING → TRANSCRIBED → ENRICHING → READY
                                                                        ↓
                                                                   ENRICH_ERROR
```

## 🚀 Deployment

### Prerequisites
1. AWS CLI configured with appropriate permissions
2. Pulumi CLI installed
3. Node.js 18+ for Lambda functions
4. **Amazon Bedrock Model Access** - Enable Claude Sonnet in AWS Console

### Enable Bedrock Models
```bash
# 1. Go to AWS Console → Amazon Bedrock → Model access
# 2. Request access to Anthropic Claude models
# 3. Wait for approval (usually instant for Claude 3 Sonnet)
# 4. Verify model ID: anthropic.claude-3-sonnet-20240229-v1:0
```

### Deploy Infrastructure
```bash
# 1. Initialize Pulumi stack
pulumi stack init dev

# 2. Set AWS region
pulumi config set aws:region us-east-1

# 3. Install Lambda dependencies
cd lambdas/process-tiktok && npm install && cd ../..
cd lambdas/transcribe-callback && npm install && cd ../..
cd lambdas/ingest-link && npm install && cd ../..
cd lambdas/get-items && npm install && cd ../..
cd lambdas/get-item && npm install && cd ../..

# 4. Deploy infrastructure
pulumi up

# 5. Get outputs (save these for frontend configuration)
pulumi stack output
```

## 🤖 AI Analysis Features

### Structured Data Extraction
Claude Sonnet analyzes transcripts and extracts:

**Recipes:**
```json
{
  "type": "recipe",
  "title": "Avocado Toast Perfecto",
  "recipe": {
    "servings": 2,
    "time_minutes": 10,
    "difficulty": "easy",
    "ingredients": ["2 rebanadas de pan", "1 aguacate maduro"],
    "steps": ["Tostar el pan", "Machacar aguacate", "Servir"]
  }
}
```

**Workouts:**
```json
{
  "type": "workout", 
  "title": "Rutina de Piernas en Casa",
  "workout": {
    "duration_minutes": 20,
    "level": "intermediate",
    "focus": ["legs", "glutes"],
    "blocks": [
      {"exercise": "squats", "reps": "3 x 15", "notes": "mantén la espalda recta"}
    ]
  }
}
```

**Pending Items:**
```json
{
  "type": "pending",
  "title": "Libro Recomendado",
  "pending": {
    "category": "book",
    "name": "Atomic Habits",
    "platform": "Amazon",
    "notes": "Para mejorar productividad"
  }
}
```

### Environment Variables (Auto-configured)
- `WELLNESS_ITEMS_TABLE` - DynamoDB table name
- `RAW_MEDIA_BUCKET` - S3 bucket for media files
- `TRANSCRIPTS_BUCKET` - S3 bucket for transcripts
- `BEDROCK_MODEL_ID` - Claude Sonnet model identifier
- `BEDROCK_REGION` - Bedrock service region

### Lambda Timeouts
- **IngestLambda**: 30s (API response)
- **ProcessTikTokLambda**: 60s (TikTok download + S3 upload)
- **TranscribeCallbackLambda**: 120s (Transcript + AI analysis)
- **TranscribeCallbackLambda**: 60s (Transcript processing)
- **GetItems/GetItemLambda**: 30s (Database queries)

### SQS Configuration
- **Visibility Timeout**: 360s (6x Lambda timeout)
- **Max Receive Count**: 3 (before DLQ)
- **Batch Size**: 1 (one TikTok per invocation)

## 🛠️ Troubleshooting

### Common Issues

1. **TikTok Download Fails**
   - Check CloudWatch logs for ProcessTikTokLambda
   - Verify TikTok URL format
   - Check if @tobyg74/tiktok-api-dl needs updates

2. **Transcribe Job Fails**
   - Verify S3 bucket policies allow transcribe.amazonaws.com
   - Check audio file format (should be MP3)
   - Verify IAM permissions for StartTranscriptionJob

3. **S3 Trigger Not Working**
   - Check S3 bucket notification configuration
   - Verify Lambda permission for S3 to invoke function
   - Check S3 object key prefix matches "transcriptions/"

4. **API Gateway 401 Errors**
   - Verify JWT token is valid and not expired
   - Check Cognito User Pool configuration
   - Ensure Authorization header format: "Bearer <token>"

### Performance Optimization
- **Concurrent Processing**: SQS supports multiple Lambda instances
- **Batch Processing**: Can increase SQS batch size for higher throughput
- **Caching**: Add ElastiCache for frequently accessed items

## 🔄 Next Steps (Phase 3)

Phase 3 will add:
- **Amazon Bedrock** integration for AI analysis
- **Recipe/workout extraction** from transcripts
- **Structured data storage** for AI insights
- **Advanced search** and categorization

## 📚 Resources

- [Pulumi AWS Documentation](https://www.pulumi.com/docs/clouds/aws/)
- [AWS Transcribe Documentation](https://docs.aws.amazon.com/transcribe/)
- [TikTok API DL Library](https://www.npmjs.com/package/@tobyg74/tiktok-api-dl)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)

## Getting Help

If you have questions or encounter issues:
- Visit the Pulumi documentation: https://www.pulumi.com/docs/
- Join the Pulumi Community Slack: https://www.pulumi.com/slack
- Open an issue in this GitHub repository.
 If you have questions or encounter issues:
 - Visit the Pulumi documentation: https://www.pulumi.com/docs/
 - Join the Pulumi Community Slack: https://www.pulumi.com/slack
 - Open an issue in this GitHub repository.