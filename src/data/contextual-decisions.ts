import { CareerDecision, DecisionChoice, EventCategory } from '@/types/game';

function choice(
  id: string,
  title: string,
  description: string,
  risk: DecisionChoice['risk'],
  preview: string,
  base: DecisionChoice['effects'],
  success: string,
  setback: string,
): DecisionChoice {
  return {
    id, title, description, risk, effectPreview: preview, effects: base, outcome: success,
    outcomes: [
      { id: 'success', weight: risk === 'high' ? 42 : risk === 'medium' ? 58 : 72, text: success, effects: { confidence: 2, reputation: risk === 'high' ? 3 : 1, coachRelationship: 1 } },
      { id: 'mixed', weight: 22, text: 'La idea funciona a medias: deja una ventaja y también una nueva tensión.', effects: { motivation: 1, fatigue: 2 } },
      { id: 'setback', weight: risk === 'high' ? 36 : risk === 'medium' ? 20 : 6, text: setback, effects: { confidence: -3, reputation: risk === 'high' ? -2 : 0, coachRelationship: -2 }, delayed: { seasons: 0, weeks: 8, text: 'La consecuencia de aquella decisión vuelve a la conversación del roster.', effects: { chemistry: -3, pressure: 3 } } },
    ],
  };
}

function event(id: string, slot: number, category: EventCategory, title: string, description: string, choices: DecisionChoice[], context: CareerDecision['context'] = {}): CareerDecision {
  return { id, slot, category, title, description, choices, context, weight: 100 };
}

