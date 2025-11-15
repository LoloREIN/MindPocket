const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { CognitoIdentityProviderClient, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const sesClient = new SESClient({ region: process.env.AWS_REGION });
const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
    console.log('Daily Recommendations Lambda triggered');
    
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
            const name = user.Attributes?.find(attr => attr.Name === 'name')?.Value || 'Usuario';
            
            if (!email) {
                console.log(`User ${userId} has no email, skipping`);
                continue;
            }
            
            try {
                await sendDailyRecommendations(userId, email, name);
            } catch (error) {
                console.error(`Failed to send recommendations to ${email}:`, error);
            }
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Daily recommendations sent successfully',
                usersProcessed: users.length
            })
        };
        
    } catch (error) {
        console.error('Error in Daily Recommendations Lambda:', error);
        throw error;
    }
};

async function sendDailyRecommendations(userId, email, name) {
    // Get user's items
    const queryCommand = new QueryCommand({
        TableName: process.env.WELLNESS_ITEMS_TABLE,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': { S: userId }
        }
    });
    
    const result = await dynamoClient.send(queryCommand);
    const items = result.Items || [];
    
    // Filter by type
    const routines = items.filter(item => item.type?.S === 'routine' && item.enrichedData?.S);
    const diets = items.filter(item => item.type?.S === 'diet' && item.enrichedData?.S);
    
    // If no routines or diets, skip sending email
    if (routines.length === 0 && diets.length === 0) {
        console.log(`User ${userId} has no routines or diets, skipping email`);
        return;
    }
    
    // Pick random routine and diet
    const randomRoutine = routines.length > 0 ? routines[Math.floor(Math.random() * routines.length)] : null;
    const randomDiet = diets.length > 0 ? diets[Math.floor(Math.random() * diets.length)] : null;
    
    // Parse enriched data
    let routineData = null;
    let dietData = null;
    
    if (randomRoutine) {
        try {
            const enrichedData = JSON.parse(randomRoutine.enrichedData.S);
            routineData = enrichedData.routine || enrichedData.enrichedData?.routine;
        } catch (e) {
            console.error('Failed to parse routine data:', e);
        }
    }
    
    if (randomDiet) {
        try {
            const enrichedData = JSON.parse(randomDiet.enrichedData.S);
            dietData = enrichedData.recipe || enrichedData.enrichedData?.recipe;
        } catch (e) {
            console.error('Failed to parse diet data:', e);
        }
    }
    
    // Build email content
    const htmlBody = buildHtmlEmail(name, routineData, dietData, randomRoutine, randomDiet);
    const textBody = buildTextEmail(name, routineData, dietData);
    
    // Send email via SES
    const sendEmailCommand = new SendEmailCommand({
        Source: process.env.FROM_EMAIL,
        Destination: {
            ToAddresses: [email]
        },
        Message: {
            Subject: {
                Data: `💪 ${name}, tu recomendación diaria de MindPocket`,
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
    console.log(`Daily recommendations sent to ${email}`);
}

function buildHtmlEmail(name, routineData, dietData, routineItem, dietItem) {
    const today = new Date().toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .recommendation-card { background: white; padding: 25px; margin: 20px 0; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .card-header { font-size: 24px; font-weight: bold; margin-bottom: 15px; color: #667eea; }
        .card-title { font-size: 20px; font-weight: bold; margin: 15px 0 10px 0; color: #333; }
        .card-meta { color: #666; font-size: 14px; margin: 5px 0; }
        .ingredient-list, .exercise-list { margin: 15px 0; padding-left: 20px; }
        .ingredient-list li, .exercise-list li { margin: 8px 0; }
        .badge { display: inline-block; padding: 5px 10px; margin: 5px 5px 0 0; background: #e0e7ff; color: #667eea; border-radius: 15px; font-size: 12px; }
        .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
        .divider { height: 1px; background: #ddd; margin: 20px 0; }
        .emoji { font-size: 24px; }
        .link { color: #667eea; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💪 ¡Buenos días, ${name}!</h1>
            <p>${today}</p>
        </div>
        <div class="content">
            <p>Aquí están tus recomendaciones para hoy:</p>
            
            ${routineData ? `
            <div class="recommendation-card">
                <div class="card-header"><span class="emoji">🏋️</span> Tu Rutina de Hoy</div>
                <div class="card-title">${routineData.name || 'Rutina de ejercicio'}</div>
                ${routineData.duration_minutes ? `<div class="card-meta">⏱️ Duración: ${routineData.duration_minutes} minutos</div>` : ''}
                ${routineData.level ? `<div class="card-meta">📊 Nivel: ${routineData.level}</div>` : ''}
                ${routineData.focus && routineData.focus.length > 0 ? `
                    <div style="margin: 10px 0;">
                        ${routineData.focus.map(f => `<span class="badge">${f}</span>`).join('')}
                    </div>
                ` : ''}
                ${routineData.blocks && routineData.blocks.length > 0 ? `
                    <div class="divider"></div>
                    <strong>Ejercicios:</strong>
                    <ul class="exercise-list">
                        ${routineData.blocks.slice(0, 5).map(block => `
                            <li>
                                <strong>${block.exercise}</strong>
                                ${block.reps ? `- ${block.reps} repeticiones` : ''}
                                ${block.sets ? ` x ${block.sets} series` : ''}
                            </li>
                        `).join('')}
                        ${routineData.blocks.length > 5 ? '<li><em>... y más ejercicios</em></li>' : ''}
                    </ul>
                ` : ''}
                ${routineItem?.sourceUrl?.S ? `<p style="margin-top: 15px;"><a href="${routineItem.sourceUrl.S}" class="link">Ver rutina completa →</a></p>` : ''}
            </div>
            ` : '<div class="recommendation-card"><p>No tienes rutinas guardadas aún. ¡Guarda algunas para recibir recomendaciones!</p></div>'}
            
            ${dietData ? `
            <div class="recommendation-card">
                <div class="card-header"><span class="emoji">🥗</span> Tu Receta de Hoy</div>
                <div class="card-title">${dietData.name || 'Receta saludable'}</div>
                ${dietData.servings ? `<div class="card-meta">👥 Porciones: ${dietData.servings}</div>` : ''}
                ${dietData.prep_time ? `<div class="card-meta">⏱️ Preparación: ${dietData.prep_time}</div>` : ''}
                ${dietData.calories ? `<div class="card-meta">🔥 Calorías: ${dietData.calories}</div>` : ''}
                ${dietData.tags && dietData.tags.length > 0 ? `
                    <div style="margin: 10px 0;">
                        ${dietData.tags.map(tag => `<span class="badge">${tag}</span>`).join('')}
                    </div>
                ` : ''}
                ${dietData.ingredients && dietData.ingredients.length > 0 ? `
                    <div class="divider"></div>
                    <strong>Ingredientes principales:</strong>
                    <ul class="ingredient-list">
                        ${dietData.ingredients.slice(0, 5).map(ing => `<li>${ing}</li>`).join('')}
                        ${dietData.ingredients.length > 5 ? '<li><em>... y más ingredientes</em></li>' : ''}
                    </ul>
                ` : ''}
                ${dietItem?.sourceUrl?.S ? `<p style="margin-top: 15px;"><a href="${dietItem.sourceUrl.S}" class="link">Ver receta completa →</a></p>` : ''}
            </div>
            ` : '<div class="recommendation-card"><p>No tienes recetas guardadas aún. ¡Guarda algunas para recibir recomendaciones!</p></div>'}
            
            <div class="recommendation-card" style="background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%); border: 2px solid #667eea;">
                <p style="margin: 0; text-align: center;">
                    <strong>💡 Tip del día:</strong><br>
                    Pequeños pasos cada día llevan a grandes cambios. ¡Tú puedes!
                </p>
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
}

function buildTextEmail(name, routineData, dietData) {
    const today = new Date().toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    let text = `¡Buenos días, ${name}!\n${today}\n\nAquí están tus recomendaciones para hoy:\n\n`;
    
    if (routineData) {
        text += `🏋️ TU RUTINA DE HOY\n`;
        text += `${routineData.name || 'Rutina de ejercicio'}\n`;
        if (routineData.duration_minutes) text += `Duración: ${routineData.duration_minutes} minutos\n`;
        if (routineData.level) text += `Nivel: ${routineData.level}\n`;
        if (routineData.blocks && routineData.blocks.length > 0) {
            text += `\nEjercicios:\n`;
            routineData.blocks.slice(0, 5).forEach(block => {
                text += `- ${block.exercise}`;
                if (block.reps) text += ` - ${block.reps} reps`;
                if (block.sets) text += ` x ${block.sets} sets`;
                text += '\n';
            });
        }
        text += '\n';
    } else {
        text += `🏋️ No tienes rutinas guardadas aún.\n\n`;
    }
    
    if (dietData) {
        text += `🥗 TU RECETA DE HOY\n`;
        text += `${dietData.name || 'Receta saludable'}\n`;
        if (dietData.servings) text += `Porciones: ${dietData.servings}\n`;
        if (dietData.prep_time) text += `Preparación: ${dietData.prep_time}\n`;
        if (dietData.ingredients && dietData.ingredients.length > 0) {
            text += `\nIngredientes principales:\n`;
            dietData.ingredients.slice(0, 5).forEach(ing => {
                text += `- ${ing}\n`;
            });
        }
        text += '\n';
    } else {
        text += `🥗 No tienes recetas guardadas aún.\n\n`;
    }
    
    text += `💡 Tip del día:\nPequeños pasos cada día llevan a grandes cambios. ¡Tú puedes!\n\n`;
    text += `---\nMindPocket - Tu asistente de bienestar personal`;
    
    return text;
}
