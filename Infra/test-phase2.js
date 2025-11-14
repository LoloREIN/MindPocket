#!/usr/bin/env node

/**
 * Phase 2 End-to-End Test Script
 * 
 * This script tests the complete flow:
 * 1. POST /items/ingest with TikTok URL
 * 2. Monitor item status progression
 * 3. Validate final TRANSCRIBED status
 */

const https = require('https');

// Configuration - Update these after deployment
const CONFIG = {
    API_URL: 'https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com', // Update after pulumi up
    COGNITO_USER_POOL_ID: 'us-east-1_XXXXXXXXX', // Update after pulumi up
    COGNITO_CLIENT_ID: 'XXXXXXXXXXXXXXXXXXXXXXXXXX', // Update after pulumi up
    TEST_TIKTOK_URLS: [
        'https://www.tiktok.com/@username/video/1234567890123456789',
        // Add more test URLs here
    ]
};

class Phase2Tester {
    constructor() {
        this.authToken = null;
        this.testItems = [];
    }

    async makeRequest(method, path, body = null, headers = {}) {
        return new Promise((resolve, reject) => {
            const url = new URL(CONFIG.API_URL + path);
            
            const options = {
                hostname: url.hostname,
                port: 443,
                path: url.pathname + url.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                }
            };

            if (this.authToken) {
                options.headers['Authorization'] = `Bearer ${this.authToken}`;
            }

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const response = {
                            statusCode: res.statusCode,
                            headers: res.headers,
                            body: data ? JSON.parse(data) : null
                        };
                        resolve(response);
                    } catch (error) {
                        reject(new Error(`Failed to parse response: ${error.message}`));
                    }
                });
            });

            req.on('error', reject);

            if (body) {
                req.write(JSON.stringify(body));
            }

            req.end();
        });
    }

    async testIngestEndpoint() {
        console.log('\n🧪 Testing POST /items/ingest...');
        
        for (const url of CONFIG.TEST_TIKTOK_URLS) {
            try {
                const response = await this.makeRequest('POST', '/items/ingest', {
                    sourceUrl: url
                });

                if (response.statusCode === 201) {
                    console.log(`✅ Successfully ingested: ${url}`);
                    console.log(`   Item ID: ${response.body.itemId}`);
                    console.log(`   Status: ${response.body.status}`);
                    
                    this.testItems.push({
                        itemId: response.body.itemId,
                        sourceUrl: url,
                        status: response.body.status,
                        createdAt: new Date()
                    });
                } else {
                    console.log(`❌ Failed to ingest ${url}: ${response.statusCode}`);
                    console.log(`   Response: ${JSON.stringify(response.body)}`);
                }
            } catch (error) {
                console.log(`❌ Error ingesting ${url}: ${error.message}`);
            }
        }
    }

    async monitorItemProgress(itemId, maxWaitMinutes = 10) {
        console.log(`\n👀 Monitoring item ${itemId} progress...`);
        
        const startTime = Date.now();
        const maxWaitMs = maxWaitMinutes * 60 * 1000;
        
        while (Date.now() - startTime < maxWaitMs) {
            try {
                const response = await this.makeRequest('GET', `/items/${itemId}`);
                
                if (response.statusCode === 200) {
                    const item = response.body;
                    console.log(`   Status: ${item.status} (${new Date().toLocaleTimeString()})`);
                    
                    // Log additional details based on status
                    if (item.status === 'MEDIA_STORED' && item.mediaS3Key) {
                        console.log(`   Media stored at: ${item.mediaS3Key}`);
                    }
                    
                    if (item.status === 'TRANSCRIBING' && item.transcriptionJobName) {
                        console.log(`   Transcription job: ${item.transcriptionJobName}`);
                    }
                    
                    if (item.status === 'TRANSCRIBED') {
                        console.log(`   ✅ Transcription complete!`);
                        if (item.transcriptPreview) {
                            console.log(`   Preview: ${item.transcriptPreview.slice(0, 100)}...`);
                        }
                        if (item.transcriptConfidence) {
                            console.log(`   Confidence: ${item.transcriptConfidence}`);
                        }
                        return item;
                    }
                    
                    if (item.status === 'ERROR') {
                        console.log(`   ❌ Processing failed: ${item.errorMessage || 'Unknown error'}`);
                        return item;
                    }
                } else {
                    console.log(`   ❌ Failed to get item status: ${response.statusCode}`);
                }
            } catch (error) {
                console.log(`   ❌ Error checking status: ${error.message}`);
            }
            
            // Wait 30 seconds before next check
            await new Promise(resolve => setTimeout(resolve, 30000));
        }
        
        console.log(`   ⏰ Timeout after ${maxWaitMinutes} minutes`);
        return null;
    }

    async testGetItemsEndpoint() {
        console.log('\n📋 Testing GET /items...');
        
        try {
            const response = await this.makeRequest('GET', '/items');
            
            if (response.statusCode === 200) {
                console.log(`✅ Retrieved ${response.body.items.length} items`);
                
                response.body.items.forEach((item, index) => {
                    console.log(`   ${index + 1}. ${item.itemId} - ${item.status}`);
                    if (item.sourceUrl) {
                        console.log(`      URL: ${item.sourceUrl.slice(0, 50)}...`);
                    }
                });
            } else {
                console.log(`❌ Failed to get items: ${response.statusCode}`);
                console.log(`   Response: ${JSON.stringify(response.body)}`);
            }
        } catch (error) {
            console.log(`❌ Error getting items: ${error.message}`);
        }
    }

    async runFullTest() {
        console.log('🚀 Starting Phase 2 End-to-End Test');
        console.log('=====================================');
        
        // Note: This test assumes you have a valid auth token
        // In a real scenario, you'd implement Cognito authentication here
        console.log('⚠️  Note: Make sure to set a valid auth token before running this test');
        console.log('   You can get one by logging into your app and copying from browser dev tools');
        
        if (!this.authToken) {
            console.log('❌ No auth token provided. Set this.authToken in the script.');
            return;
        }

        // Test the ingest endpoint
        await this.testIngestEndpoint();
        
        if (this.testItems.length === 0) {
            console.log('❌ No items were successfully ingested. Stopping test.');
            return;
        }

        // Monitor progress of first item
        const firstItem = this.testItems[0];
        const finalStatus = await this.monitorItemProgress(firstItem.itemId);
        
        // Test the get items endpoint
        await this.testGetItemsEndpoint();
        
        // Summary
        console.log('\n📊 Test Summary');
        console.log('===============');
        console.log(`Items ingested: ${this.testItems.length}`);
        
        if (finalStatus) {
            console.log(`Final status: ${finalStatus.status}`);
            if (finalStatus.status === 'TRANSCRIBED') {
                console.log('🎉 Phase 2 test PASSED! End-to-end flow working correctly.');
            } else {
                console.log('⚠️  Phase 2 test INCOMPLETE. Check logs for issues.');
            }
        }
    }
}

// Usage instructions
if (require.main === module) {
    console.log('Phase 2 Test Script');
    console.log('==================');
    console.log('');
    console.log('Before running this test:');
    console.log('1. Deploy infrastructure with: pulumi up');
    console.log('2. Update CONFIG object with your API URL and Cognito details');
    console.log('3. Set a valid auth token (get from browser after login)');
    console.log('4. Add test TikTok URLs to CONFIG.TEST_TIKTOK_URLS');
    console.log('');
    console.log('Then run: node test-phase2.js');
    console.log('');
    
    // Uncomment the next line and set auth token to run the test
    // const tester = new Phase2Tester();
    // tester.authToken = 'YOUR_JWT_TOKEN_HERE';
    // tester.runFullTest().catch(console.error);
}

module.exports = Phase2Tester;
