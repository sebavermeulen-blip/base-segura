// Contenido de Base Segura. Todo es texto fijo: no depende de internet ni de IA.
// Los ejercicios son adaptaciones de autoayuda (terapia de esquemas, DBT, ACT, compasión)
// y no sustituyen la psicoterapia.

export const MODES = [
  { id: 'nino', name: 'Niño vulnerable', hint: 'Miedo, tristeza, soledad, necesidad de cariño.',
    voice: '«Tengo miedo. No quiero que se aleje. Necesito sentir que me quiere.»',
    answer: 'Te veo. Tiene sentido que tengas miedo. Estoy aquí contigo.' },
  { id: 'enojado', name: 'Niño enojado o impulsivo', hint: 'Rabia, reclamo, ganas de actuar ya.',
    voice: '«¡No es justo! ¡Necesito que me respondas ahora!»',
    answer: 'Tu enojo dice que una necesidad importa. Podemos expresarla sin herir.' },
  { id: 'protector', name: 'Protector', hint: 'Insistir, controlar, cerrarte, desconectarte, consumir para no sentir.',
    voice: '«Necesito resolver esto ya.» o «Me da igual, me cierro.»',
    answer: 'Gracias por intentar cuidarme. Hoy puedo cuidarme de otra forma.' },
  { id: 'critico', name: 'Crítico exigente', hint: 'La voz que dice que no eres suficiente.',
    voice: '«No eres suficiente. Algo estás haciendo mal. Tienes que ganarte su cariño.»',
    answer: 'Mi valor no depende de este conflicto. No tengo que ganarme el cariño de nadie.' },
  { id: 'adulto', name: 'Adulto sano', hint: 'Reconoce, cuida, pone límites y pide con claridad.',
    voice: '«Esto me duele. Puedo pedir lo que necesito sin hacerlo desde el miedo.»',
    answer: 'Sigue así: estás respondiendo desde el presente.' },
];

export const NEEDS = ['Seguridad', 'Conexión', 'Ser escuchado', 'Reconocimiento', 'Una disculpa',
  'Una explicación', 'Saber que el desacuerdo no es una ruptura', 'Espacio', 'Un abrazo'];

export const EMOTIONS = ['Miedo', 'Angustia', 'Tristeza', 'Enojo', 'Frustración', 'Vergüenza',
  'Soledad', 'Calma', 'Esperanza', 'Alegría'];

export const DEFAULT_CARD = {
  feeling: 'Ahora mismo siento miedo y angustia porque hubo una discusión o una distancia.',
  schema: 'Es mi esquema de abandono: aprendí de niño que si alguien se aleja me quedo desprotegido.',
  reality: 'Una discusión no es un abandono. Estoy sintiendo miedo al abandono, no necesariamente siendo abandonado. No conozco el futuro.',
  behavior: 'Pido una pausa con hora de regreso, calmo mi cuerpo y después pido algo concreto. No me abandono a mí mismo.',
};

