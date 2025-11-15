const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { CognitoIdentityProviderClient, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const sesClient = new SESClient({ region: process.env.AWS_REGION });
const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
    console.log('Weekly Summary Lambda triggered');
    
    try {
        // Get all users from Cognito
        const listUsersCommand = new ListUsersCommand({
            UserPoolId: process.env.COGNITO_USER_POOL_ID
        });
        
        const cognitoResponse = await cognitoClient.send(listUsersCommand);
        const users = cognitoResponse.Users || [];
        
        console.log(`Found ${users.length} users to process`);
        
        // Process each user
        for (const user of users) {
            const userId = user.Username;
            const email = user.Attributes?.find(attr => attr.Name === 'email')?.Value;
            
            if (!email) {
                console.log(`User ${userId} has no email, skipping`);
                continue;
            }
            
            try {
                await sendWeeklySummary(userId, email);
            } catch (error) {
                console.error(`Failed to send summary to ${email}:`, error);
            }
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Weekly summaries sent successfully',
                usersProcessed: users.length
            })
        };
        
    } catch (error) {
        console.error('Error in Weekly Summary Lambda:', error);
        throw error;
    }
};

async function sendWeeklySummary(userId, email) {
    // Calculate date range for last 7 days
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Scan items for this user created in the last week
    const scanCommand = new ScanCommand({
        TableName: process.env.WELLNESS_ITEMS_TABLE,
        FilterExpression: 'userId = :userId AND createdAt >= :weekAgo',
        ExpressionAttributeValues: {
            ':userId': { S: userId },
            ':weekAgo': { S: oneWeekAgo.toISOString() }
        }
    });
    
    const result = await dynamoClient.send(scanCommand);
    const items = result.Items || [];
    
    // If no items, skip sending email
    if (items.length === 0) {
        console.log(`User ${userId} has no items this week, skipping email`);
        return;
    }
    
    // Count favorites
    const favorites = items.filter(item => item.isFavorite?.BOOL === true);
    
    // Group by type
    const itemsByType = items.reduce((acc, item) => {
        const type = item.type?.S || 'other';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});
    
    // Build email content
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .stat-card { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-number { font-size: 48px; font-weight: bold; color: #667eea; margin: 10px 0; }
        .stat-label { color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
        .breakdown { margin-top: 20px; }
        .breakdown-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
        .emoji { font-size: 24px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Tu Resumen Semanal de MindPocket</h1>
            <p>Del ${oneWeekAgo.toLocaleDateString('es-ES')} al ${now.toLocaleDateString('es-ES')}</p>
        </div>
        <div class="content">
            <div class="stat-card">
                <div class="stat-label">Links Guardados Esta Semana</div>
                <div class="stat-number">${items.length}</div>
                ${favorites.length > 0 ? `<p><span class="emoji">⭐</span> ${favorites.length} marcado${favorites.length > 1 ? 's' : ''} como favorito${favorites.length > 1 ? 's' : ''}</p>` : ''}
            </div>
            
            ${Object.keys(itemsByType).length > 1 ? `
            <div class="stat-card">
                <h3>Desglose por Categoría</h3>
                <div class="breakdown">
                    ${Object.entries(itemsByType).map(([type, count]) => `
                        <div class="breakdown-item">
                            <span>${getTypeLabel(type)}</span>
                            <strong>${count}</strong>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            <div class="stat-card">
                <p>¡Sigue así! Cada link guardado es un paso hacia tus objetivos de bienestar. 💪</p>
            </div>
        </div>
        <div class="footer">
            <p>MindPocket - Tu asistente de bienestar personal</p>
            <p>Este es un correo automático, por favor no respondas.</p>
        </div>
    </div>
</body>
</html>
    `;
    
    const textBody = `
Tu Resumen Semanal de MindPocket
Del ${oneWeekAgo.toLocaleDateString('es-ES')} al ${now.toLocaleDateString('es-ES')}

Links Guardados: ${items.length}
${favorites.length > 0 ? `Favoritos: ${favorites.length}` : ''}

${Object.keys(itemsByType).length > 1 ? `
Desglose por Categoría:
${Object.entries(itemsByType).map(([type, count]) => `${getTypeLabel(type)}: ${count}`).join('\n')}
` : ''}

¡Sigue así! Cada link guardado es un paso hacia tus objetivos de bienestar.

---
MindPocket - Tu asistente de bienestar personal
    `.trim();
    
    // Send email via SES
    const sendEmailCommand = new SendEmailCommand({
        Source: process.env.FROM_EMAIL,
        Destination: {
            ToAddresses: [email]
        },
        Message: {
            Subject: {
                Data: `📊 Tu resumen semanal: ${items.length} link${items.length !== 1 ? 's' : ''} guardado${items.length !== 1 ? 's' : ''}`,
                Charset: 'UTF-8'
            },
            Body: {
                Text: {
                    Data: textBody,
                    Charset: 'UTF-8'
                },
                Html: {
                    Data: htmlBody,
                    Charset: 'UTF-8'
                }
            }
        }
    });
    
    await sesClient.send(sendEmailCommand);
    console.log(`Weekly summary sent to ${email}`);
}

function getTypeLabel(type) {
    const labels = {
        'diet': '🥗 Receta/Dieta',
        'routine': '💪 Rutina',
        'pending': '📚 Pendiente',
        'other': '🔗 Otro'
    };
    return labels[type] || '🔗 ' + type;
}
