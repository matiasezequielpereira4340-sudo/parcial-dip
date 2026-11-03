import { diasEntre, hoyISO, sumarDias } from './fechas'

export type Calificacion = 'otra' | 'dificil' | 'bien' | 'facil'
export interface EstadoTarjeta { caja: number; vence: string; vistas: number; fallos: number; ultima: string }

/** Intervalos comprimidos hasta el parcial: caja 1 misma sesión, 2 +1 día, 3 +2, 4 +3, 5 = día de repaso (víspera del parcial). */
const INTERVALO: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3 }

export function diaDeRepaso(fechaParcial: string) { return sumarDias(fechaParcial, -1) }

export function vencimiento(caja: number, fechaParcial: string, hoy = hoyISO()): string {
  const repaso = diaDeRepaso(fechaParcial)
  if (diasEntre(hoy, repaso) <= 0) return hoy // ya estamos en la víspera o pasamos: todo vence hoy
  if (caja >= 5) return repaso
  const v = sumarDias(hoy, INTERVALO[caja] ?? 0)
  return diasEntre(v, repaso) < 0 ? repaso : v // nunca después del día de repaso
}

export function calificar(prev: EstadoTarjeta | undefined, c: Calificacion, fechaParcial: string, hoy = hoyISO()): EstadoTarjeta {
  const caja0 = prev?.caja ?? 1
  const caja = c === 'otra' ? 1 : c === 'dificil' ? Math.max(1, caja0) : c === 'bien' ? Math.min(5, caja0 + 1) : Math.min(5, caja0 + 2)
  // "Difícil" mantiene la caja pero vuelve mañana como mínimo
  let vence = vencimiento(caja, fechaParcial, hoy)
  if (c === 'dificil' && vence === hoy && diasEntre(hoy, diaDeRepaso(fechaParcial)) > 0) vence = sumarDias(hoy, 1)
  return { caja, vence, vistas: (prev?.vistas ?? 0) + 1, fallos: (prev?.fallos ?? 0) + (c === 'otra' ? 1 : 0), ultima: hoy }
}

/** Recalcula los vencimientos si cambia la fecha del parcial (desde el último repaso de cada tarjeta) */
export function recalcular(cards: Record<string, EstadoTarjeta>, fechaParcial: string) {
  const out: Record<string, EstadoTarjeta> = {}
  for (const [id, e] of Object.entries(cards)) out[id] = { ...e, vence: vencimiento(e.caja, fechaParcial, e.ultima) }
  return out
}

/** % de checklist → calificación (desarrollo y casos) */
export function calificacionPorPorcentaje(p: number): Calificacion {
  return p < 50 ? 'otra' : p < 75 ? 'dificil' : p < 90 ? 'bien' : 'facil'
}

export const estaVencida = (e: EstadoTarjeta | undefined, hoy = hoyISO()) => !!e && diasEntre(e.vence, hoy) >= 0