// Plan de 14 días. Después se repite en una segunda vuelta.
export const PROGRAM = [
  { title: 'Reconocer al niño vulnerable',
    question: 'En una discusión reciente, ¿qué fue lo primero que sentiste y qué necesitabas recibir?',
    exercise: ['Imagina, sin forzar recuerdos, una situación en la que tu pareja está molesta y se distancia.',
      'Escribe qué diría cada parte: tu niño vulnerable, tu protector, tu crítico y tu adulto sano.',
      'Lee en voz baja la frase del adulto sano: «Entiendo que esto me duele. Puedo pedir cariño y hablar, pero no necesito resolverlo desde el miedo».'],
    action: 'Cuando notes miedo hoy, di por dentro: «Se activó mi niño vulnerable. Estoy aquí conmigo».' },
  { title: 'Sentirte seguro contigo',
    question: '¿Qué palabras te habría gustado escuchar de un adulto que te cuidara?',
    exercise: ['Haz cinco respiraciones con la exhalación más larga que la inhalación.',
      'Repite despacio: «Estoy aquí. Hoy es un día nuevo. No tengo que resolver todo ahora. Puedo cuidarme incluso cuando siento miedo».',
      'Escribe tus palabras del día anterior como si te las dijeras hoy a ti mismo.'],
    action: 'Elige una acción para cuidarte que no dependa de cómo esté la relación (caminar, desayunar bien, un proyecto propio).' },
  { title: 'Tu lugar seguro',
    question: '¿Dónde o con qué te sientes más tranquilo hoy en tu vida adulta?',
    exercise: ['Cierra los ojos si te resulta cómodo. Imagina un lugar real o inventado donde te sientes a salvo. Si aparece un recuerdo difícil, abre los ojos y mira a tu alrededor: el ejercicio termina ahí.',
      'Nota tres detalles: qué ves, qué oyes, qué sientes en el cuerpo.',
      'Desde ahí, dite: «Puedo encontrar una solución para lo que venga. Confío en mí».'],
    action: 'Hoy, una vez, vuelve 30 segundos a tu lugar seguro con la respiración.' },
  { title: 'Conocer a tu protector',
    question: 'Cuando sientes miedo a perder a alguien, ¿qué haces para no sentirlo? (insistir, controlar, cerrarte, consumir, distraerte…)',
    exercise: ['Escribe la última vez que apareció tu protector y qué hizo.',
      'Pregúntate: ¿de qué intentaba protegerme?, ¿qué me costó?',
      'Agradece su intención y elige una forma alternativa de cuidarte la próxima vez.'],
    action: 'Si hoy aparece el protector, nómbralo: «Este es mi protector». Solo nombrarlo ya cuenta.' },
  { title: 'Detectar al crítico',
    question: '¿Qué frases te dice tu crítico cuando hay un conflicto con tu pareja?',
    exercise: ['Escribe tres frases del crítico tal como aparecen.',
      'Al lado de cada una, escribe la respuesta del adulto sano. Ejemplo: «No soy suficiente» → «Mi valor no depende de este conflicto».',
      'Lee solo la columna del adulto sano en voz alta.'],
    action: 'Cuando escuches al crítico hoy, responde con una de tus frases del adulto sano.' },
  { title: 'La necesidad debajo de la urgencia',
    question: 'Cuando sientes urgencia de que te confirmen que todo está bien, ¿qué necesitas en realidad?',
    exercise: ['Recuerda un momento de urgencia por recibir una respuesta.',
      'Elige la necesidad que había debajo: seguridad, conexión, ser escuchado, reconocimiento, una disculpa, saber que el desacuerdo no es ruptura…',
      'Escribe una forma de pedirla de manera concreta, y una forma de dártela tú mismo mientras tanto.'],
    action: 'Hoy pide una cosa concreta a alguien (no una confirmación de que te quiere: algo concreto).' },
  { title: 'Revisión de la semana',
    question: 'Mirando estos días, ¿qué notaste de ti que antes no veías?',
    exercise: ['Abre Patrones y mira cómo fue tu intensidad emocional durante la semana.',
      'Elige un momento en que respondiste mejor que antes, aunque sea un poco.',
      'Reconócelo por escrito: el progreso se mide por intensidad, duración y respuesta, no por no sentir.'],
    action: 'Haz algo agradable sólo porque sí, sin tener que merecerlo.' },
  { title: 'Escribir tu tarjeta',
    question: '¿Qué te gustaría leer en el momento exacto en que sientes que te van a dejar?',
    exercise: ['Abre «Mi tarjeta» y escríbela con tus palabras, en calma, en cuatro partes.',
      '1) Qué siento y qué lo disparó. 2) Qué esquema se activó y de dónde viene. 3) Qué dice la realidad. 4) Qué voy a hacer.',
      'Esta tarjeta aparecerá dentro del botón de emergencia.'],
    action: 'Lee tu tarjeta una vez hoy, aunque estés bien.' },
  { title: 'Hechos e interpretaciones',
    question: 'En tu última discusión, ¿qué fue un hecho y qué fue una interpretación tuya?',
    exercise: ['Escribe la situación en una frase, como si fuera una cámara (sin opiniones).',
      'Escribe tu interpretación («ya no me quiere»).',
      'Busca dos explicaciones alternativas posibles y qué pruebas tienes de cada una.'],
    action: 'Hoy, ante un silencio o una respuesta seca, pregúntate: ¿hecho o interpretación?' },
  { title: 'Ensayar la pausa',
    question: '¿Qué te cuesta más de pedir una pausa en medio de una discusión?',
    exercise: ['Una pausa sin hora de regreso puede vivirse como abandono, para ti y para tu pareja. Una con hora, no.',
      'Escribe tu frase de pausa: «Necesito 20 minutos para calmarme. No me voy: vuelvo a las __ para seguir hablando».',
      'Si puedes, acuerda con tu pareja en un momento tranquilo que ambos pueden pedir pausas así.'],
    action: 'Practica la frase en voz alta una vez.' },
  { title: 'Experimento: pedir en vez de comprobar',
    question: '¿Qué crees que pasaría si, en vez de buscar que te confirmen que te quieren, pidieras algo concreto?',
    exercise: ['Escribe tu predicción (qué crees que pasará y cuánto lo crees, de 0 a 100).',
      'Diseña un pedido concreto y pequeño para hoy o mañana: «¿Podemos cenar juntos y hablar 10 minutos?».',
      'Después, anota en el diario qué pasó realmente y compáralo con tu predicción.'],
    action: 'Haz el pedido concreto y aguanta el impulso de pedir confirmación extra después.' },
  { title: 'Tomar distancia de los pensamientos',
    question: '¿Cuál es el pensamiento que más se repite cuando hay distancia con tu pareja?',
    exercise: ['Escríbelo tal cual: «Me va a dejar».',
      'Ahora reescríbelo: «Estoy teniendo el pensamiento de que me va a dejar».',
      'Y una vez más: «Noto que mi mente me cuenta la historia de que me va a dejar». Observa si cambia algo en el cuerpo.'],
    action: 'Hoy, cuando aparezca ese pensamiento, agrégale «estoy teniendo el pensamiento de que…».' },
  { title: 'Pausa de autocompasión',
    question: '¿Cómo le hablarías a un amigo que siente lo mismo que tú en una discusión?',
    exercise: ['Pon una mano en el pecho si te resulta cómodo.',
      'Di: «Este es un momento de sufrimiento». Luego: «Sufrir es parte de ser humano; otras personas sienten esto también».',
      'Y: «Que pueda tratarme con amabilidad». Usa las palabras que le dirías a tu amigo.'],
    action: 'Una vez hoy, háblate como le hablarías a ese amigo.' },
  { title: 'Una vida propia',
    question: '¿Qué partes de tu vida son tuyas, más allá de la relación?',
    exercise: ['Haz una lista de cosas que disfrutas o te importan que no dependen de tu pareja.',
      'Elige una y planea un paso pequeño para esta semana.',
      'Revisa tus dos semanas: ¿qué ejercicio te sirvió más? Ese será tu ancla.'],
    action: 'Da hoy el paso pequeño que planeaste.' },
];

