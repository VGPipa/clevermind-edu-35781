// Contenido educativo para cada nodo de aprendizaje

export interface NodoContent {
  id: number;
  title: string;
  module: string;
  teoria: {
    title: string;
    content?: string;
    badExample?: string;
    goodExample?: string;
    tips?: string[];
    example?: string;
  }[];
  mision: string;
  microeval: {
    id: string;
    question: string;
    options: {
      value: string;
      label: string;
      correct?: boolean;
    }[];
  }[];
  promptExample: string;
  evaluationCriteria: {
    hasRole: string[];
    hasContext: string[];
    hasFormat: string[];
    hasCriteria: string[];
    hasLevels: string[];
  };
}

export const nodosContentMap: Record<number, NodoContent> = {
  1: {
    id: 1,
    title: "Introducción a Prompts",
    module: "IA para Planificación Educativa",
    teoria: [
      {
        title: "¿Qué es un prompt?",
        content: "Un prompt es una instrucción o pregunta que le das a la IA para obtener una respuesta específica.",
        example: "Es como darle instrucciones claras a un asistente para que te ayude.",
      },
      {
        title: "Anatomía de un prompt efectivo",
        badExample: "Dame información sobre plantas",
        goodExample: "Eres un profesor de ciencias de 5° básico. Crea una explicación simple sobre la fotosíntesis usando ejemplos cotidianos para niños de 10 años.",
      },
      {
        title: "Componentes clave",
        tips: [
          "Rol: Define quién es la IA (profesor, experto, tutor)",
          "Contexto: Especifica el nivel educativo y tema",
          "Tarea: Describe claramente qué quieres que haga",
          "Formato: Indica cómo quieres la respuesta",
        ],
      },
    ],
    mision: "Crea un prompt para que la IA genere una actividad de matemáticas para 3er grado sobre sumas y restas básicas",
    microeval: [
      {
        id: "q1",
        question: "¿Cuál es el componente MÁS importante de un prompt?",
        options: [
          { value: "a", label: "Usar muchas palabras" },
          { value: "b", label: "Definir claramente la tarea", correct: true },
          { value: "c", label: "Usar términos técnicos" },
        ],
      },
      {
        id: "q2",
        question: "¿Por qué es importante definir el rol en un prompt?",
        options: [
          { value: "a", label: "Para hacer el prompt más largo" },
          { value: "b", label: "Para que la IA adopte la perspectiva adecuada", correct: true },
          { value: "c", label: "No es importante" },
        ],
      },
    ],
    promptExample: "Eres un profesor de matemáticas de 3° básico. Crea 5 ejercicios de sumas y restas básicas (números del 1 al 100) con un contexto cotidiano que sea divertido para niños de 8 años.",
    evaluationCriteria: {
      hasRole: ["profesor", "eres", "docente"],
      hasContext: ["3", "tercero", "básico", "grado"],
      hasFormat: ["ejercicios", "actividad", "problemas"],
      hasCriteria: ["5", "cinco", "sumas", "restas"],
      hasLevels: ["1", "100", "básicas", "cotidiano"],
    },
  },
  2: {
    id: 2,
    title: "Crear Objetivos de Aprendizaje",
    module: "IA para Planificación Educativa",
    teoria: [
      {
        title: "Objetivos de aprendizaje efectivos",
        content: "Un objetivo describe qué habilidad o conocimiento adquirirá el estudiante. Debe ser medible y alcanzable.",
        example: "Ejemplo: 'Los estudiantes serán capaces de identificar las partes de una planta y explicar su función.'",
      },
      {
        title: "Estructura de objetivos con IA",
        badExample: "Crea objetivos de historia",
        goodExample: "Eres un experto en diseño curricular. Crea 3 objetivos de aprendizaje para una unidad de Historia de 6° básico sobre la Independencia, usando verbos de Bloom del nivel Aplicar y Analizar.",
      },
      {
        title: "Verbos de Bloom",
        tips: [
          "Recordar: identificar, enumerar, nombrar",
          "Comprender: explicar, describir, resumir",
          "Aplicar: demostrar, implementar, usar",
          "Analizar: comparar, contrastar, examinar",
        ],
      },
    ],
    mision: "Crea 3 objetivos de aprendizaje para una clase de Lenguaje de 4° básico sobre comprensión lectora, usando verbos de Bloom",
    microeval: [
      {
        id: "q1",
        question: "¿Qué característica debe tener un objetivo de aprendizaje?",
        options: [
          { value: "a", label: "Ser vago y general" },
          { value: "b", label: "Ser medible y específico", correct: true },
          { value: "c", label: "Ser difícil de evaluar" },
        ],
      },
      {
        id: "q2",
        question: "¿Para qué sirven los verbos de Bloom?",
        options: [
          { value: "a", label: "Para clasificar niveles cognitivos", correct: true },
          { value: "b", label: "Para hacer textos más largos" },
          { value: "c", label: "Solo para decoración" },
        ],
      },
    ],
    promptExample: "Eres un experto en diseño curricular. Crea 3 objetivos de aprendizaje para una unidad de Lenguaje de 4° básico sobre comprensión lectora de cuentos. Usa verbos de Bloom de los niveles Comprender y Analizar. Cada objetivo debe indicar qué habilidad desarrollará el estudiante.",
    evaluationCriteria: {
      hasRole: ["experto", "diseño curricular", "eres"],
      hasContext: ["4", "cuarto", "básico", "lenguaje"],
      hasFormat: ["objetivos", "aprendizaje"],
      hasCriteria: ["3", "tres", "comprensión", "lectora"],
      hasLevels: ["bloom", "comprender", "analizar", "habilidad"],
    },
  },
  3: {
    id: 3,
    title: "Planificación de Unidades",
    module: "IA para Planificación Educativa",
    teoria: [
      {
        title: "¿Qué es una unidad didáctica?",
        content: "Una unidad didáctica es un conjunto organizado de lecciones que abordan un tema específico durante varias semanas.",
        example: "Ejemplo: Unidad sobre 'Los ecosistemas' para ciencias de 5° básico, con 8 clases.",
      },
      {
        title: "Elementos de una unidad",
        tips: [
          "Tema central y objetivos",
          "Contenidos específicos por clase",
          "Actividades y metodologías",
          "Evaluaciones formativas y sumativas",
          "Recursos y materiales",
        ],
      },
      {
        title: "Prompt para planificación",
        badExample: "Planifica una unidad",
        goodExample: "Eres un profesor de Ciencias de 5° básico. Crea una planificación de unidad de 8 clases sobre 'Ecosistemas chilenos' incluyendo: objetivos, contenidos por clase, 2 actividades prácticas, y una evaluación final.",
      },
    ],
    mision: "Planifica una unidad de 6 clases sobre 'El Ciclo del Agua' para Ciencias de 4° básico, con objetivos, actividades y evaluación",
    microeval: [
      {
        id: "q1",
        question: "¿Qué debe incluir una planificación de unidad?",
        options: [
          { value: "a", label: "Solo el tema general" },
          { value: "b", label: "Objetivos, contenidos, actividades y evaluación", correct: true },
          { value: "c", label: "Solo las fechas de las clases" },
        ],
      },
      {
        id: "q2",
        question: "¿Por qué es importante especificar el número de clases en el prompt?",
        options: [
          { value: "a", label: "Para que la IA organice el contenido adecuadamente", correct: true },
          { value: "b", label: "No es importante" },
          { value: "c", label: "Solo para llenar espacio" },
        ],
      },
    ],
    promptExample: "Eres un profesor de Ciencias Naturales de 4° básico. Crea una planificación de unidad de 6 clases sobre 'El Ciclo del Agua'. Incluye: objetivos de aprendizaje, contenidos específicos para cada clase, 2 actividades prácticas experimentales, y una evaluación final tipo proyecto.",
    evaluationCriteria: {
      hasRole: ["profesor", "eres", "docente"],
      hasContext: ["4", "cuarto", "básico", "ciencias"],
      hasFormat: ["planificación", "unidad"],
      hasCriteria: ["6", "seis", "clases", "ciclo", "agua"],
      hasLevels: ["objetivos", "contenidos", "actividades", "evaluación"],
    },
  },
  6: {
    id: 6,
    title: "Crear Rúbricas con IA",
    module: "IA para Creación de Contenido",
    teoria: [
      {
        title: "¿Qué es una rúbrica?",
        content: "Una rúbrica es una herramienta de evaluación que establece criterios claros y niveles de desempeño.",
        example: "Permite evaluar trabajos complejos de manera objetiva y consistente.",
      },
      {
        title: "Componentes de un buen prompt para rúbricas",
        badExample: "Crea una rúbrica de ciencias",
        goodExample: "Eres un profesor de 5° básico. Crea una rúbrica para evaluar un proyecto sobre 'El Sistema Solar' con 3 criterios (contenido, presentación, creatividad) y 4 niveles (sobresaliente, bueno, suficiente, insuficiente).",
      },
      {
        title: "Tips para rúbricas efectivas",
        tips: [
          "Define 3-5 criterios de evaluación claros",
          "Establece 3-4 niveles de desempeño",
          "Describe específicamente cada nivel",
          "Usa lenguaje observable y medible",
        ],
      },
    ],
    mision: "Crea una rúbrica para evaluar un proyecto de Ciencias Naturales de 5to grado sobre 'El Sistema Solar' con 3 criterios y 4 niveles de desempeño",
    microeval: [
      {
        id: "q1",
        question: "¿Cuál es el PRIMER paso al crear un prompt para rúbricas?",
        options: [
          { value: "a", label: "Describir el formato final" },
          { value: "b", label: "Definir el rol y contexto educativo", correct: true },
          { value: "c", label: "Listar todos los criterios" },
        ],
      },
      {
        id: "q2",
        question: "¿Qué hace más específica una rúbrica?",
        options: [
          { value: "a", label: "Usar palabras complejas" },
          { value: "b", label: "Incluir números exactos de criterios y niveles", correct: true },
          { value: "c", label: "Hacerla lo más larga posible" },
        ],
      },
    ],
    promptExample: "Eres un profesor de Ciencias Naturales de 5° básico. Crea una rúbrica analítica para evaluar un proyecto sobre 'El Sistema Solar'. Debe tener 3 criterios: contenido científico, presentación visual y creatividad. Cada criterio debe tener 4 niveles: sobresaliente (4), bueno (3), suficiente (2), insuficiente (1). Describe específicamente qué se espera en cada nivel.",
    evaluationCriteria: {
      hasRole: ["profesor", "eres", "docente"],
      hasContext: ["5", "quinto", "básico"],
      hasFormat: ["rúbrica"],
      hasCriteria: ["3", "tres", "criterios", "contenido", "presentación", "creatividad"],
      hasLevels: ["4", "cuatro", "niveles", "sobresaliente", "bueno", "suficiente", "insuficiente"],
    },
  },
};

export const getNodeContent = (nodeId: number): NodoContent | null => {
  return nodosContentMap[nodeId] || null;
};
