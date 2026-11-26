// Contenido fijo de Base Segura. Funciona sin internet y sin IA.
// Las herramientas son adaptaciones de autoayuda de TCC, terapia de esquemas, DBT, ACT,
// terapia centrada en la compasión y mindfulness. No sustituyen la psicoterapia.

/* ─── Check-in: lo que está pasando ─── */
export const THEMES = [
  { id: 'ansiedad', name: 'Ansiedad o nervios' },
  { id: 'maldia', name: 'Un mal día' },
  { id: 'tristeza', name: 'Tristeza o bajón' },
  { id: 'enojo', name: 'Enojo o frustración' },
  { id: 'incomprension', name: 'No me siento comprendido' },
  { id: 'conflicto', name: 'Conflicto con alguien' },
  { id: 'soledad', name: 'Soledad' },
  { id: 'estres', name: 'Estrés o sobrecarga' },
  { id: 'preocupacion', name: 'Preocupación por algo que viene' },
  { id: 'autocritica', name: 'Me estoy criticando mucho' },
  { id: 'miedo-perder', name: 'Miedo a perder a alguien' },
  { id: 'sueno', name: 'No puedo dormir' },
  { id: 'consumo', name: 'Ganas de consumir' },
  { id: 'nose', name: 'No sé qué me pasa' },
];

export const BODY = ['Pecho apretado', 'Corazón acelerado', 'Nudo en el estómago', 'Tensión en hombros o mandíbula',
  'Cansancio', 'Inquietud', 'Ganas de llorar', 'Nada en especial'];

export const NEEDS_NOW = [
  { id: 'calmarme', name: 'Calmarme' },
  { id: 'entender', name: 'Entender qué me pasa' },
  { id: 'desahogarme', name: 'Desahogarme' },
  { id: 'decidir', name: 'Decidir qué hacer' },
  { id: 'acompanado', name: 'Sentirme acompañado' },
  { id: 'distraerme', name: 'Despejarme un rato' },
];

export const EMOTIONS = ['Ansiedad', 'Miedo', 'Tristeza', 'Enojo', 'Frustración', 'Vergüenza', 'Culpa',
  'Soledad', 'Cansancio', 'Confusión', 'Calma', 'Esperanza', 'Alegría'];

export const DEEP_NEEDS = ['Seguridad', 'Conexión', 'Ser escuchado', 'Reconocimiento', 'Descanso', 'Espacio',
  'Una disculpa', 'Claridad', 'Control sobre algo', 'Apoyo práctico', 'Cariño'];

/* ─── Modos (terapia de esquemas), en lenguaje general ─── */
export const MODES = [
  { id: 'vulnerable', name: 'Mi parte vulnerable', hint: 'Miedo, tristeza, soledad, sentirse pequeño.',
    answer: 'Te veo. Tiene sentido que te sientas así. No estás solo con esto.' },
  { id: 'enojada', name: 'Mi parte enojada o impulsiva', hint: 'Rabia, ganas de actuar ya, de explotar.',
    answer: 'Tu enojo dice que algo importa. Podemos expresarlo sin hacer daño.' },
  { id: 'protector', name: 'Mi protector', hint: 'Evitar, cerrarse, distraerse, consumir, controlar o insistir para no sentir.',
    answer: 'Gracias por intentar cuidarme. Hoy puedo cuidarme de otra forma.' },
  { id: 'critico', name: 'Mi crítico', hint: 'La voz que exige, juzga o castiga.',
    answer: 'Puedo equivocarme y seguir valiendo. Exigirme así no me ayuda.' },
  { id: 'adulto', name: 'Mi adulto sano', hint: 'Reconoce, cuida, pone límites y decide con calma.',
    answer: 'Sigue así: estás respondiendo desde el presente.' },
];

