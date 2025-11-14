#!/usr/bin/env node

/**
 * Phase 3 End-to-End Test Script
 * 
 * Tests the complete AI-powered content analysis flow:
 * 1. POST /items/ingest with TikTok URL
 * 2. Monitor status progression: PENDING_DOWNLOAD → TRANSCRIBING → ENRICHING → READY
 * 3. Validate Claude Sonnet analysis results
 * 4. Test structured data extraction (recipes, workouts, pending items)
 */

const https = require('https');

// Configuration - Update these after deployment
const CONFIG = {
    API_URL: 'https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com', // Update after pulumi up
    COGNITO_USER_POOL_ID: 'us-east-1_XXXXXXXXX', // Update after pulumi up
    COGNITO_CLIENT_ID: 'XXXXXXXXXXXXXXXXXXXXXXXXXX', // Update after pulumi up
    
    // Test TikTok URLs for different content types
    TEST_SCENARIOS: [
        {
            name: "Recipe Test",
            url: "https://www.tiktok.com/@chef/video/recipe123",
            expectedType: "RECIPE",
            description: "Should extract ingredients, steps, servings, etc."
        },
        {
            name: "Workout Test", 
            url: "https://www.tiktok.com/@fitness/video/workout456",
            expectedType: "WORKOUT",
            description: "Should extract exercises, reps, duration, etc."
        },
        {
            name: "Book Recommendation",
            url: "https://www.tiktok.com/@reader/video/book789",
            expectedType: "PENDING",
            description: "Should extract book name, platform, notes"
        }
    ]
};

