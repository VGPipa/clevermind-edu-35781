type ClassStage = 'guia' | 'evaluaciones' | 'cierre' | 'otros';

const GUIA_STATES = [
  'borrador',
  'generando_clase',
  'editando_guia',
  'guia_aprobada',
  'modificando_guia',
] as const;

const EVALUACIONES_PRE_STATES = [
  'guia_final',
  'quiz_pre_generando',
  'quiz_pre_enviado',
  'analizando_quiz_pre',
] as const;

const EVALUACIONES_POST_STATES = [
  'quiz_post_generando',
  'quiz_post_enviado',
  'analizando_resultados',
] as const;

const CIERRE_STATES = [
  'clase_programada',
  'preparada',
  'en_clase',
  'completada',
  'ejecutada',
  'programada',
] as const;

const OTROS_STATES = [
  'cancelada',
] as const;

const CLASS_STATE_STAGE: Record<string, ClassStage> = {};
GUIA_STATES.forEach(state => CLASS_STATE_STAGE[state] = 'guia');
EVALUACIONES_PRE_STATES.forEach(state => CLASS_STATE_STAGE[state] = 'evaluaciones');
EVALUACIONES_POST_STATES.forEach(state => CLASS_STATE_STAGE[state] = 'evaluaciones');
CIERRE_STATES.forEach(state => CLASS_STATE_STAGE[state] = 'cierre');
OTROS_STATES.forEach(state => CLASS_STATE_STAGE[state] = 'otros');

export const PRE_EVALUATION_STATES = [...EVALUACIONES_PRE_STATES];
export const POST_EVALUATION_STATES = [...EVALUACIONES_POST_STATES];
export const FLOW_STATES = [
  ...GUIA_STATES,
  ...EVALUACIONES_PRE_STATES,
  ...EVALUACIONES_POST_STATES,
];
export const CLOSURE_STATES = [...CIERRE_STATES];

export const getClassStage = (estado?: string | null): ClassStage => {
  if (!estado) return 'guia';
  return CLASS_STATE_STAGE[estado] || 'guia';
};

export const isPreparationStage = (estado?: string | null) => getClassStage(estado) === 'guia';
export const isEvaluationStage = (estado?: string | null) => getClassStage(estado) === 'evaluaciones';
export const isClosureStage = (estado?: string | null) => getClassStage(estado) === 'cierre';
export const isPreQuizState = (estado?: string | null) => PRE_EVALUATION_STATES.includes((estado || '') as typeof PRE_EVALUATION_STATES[number]);
export const isPostQuizState = (estado?: string | null) => POST_EVALUATION_STATES.includes((estado || '') as typeof POST_EVALUATION_STATES[number]);

export const getPreparationCategory = (estado?: string | null): 'guia_pendiente' | 'eval_pre_pendiente' | 'eval_post_pendiente' | 'otros' => {
  if (isPreparationStage(estado)) return 'guia_pendiente';
  if (isPreQuizState(estado)) return 'eval_pre_pendiente';
  if (isPostQuizState(estado)) return 'eval_post_pendiente';
  return 'otros';
};

