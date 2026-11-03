import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { calificar, recalcular, type Calificacion, type EstadoTarjeta } from './leitner'
import { diasEntre, hoyISO, sumarDias } from './fechas'

export type Tema = 'sistema' | 'claro' | 'oscuro'
export interface ResultadoSimulacro { fecha: string; unidades: number[]; puntaje: number; erroresPorTema: Record<string, number> }
export interface Progreso {
  version: 1
  fechaParcial: string
  cards: Record<string, EstadoTarjeta>
  dias: string[]
  errores: string[]
  recuerdos: Record<string, string>
  simulacros: ResultadoSimulacro[]
  tema: Tema
}

const CLAVE = 'parcial-dip-untref-v1'
export const PROGRESO_INICIAL: Progreso = {
  version: 1, fechaParcial: '2026-11-11', cards: {}, dias: [], errores: [], recuerdos: {}, simulacros: [], tema: 'sistema'
}

function leer(): Progreso {
  try {
    const raw = localStorage.getItem(CLAVE)
    if (!raw) return PROGRESO_INICIAL
    return validarProgreso(JSON.parse(raw)) ?? PROGRESO_INICIAL
  } catch { return PROGRESO_INICIAL }
}
function escribir(p: Progreso) { try { localStorage.setItem(CLAVE, JSON.stringify(p)) } catch { /* modo privado o sin espacio: la app sigue funcionando en memoria */ } }

export function validarProgreso(x: unknown): Progreso | null {
  if (!x || typeof x !== 'object') return null
  const o = x as Partial<Progreso>
  if (o.version !== 1 || typeof o.cards !== 'object' || o.cards === null) return null
  return { ...PROGRESO_INICIAL, ...o, cards: o.cards as Progreso['cards'] }
}

interface Ctx {
  p: Progreso
  calificarItem: (id: string, c: Calificacion) => void
  registrarError: (id: string) => void
  quitarError: (id: string) => void
  guardarRecuerdo: (temaId: string, texto: string) => void
  guardarSimulacro: (r: ResultadoSimulacro) => void
  setFechaParcial: (f: string) => void
  setTema: (t: Tema) => void
  importar: (p: Progreso) => void
  reiniciar: () => void
  racha: number
}
const C = createContext<Ctx | null>(null)

export function ProgresoProvider({ children }: { children: ReactNode }) {
  const [p, setP] = useState<Progreso>(leer)
  useEffect(() => escribir(p), [p])

  // Tema (modo oscuro)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const aplicar = () => document.documentElement.classList.toggle('dark', p.tema === 'oscuro' || (p.tema === 'sistema' && mq.matches))
    aplicar(); mq.addEventListener('change', aplicar)
    return () => mq.removeEventListener('change', aplicar)
  }, [p.tema])

  const marcarDia = (q: Progreso): Progreso => {
    const h = hoyISO()
    return q.dias.includes(h) ? q : { ...q, dias: [...q.dias, h] }
  }
  const calificarItem = useCallback((id: string, c: Calificacion) =>
    setP((q) => marcarDia({ ...q, cards: { ...q.cards, [id]: calificar(q.cards[id], c, q.fechaParcial) } })), [])
  const registrarError = useCallback((id: string) => setP((q) => q.errores.includes(id) ? q : { ...q, errores: [...q.errores, id] }), [])
  const quitarError = useCallback((id: string) => setP((q) => ({ ...q, errores: q.errores.filter((e) => e !== id) })), [])
  const guardarRecuerdo = useCallback((t: string, texto: string) => setP((q) => marcarDia({ ...q, recuerdos: { ...q.recuerdos, [t]: texto } })), [])
  const guardarSimulacro = useCallback((r: ResultadoSimulacro) => setP((q) => marcarDia({ ...q, simulacros: [...q.simulacros, r] })), [])
  const setFechaParcial = useCallback((f: string) => setP((q) => ({ ...q, fechaParcial: f, cards: recalcular(q.cards, f) })), [])
  const setTema = useCallback((t: Tema) => setP((q) => ({ ...q, tema: t })), [])
  const importar = useCallback((n: Progreso) => setP(n), [])
  const reiniciar = useCallback(() => setP((q) => ({ ...PROGRESO_INICIAL, tema: q.tema, fechaParcial: q.fechaParcial })), [])

  const racha = useMemo(() => {
    const set = new Set(p.dias); let d = hoyISO(); let n = 0
    if (!set.has(d)) d = sumarDias(d, -1) // la racha sigue viva si estudiaste ayer
    while (set.has(d)) { n++; d = sumarDias(d, -1) }
    return n
  }, [p.dias])

  const v = { p, calificarItem, registrarError, quitarError, guardarRecuerdo, guardarSimulacro, setFechaParcial, setTema, importar, reiniciar, racha }
  return <C.Provider value={v}>{children}</C.Provider>
}

export function useProgreso() { const c = useContext(C); if (!c) throw new Error('Falta ProgresoProvider'); return c }
export const diasAlParcial = (f: string) => diasEntre(hoyISO(), f)