class Phase3Tester {
    constructor() {
        this.authToken = null;
        this.testResults = [];
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

    async testScenario(scenario) {
        console.log(`\n🧪 Testing: ${scenario.name}`);
        console.log(`   URL: ${scenario.url}`);
        console.log(`   Expected: ${scenario.expectedType}`);
        console.log(`   ${scenario.description}`);
        
        try {
            // 1) Ingest the URL
            const ingestResponse = await this.makeRequest('POST', '/items/ingest', {
                sourceUrl: scenario.url
            });

            if (ingestResponse.statusCode !== 201) {
                console.log(`   ❌ Ingest failed: ${ingestResponse.statusCode}`);
                return { scenario: scenario.name, success: false, error: 'Ingest failed' };
            }

            const itemId = ingestResponse.body.itemId;
            console.log(`   ✅ Ingested successfully, itemId: ${itemId}`);

            // 2) Monitor progress through all phases
            const finalItem = await this.monitorItemProgress(itemId, scenario.expectedType, 15); // 15 min timeout

            if (!finalItem) {
                return { scenario: scenario.name, success: false, error: 'Timeout waiting for completion' };
            }

            // 3) Validate the results
            const validation = this.validateEnrichedData(finalItem, scenario);
            
            return {
                scenario: scenario.name,
                success: validation.success,
                itemId,
                finalStatus: finalItem.status,
                contentType: finalItem.type,
                title: finalItem.title,
                enrichedData: finalItem.enrichedData,
                validation: validation.details,
                error: validation.error
            };

        } catch (error) {
            console.log(`   ❌ Test failed: ${error.message}`);
            return { scenario: scenario.name, success: false, error: error.message };
        }
    }

    async monitorItemProgress(itemId, expectedType, maxWaitMinutes = 15) {
        console.log(`\n👀 Monitoring item ${itemId} through Phase 3 pipeline...`);
        
        const startTime = Date.now();
        const maxWaitMs = maxWaitMinutes * 60 * 1000;
        const expectedStatuses = ['PENDING_DOWNLOAD', 'MEDIA_STORED', 'TRANSCRIBING', 'TRANSCRIBED', 'ENRICHING', 'READY'];
        let lastStatus = '';
        
        while (Date.now() - startTime < maxWaitMs) {
            try {
                const response = await this.makeRequest('GET', `/items/${itemId}`);
                
                if (response.statusCode === 200) {
                    const item = response.body;
                    const currentStatus = item.status;
                    
                    // Only log status changes
                    if (currentStatus !== lastStatus) {
                        console.log(`   📊 Status: ${currentStatus} (${new Date().toLocaleTimeString()})`);
                        lastStatus = currentStatus;
                        
                        // Log additional details based on status
                        if (currentStatus === 'TRANSCRIBED' && item.transcriptPreview) {
                            console.log(`   📝 Transcript preview: ${item.transcriptPreview.slice(0, 100)}...`);
                            console.log(`   🎯 Confidence: ${item.transcriptConfidence || 'N/A'}`);
                        }
                        
                        if (currentStatus === 'ENRICHING') {
                            console.log(`   🤖 Claude Sonnet analyzing content...`);
                        }
                    }
                    
                    if (currentStatus === 'READY') {
                        console.log(`   ✅ AI Analysis complete!`);
                        console.log(`   📋 Content Type: ${item.type}`);
                        console.log(`   📖 Title: ${item.title || 'N/A'}`);
                        console.log(`   🏷️  Tags: ${item.tags ? item.tags.join(', ') : 'N/A'}`);
                        
                        if (item.enrichedData) {
                            const data = item.enrichedData;
                            console.log(`   📊 Summary: ${data.summary?.slice(0, 100) || 'N/A'}...`);
                            
                            // Type-specific details
                            if (data.type === 'recipe' && data.recipe) {
                                console.log(`   🍳 Recipe: ${data.recipe.ingredients?.length || 0} ingredients, ${data.recipe.steps?.length || 0} steps`);
                            } else if (data.type === 'workout' && data.workout) {
                                console.log(`   💪 Workout: ${data.workout.blocks?.length || 0} exercises, ${data.workout.duration_minutes || 'N/A'} min`);
                            } else if (data.type === 'pending' && data.pending) {
                                console.log(`   📚 Pending: ${data.pending.category} - ${data.pending.name}`);
                            }
                        }
                        
                        return item;
                    }
                    
                    if (currentStatus === 'ERROR' || currentStatus === 'ENRICH_ERROR') {
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

    validateEnrichedData(item, scenario) {
        const validation = { success: true, details: [], error: null };
        
        try {
            // Basic validations
            if (item.status !== 'READY') {
                validation.success = false;
                validation.details.push(`❌ Expected status READY, got ${item.status}`);
            } else {
                validation.details.push(`✅ Status: ${item.status}`);
            }

            if (item.type !== scenario.expectedType) {
                validation.success = false;
                validation.details.push(`❌ Expected type ${scenario.expectedType}, got ${item.type}`);
            } else {
                validation.details.push(`✅ Content Type: ${item.type}`);
            }

            if (!item.enrichedData) {
                validation.success = false;
                validation.details.push(`❌ Missing enrichedData`);
                return validation;
            }

            const data = item.enrichedData;

            // Validate required fields
            if (!data.title) {
                validation.details.push(`⚠️  Missing title`);
            } else {
                validation.details.push(`✅ Title: "${data.title}"`);
            }

            if (!data.summary) {
                validation.details.push(`⚠️  Missing summary`);
            } else {
                validation.details.push(`✅ Summary length: ${data.summary.length} chars`);
            }

            // Type-specific validations
            if (scenario.expectedType === 'RECIPE' && data.recipe) {
                const recipe = data.recipe;
                validation.details.push(`✅ Recipe data present`);
                validation.details.push(`   - Ingredients: ${recipe.ingredients?.length || 0}`);
                validation.details.push(`   - Steps: ${recipe.steps?.length || 0}`);
                validation.details.push(`   - Servings: ${recipe.servings || 'N/A'}`);
                validation.details.push(`   - Time: ${recipe.time_minutes || 'N/A'} min`);
                validation.details.push(`   - Difficulty: ${recipe.difficulty || 'N/A'}`);
            }

            if (scenario.expectedType === 'WORKOUT' && data.workout) {
                const workout = data.workout;
                validation.details.push(`✅ Workout data present`);
                validation.details.push(`   - Exercises: ${workout.blocks?.length || 0}`);
                validation.details.push(`   - Duration: ${workout.duration_minutes || 'N/A'} min`);
                validation.details.push(`   - Level: ${workout.level || 'N/A'}`);
                validation.details.push(`   - Focus: ${workout.focus?.join(', ') || 'N/A'}`);
            }

            if (scenario.expectedType === 'PENDING' && data.pending) {
                const pending = data.pending;
                validation.details.push(`✅ Pending item data present`);
                validation.details.push(`   - Category: ${pending.category || 'N/A'}`);
                validation.details.push(`   - Name: ${pending.name || 'N/A'}`);
                validation.details.push(`   - Platform: ${pending.platform || 'N/A'}`);
            }

        } catch (error) {
            validation.success = false;
            validation.error = `Validation error: ${error.message}`;
        }

        return validation;
    }

    async runFullTest() {
        console.log('🚀 Starting Phase 3 End-to-End Test');
        console.log('====================================');
        console.log('Testing AI-powered content analysis with Claude Sonnet');
        console.log('');
        
        // Note: This test assumes you have a valid auth token
        if (!this.authToken) {
            console.log('❌ No auth token provided. Set this.authToken in the script.');
            console.log('   Get a JWT token by logging into your app and copying from browser dev tools');
            return;
        }

        // Test each scenario
        for (const scenario of CONFIG.TEST_SCENARIOS) {
            const result = await this.testScenario(scenario);
            this.testResults.push(result);
            
            // Brief pause between tests
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        // Print summary
        this.printTestSummary();
    }

    printTestSummary() {
        console.log('\n📊 Phase 3 Test Summary');
        console.log('=======================');
        
        const successful = this.testResults.filter(r => r.success).length;
        const total = this.testResults.length;
        
        console.log(`Tests: ${successful}/${total} passed`);
        console.log('');
        
        this.testResults.forEach(result => {
            const status = result.success ? '✅' : '❌';
            console.log(`${status} ${result.scenario}`);
            
            if (result.success) {
                console.log(`   Status: ${result.finalStatus}`);
                console.log(`   Type: ${result.contentType}`);
                console.log(`   Title: ${result.title || 'N/A'}`);
            } else {
                console.log(`   Error: ${result.error}`);
            }
            
            if (result.validation?.details) {
                result.validation.details.forEach(detail => {
                    console.log(`   ${detail}`);
                });
            }
            console.log('');
        });
        
        if (successful === total) {
            console.log('🎉 All Phase 3 tests PASSED! AI content analysis working correctly.');
            console.log('   - TikTok audio extraction ✅');
            console.log('   - AWS Transcribe speech-to-text ✅');
            console.log('   - Claude Sonnet content analysis ✅');
            console.log('   - Structured data extraction ✅');
        } else {
            console.log('⚠️  Some Phase 3 tests failed. Check logs and Bedrock model access.');
        }
    }
}

// Usage instructions
if (require.main === module) {
    console.log('Phase 3 AI Analysis Test Script');
    console.log('===============================');
    console.log('');
    console.log('Before running this test:');
    console.log('1. Deploy Phase 3 infrastructure: pulumi up');
    console.log('2. Enable Claude Sonnet in Bedrock console → Model access');
    console.log('3. Update CONFIG with your API URL and Cognito details');
    console.log('4. Set a valid JWT auth token');
    console.log('5. Replace test TikTok URLs with real ones');
    console.log('');
    console.log('Then run: node test-phase3.js');
    console.log('');
    
    // Uncomment the next lines and set auth token to run the test
    // const tester = new Phase3Tester();
    // tester.authToken = 'YOUR_JWT_TOKEN_HERE';
    // tester.runFullTest().catch(console.error);
}

module.exports = Phase3Tester;