/* ─── Esquemas frecuentes (psicoeducación; adaptado de la terapia de esquemas de J. Young) ─── */
export const SCHEMAS = [
  { id: 'abandono', name: 'Abandono', feel: 'Miedo a que las personas importantes se vayan o dejen de estar.',
    thought: '«Si se aleja, me quedo solo y desprotegido.»', adult: 'Una distancia no es un abandono. Puedo acompañarme mientras pasa.' },
  { id: 'privacion', name: 'Privación emocional', feel: 'Sentir que nadie te entiende, te cuida o te da lo que necesitas.',
    thought: '«Nadie va a estar realmente para mí.»', adult: 'Puedo pedir lo que necesito y también dármelo en parte.' },
  { id: 'defectuosidad', name: 'Defectuosidad o vergüenza', feel: 'Sentir que hay algo malo en ti y que, si te conocieran, te rechazarían.',
    thought: '«No soy suficiente.»', adult: 'Tengo errores como todos; eso no me quita valor.' },
  { id: 'desconfianza', name: 'Desconfianza', feel: 'Esperar que los demás te lastimen, mientan o se aprovechen.',
    thought: '«Si bajo la guardia, me van a lastimar.»', adult: 'Puedo cuidarme y a la vez revisar la evidencia de cada persona.' },
  { id: 'fracaso', name: 'Fracaso', feel: 'Sentir que fallas donde otros logran.',
    thought: '«Todo me sale mal.»', adult: 'Un tropiezo es información, no una sentencia.' },
  { id: 'vulnerabilidad', name: 'Vulnerabilidad al daño', feel: 'Sentir que en cualquier momento puede pasar algo terrible.',
    thought: '«Algo malo va a pasar.»', adult: 'Mi alarma suena fuerte, pero eso no la hace una predicción.' },
  { id: 'aprobacion', name: 'Búsqueda de aprobación', feel: 'Necesitar que los demás aprueben lo que haces para sentirte bien.',
    thought: '«Tengo que ganarme que me quieran.»', adult: 'No tengo que ganarme el cariño de nadie.' },
  { id: 'subyugacion', name: 'Subyugación', feel: 'Ceder siempre ante otros para evitar conflicto o rechazo.',
    thought: '«Si digo lo que quiero, se enojarán.»', adult: 'Mis necesidades también cuentan. Puedo decir que no con respeto.' },
  { id: 'autosacrificio', name: 'Autosacrificio', feel: 'Ocuparte tanto de los demás que te olvidas de ti.',
    thought: '«Primero los demás, siempre.»', adult: 'Cuidarme no es egoísmo; me permite cuidar mejor.' },
  { id: 'exigencia', name: 'Estándares inalcanzables', feel: 'Exigirte muchísimo y nunca sentir que es suficiente.',
    thought: '«Tengo que hacerlo perfecto.»', adult: 'Suficientemente bien también está bien.' },
  { id: 'negatividad', name: 'Negatividad o pesimismo', feel: 'Fijarte sobre todo en lo que puede salir mal.',
    thought: '«Para qué, si va a salir mal.»', adult: 'Busco también lo que sí funciona, aunque sea pequeño.' },
  { id: 'aislamiento', name: 'Aislamiento social', feel: 'Sentirte distinto o fuera de lugar con los demás.',
    thought: '«No encajo en ningún lado.»', adult: 'Puedo encontrar personas con las que sí conecto.' },
];

/* ─── Catálogo de herramientas ─── */
// cat: cuerpo | entender | pensamientos | emociones | vinculos | accion | sueno
// widget: breath (respiración 4-6) | sigh (suspiro cíclico) | timer
// fields: preguntas para escribir dentro de la herramienta
export const CATEGORIES = {
  cuerpo: 'Calmar el cuerpo', entender: 'Entender qué pasa', pensamientos: 'Pensamientos',
  emociones: 'Emociones', vinculos: 'Con los demás', accion: 'Pasar a la acción', sueno: 'Dormir',
};

