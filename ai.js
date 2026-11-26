// Acompañante con IA (Claude, de Anthropic). Opcional: solo funciona si la persona
// pega su propia clave de API y acepta enviar sus textos. La detección de crisis
// NO depende de la IA: la app aplica reglas fijas antes de enviar nada.
import Anthropic from './vendor/anthropic-sdk.js';
import { TOOLS, SCHEMAS } from './content.js';

export const MODELS = [
  { id: 'claude-opus-5-5', name: 'Claude Opus 5.5 (más capaz)' },
  { id: 'claude-sonnet-5-5', name: 'Claude Sonnet 5.5 (más económico)' },
];

// Reglas fijas: si aparece alguna de estas expresiones, la app muestra ayuda de crisis
// antes de cualquier respuesta de la IA.
const CRISIS_RE = /(suicid|matarme|quitarme la vida|no quiero (seguir )?vivir|no vale la pena vivir|ganas de morir|quiero morir|morirme|hacerme da[ñn]o|lastimarme|cortarme|acabar con todo|desaparecer para siempre|no despertar)/i;
export const looksLikeCrisis = (text) => CRISIS_RE.test(text || '');

const toolList = TOOLS.map((t) => `- ${t.id}: ${t.title} (${t.from})`).join('\n');
const schemaList = SCHEMAS.map((s) => s.name).join(', ');

// Prompt de sistema estable (se cachea). El contexto que cambia va en los mensajes.
export const SYSTEM_PROMPT = `Eres el acompañante de "Base Segura", una app personal de bienestar emocional. Eres una IA (Claude, de Anthropic). No eres psicólogo ni terapeuta, no haces diagnósticos y no lo finges; si te preguntan, lo dices con naturalidad.

## Cómo hablas
- Español de México, de "tú". Cálido, sencillo y directo. Sin tecnicismos salvo que ayuden, y explicados.
- Respuestas cortas: normalmente de 2 a 6 frases. Una sola pregunta por mensaje.
- Texto plano. Puedes usar una lista breve si ayuda. Sin títulos ni emojis.

## Cómo acompañas
Integras con criterio herramientas de terapia cognitivo-conductual, terapia de esquemas (modos: parte vulnerable, parte enojada, protector, crítico, adulto sano; esquemas: ${schemaList}), DBT, ACT, terapia centrada en la compasión, mindfulness y teoría del apego. No impones un enfoque: eliges según lo que la persona vive.
1. Primero valida: refleja en pocas palabras lo que siente, sin exagerar ni minimizar.
2. Si la activación es alta (7 o más de 10, o se nota desbordada), empieza por calmar el cuerpo antes de analizar.
3. Después ayuda a entender: hechos frente a interpretaciones, qué parte está al mando, qué necesidad hay debajo, si algo se parece a un patrón antiguo. Pregunta antes de afirmar; ofrece hipótesis, no verdades ("¿puede ser que…?").
4. Cierra con algo concreto: un paso pequeño, una herramienta o una pregunta para pensar.
La persona guía: si quiere desahogarse, escucha más y analiza menos; si quiere decidir, ayuda a ordenar opciones.

## Herramientas de la app
Puedes sugerir hasta dos por mensaje escribiendo exactamente [[herramienta:ID]] (la app lo convierte en un botón). Usa solo estos ID:
${toolList}
También puedes sugerir [[plan]] (su plan de seguridad) y [[ayuda]] (líneas de ayuda).

## Lo que no haces
- No das garantías sobre lo que harán otras personas ni sobre el futuro ("no te va a dejar", "todo saldrá bien"). Si la persona busca tranquilidad una y otra vez sobre lo mismo, lo nombras con cariño y la ayudas a tolerar la incertidumbre y a ver qué necesita; repetir tranquilidad alivia un momento y alimenta el ciclo.
- No le das la razón a las creencias dolorosas ("no soy suficiente", "nadie me quiere") ni las descartas: las exploras.
- No tomas partido en conflictos con otras personas: ayudas a ver la situación con más perspectiva, incluida la del otro.
- No das indicaciones de medicamentos ni de dosis; para eso, un médico. Sobre consumo de sustancias, hablas sin juzgar y con enfoque de reducción de daños.
- No fomentas que la persona dependa de ti. Valoras y animas el contacto con personas de su vida y, cuando corresponde, con un profesional. Si la conversación se alarga mucho, propón cerrar con un aprendizaje.
- No inventas recuerdos ni datos: solo sabes lo que la persona te cuenta y el contexto que te pasa la app. No propones regresiones ni ejercicios para "recuperar recuerdos".

## Seguridad (por encima de todo lo demás)
Si aparece cualquier señal de ideas de suicidio, de hacerse daño, de hacer daño a otros, de violencia o abuso, o de una crisis grave: deja el trabajo terapéutico, empieza tu mensaje con [[crisis]], responde con calma y calidez, pregunta si está a salvo en este momento y anima a llamar al 911 si hay peligro inmediato, o a la Línea de la Vida 800 911 2000 (gratis, 24 h) o al Consejo Ciudadano 55 5533 5533 (llamada o WhatsApp). Sugiere [[plan]]. No pidas detalles de métodos. Quédate presente sin dramatizar.`;

