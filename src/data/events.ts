import { CareerDecision, EventCategory } from '@/types/game';
import { CONTEXTUAL_DECISIONS } from './contextual-decisions';

type Blueprint = { category: EventCategory; subject: string; tension: string; positive: string; conservative: string; risky: string };

const BLUEPRINTS: Blueprint[] = [
  { category: 'training', subject: 'El coach cambia tu rutina', tension: 'La nueva carga promete subir tu nivel, pero llegás con fatiga acumulada.', positive: 'Aceptar el plan medido', conservative: 'Pedir una semana liviana', risky: 'Duplicar la carga' },
  { category: 'transfer', subject: 'Una organización te contacta', tension: 'Ofrece mayor exposición, un sueldo mejor y un rol menos claro.', positive: 'Negociar un rol definido', conservative: 'Quedarte en el proyecto', risky: 'Forzar la transferencia' },
  { category: 'relationship', subject: 'Un compañero cuestiona tu actitud', tension: 'La charla ocurre delante del roster después de una derrota dura.', positive: 'Hablar en privado', conservative: 'Escuchar y seguir', risky: 'Responder públicamente' },
  { category: 'contract', subject: 'Tu contrato entra en revisión', tension: 'La organización quiere más meses y una cláusula de salida alta.', positive: 'Negociar con representante', conservative: 'Aceptar estabilidad', risky: 'Rechazar y quedar libre' },
  { category: 'money', subject: 'Llega tu primer premio importante', tension: 'Podés invertirlo en tu carrera, guardarlo o cambiar tu estilo de vida.', positive: 'Invertir en staff', conservative: 'Ahorrar el premio', risky: 'Gastar en una celebración' },
  { category: 'equipment', subject: 'Tu mouse falla antes del torneo', tension: 'El sponsor exige usar un modelo nuevo que nunca probaste.', positive: 'Adaptarte con práctica', conservative: 'Pedir una excepción', risky: 'Cambiar todo el setup' },
  { category: 'schedule', subject: 'Dos eventos se superponen', tension: 'Uno da ranking; el otro, dinero y exposición regional.', positive: 'Priorizar ranking', conservative: 'Elegir el evento conocido', risky: 'Intentar jugar ambos' },
  { category: 'travel', subject: 'El vuelo de la bootcamp se cancela', tension: 'Llegarías tarde al media day y perderías una práctica completa.', positive: 'Reorganizar con el equipo', conservative: 'Entrenar remoto', risky: 'Viajar por otra ruta sin descanso' },
  { category: 'rest', subject: 'Tenés una semana libre', tension: 'El próximo rival es favorito, pero tu energía está al límite.', positive: 'Descansar con estructura', conservative: 'Mezclar descanso y demos', risky: 'Grindear sin parar' },
  { category: 'injury', subject: 'Aparece dolor en la muñeca', tension: 'El médico recomienda parar; el qualifier empieza mañana.', positive: 'Seguir el tratamiento', conservative: 'Reducir práctica', risky: 'Jugar infiltrado' },
  { category: 'nutrition', subject: 'La gira desordena tu alimentación', tension: 'Dormís mal y tu reacción empezó a caer en scrims.', positive: 'Contratar nutricionista', conservative: 'Ordenar tus horarios', risky: 'Compensar con energizantes' },
  { category: 'mental', subject: 'Perdés confianza tras un 0.62', tension: 'Las redes amplifican el peor partido de tu temporada.', positive: 'Trabajar con psicólogo', conservative: 'Alejarte de redes', risky: 'Responder a cada crítica' },
  { category: 'social', subject: 'Un clip tuyo se vuelve viral', tension: 'La comunidad te ama, pero el coach teme que pierdas foco.', positive: 'Aprovecharlo con límites', conservative: 'Mantener perfil bajo', risky: 'Volverte full creator' },
  { category: 'streaming', subject: 'Una plataforma ofrece exclusividad', tension: 'El contrato paga muy bien pero exige horas durante la temporada.', positive: 'Negociar pocas horas', conservative: 'Esperar al off-season', risky: 'Firmar el máximo' },
  { category: 'media', subject: 'Te preguntan por el IGL en vivo', tension: 'El equipo viene de tres derrotas y la relación está tensa.', positive: 'Respaldar el proyecto', conservative: 'Responder sin entrar en detalles', risky: 'Criticar las calls' },
  { category: 'sponsor', subject: 'Un sponsor propone una campaña', tension: 'La idea da dinero y visibilidad, pero usa una imagen que no te representa.', positive: 'Rediseñar la campaña', conservative: 'Rechazar con respeto', risky: 'Aceptar por el dinero' },
  { category: 'conflict', subject: 'El roster se divide en dos', tension: 'Coach e IGL proponen sistemas opuestos antes de playoffs.', positive: 'Mediar con datos', conservative: 'Seguir al coach', risky: 'Armar tu propio bloque' },
  { category: 'rivalry', subject: 'Un rival te provoca en redes', tension: 'El próximo cruce define la clasificación al evento del año.', positive: 'Responder en el server', conservative: 'Ignorar la provocación', risky: 'Subir la apuesta' },
  { category: 'role', subject: 'Te ofrecen cambiar de rol', tension: 'Perdés protagonismo, pero el equipo ganaría equilibrio.', positive: 'Probar durante un mes', conservative: 'Mantener tu rol', risky: 'Exigir ser la estrella' },
  { category: 'language', subject: 'El nuevo roster habla inglés', tension: 'Entendés las calls básicas, pero sufrís en los mid-rounds.', positive: 'Tomar clases intensivas', conservative: 'Usar protocolos simples', risky: 'Improvisar hasta aprender' },
  { category: 'bootcamp', subject: 'La bootcamp se extiende', tension: 'El equipo quiere una semana más lejos de casa antes del Major.', positive: 'Aceptar con descansos', conservative: 'Pedir mantener la fecha', risky: 'Entrenar catorce horas diarias' },
  { category: 'confidence', subject: 'El coach te entrega el clutch', tension: 'Queda una ronda, poco tiempo y toda la temporada en juego.', positive: 'Jugar el porcentaje', conservative: 'Guardar el arma', risky: 'Buscar el highlight' },
  { category: 'team', subject: 'Llega una promesa al roster', tension: 'Compite por tu espacio, pero necesita alguien que la guíe.', positive: 'Mentorear al rookie', conservative: 'Competir profesionalmente', risky: 'Bloquear su integración' },
  { category: 'igl', subject: 'El IGL abandona el proyecto', tension: 'El equipo necesita una voz y vos conocés el sistema mejor que nadie.', positive: 'Tomar responsabilidad temporal', conservative: 'Buscar un reemplazo', risky: 'Exigir capitanía total' },
  { category: 'coach', subject: 'El coach propone un sistema nuevo', tension: 'Las primeras scrims salen mal y el roster pierde paciencia.', positive: 'Apoyar con feedback', conservative: 'Pedir más tiempo', risky: 'Desafiarlo delante del equipo' },
  { category: 'fanbase', subject: 'La hinchada pide más contenido', tension: 'Tu popularidad sube, pero también la presión por cada resultado.', positive: 'Crear contenido planificado', conservative: 'Hacer un Q&A ocasional', risky: 'Transmitir todos los días' },
  { category: 'pressure', subject: 'Debutás en un escenario gigante', tension: 'Escuchás al público rival y fallás los primeros dos duelos.', positive: 'Respirar y volver al protocolo', conservative: 'Pedir timeout', risky: 'Acelerar para recuperar confianza' },
  { category: 'integrity', subject: 'Aparece una acusación falsa', tension: 'Un clip editado instala dudas sobre una jugada extraordinaria.', positive: 'Cooperar con la investigación', conservative: 'Dejar que responda el equipo', risky: 'Atacar al acusador' },
  { category: 'suspension', subject: 'Un compañero recibe una sanción', tension: 'El suplente tiene talento, pero nunca jugó este rol en LAN.', positive: 'Adaptar el sistema', conservative: 'Simplificar el map pool', risky: 'Cambiar todos los roles' },
  { category: 'retirement', subject: 'Pensás en el futuro', tension: 'Tu nivel sigue alto, pero aparece una oferta para ser coach o analista.', positive: 'Preparar una transición', conservative: 'Seguir una temporada', risky: 'Retirarte inmediatamente' },
];