export const TOOLS = [
  { id: 'respiracion', title: 'Respiración lenta 4-6', cat: 'cuerpo', from: 'Respiración pausada', mins: 2,
    themes: ['ansiedad', 'enojo', 'estres', 'conflicto', 'miedo-perder', 'sueno', 'consumo'], needs: ['calmarme'], body: true, widget: 'breath', seconds: 120,
    steps: ['Inhala por la nariz contando 4.', 'Exhala por la boca, despacio, contando 6.', 'Sigue el círculo. Si te mareas, respira normal.'],
    why: 'Exhalar más largo que inhalar activa el sistema que frena la alarma del cuerpo.' },
  { id: 'suspiro', title: 'Suspiro cíclico', cat: 'cuerpo', from: 'Respiración', mins: 3,
    themes: ['ansiedad', 'estres', 'maldia', 'preocupacion'], needs: ['calmarme'], body: true, widget: 'sigh', seconds: 180,
    steps: ['Inhala por la nariz.', 'Sin soltar el aire, inhala un poquito más para llenar los pulmones.', 'Suelta todo por la boca, largo y lento.', 'Repite durante unos minutos.'],
    why: 'En un estudio de 2023, 5 minutos diarios mejoraron el ánimo más que la meditación.' },
  { id: 'grounding', title: '5-4-3-2-1: volver al presente', cat: 'cuerpo', from: 'Mindfulness', mins: 3,
    themes: ['ansiedad', 'preocupacion', 'nose', 'miedo-perder'], needs: ['calmarme'], body: true,
    steps: ['Nombra 5 cosas que ves.', '4 cosas que sientes con la piel (la ropa, la silla, el aire).', '3 sonidos que oyes.', '2 olores.', '1 sabor, o una respiración consciente.'],
    why: 'Llevar la atención a los sentidos saca a la mente del futuro o del pasado.' },
  { id: 'agua-fria', title: 'Agua fría (bajar la intensidad rápido)', cat: 'cuerpo', from: 'DBT (TIPP)', mins: 1,
    themes: ['enojo', 'ansiedad', 'conflicto', 'consumo'], needs: ['calmarme'], body: true, minAct: 7,
    steps: ['Moja tu cara con agua muy fría, o sostén algo frío en la cara, 15 a 30 segundos, conteniendo un momento la respiración.', 'Luego respira lento.', 'Evítalo si tienes un problema del corazón.'],
    why: 'El frío en la cara activa un reflejo que baja el ritmo cardíaco en segundos.' },
  { id: 'relajacion', title: 'Tensar y soltar', cat: 'cuerpo', from: 'Relajación muscular', mins: 5,
    themes: ['estres', 'ansiedad', 'sueno'], needs: ['calmarme'], body: true,
    steps: ['Aprieta los puños 5 segundos y suelta.', 'Sube los hombros hacia las orejas 5 segundos y suelta.', 'Aprieta la cara 5 segundos y suelta.', 'Nota la diferencia entre tensión y calma.'],
    why: 'Soltar la tensión muscular le avisa al cerebro que no hay peligro.' },
  { id: 'movimiento', title: 'Mover el cuerpo 5 minutos', cat: 'cuerpo', from: 'DBT (TIPP) / activación', mins: 5,
    themes: ['enojo', 'ansiedad', 'maldia', 'tristeza', 'estres', 'consumo'], needs: ['calmarme', 'distraerme'], body: true,
    steps: ['Camina rápido, sube escaleras o haz sentadillas durante 5 minutos.', 'Fíjate en la respiración y el cuerpo, no en el problema.'],
    why: 'El ejercicio intenso quema la energía de la emoción.' },

  { id: 'nombrar', title: 'Nombrar y validar lo que siento', cat: 'entender', from: 'Regulación emocional', mins: 3,
    themes: ['nose', 'maldia', 'tristeza', 'enojo', 'incomprension', 'soledad'], needs: ['entender', 'desahogarme'],
    fields: ['¿Qué emoción hay? Ponle nombre (puede haber varias).', '¿Dónde la sientes en el cuerpo?', 'Completa: «Tiene sentido que me sienta así porque…»'],
    why: 'Ponerle nombre a una emoción baja su intensidad.' },
  { id: 'hechos', title: 'Hechos e interpretaciones', cat: 'entender', from: 'TCC / DBT', mins: 5,
    themes: ['conflicto', 'incomprension', 'miedo-perder', 'ansiedad', 'autocritica', 'preocupacion'], needs: ['entender', 'decidir'],
    fields: ['¿Qué pasó, como lo grabaría una cámara (sin opiniones)?', '¿Qué me estoy diciendo sobre eso?', '¿Qué otras dos explicaciones podría haber?', '¿Qué haría si viera esto con más calma?'],
    why: 'Muchas veces sufrimos más por la historia que nos contamos que por el hecho.' },
  { id: 'cadena', title: 'La cadena: qué me llevó hasta aquí', cat: 'entender', from: 'TCC / DBT', mins: 6,
    themes: ['maldia', 'enojo', 'consumo', 'conflicto', 'nose'], needs: ['entender'],
    fields: ['¿Qué lo disparó?', '¿Qué pensé?', '¿Qué sentí y con qué intensidad?', '¿Qué hice?', '¿Qué pasó después?', '¿En qué eslabón podría hacer algo distinto la próxima vez?'],
    why: 'Ver la secuencia completa muestra dónde tienes margen para cambiarla.' },
  { id: 'modos', title: '¿Qué parte de mí está al mando?', cat: 'entender', from: 'Terapia de esquemas', mins: 4, modes: true,
    themes: ['conflicto', 'autocritica', 'miedo-perder', 'enojo', 'consumo', 'incomprension'], needs: ['entender'],
    fields: ['¿Qué parte de ti está al mando ahora y qué dice?', '¿Qué le respondería tu adulto sano?'],
    why: 'Reconocer el modo te da distancia: no eres esa parte, la estás viendo.' },
  { id: 'necesidad', title: 'La necesidad que hay debajo', cat: 'entender', from: 'Terapia de esquemas', mins: 4,
    themes: ['incomprension', 'soledad', 'conflicto', 'miedo-perder', 'tristeza'], needs: ['entender', 'decidir'], deepNeeds: true,
    fields: ['¿Qué necesito de verdad en este momento?', '¿Cómo podría pedirlo de forma concreta?', '¿Qué parte de eso puedo darme yo ahora?'],
    why: 'Detrás de cada emoción fuerte hay una necesidad sin atender.' },
  { id: 'esquema', title: '¿Se activó un esquema?', cat: 'entender', from: 'Terapia de esquemas', mins: 5, schemas: true,
    themes: ['miedo-perder', 'autocritica', 'incomprension', 'conflicto', 'soledad'], needs: ['entender'],
    fields: ['¿Esta reacción se parece a algo que siento desde hace mucho?', '¿Qué esquema podría ser (mira la lista)?', '¿Qué diría mi adulto sano sobre esto, hoy?'],
    why: 'Cuando la reacción es mucho más grande que el hecho, a veces es una herida antigua.' },

  { id: 'defusion', title: 'Tomar distancia de un pensamiento', cat: 'pensamientos', from: 'ACT', mins: 3,
    themes: ['ansiedad', 'autocritica', 'preocupacion', 'miedo-perder', 'tristeza'], needs: ['calmarme', 'entender'],
    fields: ['Escribe el pensamiento tal cual.', 'Ahora: «Estoy teniendo el pensamiento de que…» + el pensamiento.', 'Y: «Noto que mi mente me cuenta la historia de que…». ¿Cambió algo?'],
    why: 'Un pensamiento no es un hecho; verlo como pensamiento le quita fuerza.' },
  { id: 'preocupacion', title: 'Posponer la preocupación', cat: 'pensamientos', from: 'TCC', mins: 4,
    themes: ['preocupacion', 'ansiedad', 'sueno', 'estres'], needs: ['calmarme', 'decidir'],
    fields: ['¿Qué me preocupa? Escríbelo en una frase.', '¿Depende de mí? Si sí: ¿cuál es el primer paso? Si no: ¿qué puedo soltar?', '¿A qué hora de hoy le daré 15 minutos a esta preocupación? Hasta entonces, la dejo aquí.'],
    why: 'Darle un horario a la preocupación evita que ocupe todo el día.' },
  { id: 'descatastrofizar', title: 'Peor, mejor y más probable', cat: 'pensamientos', from: 'TCC', mins: 4,
    themes: ['preocupacion', 'ansiedad', 'miedo-perder'], needs: ['entender', 'decidir'],
    fields: ['¿Qué es lo peor que podría pasar?', '¿Lo mejor?', '¿Lo más probable?', 'Si pasara lo peor, ¿qué haría para salir adelante?'],
    why: 'La ansiedad se queda en el peor escenario; ampliar la vista la calma.' },
  { id: 'critico', title: 'Responder a mi crítico', cat: 'pensamientos', from: 'Terapia de esquemas / compasión', mins: 4,
    themes: ['autocritica', 'maldia', 'tristeza'], needs: ['entender', 'calmarme'],
    fields: ['¿Qué me está diciendo mi crítico?', '¿Le hablaría así a un amigo? ¿Qué le diría en cambio?', 'Escribe la respuesta de tu adulto sano.'],
    why: 'El crítico se presenta como ayuda, pero castigarse no suele motivar.' },

  { id: 'autocompasion', title: 'Pausa de autocompasión', cat: 'emociones', from: 'Autocompasión (K. Neff)', mins: 3,
    themes: ['maldia', 'tristeza', 'autocritica', 'soledad', 'incomprension'], needs: ['calmarme', 'acompanado'],
    steps: ['Pon una mano en el pecho si te resulta cómodo.', 'Di: «Este es un momento difícil».', '«Lo difícil es parte de ser humano; otras personas también lo sienten.»', '«Que pueda tratarme con amabilidad ahora.» Usa las palabras que le dirías a un amigo.'],
    why: 'Tratarse con amabilidad reduce la autocrítica de forma consistente en los estudios.' },
  { id: 'ola', title: 'Surfear la ola', cat: 'emociones', from: 'Mindfulness / DBT', mins: 5, widget: 'timer', seconds: 300,
    themes: ['ansiedad', 'enojo', 'consumo', 'tristeza', 'miedo-perder'], needs: ['calmarme'],
    steps: ['Imagina la emoción (o las ganas) como una ola: sube, llega a un pico y baja.', 'No la empujes ni la sigas. Solo obsérvala en el cuerpo.', 'Pon el temporizador de 5 minutos y nota cómo cambia.'],
    why: 'Las emociones y las ganas tienen un pico y luego bajan si no las alimentas.' },
  { id: 'accion-opuesta', title: 'Acción opuesta', cat: 'emociones', from: 'DBT', mins: 4,
    themes: ['tristeza', 'enojo', 'soledad', 'maldia'], needs: ['decidir'],
    fields: ['¿Qué emoción tengo y qué me pide hacer? (aislarme, atacar, esconderme…)', '¿Esa acción me ayuda hoy?', '¿Cuál sería la acción opuesta, pequeña? (salir, acercarme con calma, mostrarme)'],
    why: 'Cuando la emoción no ayuda, hacer lo contrario la va cambiando.' },
  { id: 'validarme', title: 'Cuando no me comprenden', cat: 'emociones', from: 'Validación (DBT)', mins: 4,
    themes: ['incomprension', 'soledad', 'conflicto'], needs: ['acompanado', 'entender'],
    fields: ['¿Qué quería que entendieran?', 'Escríbete lo que te habría gustado escuchar.', '¿Hay alguien que sí podría entenderlo? ¿Cómo se lo diría?'],
    why: 'Puedes validar tu experiencia aunque el otro no lo haga en este momento.' },

  { id: 'pausa', title: 'Pausa con hora de regreso', cat: 'vinculos', from: 'Gottman / DBT', mins: 2, pauseMsg: true,
    themes: ['conflicto', 'enojo', 'miedo-perder'], needs: ['calmarme'],
    steps: ['Con la emoción muy alta no se puede hablar bien. Pide una pausa.', 'Di cuándo vuelves: una pausa con hora de regreso no es irse.', 'Usa la pausa para calmar el cuerpo, no para repasar la discusión.'],
    why: 'Con el corazón muy acelerado escuchamos peor; 20 minutos ayudan a bajar.' },
  { id: 'pedido', title: 'Pedir algo con claridad', cat: 'vinculos', from: 'DBT (DEAR MAN)', mins: 5, request: true,
    themes: ['conflicto', 'incomprension', 'miedo-perder', 'soledad'], needs: ['decidir'],
    steps: ['Describe el hecho sin juicios.', 'Expresa lo que sentiste.', 'Pide algo concreto (no una promesa de que todo estará bien).', 'Escucha la respuesta.'],
    why: 'Un pedido concreto tiene más probabilidades de cumplirse que un reclamo.' },
  { id: 'borrador', title: 'Escribir sin enviar', cat: 'vinculos', from: 'Escritura expresiva', mins: 5, draft: true,
    themes: ['enojo', 'conflicto', 'incomprension', 'tristeza', 'maldia'], needs: ['desahogarme'],
    steps: ['Escribe todo lo que quisieras decir, sin filtro.', 'Esto no se envía: es para ti.', 'Al terminar, léelo y pregúntate qué necesitas de verdad.'],
    why: 'Poner en palabras lo que sientes ayuda a ordenarlo sin dañar la relación.' },
  { id: 'contacto', title: 'Escribirle a alguien de confianza', cat: 'vinculos', from: 'Apoyo social', mins: 3,
    themes: ['soledad', 'tristeza', 'maldia', 'incomprension'], needs: ['acompanado'],
    fields: ['¿Quién podría escucharme hoy, aunque sea un rato?', 'Escribe un mensaje corto. Ejemplo: «¿Tienes 10 minutos para platicar? Tuve un día pesado.»'],
    why: 'Hablar con una persona real es de lo que más protege la salud mental.' },

  { id: 'paso', title: 'Un paso pequeño', cat: 'accion', from: 'Activación conductual', mins: 3,
    themes: ['tristeza', 'maldia', 'estres', 'soledad'], needs: ['decidir', 'distraerme'],
    fields: ['¿Qué actividad pequeña me suele hacer bien? (ducharme, salir 10 minutos, música, cocinar)', '¿Cuándo exactamente la haré hoy?'],
    why: 'En el bajón no se espera a tener ganas: la acción pequeña trae las ganas.' },
  { id: 'problema', title: 'Resolver un problema paso a paso', cat: 'accion', from: 'TCC', mins: 6,
    themes: ['estres', 'preocupacion', 'conflicto'], needs: ['decidir'],
    fields: ['¿Cuál es el problema, en una frase?', 'Escribe 3 opciones, sin juzgarlas todavía.', '¿Cuál eliges y por qué?', '¿Cuál es el primer paso y cuándo lo das?'],
    why: 'Pasar de dar vueltas a un plan concreto baja la ansiedad.' },
  { id: 'valores', title: 'Mi brújula: lo que me importa', cat: 'accion', from: 'ACT', mins: 5,
    themes: ['maldia', 'tristeza', 'nose', 'estres'], needs: ['decidir', 'entender'],
    fields: ['¿Qué persona quiero ser en esta situación?', '¿Qué valor me guía? (cuidado, honestidad, calma, valentía…)', '¿Qué acción pequeña va en esa dirección hoy?'],
    why: 'Actuar según tus valores da sentido aunque la emoción siga ahí.' },
  { id: 'demorar', title: 'Demorar las ganas 15 minutos', cat: 'accion', from: 'Prevención de recaídas', mins: 15, widget: 'timer', seconds: 900,
    themes: ['consumo'], needs: ['calmarme', 'distraerme'],
    steps: ['No tienes que decidir ahora si consumes. Solo esperar 15 minutos.', 'Mientras tanto, haz otra cosa: agua, caminar, una ducha, respirar.', 'Al terminar, nota si las ganas cambiaron.'],
    why: 'Las ganas suben y bajan; esperar te devuelve la elección.' },

  { id: 'descarga', title: 'Vaciar la mente antes de dormir', cat: 'sueno', from: 'TCC del insomnio', mins: 5,
    themes: ['sueno', 'preocupacion', 'estres'], needs: ['calmarme'],
    fields: ['Escribe todo lo que te da vueltas.', 'Para cada cosa: ¿hay algo que hacer mañana? Anótalo.', 'Ahora la mente ya no tiene que recordarlo por ti.'],
    why: 'Escribir pendientes antes de dormir ayuda a conciliar el sueño.' },
];

