const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const USER_ID = 'd4280448-a0d1-70f3-08cd-319089b00c51';
const TABLE_NAME = 'WellnessItems';

// Helper para generar IDs únicos
const generateId = () => Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);

// Seed data
const seedData = [
    // 🍳 RECETAS
    {
        type: 'recipe',
        title: '🥑 Tostadas de Aguacate con Huevo Poché',
        transcript: 'Desayuno saludable y delicioso. Tuesta pan integral, machaca aguacate maduro con limón, sal y pimienta. Prepara huevo poché (3-4 min en agua hirviendo). Monta todo y decora con semillas de sésamo.',
        tags: ['desayuno', 'saludable', 'fácil', 'aguacate', '15-minutos', 'vegetariano', 'proteína'],
        notes: '💡 Tip: Usa huevos muy frescos para que el poché quede perfecto. Si quieres más proteína, agrega queso cottage o salmón ahumado.',
        enrichedData: {
            recipe: {
                name: 'Tostadas de Aguacate con Huevo Poché',
                ingredients: [
                    { item: 'Pan integral', quantity: '2 rebanadas' },
                    { item: 'Aguacate maduro', quantity: '1 pieza' },
                    { item: 'Huevos', quantity: '2 piezas' },
                    { item: 'Limón', quantity: '1/2 pieza' },
                    { item: 'Semillas de sésamo', quantity: '1 cucharada' },
                    { item: 'Sal y pimienta', quantity: 'al gusto' },
                    { item: 'Hojuelas de chile (opcional)', quantity: 'al gusto' }
                ],
                steps: [
                    'Tuesta el pan integral hasta que esté dorado y crujiente',
                    'Machaca el aguacate con limón, sal y pimienta negra recién molida',
                    'Hierve agua con un chorrito de vinagre blanco',
                    'Prepara huevos poché: rompe el huevo en un bowl y deslízalo suavemente al agua (3-4 minutos)',
                    'Retira el huevo con una espumadera y escurre sobre papel absorbente',
                    'Unta generosamente el aguacate en el pan tostado',
                    'Coloca el huevo poché encima',
                    'Decora con semillas de sésamo, hojuelas de chile y un poco más de pimienta'
                ],
                time_minutes: 15,
                servings: 2,
                difficulty: 'fácil',
                calories: 320,
                nutrition: {
                    protein: '14g',
                    carbs: '28g',
                    fat: '18g',
                    fiber: '8g'
                }
            }
        }
    },
    {
        type: 'recipe',
        title: '🍝 Pasta Alfredo con Pollo',
        transcript: 'Cocina pechuga de pollo en cubitos con ajo. En la misma sartén, agrega crema, queso parmesano y mantequilla. Mezcla con pasta cocida. Sazona con sal, pimienta y perejil fresco.',
        tags: ['pasta', 'cena', 'cremoso', 'italiano', '30-minutos', 'pollo', 'comfort-food'],
        notes: '🍝 Secreto del chef: Guarda 1 taza del agua de la pasta para ajustar la consistencia de la salsa. La salsa debe ser cremosa pero no espesa.',
        enrichedData: {
            recipe: {
                name: 'Pasta Alfredo con Pollo',
                ingredients: [
                    { item: 'Pasta fettuccine', quantity: '400g' },
                    { item: 'Pechuga de pollo', quantity: '300g' },
                    { item: 'Crema para cocinar (35% grasa)', quantity: '300ml' },
                    { item: 'Queso parmesano rallado', quantity: '100g' },
                    { item: 'Mantequilla', quantity: '50g' },
                    { item: 'Ajo', quantity: '3 dientes' },
                    { item: 'Perejil fresco', quantity: '1/4 taza' },
                    { item: 'Nuez moscada', quantity: 'una pizca' },
                    { item: 'Sal y pimienta negra', quantity: 'al gusto' }
                ],
                steps: [
                    'Cocina la pasta fettuccine en agua con sal según instrucciones del paquete. Guarda 1 taza del agua de cocción',
                    'Corta el pollo en cubitos medianos, sazona con sal y pimienta',
                    'En una sartén grande, saltea el ajo picado en aceite de oliva hasta que esté aromático',
                    'Agrega el pollo y cocina hasta que esté dorado y bien cocido (6-8 minutos)',
                    'Reduce el fuego a medio-bajo, agrega la mantequilla',
                    'Una vez derretida, incorpora la crema y deja hervir suavemente por 2 minutos',
                    'Agrega el queso parmesano gradualmente, mezclando constantemente',
                    'Añade una pizca de nuez moscada para realzar el sabor',
                    'Agrega la pasta escurrida a la sartén y mezcla bien. Usa el agua de pasta si necesitas más cremosidad',
                    'Sirve inmediatamente con perejil fresco picado y más parmesano encima'
                ],
                time_minutes: 30,
                servings: 4,
                difficulty: 'media',
                calories: 680,
                nutrition: {
                    protein: '32g',
                    carbs: '68g',
                    fat: '28g',
                    fiber: '3g'
                }
            }
        }
    },
    {
        type: 'recipe',
        title: '🍪 Galletas de Avena y Chocolate',
        transcript: 'Mezcla avena, harina, azúcar morena y canela. Agrega mantequilla derretida, huevo y vainilla. Incorpora chips de chocolate. Hornea a 180°C por 12 minutos.',
        tags: ['postre', 'galletas', 'avena', 'chocolate', 'horneado', 'snack', 'dulce'],
        notes: '🍪 Perfectas para meal prep: Se conservan hasta 1 semana en recipiente hermético. Puedes congelar la masa en bolitas para hornear galletas frescas cuando quieras.',
        enrichedData: {
            recipe: {
                name: 'Galletas de Avena y Chocolate',
                ingredients: [
                    { item: 'Avena en hojuelas', quantity: '200g' },
                    { item: 'Harina de trigo', quantity: '150g' },
                    { item: 'Azúcar morena', quantity: '120g' },
                    { item: 'Mantequilla sin sal', quantity: '100g' },
                    { item: 'Huevo grande', quantity: '1 pieza' },
                    { item: 'Chips de chocolate semi-amargo', quantity: '150g' },
                    { item: 'Esencia de vainilla', quantity: '1 cucharadita' },
                    { item: 'Canela en polvo', quantity: '1 cucharadita' },
                    { item: 'Bicarbonato de sodio', quantity: '1/2 cucharadita' },
                    { item: 'Sal', quantity: '1/4 cucharadita' },
                    { item: 'Nueces picadas (opcional)', quantity: '50g' }
                ],
                steps: [
                    'Precalienta el horno a 180°C y prepara charolas con papel encerado',
                    'En un bowl grande, mezcla avena, harina, canela, bicarbonato y sal',
                    'Derrite la mantequilla y deja enfriar ligeramente',
                    'En otro bowl, bate el azúcar morena con la mantequilla derretida',
                    'Agrega el huevo y la vainilla, mezcla bien',
                    'Incorpora los ingredientes secos a los húmedos, mezcla hasta integrar',
                    'Añade los chips de chocolate (y nueces si usas)',
                    'Forma bolitas de 2 cucharadas de masa, coloca en charola dejando 5cm de espacio',
                    'Aplasta ligeramente cada bolita con la palma de tu mano',
                    'Hornea 12-14 minutos hasta que los bordes estén dorados',
                    'Deja enfriar en la charola 5 minutos antes de transferir a rejilla'
                ],
                time_minutes: 25,
                servings: 24,
                difficulty: 'fácil',
                calories: 145,
                nutrition: {
                    protein: '2g',
                    carbs: '19g',
                    fat: '7g',
                    fiber: '1g'
                }
            }
        }
    },
    {
        type: 'recipe',
        title: '🥗 Bowl de Quinoa con Vegetales Asados',
        transcript: 'Cocina quinoa. Asa vegetales (pimiento, calabacín, cebolla) con aceite de oliva y especias. Monta el bowl con quinoa, vegetales, aguacate, hummus y semillas de girasol.',
        tags: ['saludable', 'vegetariano', 'bowl', 'quinoa', 'fit', 'alto-proteína', 'meal-prep'],
        notes: '🥗 Meal prep friendly: Prepara quinoa y vegetales por anticipado. Ensambla el bowl justo antes de comer. Mantiene su textura y sabor hasta por 4 días en el refrigerador.',
        enrichedData: {
            recipe: {
                name: 'Bowl de Quinoa con Vegetales Asados',
                ingredients: [
                    { item: 'Quinoa tricolor', quantity: '200g (cruda)' },
                    { item: 'Pimiento rojo', quantity: '1 pieza grande' },
                    { item: 'Calabacín', quantity: '1 pieza mediana' },
                    { item: 'Cebolla morada', quantity: '1 pieza' },
                    { item: 'Berenjena pequeña', quantity: '1 pieza' },
                    { item: 'Aguacate maduro', quantity: '1 pieza' },
                    { item: 'Hummus de garbanzo', quantity: '4 cucharadas' },
                    { item: 'Semillas de girasol', quantity: '2 cucharadas' },
                    { item: 'Aceite de oliva extra virgen', quantity: '3 cucharadas' },
                    { item: 'Jugo de limón', quantity: '2 cucharadas' },
                    { item: 'Especias (comino, páprika, ajo en polvo)', quantity: '1 cucharadita c/u' },
                    { item: 'Sal y pimienta', quantity: 'al gusto' },
                    { item: 'Cilantro fresco', quantity: 'para decorar' }
                ],
                steps: [
                    'Enjuaga la quinoa bajo agua fría. Cocina en proporción 1:2 (1 taza quinoa, 2 tazas agua) con una pizca de sal por 15 minutos. Deja reposar tapada 5 minutos más',
                    'Precalienta el horno a 200°C',
                    'Corta todos los vegetales en trozos medianos y uniformes',
                    'En un bowl, mezcla los vegetales con 2 cucharadas de aceite de oliva, comino, páprika, ajo en polvo, sal y pimienta',
                    'Distribuye los vegetales en una charola con papel encerado, sin amontonarlos',
                    'Asa en el horno por 25-30 minutos, volteando a la mitad, hasta que estén dorados y caramelizados',
                    'Mientras, prepara el aderezo: mezcla 1 cucharada de aceite de oliva con jugo de limón, sal y pimienta',
                    'Para montar el bowl: coloca la quinoa esponjada como base',
                    'Distribuye los vegetales asados en secciones',
                    'Añade rebanadas de aguacate',
                    'Coloca una porción generosa de hummus',
                    'Rocía con el aderezo de limón',
                    'Decora con semillas de girasol tostadas y cilantro fresco'
                ],
                time_minutes: 40,
                servings: 2,
                difficulty: 'fácil',
                calories: 485,
                nutrition: {
                    protein: '16g',
                    carbs: '58g',
                    fat: '22g',
                    fiber: '12g'
                }
            }
        }
    },

    // 💪 RUTINAS DE EJERCICIO
    {
        type: 'workout',
        title: '🔥 Rutina HIIT para Principiantes - 20 minutos',
        transcript: 'Calentamiento 5 min. Circuito: 30 seg jumping jacks, 30 seg sentadillas, 30 seg mountain climbers, 30 seg descanso. Repite 4 veces. Enfriamiento 3 min de estiramientos.',
        tags: ['hiit', 'cardio', 'principiante', '20-minutos', 'casa', 'sin-equipo', 'quema-grasa'],
        notes: '🔥 Perfecto para: Mañanas antes del trabajo o como cardio rápido cualquier día. Quema aprox. 200-250 calorías. Modífica la intensidad según tu nivel: puedes hacer las versiones de bajo impacto.',
        enrichedData: {
            workout: {
                name: 'HIIT para Principiantes',
                duration_minutes: 20,
                level: 'principiante',
                focus: ['cardio', 'quema-grasa', 'cuerpo-completo', 'resistencia'],
                equipment: 'Ninguno (solo tu cuerpo y una colchoneta opcional)',
                calories_burned: '200-250',
                blocks: [
                    { 
                        name: 'Calentamiento',
                        exercise: 'Movimientos dinámicos',
                        description: 'March in place, arm circles, leg swings, torso twists',
                        reps: '5 minutos',
                        sets: 1
                    },
                    { 
                        name: 'Circuito (repetir 4 veces)',
                        exercise: 'Jumping jacks',
                        description: 'Salta abriendo piernas y brazos simultáneamente. Versión fácil: step jacks',
                        reps: '30 segundos',
                        sets: 4
                    },
                    { 
                        name: 'Circuito',
                        exercise: 'Sentadillas',
                        description: 'Pies ancho de hombros, baja como si te sentaras. Rodillas no pasan de la punta del pie',
                        reps: '30 segundos',
                        sets: 4
                    },
                    { 
                        name: 'Circuito',
                        exercise: 'Mountain climbers',
                        description: 'Posición de plancha, alterna rodillas al pecho. Versión fácil: más lento',
                        reps: '30 segundos',
                        sets: 4
                    },
                    { 
                        name: 'Circuito',
                        exercise: 'Descanso activo',
                        description: 'Camina en el lugar, respira profundamente',
                        reps: '30 segundos',
                        sets: 4
                    },
                    {
                        name: 'Enfriamiento',
                        exercise: 'Estiramientos',
                        description: 'Piernas, brazos, espalda. Mantén cada estiramiento 20-30 segundos',
                        reps: '3 minutos',
                        sets: 1
                    }
                ]
            }
        }
    },
    {
        type: 'workout',
        title: '💪 Rutina de Fuerza - Piernas y Glúteos',
        transcript: 'Enfoque en tren inferior. 4x12 sentadillas con peso, 4x15 zancadas alternas, 3x20 elevaciones de cadera, 3x15 peso muerto rumano. Descanso 60 seg entre series.',
        tags: ['fuerza', 'piernas', 'glúteos', 'intermedio', 'gym', 'hipertrofia', 'tonificación'],
        notes: '💪 Objetivo: Desarrollo muscular en piernas y glúteos. Usa peso que te permita completar las reps con buena forma. Últimas 2-3 reps deben ser desafiantes. Descansa 48h antes de volver a trabajar este grupo muscular.',
        enrichedData: {
            workout: {
                name: 'Fuerza - Piernas y Glúteos',
                duration_minutes: 45,
                level: 'intermedio',
                focus: ['fuerza', 'piernas', 'glúteos', 'hipertrofia'],
                equipment: 'Barra, mancuernas, banda de resistencia (opcional)',
                calories_burned: '300-400',
                blocks: [
                    {
                        name: 'Calentamiento',
                        exercise: 'Activación de glúteos',
                        description: 'Clamshells con banda, glute bridges sin peso, sentadillas con peso corporal',
                        reps: '10 reps cada uno',
                        sets: 2
                    },
                    { 
                        name: 'Ejercicio Principal 1',
                        exercise: 'Sentadillas con barra',
                        description: 'Barra en trapecios (no en cuello). Baja hasta que muslos estén paralelos al piso. Empuja con talones',
                        reps: '12',
                        sets: 4,
                        rest: '90 segundos',
                        weight: '60-70% de tu 1RM'
                    },
                    { 
                        name: 'Ejercicio Principal 2',
                        exercise: 'Zancadas alternas con mancuernas',
                        description: 'Paso amplio hacia adelante. Rodilla trasera casi toca el piso. Mantén torso erguido',
                        reps: '15 por pierna',
                        sets: 4,
                        rest: '60 segundos',
                        weight: 'Mancuernas 20-40% de tu peso corporal'
                    },
                    { 
                        name: 'Ejercicio Acces orio 1',
                        exercise: 'Hip thrust / Elevaciones de cadera',
                        description: 'Espalda apoyada en banco. Barra sobre caderas. Empuja con glúteos hasta formar línea recta. Aprieta glúteos arriba',
                        reps: '20',
                        sets: 3,
                        rest: '60 segundos',
                        weight: 'Barra con peso moderado'
                    },
                    { 
                        name: 'Ejercicio Accesorio 2',
                        exercise: 'Peso muerto rumano',
                        description: 'Piernas semi-flexionadas. Baja barra por frente de piernas manteniendo espalda recta. Siente estiramiento en femorales',
                        reps: '15',
                        sets: 3,
                        rest: '60 segundos',
                        weight: '40-50% de tu 1RM de peso muerto'
                    },
                    {
                        name: 'Finisher',
                        exercise: 'Sentadilla pulsante',
                        description: 'Baja a sentadilla y haz pequeños pulsos. Quema final',
                        reps: '30 segundos',
                        sets: 2
                    }
                ]
            }
        }
    },
    {
        type: 'workout',
        title: '🧘 Yoga Flow - Flexibilidad y Equilibrio',
        transcript: 'Secuencia suave de yoga. Saludo al sol (5 min), guerrero 1 y 2, triángulo, árbol, postura del niño. Respiración consciente. Ideal para flexibilidad y relajación.',
        tags: ['yoga', 'flexibilidad', 'equilibrio', 'relajación', 'todos-niveles', 'mañana', 'mindfulness'],
        notes: '🧘 Momento ideal: Mañana para despertar el cuerpo o noche para relajarte. Enfoca en la respiración: inhala por nariz, exhala por boca. No fuerces las posturas, el yoga es un camino progresivo.',
        enrichedData: {
            workout: {
                name: 'Yoga Flow Matutino',
                duration_minutes: 30,
                level: 'todos-niveles',
                focus: ['flexibilidad', 'equilibrio', 'relajación', 'movilidad', 'bienestar-mental'],
                equipment: 'Colchoneta de yoga (mat), bloque de yoga opcional, cojines para soporte',
                calories_burned: '100-150',
                blocks: [
                    {
                        name: 'Centramiento Inicial',
                        exercise: 'Respiración consciente',
                        description: 'Siéntate en posición cómoda. Cierra los ojos. 10 respiraciones profundas. Conecta con tu intención para la práctica',
                        reps: '2 minutos',
                        sets: 1
                    },
                    { 
                        name: 'Calentamiento Dinámico',
                        exercise: 'Saludo al sol (Surya Namaskar A)',
                        description: 'Secuencia completa: Montaña → Brazos arriba → Flexión adelante → Media flexión → Plancha → Chaturanga → Perro mirando arriba → Perro mirando abajo. Fluye con tu respiración',
                        reps: '5 ciclos',
                        sets: 1,
                        duration: '5 minutos'
                    },
                    { 
                        name: 'Posturas de Pie - Fuerza',
                        exercise: 'Guerrero 1 (Virabhadrasana I)',
                        description: 'Pierna trasera girada 45°, rodilla delantera doblada 90°. Brazos arriba, manos juntas. Abre el pecho',
                        reps: '1 minuto por lado',
                        sets: 1
                    },
                    { 
                        name: 'Posturas de Pie - Fuerza',
                        exercise: 'Guerrero 2 (Virabhadrasana II)',
                        description: 'Caderas abiertas al lado. Brazos extendidos línea recta. Mirada sobre mano delantera. Rodilla sobre tobillo',
                        reps: '1 minuto por lado',
                        sets: 1
                    },
                    { 
                        name: 'Posturas de Pie - Estiramiento',
                        exercise: 'Postura del triángulo (Trikonasana)',
                        description: 'Piernas abiertas. Inclina torso hacia un lado. Mano baja a espinilla/piso. Brazo opuesto al cielo. Abre el pecho',
                        reps: '1 minuto por lado',
                        sets: 1
                    },
                    { 
                        name: 'Equilibrio y Concentración',
                        exercise: 'Postura del árbol (Vrksasana)',
                        description: 'Pie derecho en muslo izquierdo (o pantorrilla). Manos en corazón o arriba. Encuentra un punto fijo para mirar. Respira',
                        reps: '1-2 minutos por pierna',
                        sets: 1
                    },
                    {
                        name: 'Flexibilidad y Apertura',
                        exercise: 'Paloma (Eka Pada Rajakapotasana modificada)',
                        description: 'Rodilla doblada al frente, pierna trasera extendida. Inclina torso adelante para intensificar estiramiento de cadera',
                        reps: '2 minutos por lado',
                        sets: 1
                    },
                    {
                        name: 'Relajación',
                        exercise: 'Postura del niño (Balasana)',
                        description: 'Rodillas separadas, dedos gordos tocandose. Siéntate sobre talones. Brazos extendidos o a los lados. Respira profundo',
                        reps: '3-5 minutos',
                        sets: 1
                    },
                    {
                        name: 'Savasana',
                        exercise: 'Relajación final',
                        description: 'Acuéstate boca arriba. Piernas y brazos relajados y abiertos. Suelta completamente el cuerpo. Meditación guiada o música suave opcional',
                        reps: '5 minutos',
                        sets: 1
                    }
                ]
            }
        }
    },

    // 🎬 PELÍCULAS PENDIENTES
    {
        type: 'pending',
        title: '🎬 Oppenheimer (2023)',
        transcript: 'Biografía épica sobre J. Robert Oppenheimer y la creación de la bomba atómica. Dirigida por Christopher Nolan. Ganadora de múltiples premios Oscar incluyendo Mejor Película.',
        tags: ['película', 'biografía', 'drama', 'histórica', 'nolan', 'oscar-2024', 'imprescindible'],
        notes: '🏆 Ganadora de 7 Oscars incluyendo Mejor Película y Mejor Director. Duración: 3h. 💡 Recomendación: Véla en formato IMAX si es posible para la experiencia completa. Cillian Murphy da la actuación de su vida.',
        enrichedData: {
            pending: {
                category: 'movie',
                name: 'Oppenheimer',
                author: 'Christopher Nolan',
                year: 2023,
                duration: '180 minutos',
                genre: ['Biografía', 'Drama', 'Historia', 'Thriller'],
                rating: 'R',
                imdbRating: '8.3/10',
                cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.'],
                awards: '7 Oscars (Mejor Película, Director, Actor, Fotografía, Edición, Música, Actor de Reparto)',
                platform: 'Amazon Prime Video, Apple TV',
                description: 'La historia del físico J. Robert Oppenheimer y su papel en el desarrollo de la bomba atómica durante la Segunda Guerra Mundial. Nolan entreteje un thriller psicológico que explora la responsabilidad moral, el ego y las consecuencias del poder científico. Una obra maestra cinematográfica que combina narrativa no lineal con imágenes impresionantes.',
                why_watch: 'Una de las mejores películas del año. Cinematografía espectacular, actuaciones impecables y una historia que te hace pensar mucho después de verla.'
            }
        }
    },
    {
        type: 'pending',
        title: '🎥 Dune: Parte Dos (2024)',
        transcript: 'Paul Atreides se une con Chani y los Fremen para vengarse contra quienes destruyeron su familia. Denis Villeneuve continúa la épica adaptación de la novela de Frank Herbert.',
        tags: ['película', 'ciencia-ficción', 'épica', 'dune', 'aventura', 'acción', 'espectacular'],
        notes: '🎬 Experiencia visual alucinante. Mejor que la Parte 1. 🤩 Escenas de acción impresionantes, efectos visuales de otro nivel. La banda sonora de Hans Zimmer es épica. ¡Mínimo en cine, ideal en IMAX!',
        enrichedData: {
            pending: {
                category: 'movie',
                name: 'Dune: Parte Dos',
                author: 'Denis Villeneuve',
                year: 2024,
                duration: '166 minutos',
                genre: ['Ciencia Ficción', 'Aventura', 'Drama', 'Épica'],
                rating: 'PG-13',
                imdbRating: '8.8/10',
                cast: ['Timothée Chalamet', 'Zendaya', 'Austin Butler', 'Florence Pugh', 'Josh Brolin'],
                awards: 'Nominada a 5 Oscars incluyendo Mejor Película',
                platform: 'Max (HBO), Amazon Prime Video (alquiler)',
                description: 'Paul Atreides se une a los Fremen del desierto en su guerra santa contra la Casa Harkonnen. Mientras lucha por vengar a su familia, debe enfrentarse a la profecía que lo convierte en el Mesías del pueblo Fremen. Una continuación espectacular que supera a la primera parte con secuencias de acción impresionantes y desarrollo de personajes profundo.',
                why_watch: 'Cine de ciencia ficción en su máxima expresión. Villeneuve logra una adaptación fiel y visualmente asombrosa de la novela clásica. Las escenas de las batallas en el desierto y la monta de gusanos son inolvidables.'
            }
        }
    },

    // 📚 LIBRO PENDIENTE
    {
        type: 'pending',
        title: '📚 Hábitos Atómicos - James Clear',
        transcript: 'Libro sobre cómo los pequeños cambios diarios pueden transformar tu vida. Explica la ciencia detrás de la formación de hábitos y proporciona estrategias prácticas para mejorar cada día un 1%.',
        tags: ['libro', 'hábitos', 'productividad', 'desarrollo-personal', 'bestseller', 'autoayuda', 'imprescindible'],
        notes: '📚 #1 bestseller del New York Times. +5 millones de copias vendidas. 💡 Libro práctico con estrategias accionables. Perfecto para: construir rutinas, eliminar malos hábitos, lograr metas a largo plazo. Lee 15 min diarios para absorberlo bien.',
        enrichedData: {
            pending: {
                category: 'book',
                name: 'Hábitos Atómicos (Atomic Habits)',
                author: 'James Clear',
                year: 2018,
                pages: 320,
                language: 'Español / English',
                isbn: '978-0735211292',
                rating: '4.8/5 (Amazon)',
                format: ['Físico', 'Kindle', 'Audiolibro'],
                publisher: 'Avery / Diana',
                readingTime: '4-6 horas',
                keyTopics: [
                    'Las 4 leyes del cambio de comportamiento',
                    'Cómo hacer que los buenos hábitos sean inevitables',
                    'Cómo romper malos hábitos',
                    'El poder del 1% de mejora diaria',
                    'Sistemas vs. Metas',
                    'Stackeo de hábitos'
                ],
                description: 'James Clear presenta un método revolucionario basado en ciencia para crear buenos hábitos y eliminar los malos. El libro se centra en pequeños cambios que generan resultados extraordinarios con el tiempo. Clear desglosa cómo funcionan los hábitos a nivel neurológico y proporciona tácticas prácticas para aplicar inmediatamente.',
                keyLessons: [
                    'Los hábitos son el interés compuesto de la mejora personal',
                    'Enfocarse en sistemas, no en metas',
                    'Los hábitos se forman en 4 pasos: señal, anhelo, respuesta, recompensa',
                    'El entorno es más importante que la motivación',
                    'La regla de los 2 minutos para comenzar nuevos hábitos'
                ],
                why_read: 'Este libro cambiará tu forma de ver el crecimiento personal. En lugar de cambios drásticos que no duran, aprendes a construir sistemas sostenibles. Extremadamente práctico con ejemplos reales y ejercicios.'
            }
        }
    },

    // 💻 CURSO PENDIENTE
    {
        type: 'pending',
        title: '💻 Full Stack Web Development - The Complete Course',
        transcript: 'Curso completo de desarrollo web desde cero. Aprende HTML, CSS, JavaScript, React, Node.js, bases de datos y deployment. Incluye proyectos reales y certificación.',
        tags: ['curso', 'programación', 'web-development', 'react', 'nodejs', 'full-stack', 'carrera'],
        notes: '🚀 De cero a Full Stack en 6 meses. 💼 Habilidades demandadas en el mercado. ⏰ Dedica 2-3 horas diarias. Incluye portafolio completo al final. 💰 Inversión: ~$15-20 USD en oferta (Udemy). Certificado reconocido.',
        enrichedData: {
            pending: {
                category: 'course',
                name: 'The Web Developer Bootcamp 2024',
                author: 'Colt Steele',
                platform: 'Udemy',
                duration: '63 horas de video',
                level: 'Principiante a Avanzado',
                language: 'Inglés (subtitulos en español disponibles)',
                price: '$15-20 USD (en oferta) - Precio regular $84.99',
                rating: '4.7/5 (270K+ estudiantes)',
                lastUpdated: '2024',
                certificate: 'Sí, al completar el curso',
                prerequisites: 'Ninguno - se empieza desde cero',
                curriculum: [
                    'HTML5 y CSS3 moderno (Flexbox, Grid)',
                    'JavaScript ES6+ (async/await, closures, OOP)',
                    'React.js (Hooks, Context, React Router)',
                    'Node.js y Express.js',
                    'MongoDB y Mongoose',
                    'REST APIs y CRUD operations',
                    'Autenticación y Seguridad',
                    'Git y GitHub',
                    'Deployment (Heroku, Netlify, Vercel)',
                    'Responsive Design',
                    'Bootstrap y Tailwind CSS'
                ],
                projects: [
                    'YelpCamp - Plataforma de reseñas de campamentos',
                    'Aplicación de lista de tareas con React',
                    'API REST de películas',
                    'Blog personal con CMS',
                    'Tienda e-commerce básica',
                    'Juego de navegador interactivo'
                ],
                skillsYouLearn: [
                    'Crear aplicaciones web completas desde cero',
                    'Diseñar interfaces responsive y modernas',
                    'Implementar bases de datos y APIs',
                    'Desplegar aplicaciones a producción',
                    'Trabajar con Git y control de versiones',
                    'Debugging y testing'
                ],
                description: 'El curso más completo y actualizado de desarrollo web Full Stack en Udemy. Colt Steele, instructor con +1M de estudiantes, te lleva desde HTML básico hasta construir aplicaciones web complejas. El curso se actualiza constantemente con las últimas tecnologías y mejores prácticas de la industria.',
                careerPath: 'Al finalizar estarás listo para aplicar a posiciones de Junior Full Stack Developer, Frontend Developer o Backend Developer. Salario promedio: $50-80K USD al año para juniors.',
                why_take: 'Colt es un instructor excepcional que explica conceptos complejos de forma simple. El curso tiene un balance perfecto entre teoría y práctica. Los proyectos te dan un portafolio sólido para mostrar a empleadores. La comunidad es muy activa y ayuda cuando te atoras.'
            }
        }
    }
];