const contexts = ['en una liga regional', 'antes de playoffs', 'durante una bootcamp', 'camino al Major', 'tras una racha de derrotas', 'después de tu mejor torneo', 'en pleno mercado de pases'];

export const CAREER_EVENTS: CareerDecision[] = BLUEPRINTS.flatMap((blueprint, blueprintIndex) => contexts.map((context, variant) => ({
  id: `${blueprint.category}-${variant + 1}`,
  category: blueprint.category,
  title: blueprint.subject,
  description: `${blueprint.tension} La situación aparece ${context}.`,
  minSeason: blueprint.category === 'retirement' ? 4 : blueprint.category === 'contract' ? 2 : 1,
  weight: 10 + ((blueprintIndex + variant) % 8),
  choices: [
    { id: 'balanced', title: blueprint.positive, description: 'Buscás una solución sostenible sin perder ambición.', risk: 'low', effectPreview: '+química · +disciplina', effects: { confidence: 2, chemistry: 4, reputation: 2, fatigue: -2, attributes: { discipline: 1, communication: 1 }, flags: { [`${blueprint.category}Balanced`]: true } }, outcome: 'La decisión fortalece tu posición y el equipo reconoce tu madurez.' },
    { id: 'safe', title: blueprint.conservative, description: 'Reducís la exposición y cuidás la estabilidad del proyecto.', risk: 'medium', effectPreview: '+estabilidad · -impacto', effects: { confidence: -1, chemistry: 1, fatigue: -5, motivation: -1, attributes: { mentalStrength: 1 }, flags: { [`${blueprint.category}Safe`]: true } }, outcome: 'Evitaste el peor escenario, aunque algunos esperaban más iniciativa.' },
    { id: 'risk', title: blueprint.risky, description: 'Apostás fuerte: puede acelerar tu carrera o dejar una marca difícil.', risk: 'high', effectPreview: '+impacto · alto riesgo', effects: { confidence: 5, chemistry: -5, reputation: variant % 2 ? -3 : 5, fatigue: 7, burnout: 4, attributes: { aim: 1, discipline: -1 }, flags: { [`${blueprint.category}Risk`]: true } }, outcome: variant % 2 ? 'La apuesta genera tensión y obliga a demostrar resultados.' : 'La jugada sale bien y tu nombre empieza a circular.' },
  ],
})));

export const ALL_CAREER_DECISIONS = [...CONTEXTUAL_DECISIONS, ...CAREER_EVENTS];
export const getCareerEvent = (id?: string) => ALL_CAREER_DECISIONS.find((event) => event.id === id);