export const DEFAULT_CARD = {
  feeling: 'Ahora mismo siento algo muy intenso y quiero que pare ya.',
  pattern: 'Conozco esto: cuando me pasa, tiendo a reaccionar rápido, sacar conclusiones o castigarme.',
  truth: 'Las emociones suben y bajan. Lo que siento ahora es real, pero no es todo ni es para siempre. No tengo que resolverlo todo hoy.',
  action: 'Primero calmo el cuerpo. Después elijo un paso pequeño que me cuide. Si lo necesito, pido ayuda.',
};

/* ─── Programa diario de 21 días ─── */
export const PROGRAM = [
  // Semana 1: conocerte
  { week: 'Conocerte', title: 'Tus emociones tienen nombre', question: '¿Qué emoción te acompañó más ayer? ¿Qué la disparó?', tool: 'nombrar', action: 'Hoy, cuando notes una emoción, ponle nombre por dentro.' },
  { week: 'Conocerte', title: 'Lo que dice tu cuerpo', question: '¿Dónde sientes en el cuerpo el estrés o la ansiedad?', tool: 'grounding', action: 'Una vez hoy, haz una pausa y nota tu cuerpo durante 30 segundos.' },
  { week: 'Conocerte', title: 'Pensamientos que no son hechos', question: '¿Qué pensamiento se te repite últimamente?', tool: 'defusion', action: 'Cuando aparezca ese pensamiento, agrégale «estoy teniendo el pensamiento de que…».' },
  { week: 'Conocerte', title: 'La cadena de un mal momento', question: 'Piensa en un momento difícil reciente. ¿Cómo empezó?', tool: 'cadena', action: 'Hoy, fíjate en un eslabón temprano de tus reacciones.' },
  { week: 'Conocerte', title: 'Tus partes', question: '¿Qué parte de ti aparece más cuando las cosas se ponen difíciles?', tool: 'modos', action: 'Cuando reacciones fuerte, pregúntate: ¿qué parte de mí está al mando?' },
  { week: 'Conocerte', title: 'Lo que necesitas', question: '¿Qué necesitas más en esta etapa de tu vida?', tool: 'necesidad', action: 'Pide hoy una cosa concreta que necesites, o dátela.' },
  { week: 'Conocerte', title: 'Revisión de la semana', question: '¿Qué descubriste de ti esta semana?', tool: 'valores', action: 'Haz algo agradable sólo porque sí, sin tener que merecerlo.' },
  // Semana 2: regular
  { week: 'Regular', title: 'Respirar para bajar la alarma', question: '¿En qué momentos del día te sientes más acelerado?', tool: 'respiracion', action: 'Usa la respiración 4-6 una vez hoy, antes de que la emoción suba mucho.' },
  { week: 'Regular', title: 'La preocupación tiene horario', question: '¿Qué te preocupa hoy?', tool: 'preocupacion', action: 'Respeta tu horario de preocupación: fuera de él, anota y suelta.' },
  { week: 'Regular', title: 'Peor, mejor, más probable', question: '¿Qué escenario temes que pase?', tool: 'descatastrofizar', action: 'Si aparece el peor escenario, busca también el más probable.' },
  { week: 'Regular', title: 'Amabilidad contigo', question: '¿Cómo te hablas cuando algo te sale mal?', tool: 'autocompasion', action: 'Una vez hoy, háblate como le hablarías a un amigo.' },
  { week: 'Regular', title: 'Surfear la ola', question: '¿Qué emoción o ganas te cuesta más aguantar sin actuar?', tool: 'ola', action: 'Si hoy llega una ola, espera a que baje antes de decidir.' },
  { week: 'Regular', title: 'Acción opuesta', question: '¿Qué te pide hacer tu emoción más frecuente?', tool: 'accion-opuesta', action: 'Prueba una acción opuesta pequeña.' },
  { week: 'Regular', title: 'Revisión: lo que te funciona', question: '¿Qué herramienta te sirvió más estas dos semanas?', tool: 'paso', action: 'Elige tu herramienta ancla y tenla a mano.' },
  // Semana 3: esquemas y vínculos
  { week: 'Esquemas y vínculos', title: '¿Qué es un esquema?', question: '¿Hay alguna reacción tuya que sientes que viene de hace mucho?', tool: 'esquema', action: 'Lee la lista de esquemas y marca cuáles te suenan.' },
  { week: 'Esquemas y vínculos', title: 'Tu crítico', question: '¿Qué frases te dice tu crítico?', tool: 'critico', action: 'Responde al crítico con tu adulto sano una vez hoy.' },
  { week: 'Esquemas y vínculos', title: 'Tu protector', question: '¿Qué haces para no sentir? (evitar, distraerte, consumir, controlar)', tool: 'modos', action: 'Si aparece tu protector, nómbralo y elige otra forma de cuidarte.' },
  { week: 'Esquemas y vínculos', title: 'Hechos en los vínculos', question: '¿Hubo algo con otra persona que interpretaste rápido?', tool: 'hechos', action: 'Ante un silencio o una respuesta seca, pregúntate: ¿hecho o interpretación?' },
  { week: 'Esquemas y vínculos', title: 'Pedir con claridad', question: '¿Qué te gustaría pedirle a alguien y no te animas?', tool: 'pedido', action: 'Haz un pedido concreto y pequeño.' },
  { week: 'Esquemas y vínculos', title: 'Una vida propia', question: '¿Qué partes de tu vida son solo tuyas?', tool: 'valores', action: 'Da hoy un paso pequeño en algo que sea tuyo.' },
  { week: 'Esquemas y vínculos', title: 'Revisión de tres semanas', question: 'Mirando estas semanas, ¿qué cambió en cómo respondes?', tool: 'autocompasion', action: 'Reconoce tu esfuerzo por escrito o en voz alta.' },
];