// Función para crear items
async function seedDatabase() {
    console.log('🌱 Iniciando seed de base de datos...\n');
    
    let successCount = 0;
    let errorCount = 0;

    for (const data of seedData) {
        const itemId = generateId();
        const item = {
            userId: USER_ID,
            itemId: itemId,
            status: 'READY',
            type: data.type,
            title: data.title,
            transcriptFull: data.transcript,  // Full transcript (matches get-item schema)
            transcriptPreview: data.transcript.substring(0, 200),  // Preview for list view
            tags: data.tags,
            sourceUrl: `https://example.com/${itemId}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Agregar enrichedData si existe
        if (data.enrichedData) {
            item.enrichedData = data.enrichedData;
        }
        
        // Agregar notes si existe (campo opcional para UI)
        if (data.notes) {
            item.notes = data.notes;
        }

        try {
            await docClient.send(new PutCommand({
                TableName: TABLE_NAME,
                Item: item
            }));
            
            console.log(`✅ ${data.title}`);
            successCount++;
            
            // Pequeña pausa para no saturar
            await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
            console.error(`❌ Error creando ${data.title}:`, error.message);
            errorCount++;
        }
    }

    console.log('\n📊 Resumen:');
    console.log(`   ✅ Creados exitosamente: ${successCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);
    console.log('\n🎉 ¡Base de datos poblada!');
    console.log(`\n🔗 Visita tu app: https://mindpocket.lolorein.com`);
}

// Ejecutar
seedDatabase().catch(console.error);
