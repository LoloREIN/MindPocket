 # AWS S3 Bucket (Pulumi YAML)

 A minimal Pulumi YAML template that provisions an AWS S3 Bucket and exports its name.

 ## Overview

 This template uses the AWS provider to create a single S3 bucket. It is a great starting point for projects that require simple object storage with minimal setup.

 ## Providers

 - AWS

 ## Resources Created

 - aws:s3:BucketV2 (`my-bucket`): A basic S3 bucket.

 ## Outputs

 - **bucketName**: The name (ID) of the created S3 bucket.

 ## Prerequisites

 - Pulumi CLI configured and logged in to your chosen backend.
 - AWS credentials configured (environment variables, `~/.aws/credentials`, or `AWS_PROFILE`).
 - An AWS account with permissions to create S3 buckets.

 ## Usage

 Initialize a new project from this template by running:

 ```bash
 pulumi new aws-yaml
 ```

 You will be prompted for:
 - A project name (default is set by the template).
 - A project description.
 - The AWS region to deploy into (default: `us-east-1`).

 After initialization, deploy your stack:

 ```bash
 pulumi up
 ```

 ## Project Layout

 After `pulumi new`, your directory will look like:

 ```
 .
 ├── Pulumi.yaml           # Project metadata and YAML program
 └── Pulumi.<stack>.yaml   # Stack configuration (e.g., aws:region)

### Error Handling
- **Invalid TikTok URLs**: Status = "ERROR" with error message
- **Network failures**: SQS retry → DLQ after 3 attempts
- **Transcribe failures**: Error status in DynamoDB

## 🔧 Configuration

### Environment Variables (Auto-configured)
- `WELLNESS_ITEMS_TABLE` - DynamoDB table name
- `RAW_MEDIA_BUCKET` - S3 bucket for media files
- `TRANSCRIPTS_BUCKET` - S3 bucket for transcripts
- `PROCESS_TIKTOK_QUEUE_URL` - SQS queue URL

### Lambda Timeouts
- **IngestLambda**: 30s (API response)
- **ProcessTikTokLambda**: 60s (TikTok download + S3 upload)
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