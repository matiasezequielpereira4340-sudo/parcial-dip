import { CARGADAS, ITEMS, TIPOS_RAPIDOS, UNIDADES } from '../data'
import type { Item } from '../types'
import { estaVencida, type EstadoTarjeta } from './leitner'
import { diasEntre, hoyISO, sumarDias } from './fechas'
import { intercalar, mezclar } from './util'

type Cards = Record<string, EstadoTarjeta>

/** Dominio = % de ítems de la unidad en cajas 4-5 */
export function dominio(unidad: number, cards: Cards) {
  const its = ITEMS.filter((i) => i.unidad === unidad)
  if (!its.length) return 0
  return Math.round((its.filter((i) => (cards[i.id]?.caja ?? 0) >= 4).length / its.length) * 100)
}
export function vistas(unidad: number, cards: Cards) { return ITEMS.filter((i) => i.unidad === unidad && cards[i.id]).length }

/** Sesión de hoy: primero vencidas, después nuevas; intercaladas por unidad. ~25 ítems ≈ 20-30 min */
export function sesionDeHoy(cards: Cards, tamano = 25): Item[] {
  const hoy = hoyISO()
  const rapidos = ITEMS.filter((i) => TIPOS_RAPIDOS.has(i.tipo))
  const vencidas = mezclar(rapidos.filter((i) => estaVencida(cards[i.id], hoy)))
    .sort((a, b) => (cards[a.id]!.caja - cards[b.id]!.caja))
  const nuevasPorUnidad = CARGADAS.map((u) => mezclar(rapidos.filter((i) => i.unidad === u.unidad && !cards[i.id]))
    .sort((a, b) => a.dificultad - b.dificultad))
  const nuevas = intercalar(nuevasPorUnidad)
  const cupoVencidas = Math.min(vencidas.length, Math.max(15, tamano - 10))
  const sel = [...vencidas.slice(0, cupoVencidas), ...nuevas.slice(0, tamano - cupoVencidas)]
  // si faltan, completar con más vencidas
  if (sel.length < tamano) sel.push(...vencidas.slice(cupoVencidas, cupoVencidas + tamano - sel.length))
  // intercalar por unidad para no estudiar en bloques
  return intercalar(CARGADAS.map((u) => sel.filter((i) => i.unidad === u.unidad)))
}

export function contarVencidas(cards: Cards) { const h = hoyISO(); return ITEMS.filter((i) => TIPOS_RAPIDOS.has(i.tipo) && estaVencida(cards[i.id], h)).length }

/** Mezcla: intercalado de todas las unidades, priorizando los conceptos que se confunden */
export function mezcla(tamano = 20, soloConfusables = false): Item[] {
  const base = ITEMS.filter((i) => TIPOS_RAPIDOS.has(i.tipo) && (!soloConfusables || i.etiquetas.includes('confusables')))
  const conf = mezclar(base.filter((i) => i.etiquetas.includes('confusables')))
  const resto = mezclar(base.filter((i) => !i.etiquetas.includes('confusables')))
  const porUnidad = (l: Item[]) => intercalar(CARGADAS.map((u) => l.filter((i) => i.unidad === u.unidad)))
  // mitad confusables, mitad resto, alternando tipo
  return intercalar([porUnidad(conf), porUnidad(resto)]).slice(0, tamano)
}

export interface DiaPlan { fecha: string; unidades: number[]; nota: string }

/** Plan del 03/11 a la víspera: intercalado (2 unidades por día, rotando), priorizando menor dominio */
export function plan(cards: Cards, fechaParcial: string): DiaPlan[] {
  const inicio = '2026-11-03'
  const hoy = hoyISO()
  const repaso = sumarDias(fechaParcial, -1)
  const desde = diasEntre(inicio, hoy) > 0 ? hoy : inicio
  const dias: DiaPlan[] = []
  const peso = new Map(CARGADAS.map((u) => [u.unidad, 100 - dominio(u.unidad, cards) + 1]))
  const asignadas = new Map(CARGADAS.map((u) => [u.unidad, 0]))
  let ayer: number[] = []
  for (let f = desde; diasEntre(f, repaso) >= 0; f = sumarDias(f, 1)) {
    if (f === repaso) { dias.push({ fecha: f, unidades: CARGADAS.map((u) => u.unidad), nota: 'Repaso general: caja 5 + "Repasar mis errores" + un Simulacro tipo parcial real. Dormí bien.' }); continue }
    const orden = CARGADAS.map((u) => u.unidad)
      .sort((a, b) => (peso.get(b)! / (1 + asignadas.get(b)!)) - (peso.get(a)! / (1 + asignadas.get(a)!)) || (ayer.includes(a) ? 1 : -1))
    const elegidas = orden.slice(0, Math.min(2, orden.length))
    // forzar rotación: no repetir exactamente el mismo par que ayer si hay alternativa
    if (orden.length > 2 && elegidas.every((u) => ayer.includes(u))) elegidas[1] = orden[2]
    elegidas.forEach((u) => asignadas.set(u, asignadas.get(u)! + 1))
    ayer = elegidas
    dias.push({ fecha: f, unidades: elegidas, nota: 'Sesión de hoy + Mezcla. Después, 1 consigna de desarrollo de cada unidad marcada (o un Simulacro tipo parcial real).' })
  }
  return dias
}

export const pendientes = () => UNIDADES.filter((u) => u.estado === 'pendiente')
