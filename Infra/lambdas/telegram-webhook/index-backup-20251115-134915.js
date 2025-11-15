const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { v4: uuidv4 } = require('uuid');
const https = require('https');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

/**
 * Send a message back to the user on Telegram
 */
async function sendTelegramMessage(chatId, text) {
    const payload = JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
    });

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${BOT_TOKEN}/sendMessage`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(data));
                } else {
                    console.error('Telegram API error:', data);
                    reject(new Error(`Telegram API returned ${res.statusCode}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error('Error sending Telegram message:', error);
            reject(error);
        });

        req.write(payload);
        req.end();
    });
}

/**
 * Process the TikTok link and create an item in the system
 */
async function processLink(userId, sourceUrl) {
    const itemId = uuidv4();
    const now = new Date().toISOString();

    // Create item in DynamoDB
    const putItemParams = {
        TableName: process.env.WELLNESS_ITEMS_TABLE,
        Item: {
            userId: { S: userId },
            itemId: { S: itemId },
            sourceUrl: { S: sourceUrl },
            status: { S: 'PENDING_DOWNLOAD' },
            type: { S: 'UNKNOWN' },
            createdAt: { S: now },
            updatedAt: { S: now }
        }
    };

    await dynamoClient.send(new PutItemCommand(putItemParams));
    console.log('Item created in DynamoDB:', itemId);

    // Send message to SQS for processing
    const sqsMessage = {
        QueueUrl: process.env.PROCESS_TIKTOK_QUEUE_URL,
        MessageBody: JSON.stringify({
            userId,
            itemId,
            sourceUrl,
            timestamp: now
        })
    };

    await sqsClient.send(new SendMessageCommand(sqsMessage));
    console.log('Message sent to SQS for processing');

    return itemId;
}

/**
 * Main Lambda handler
 */
exports.handler = async (event) => {
    console.log('Telegram Webhook triggered:', JSON.stringify(event, null, 2));

    try {
        // Parse Telegram update
        const body = JSON.parse(event.body || '{}');
        console.log('Telegram update:', JSON.stringify(body, null, 2));

        // Handle different update types
        const message = body.message;
        
        if (!message || !message.text) {
            console.log('No text message found, ignoring update');
            return {
                statusCode: 200,
                body: JSON.stringify({ ok: true })
            };
        }

        const chatId = message.chat.id;
        const text = message.text.trim();
        
        // Use configured userId or fallback to telegram-{chatId}
        // Set DEFAULT_USER_ID in environment to link bot to a specific Cognito user
        const userId = process.env.DEFAULT_USER_ID || `telegram-${chatId}`;

        console.log(`Processing message from chatId: ${chatId}, userId: ${userId}`);

        // Handle /start command
        if (text.startsWith('/start')) {
            await sendTelegramMessage(
                chatId,
                '👋 *¡Hola!* Bienvenido a *MindPocket Bot*\n\n' +
                'Mándame links de TikTok con recetas, rutinas o ideas que quieras guardar.\n\n' +
                'Los procesaré automáticamente y los verás en tu dashboard de MindPocket.\n\n' +
                '✨ ¡Prueba enviándome un link de TikTok ahora!'
            );
            return {
                statusCode: 200,
                body: JSON.stringify({ ok: true })
            };
        }

        // Handle /help command
        if (text.startsWith('/help')) {
            await sendTelegramMessage(
                chatId,
                '🤖 *Comandos disponibles:*\n\n' +
                '/start - Iniciar el bot\n' +
                '/help - Ver esta ayuda\n\n' +
                '*¿Cómo usar MindPocket Bot?*\n' +
                '1. Copia un link de TikTok\n' +
                '2. Pégalo en este chat\n' +
                '3. ¡Listo! Lo procesaré automáticamente\n\n' +
                'Soporto links de:\n' +
                '• tiktok.com\n' +
                '• vm.tiktok.com (links cortos)'
            );
            return {
                statusCode: 200,
                body: JSON.stringify({ ok: true })
            };
        }

        // Check if it's a TikTok link
        const isTikTokLink = text.includes('tiktok.com') || 
                            text.includes('vm.tiktok.com');

        if (!isTikTokLink) {
            await sendTelegramMessage(
                chatId,
                '🤔 Por ahora solo trabajo con links de TikTok.\n\n' +
                'Pega un link de TikTok y lo guardaré por ti.\n\n' +
                'Ejemplo: https://www.tiktok.com/@user/video/123'
            );
            return {
                statusCode: 200,
                body: JSON.stringify({ ok: true })
            };
        }

        // Extract the URL from the text (in case there's more text)
        const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
        const sourceUrl = urlMatch ? urlMatch[0] : text;

        console.log(`Processing TikTok URL: ${sourceUrl}`);

        // Send "processing" message immediately
        await sendTelegramMessage(
            chatId,
            '⏳ Procesando tu TikTok...'
        );

        // Process the link
        const itemId = await processLink(userId, sourceUrl);

        // Send success message
        await sendTelegramMessage(
            chatId,
            '✅ *¡Guardado!*\n\n' +
            `📱 ID: \`${itemId}\`\n\n` +
            'En unos minutos tu TikTok estará transcrito y enriquecido con IA.\n\n' +
            'Lo verás en tu dashboard de MindPocket.'
        );

        return {
            statusCode: 200,
            body: JSON.stringify({ ok: true })
        };

    } catch (error) {
        console.error('Error in Telegram webhook:', error);
        
        // Try to notify the user about the error if we have a chatId
        try {
            const body = JSON.parse(event.body || '{}');
            const chatId = body.message?.chat?.id;
            if (chatId) {
                await sendTelegramMessage(
                    chatId,
                    '❌ Ups, algo salió mal procesando tu link.\n\n' +
                    'Por favor intenta de nuevo más tarde. 🙏'
                );
            }
        } catch (notifyError) {
            console.error('Error sending error notification:', notifyError);
        }

        // Always return 200 to Telegram to avoid retries
        return {
            statusCode: 200,
            body: JSON.stringify({ ok: true })
        };
    }
};
