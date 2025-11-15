const { DynamoDBClient, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { CognitoIdentityProviderClient, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { v4: uuidv4 } = require('uuid');
const https = require('https');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const sqsClient = new SQSClient({ region: process.env.AWS_REGION });
const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

/**
 * Send a message back to the user on Telegram
 */
async function sendTelegramMessage(chatId, text, replyMarkup = null) {
    const payload = {
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
    };
    
    if (replyMarkup) {
        payload.reply_markup = replyMarkup;
    }

    return new Promise((resolve, reject) => {
        const payloadStr = JSON.stringify(payload);
        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${BOT_TOKEN}/sendMessage`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payloadStr)
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

        req.write(payloadStr);
        req.end();
    });
}

/**
 * Get or create mapping between chatId and userId
 */
async function getUserIdForChat(chatId) {
    // First check if DEFAULT_USER_ID is configured (fallback mode)
    if (process.env.DEFAULT_USER_ID) {
        console.log('Using DEFAULT_USER_ID:', process.env.DEFAULT_USER_ID);
        return process.env.DEFAULT_USER_ID;
    }
    
    // Check if we have a mapping in DynamoDB
    const getParams = {
        TableName: process.env.TELEGRAM_USERS_TABLE,
        Key: {
            chatId: { S: String(chatId) }
        }
    };
    
    try {
        const result = await dynamoClient.send(new GetItemCommand(getParams));
        if (result.Item && result.Item.userId) {
            console.log('Found existing mapping:', result.Item.userId.S);
            return result.Item.userId.S;
        }
    } catch (error) {
        console.error('Error fetching user mapping:', error);
    }
    
    // No mapping found - return null (user needs to /link)
    return null;
}

/**
 * Save mapping between chatId and userId
 */
async function saveUserMapping(chatId, userId, phoneNumber) {
    const putParams = {
        TableName: process.env.TELEGRAM_USERS_TABLE,
        Item: {
            chatId: { S: String(chatId) },
            userId: { S: userId },
            phoneNumber: { S: phoneNumber },
            linkedAt: { S: new Date().toISOString() }
        }
    };
    
    await dynamoClient.send(new PutItemCommand(putParams));
    console.log('Saved mapping:', chatId, '→', userId);
}

/**
 * Find Cognito user by phone number
 */
async function findUserByPhoneNumber(phoneNumber) {
    // Normalize phone number: remove spaces, ensure + prefix
    let normalizedPhone = phoneNumber.trim().replace(/\s+/g, '');
    if (!normalizedPhone.startsWith('+')) {
        normalizedPhone = '+' + normalizedPhone;
    }
    
    console.log('Searching Cognito for phone:', normalizedPhone);
    
    const params = {
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Filter: `phone_number = "${normalizedPhone}"`,
        Limit: 1
    };
    
    try {
        const result = await cognitoClient.send(new ListUsersCommand(params));
        
        if (result.Users && result.Users.length > 0) {
            const user = result.Users[0];
            // Get userId (sub attribute)
            const subAttr = user.Attributes.find(attr => attr.Name === 'sub');
            if (subAttr) {
                console.log('Found user:', subAttr.Value);
                return subAttr.Value;
            }
        }
        
        console.log('No user found with phone:', normalizedPhone);
        return null;
    } catch (error) {
        console.error('Error searching Cognito:', error);
        return null;
    }
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
        
        if (!message) {
            console.log('No message found, ignoring update');
            return {
                statusCode: 200,
                body: JSON.stringify({ ok: true })
            };
        }

        const chatId = message.chat.id;
        
        // Handle contact sharing (phone number)
        if (message.contact) {
            console.log('Received contact:', message.contact);
            
            const phoneNumber = message.contact.phone_number;
            
            // Find user in Cognito
            const userId = await findUserByPhoneNumber(phoneNumber);
            
            if (!userId) {
                await sendTelegramMessage(
                    chatId,
                    '❌ *No encontré tu cuenta*\n\n' +
                    'No pude encontrar una cuenta de MindPocket con el número: ' + phoneNumber + '\n\n' +
                    '💡 *¿Qué hacer?*\n' +
                    '1. Asegúrate de haberte registrado en la app web\n' +
                    '2. Verifica que usaste este mismo número de teléfono\n' +
                    '3. Intenta de nuevo con /link'
                );
                return {
                    statusCode: 200,
                    body: JSON.stringify({ ok: true })
                };
            }
            
            // Save mapping
            await saveUserMapping(chatId, userId, phoneNumber);
            
            await sendTelegramMessage(
                chatId,
                '✅ *¡Cuenta vinculada!*\n\n' +
                '🎉 Tu cuenta de Telegram está ahora conectada con MindPocket.\n\n' +
                '📱 Ahora puedes enviarme links de TikTok y aparecerán automáticamente en tu dashboard web.\n\n' +
                '✨ ¡Pruébalo enviándome un link de TikTok!'
            );
            
            return {
                statusCode: 200,
                body: JSON.stringify({ ok: true })
            };
        }
        
        // Handle text messages
        if (!message.text) {
            console.log('No text message found, ignoring update');
            return {
                statusCode: 200,
                body: JSON.stringify({ ok: true })
            };
        }

        const text = message.text.trim();
        
        // Handle /start command
        if (text.startsWith('/start')) {
            await sendTelegramMessage(
                chatId,
                '👋 *¡Hola!* Bienvenido a *MindPocket Bot*\n\n' +
                'Mándame links de TikTok con recetas, rutinas o ideas que quieras guardar.\n\n' +
                'Los procesaré automáticamente y los verás en tu dashboard de MindPocket.\n\n' +
                '🔗 *Primero vincula tu cuenta:*\n' +
                'Usa el comando /link para conectar tu cuenta de Telegram con MindPocket.\n\n' +
                '✨ ¡Después solo envíame links de TikTok!'
            );
            return {
                statusCode: 200,
                body: JSON.stringify({ ok: true })
            };
        }

        // Handle /link command
        if (text.startsWith('/link')) {
            // Send button to request phone number
            const replyMarkup = {
                keyboard: [[{
                    text: '📱 Compartir mi número de teléfono',
                    request_contact: true
                }]],
                one_time_keyboard: true,
                resize_keyboard: true
            };
            
            await sendTelegramMessage(
                chatId,
                '🔗 *Vincular tu cuenta*\n\n' +
                'Para conectar tu Telegram con MindPocket, necesito tu número de teléfono.\n\n' +
                '✅ *¿Por qué?*\n' +
                'Lo uso para encontrar tu cuenta en la app web y asociar tus TikToks guardados.\n\n' +
                '🔒 *Privacidad:*\n' +
                'Tu número solo se usa para la vinculación. No se comparte ni se usa para otros fines.\n\n' +
                '👇 Presiona el botón abajo para compartir tu número:',
                replyMarkup
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
                '/link - Vincular tu cuenta de MindPocket\n' +
                '/help - Ver esta ayuda\n\n' +
                '*¿Cómo usar MindPocket Bot?*\n' +
                '1. Vincula tu cuenta con /link\n' +
                '2. Copia un link de TikTok\n' +
                '3. Pégalo en este chat\n' +
                '4. ¡Listo! Lo verás en tu dashboard\n\n' +
                'Soporto links de:\n' +
                '• tiktok.com\n' +
                '• vm.tiktok.com (links cortos)'
            );
            return {
                statusCode: 200,
                body: JSON.stringify({ ok: true })
            };
        }

        // For any other message, check if user is linked
        const userId = await getUserIdForChat(chatId);
        
        if (!userId) {
            await sendTelegramMessage(
                chatId,
                '⚠️ *Cuenta no vinculada*\n\n' +
                'Primero necesitas vincular tu cuenta de MindPocket.\n\n' +
                'Usa el comando /link para comenzar.'
            );
            return {
                statusCode: 200,
                body: JSON.stringify({ ok: true })
            };
        }

        console.log(`Processing message from chatId: ${chatId}, userId: ${userId}`);

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