export const CONTEXTUAL_DECISIONS: CareerDecision[] = [
  event('ctx-role-review', 1, 'role', 'El coach define la jerarquía del roster', 'Tu lugar se decide con rendimiento reciente, confianza del coach y competencia interna. Podés aceptar el proceso o intentar acelerar tu ascenso.', [
    choice('earn-minutes', 'Ganar minutos mapa a mapa', 'Pedís objetivos concretos y revisión mensual.', 'low', '+confianza del coach · progreso lento', { coachRelationship: 4, chemistry: 2, attributes: { consistency: 1, discipline: 1 } }, 'Cumplís los objetivos y tu porcentaje de mapas empieza a crecer.', 'Una mala racha retrasa la revisión y seguís peleando desde atrás.'),
    choice('demand-start', 'Exigir titularidad', 'Usás tu nivel individual como argumento para cambiar la jerarquía ya.', 'high', '+rol potencial · riesgo de banca', { confidence: 4, coachRelationship: -4, pressure: 5, flags: { demandedStartingRole: true } }, 'El staff acepta probarte como titular durante el siguiente bloque.', 'El ultimátum cae mal y el club empieza a mirar alternativas.'),
    choice('specialist', 'Aceptar un rol especialista', 'Entrás en mapas y situaciones que encajan con tu perfil.', 'medium', '+map share · menor protagonismo', { coachRelationship: 2, chemistry: 3, attributes: { adaptability: 1, mapKnowledge: 1 } }, 'Tu impacto específico te vuelve difícil de reemplazar.', 'La etiqueta de especialista limita tus oportunidades en series cortas.'),
  ]),
  event('ctx-small-team-calendar', 2, 'schedule', 'El calendario del underdog', 'El presupuesto no alcanza para viajar a todo. El equipo debe elegir entre puntos regionales, experiencia internacional o descanso.', [
    choice('regional-points', 'Construir ranking regional', 'Priorizan volumen y resultados alcanzables.', 'low', '+VRS sostenible · menos exposición', { chemistry: 3, fatigue: 2, flags: { calendarFocus: 'regional' } }, 'La regularidad da puntos y una identidad competitiva al proyecto.', 'Un upset perdido cuesta más de lo esperado y frena la escalada.'),
    choice('international-shot', 'Apostar por el qualifier grande', 'Sacrifican eventos menores por una ruta internacional.', 'high', '+techo · alto riesgo', { motivation: 4, pressure: 5, money: -1200, flags: { calendarFocus: 'international' } }, 'La preparación específica sorprende a un favorito y abre el circuito.', 'La eliminación temprana deja semanas sin partidos ni puntos.'),
    choice('protect-roster', 'Reducir viajes', 'El equipo protege energía y trabaja el map pool.', 'medium', '-fatiga · menos partidos', { fatigue: -7, burnout: -4, attributes: { mapKnowledge: 1 }, flags: { calendarFocus: 'rest' } }, 'El descanso mejora la calidad de las prácticas y llegan enteros al cierre.', 'La falta de oficiales les quita ritmo en el siguiente evento.'),
  ], { teamTiers: ['Tier 3', 'Semi-pro', 'Amateur'] }),
  event('ctx-star-responsibility', 2, 'team', 'El equipo empieza a jugar para vos', 'Tus números te ponen en el centro del sistema. Eso trae recursos, expectativas y responsabilidad por los resultados.', [
    choice('accept-star', 'Aceptar el sistema de estrella', 'Pedís espacio, drops y libertad en mid-round.', 'medium', '+impacto · +presión', { attributes: { entryImpact: 1, confidence: 1 }, pressure: 6, chemistry: -1, flags: { starSystem: true } }, 'El equipo entiende tus timings y tu rating sube con el nuevo espacio.', 'Tus compañeros pierden impacto y cada derrota se vuelve personal.'),
    choice('share-resources', 'Repartir recursos', 'Mantenés la estructura colectiva aunque reduzca highlights.', 'low', '+química · +consistencia', { chemistry: 5, attributes: { tradeEfficiency: 1, communication: 1 }, reputation: 1 }, 'El reparto vuelve al equipo menos predecible y más estable.', 'En rondas decisivas nadie asume la responsabilidad final.'),
    choice('call-more', 'Tomar voz en el mid-round', 'Convertís tu lectura individual en decisiones para todos.', 'high', '+liderazgo · doble carga', { attributes: { leadership: 2, readingOpponents: 1 }, fatigue: 4, pressure: 4 }, 'Tus calls ganan rondas y el roster empieza a verte como líder.', 'La doble función baja tu rendimiento mecánico durante varias semanas.'),
  ], { minRating: 1.12 }),
  event('ctx-slump-response', 3, 'mental', 'Tu peor tramo del año', 'El rating reciente cae, aparecen dudas sobre tu puesto y el próximo torneo define la narrativa de la temporada.', [
    choice('reset-basics', 'Volver a fundamentos', 'Reducís carga y reconstruís confianza con objetivos simples.', 'low', '-fatiga · +consistencia', { fatigue: -6, pressure: -4, attributes: { consistency: 1, crosshairPlacement: 1 } }, 'El piso de rendimiento mejora y frenás la caída.', 'La mejora es lenta y la prensa sigue pidiendo un cambio.'),
    choice('role-change', 'Probar otro rol', 'Buscás un contexto que use mejor tus atributos actuales.', 'medium', '+adaptabilidad · riesgo de minutos', { attributes: { adaptability: 2, gameSense: 1 }, coachRelationship: 2, flags: { temporaryRoleChange: true } }, 'El cambio libera tu juego y recuperás impacto.', 'La adaptación cuesta mapas y perdés prioridad en el veto.'),
    choice('grind-through', 'Jugar y entrenar más', 'Intentás romper la racha con volumen.', 'high', '+mecánica · burnout', { attributes: { aim: 1, reaction: 1 }, fatigue: 9, burnout: 7, motivation: -2 }, 'El trabajo aparece a tiempo y llegás encendido al torneo.', 'El cansancio profundiza la mala forma y aumenta el riesgo físico.'),
  ], { maxRating: 1.02 }),
  event('ctx-major-expectation', 4, 'pressure', 'La ruta al Major define el proyecto', 'El objetivo real depende del tamaño del club: para algunos es ganar; para otros, sobrevivir al qualifier ya cambia la historia.', [
    choice('process-goal', 'Objetivo por etapas', 'El roster mide cada ronda y evita mirar demasiado adelante.', 'low', '+mental · +estabilidad', { pressure: -5, chemistry: 3, attributes: { mentalStrength: 1 }, flags: { majorGoal: 'process' } }, 'La calma ayuda al equipo a competir por encima de su ranking.', 'La falta de ambición se nota cuando aparece una oportunidad real.'),
    choice('public-playoffs', 'Prometer playoffs', 'Elevás la ambición y la atención sobre el equipo.', 'high', '+fama · +presión', { reputation: 4, fanbase: 5, pressure: 9, flags: { majorGoal: 'playoffs' } }, 'La declaración une al roster y los convierte en revelación.', 'La presión pública castiga cada error del camino.'),
    choice('private-upset-plan', 'Preparar un upset específico', 'Eligen un rival, tres mapas y un plan oculto.', 'medium', '+preparación · map pool angosto', { attributes: { readingOpponents: 1, mapKnowledge: 1 }, fatigue: 3, flags: { majorGoal: 'upset' } }, 'El plan produce la mejor serie del año contra un favorito.', 'El bracket evita al rival preparado y el plan pierde valor.'),
  ]),
  event('ctx-market-choice', 5, 'transfer', 'Tu valor abre caminos distintos', 'Las ofertas no significan lo mismo: un escudo grande puede darte banca; un proyecto menor puede construir alrededor tuyo.', [
    choice('big-bench', 'Aceptar competir en un grande', 'Priorizás techo competitivo sin garantía de mapas.', 'high', '+prestigio · riesgo de banca', { reputation: 4, pressure: 5, flags: { transferPreference: 'big-club' } }, 'Tu nivel en prácticas obliga al equipo grande a darte minutos.', 'Pasás meses detrás de una figura y tu desarrollo pierde ritmo.'),
    choice('small-star', 'Liderar un proyecto chico', 'Elegís minutos, influencia y responsabilidad.', 'medium', '+rol · +desarrollo', { coachRelationship: 3, chemistry: 3, motivation: 3, flags: { transferPreference: 'project' } }, 'El proyecto te convierte en referencia y crece con tus actuaciones.', 'La falta de estructura limita cuánto podés cargar al equipo.'),
    choice('stay', 'Renovar donde estás', 'Priorizás continuidad y relaciones construidas.', 'low', '+seguridad · menor salto', { chemistry: 5, coachRelationship: 4, flags: { transferPreference: 'stay' } }, 'La continuidad se traduce en un sistema hecho a tu medida.', 'El mercado se enfría y una ventana de crecimiento se cierra.'),
  ]),
  event('ctx-brand-time', 6, 'streaming', 'Tu carrera ya compite por tu tiempo', 'Contenido, sponsors y entrenamiento quieren las mismas horas. Lo que elijas afectará ingresos y también preparación.', [
    choice('training-first', 'Blindar horas de práctica', 'Aceptás menos campañas para sostener el rendimiento.', 'low', '+training · -ingreso', { attributes: { discipline: 1, consistency: 1 }, fanbase: -1, flags: { brandBalance: 'training' } }, 'La disciplina se nota en los partidos de cierre.', 'Perdés una campaña que podría haber acelerado tu marca.'),
    choice('balanced-brand', 'Contratar ayuda de producción', 'Invertís para separar creación y práctica.', 'medium', '+fama · costo', { money: -2200, fanbase: 4, reputation: 2, fatigue: 1, flags: { brandBalance: 'staff' } }, 'El contenido crece sin romper la rutina competitiva.', 'El equipo de producción no recupera todavía su costo.'),
    choice('full-content', 'Aprovechar el momento viral', 'Subís horas y exposición durante el cierre del año.', 'high', '+ingreso futuro · fatiga', { money: 3500, fanbase: 8, fatigue: 8, burnout: 5, flags: { brandBalance: 'content' } }, 'La audiencia explota y aparecen nuevos sponsors.', 'La sobrecarga llega al servidor y el staff cuestiona tus prioridades.'),
  ]),
];