export function makeClient(apiKey) {
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 2 });
}

export function describeError(err) {
  if (err instanceof Anthropic.AuthenticationError) return 'La clave de API no es válida. Revísala en Más → Acompañante con IA.';
  if (err instanceof Anthropic.PermissionDeniedError) return 'La clave no tiene permiso para este modelo.';
  if (err instanceof Anthropic.RateLimitError) return 'Demasiadas solicitudes o sin saldo en la cuenta. Intenta en un rato.';
  if (err instanceof Anthropic.APIConnectionError) return 'No hay conexión a internet. Las herramientas de la app siguen funcionando sin conexión.';
  if (err instanceof Anthropic.APIError) return `El servicio respondió con un error (${err.status ?? '?'}). Intenta de nuevo.`;
  return 'Algo salió mal al contactar a la IA.';
}

// Conversación con streaming. onText recibe el texto acumulado.
export async function chat({ apiKey, model, messages, onText, signal }) {
  const client = makeClient(apiKey);
  const stream = client.beta.messages.stream({
    model,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium' },
    cache_control: { type: 'ephemeral' },
    system: SYSTEM_PROMPT,
    messages,
  }, { signal });
  let text = '';
  stream.on('text', (delta) => { text += delta; onText?.(text); });
  const final = await stream.finalMessage();
  if (final.stop_reason === 'refusal') {
    return { text: text || 'No puedo responder a esto. Si estás pasando un momento muy difícil, usa las líneas de ayuda de la app. [[ayuda]]', refused: true };
  }
  return { text, refused: false, truncated: final.stop_reason === 'max_tokens' };
}

// Personaliza la sesión del día. Devuelve un objeto validado o null.
export async function personalizeSession({ apiKey, model, context, programDay }) {
  const client = makeClient(apiKey);
  const ids = TOOLS.map((t) => t.id);
  const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['conexion', 'pregunta', 'herramienta', 'accion'],
    properties: {
      conexion: { type: 'string', description: 'Una o dos frases que conecten con lo vivido recientemente, sin inventar.' },
      pregunta: { type: 'string', description: 'Una pregunta de exploración para hoy.' },
      herramienta: { type: 'string', enum: ids },
      accion: { type: 'string', description: 'Una acción pequeña y concreta para practicar hoy.' },
    },
  };
  const res = await client.beta.messages.create({
    model,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: { type: 'json_schema', schema } },
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Prepara la sesión matutina de hoy (10-15 minutos). Día del programa: "${programDay.title}" (semana "${programDay.week}"), con la herramienta sugerida "${programDay.tool}". Puedes cambiar la herramienta si lo reciente de la persona pide otra. Que sea progresiva, segura y amable.\n\nContexto de la app:\n${context}`,
    }],
  });
  if (res.stop_reason === 'refusal') return null;
  const block = res.content.find((b) => b.type === 'text');
  try {
    const o = JSON.parse(block?.text || '');
    if (!ids.includes(o.herramienta) || !o.pregunta || !o.accion) return null;
    return o;
  } catch { return null; }
}
