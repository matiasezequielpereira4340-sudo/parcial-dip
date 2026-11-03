import type { Item, Sigla, Unidad } from './types'
import glosarioJson from './data/glosario.json'

// Toma automáticamente todos los archivos src/data/uNN.json: para sumar contenido no hace falta tocar código.
const mods = import.meta.glob<{ default: Unidad }>('./data/u*.json', { eager: true })
export const UNIDADES: Unidad[] = Object.values(mods).map((m) => m.default).sort((a, b) => a.unidad - b.unidad)
export const CARGADAS = UNIDADES.filter((u) => u.estado === 'cargado' && u.items.length > 0)
export const ITEMS: Item[] = CARGADAS.flatMap((u) => u.items)
export const ITEM_POR_ID = new Map(ITEMS.map((i) => [i.id, i]))
export const GLOSARIO = (glosarioJson as Sigla[]).slice().sort((a, b) => a.sigla.localeCompare(b.sigla, 'es'))
export const unidadPorNumero = (n: number) => UNIDADES.find((u) => u.unidad === n)

/** Tipos que entran en la "Sesión de hoy" (respuesta corta) */
export const TIPOS_RAPIDOS = new Set(['flashcard', 'mcq', 'vf'])