// Fallbacks keep all six yearly calls contextual even after the player reaches a
// tier or form band that does not match the more specific story above.
CONTEXTUAL_DECISIONS.push(
  event('ctx-team-direction', 2, 'team', 'El proyecto debe elegir una identidad', 'Los resultados recientes permiten insistir con el sistema, ampliar el map pool o simplificar roles. Tu posición dentro del roster cambia el peso de tu voz.', [
    choice('keep-system', 'Profundizar el sistema', 'El equipo prioriza coordinación y repeticiones.', 'low', '+química · +consistencia', { chemistry: 4, attributes: { consistency: 1 } }, 'Las repeticiones mejoran los protocolos y reducen errores evitables.', 'Los rivales leen el sistema y obligan a improvisar.'),
    choice('expand-pool', 'Ampliar el map pool', 'Sacrifican forma inmediata para preparar dos mapas nuevos.', 'medium', '+map knowledge · fatiga', { attributes: { mapKnowledge: 2, adaptability: 1 }, fatigue: 4 }, 'El veto gana profundidad y aparecen cruces favorables.', 'Los nuevos mapas todavía no están listos cuando llega el siguiente torneo.'),
    choice('rebuild-roles', 'Redefinir todos los roles', 'Buscan un techo mayor aceptando semanas de inestabilidad.', 'high', '+techo · -seguridad', { chemistry: -5, coachRelationship: -2, attributes: { adaptability: 2 }, flags: { roleRebuild: true } }, 'La nueva distribución desbloquea el potencial del quinteto.', 'La reconstrucción abre competencia interna por tu lugar.'),
  ]),
  event('ctx-midseason-adjustment', 3, 'training', 'La revisión de mitad de temporada', 'Tus datos muestran fortalezas claras y una debilidad que los rivales empiezan a atacar. El plan debe equilibrar rendimiento inmediato y desarrollo.', [
    choice('fix-weakness', 'Atacar la debilidad', 'Invertís el bloque en el atributo más vulnerable del perfil.', 'medium', '+adaptabilidad · rendimiento futuro', { attributes: { adaptability: 1, discipline: 1 }, fatigue: 3 }, 'La corrección te vuelve menos predecible en series largas.', 'La mejora tarda y tu fortaleza principal pierde algo de ritmo.'),
    choice('double-strength', 'Duplicar tu fortaleza', 'El equipo construye un arma táctica alrededor de tu mejor virtud.', 'high', '+impacto · dependencia', { attributes: { entryImpact: 1, confidence: 1 }, pressure: 4, flags: { specialistPeak: true } }, 'Tu especialidad decide varias series y te da un rol más claro.', 'Los rivales preparan un counter específico y el plan pierde sorpresa.'),
    choice('recover', 'Priorizar recuperación', 'Buscás llegar entero a los eventos de cierre.', 'low', '-fatiga · -presión', { fatigue: -8, burnout: -5, pressure: -3 }, 'La frescura devuelve consistencia sin cambiar el sistema.', 'El descanso baja el ritmo competitivo durante las primeras series.'),
  ]),
);
for (const fallback of CONTEXTUAL_DECISIONS.filter((item) => ['ctx-team-direction', 'ctx-midseason-adjustment'].includes(item.id))) fallback.weight = 1;