export const MINIMAL = {
  title: 'Versión mínima (2 minutos)',
  phrase: 'No tengo que hacerlo perfecto. Hoy elijo cuidarme un poco, y eso cuenta.',
};

export const HARD_MORNING = {
  title: 'Mañana difícil',
  intro: 'Ayer fue un día intenso. Hoy la sesión es corta y amable.',
  steps: ['Respira un minuto con la exhalación más larga.', 'Di: «Ayer fue difícil. Hoy es otro día. Estoy aquí conmigo».', 'Elige un solo gesto de cuidado para hoy.'],
};

/* ─── Líneas de ayuda en México ─── */
// Fuente: directorio de la Defensoría de la UAM (abril 2026); la página oficial de CONASAMA no cargó al investigar.
export const CRISIS_LINES = [
  { name: 'Emergencias', number: '911', tel: '911', note: 'Si hay peligro inmediato.' },
  { name: 'Línea de la Vida (CONASAMA)', number: '800 911 2000', tel: '8009112000', note: 'Gratis, 24 horas.' },
  { name: 'Consejo Ciudadano', number: '55 5533 5533', tel: '5555335533', note: 'Llamada o WhatsApp, 24 horas.' },
  { name: 'SAPTEL', number: '55 5259 8121', tel: '5552598121', note: '24 horas.' },
  { name: 'Atención psicológica a distancia UNAM', number: '55 5025 0855', tel: '5550250855', note: 'Gratis, lunes a viernes 8 a 18 h. No es línea de crisis.' },
];
export const CRISIS_VERIFIED = 'Números tomados de un directorio institucional (abril 2026). Pendiente confirmar con fuentes oficiales.';

/* ─── Cannabis ─── */
export const CANNABIS_MOTIVES = ['Relajarme', 'Dormir', 'No sentir / evitar una emoción', 'Después de un conflicto',
  'Costumbre o aburrimiento', 'Social'];

export const WITHDRAWAL = [
  ['Días 1–2', 'Pueden empezar la irritabilidad, la ansiedad y la dificultad para dormir.'],
  ['Días 2–6', 'Suele ser el momento más intenso: sueños vívidos o pesadillas, insomnio, poco apetito, inquietud.'],
  ['Días 7–14', 'La mayoría de los síntomas bajan.'],
  ['Semana 3 en adelante', 'En consumo intenso algunos síntomas, sobre todo del sueño, pueden durar más.'],
];