export const MINIMAL = {
  title: 'Versión mínima (2 minutos)',
  phrase: 'No tengo que hacerlo perfecto. Hoy elijo cuidarme un poco, y eso cuenta.',
};

export const HARD_MORNING = {
  title: 'Mañana difícil',
  intro: 'Ayer fue un día intenso. Hoy la sesión es corta y amable.',
  steps: ['Respira un minuto con la exhalación más larga.',
    'Di: «Ayer hubo dolor. Una discusión no es un abandono. Estoy aquí conmigo».',
    'Elige un solo gesto de cuidado para hoy.'],
};

// Líneas de ayuda en México. Fuente: directorio de la Defensoría de la UAM (abril 2026),
// porque la página oficial de CONASAMA no cargó al investigar. Hay que confirmarlas.
export const CRISIS_LINES = [
  { name: 'Emergencias', number: '911', tel: '911', note: 'Si hay peligro inmediato.' },
  { name: 'Línea de la Vida (CONASAMA)', number: '800 911 2000', tel: '8009112000', note: 'Gratis, 24 horas.' },
  { name: 'Consejo Ciudadano', number: '55 5533 5533', tel: '5555335533', note: 'Llamada o WhatsApp, 24 horas.' },
  { name: 'SAPTEL', number: '55 5259 8121', tel: '5552598121', note: '24 horas.' },
  { name: 'Atención psicológica a distancia UNAM', number: '55 5025 0855', tel: '5550250855', note: 'Gratis, lunes a viernes 8 a 18 h. No es línea de crisis.' },
];
export const CRISIS_VERIFIED = 'Números tomados de un directorio institucional (abril 2026). Pendiente confirmar con fuentes oficiales.';

export const CANNABIS_MOTIVES = ['Relajarme', 'Dormir', 'No sentir / evitar una emoción', 'Después de una discusión',
  'Costumbre o aburrimiento', 'Social'];

export const WITHDRAWAL = [
  ['Días 1–2', 'Pueden empezar la irritabilidad, la ansiedad y la dificultad para dormir.'],
  ['Días 2–6', 'Suele ser el momento más intenso: sueños vívidos o pesadillas, insomnio, poco apetito, inquietud.'],
  ['Días 7–14', 'La mayoría de los síntomas bajan.'],
  ['Semana 3 en adelante', 'En consumo intenso algunos síntomas, sobre todo del sueño, pueden durar más.'],
];
