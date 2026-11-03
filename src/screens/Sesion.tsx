import { useState } from 'react'
import { ITEMS, ITEM_POR_ID } from '../data'
import type { Item, Tipo } from '../types'
import { Ejercicio, type Resultado } from '../components/ejercicios'
import { Boton, Tarjeta, Titulo, Enlace } from '../components/ui'
import { useProgreso } from '../lib/progreso'
import { mezcla, sesionDeHoy } from '../lib/seleccion'
import { mezclar } from '../lib/util'

const NOMBRE: Record<string, string> = { hoy: 'Sesión de hoy', mezcla: 'Mezcla (intercalado)', confusables: 'Conceptos que se confunden', errores: 'Repasar mis errores', tipo: 'Práctica' }

export function construirCola(modo: string, q: URLSearchParams, cards: ReturnType<typeof useProgreso>['p']['cards'], errores: string[]): Item[] {
  if (modo === 'hoy') return sesionDeHoy(cards)
  if (modo === 'mezcla') return mezcla(20)
  if (modo === 'confusables') return mezcla(20, true)
  if (modo === 'errores') return mezclar(errores.map((id) => ITEM_POR_ID.get(id)).filter((x): x is Item => !!x))
  const u = q.get('u') ? q.get('u')!.split(',').map(Number) : null
  const t = q.get('t') as Tipo | null
  const base = ITEMS.filter((i) => (!u || u.includes(i.unidad)) && (!t || i.tipo === t))
  // primero lo nunca visto y lo vencido; tope por tipo para sesiones razonables
  const tope = t === 'flashcard' ? 25 : t === 'desarrollo' || t === 'caso' ? 3 : t === 'matching' || t === 'timeline' ? 3 : 15
  const orden = mezclar(base).sort((a, b) => (cards[a.id]?.caja ?? 0) - (cards[b.id]?.caja ?? 0))
  return orden.slice(0, tope)
}

export default function Sesion({ modo, q }: { modo: string; q: URLSearchParams }) {
  const { p, calificarItem, registrarError, quitarError } = useProgreso()
  const [cola, setCola] = useState<Item[]>(() => construirCola(modo, q, p.cards, p.errores))
  const [idx, setIdx] = useState(0)
  const [repes, setRepes] = useState<Record<string, number>>({})
  const [stats, setStats] = useState({ ok: 0, mal: 0 })
  const titulo = modo === 'tipo' ? `Práctica${q.get('u') ? ' · Unidad ' + q.get('u') : ''}` : NOMBRE[modo] ?? 'Práctica'

  if (!cola.length) return (
    <><Titulo>{titulo}</Titulo><Tarjeta><p>{modo === 'errores' ? '¡No tenés errores pendientes! 🎉' : 'No hay ítems para esta selección todavía.'}</p><Enlace href="/">Volver al inicio</Enlace></Tarjeta></>
  )
  if (idx >= cola.length) return (
    <>
      <Titulo>{titulo}: terminada</Titulo>
      <Tarjeta className="space-y-3">
        <p className="text-lg">✓ {stats.ok} bien · ✗ {stats.mal} para repasar</p>
        <p className="text-sm text-slate-600 dark:text-slate-400">Cada ítem cambió de caja según tu respuesta. Lo que fallaste vuelve pronto y queda en "Repasar mis errores".</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Boton onClick={() => (location.hash = '/')}>Volver al inicio</Boton>
          <Boton v="secundario" onClick={() => (location.hash = '/run/mezcla?r=' + Date.now())}>Una ronda de Mezcla</Boton>
        </div>
      </Tarjeta>
    </>
  )
  const item = cola[idx]
  const listo = (r: Resultado) => {
    calificarItem(item.id, r.calificacion)
    if (!r.correcto) registrarError(item.id); else if (r.calificacion !== 'dificil') quitarError(item.id)
    setStats((s) => (r.correcto ? { ...s, ok: s.ok + 1 } : { ...s, mal: s.mal + 1 }))
    // Caja 1 = "misma sesión": lo que sale "Otra vez" vuelve al final (máx. 2 veces)
    if (r.calificacion === 'otra' && (repes[item.id] ?? 0) < 2) {
      setCola((c) => [...c, item]); setRepes((x) => ({ ...x, [item.id]: (x[item.id] ?? 0) + 1 }))
    }
    setIdx((i) => i + 1)
  }
  return (
    <>
      <div className="flex items-center justify-between mb-3 gap-2">
        <h1 className="text-lg font-bold">{titulo}</h1>
        <span className="text-sm text-slate-600 dark:text-slate-400" aria-live="polite">{idx + 1} / {cola.length}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 mb-4 overflow-hidden"><div className="h-full bg-blue-700" style={{ width: `${(idx / cola.length) * 100}%` }} /></div>
      <Ejercicio key={item.id + '-' + idx} item={item} onListo={listo} />
    </>
  )
}
