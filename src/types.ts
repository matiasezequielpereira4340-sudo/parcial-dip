export type Tipo = 'flashcard' | 'mcq' | 'vf' | 'caso' | 'desarrollo' | 'matching' | 'timeline'
export type Fuente =
  | 'Hinojosa' | 'Bottini' | 'Pérez Aznar' | 'Herdegen (optativo)' | 'Segura Serrano'
  | 'Oyarzábal' | 'Juste Ruiz' | 'Mollar' | 'Complemento'

export interface Item {
  id: string
  unidad: number
  tema: string
  tipo: Tipo
  pregunta: string
  /** Solo casos: relato previo a la pregunta */
  relato?: string
  /** mcq: opciones; vf: ["Verdadero","Falso"] */
  opciones?: string[]
  /** mcq/vf: texto exacto de la opción correcta */
  correcta?: string
  /** vf: 3 justificaciones posibles */
  justificaciones?: string[]
  justificacionCorrecta?: string
  respuesta: string
  puntosClave?: string[]
  /** matching: pares a relacionar */
  pares?: { a: string; b: string }[]
  /** timeline: eventos en orden cronológico correcto */
  eventos?: { fecha: string; texto: string }[]
  explicacion: string
  fuente: Fuente
  dificultad: 1 | 2 | 3
  etiquetas: string[]
}

export interface Tema { id: string; titulo: string; ideaClave: string; fuente: Fuente }
export interface Cuadro { titulo: string; columnas: string[]; filas: string[][]; fuente: Fuente }
export interface Esquema { titulo: string; pasos: string[]; fuente: Fuente }
export interface Hito { fecha: string; texto: string; fuente: Fuente }

export interface Unidad {
  unidad: number
  titulo: string
  estado: 'cargado' | 'pendiente'
  nota?: string
  temas: Tema[]
  cuadros: Cuadro[]
  esquemas: Esquema[]
  lineaDeTiempo: Hito[]
  items: Item[]
}

export interface Sigla { sigla: string; nombre: string; definicion: string; unidad: number | null; fuente: Fuente }
