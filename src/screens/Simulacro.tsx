import { useEffect, useState } from 'react'
import { CARGADAS, ITEMS } from '../data'
import type { Item, Tipo } from '../types'
import { AreaTexto, Boton, BotonConfirmar, Chip, Etiquetas, Explicacion, Tarjeta, Titulo } from '../components/ui'
import { useProgreso } from '../lib/progreso'
import { calificacionPorPorcentaje } from '../lib/leitner'
import { hoyISO } from '../lib/fechas'
import { intercalar, mezclar } from '../lib/util'
import { ir } from '../lib/router'

type Resp = { op?: string; vf?: string; j?: string; texto?: string; marcas?: boolean[] }
const COMPOSICION: Record<number, Record<Tipo, number>> = {
  60: { mcq: 10, vf: 4, caso: 1, desarrollo: 2, flashcard: 0, matching: 0, timeline: 0 },
  90: { mcq: 15, vf: 6, caso: 1, desarrollo: 2, flashcard: 0, matching: 0, timeline: 0 },
  120: { mcq: 20, vf: 8, caso: 1, desarrollo: 2, flashcard: 0, matching: 0, timeline: 0 },
}
function armar(us: number[], min: number): Item[] {
  const out: Item[] = []
  for (const [tipo, n] of Object.entries(COMPOSICION[min]) as [Tipo, number][]) {
    if (!n) continue
    const porU = us.map((u) => mezclar(ITEMS.filter((i) => i.unidad === u && i.tipo === tipo)))
    out.push(...intercalar(porU).slice(0, n))
  }
  return out
}
/** Puntaje de un ítem entre 0 y 1 */
function puntaje(it: Item, r: Resp | undefined): number {
  if (!r) return 0
  if (it.tipo === 'mcq') return r.op === it.correcta ? 1 : 0
  if (it.tipo === 'vf') return (r.vf === it.correcta ? 0.5 : 0) + (r.vf === it.correcta && r.j === it.justificacionCorrecta ? 0.5 : 0)
  const m = r.marcas ?? []; return m.length ? m.filter(Boolean).length / m.length : 0
}
const PESO: Partial<Record<Tipo, number>> = { mcq: 1, vf: 1, caso: 4, desarrollo: 4 }

export default function Simulacro() {
  const { calificarItem, registrarError, guardarSimulacro } = useProgreso()
  const [fase, setFase] = useState<'config' | 'examen' | 'autoeval' | 'informe'>('config')
  const [us, setUs] = useState<number[]>(CARGADAS.map((u) => u.unidad))
  const [min, setMin] = useState(90)
  const [items, setItems] = useState<Item[]>([])
  const [resp, setResp] = useState<Record<string, Resp>>({})
  const [i, setI] = useState(0)
  const [fin, setFin] = useState(0)
  const [ahora, setAhora] = useState(Date.now())
  const [ordenOps] = useState<Record<string, string[]>>({})

  useEffect(() => { if (fase !== 'examen') return; const t = setInterval(() => setAhora(Date.now()), 1000); return () => clearInterval(t) }, [fase])
  const restante = Math.max(0, Math.round((fin - ahora) / 1000))
  useEffect(() => { if (fase === 'examen' && restante === 0) setFase('autoeval') }, [restante, fase])

  const set = (id: string, r: Resp) => setResp((x) => ({ ...x, [id]: { ...x[id], ...r } }))
  const ops = (it: Item, base: string[]) => (ordenOps[it.id] ??= mezclar(base))

  const [informe, setInforme] = useState<{ pct: number; porTema: Record<string, number>; mal: Item[] } | null>(null)
  const calcularInforme = () => {
    let tot = 0, max = 0; const porTema: Record<string, number> = {}; const mal: Item[] = []
    for (const it of items) {
      const s = puntaje(it, resp[it.id]); const w = PESO[it.tipo] ?? 1
      tot += s * w; max += w
      if (s < 0.75) { const k = `U${it.unidad} · ${it.tema}`; porTema[k] = (porTema[k] ?? 0) + 1; mal.push(it) }
    }
    return { pct: max ? Math.round((tot / max) * 100) : 0, porTema, mal }
  }

  if (fase === 'config') return (
    <div className="space-y-4">
      <Titulo sub="Opción múltiple, V/F justificado, 1 caso y 2 de desarrollo, con feedback al final. Para repasar rápido; el formato real del parcial es el Simulacro tipo parcial real.">Práctica rápida</Titulo>
      <Tarjeta className="space-y-4">
        <fieldset><legend className="font-semibold mb-2">Unidades</legend>
          <div className="flex flex-wrap gap-3">{CARGADAS.map((u) => <label key={u.unidad} className="flex items-center gap-2 min-h-10"><input type="checkbox" className="size-5" checked={us.includes(u.unidad)} onChange={() => setUs(us.includes(u.unidad) ? us.filter((x) => x !== u.unidad) : [...us, u.unidad])} />U{u.unidad}</label>)}</div>
        </fieldset>
        <fieldset><legend className="font-semibold mb-2">Duración</legend>
          <div className="grid grid-cols-3 gap-2">{[60, 90, 120].map((m) => <Boton key={m} v={min === m ? 'primario' : 'secundario'} onClick={() => setMin(m)} aria-pressed={min === m}>{m} min</Boton>)}</div>
          <p className="text-xs text-slate-500 mt-2">{COMPOSICION[min].mcq} opción múltiple · {COMPOSICION[min].vf} V/F · 1 caso · 2 desarrollo</p>
        </fieldset>
        <Boton className="w-full" disabled={!us.length} onClick={() => { setItems(armar(us, min)); setResp({}); setI(0); setFin(Date.now() + min * 60000); setAhora(Date.now()); setFase('examen') }}>Empezar práctica rápida</Boton>
      </Tarjeta>
    </div>
  )

  if (fase === 'examen') {
    const it = items[i]; const r = resp[it.id] ?? {}
    const mm = String(Math.floor(restante / 60)).padStart(2, '0'), ss = String(restante % 60).padStart(2, '0')
    return (
      <div className="space-y-3">
        <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-slate-50/95 dark:bg-slate-950/95 flex justify-between items-center">
          <span className="font-semibold">Pregunta {i + 1} / {items.length}</span>
          <span className={`font-mono text-lg font-bold ${restante < 300 ? 'text-red-700 dark:text-red-400' : ''}`} aria-label="Tiempo restante">⏱ {mm}:{ss}</span>
        </div>
        <Tarjeta>
          <div className="mb-2"><Chip tono="azul">U{it.unidad}</Chip></div>
          {it.relato && <p className="mb-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-800">{it.relato}</p>}
          <p className="text-lg font-semibold mb-3">{it.pregunta}</p>
          {it.tipo === 'mcq' && <div className="grid gap-2">{ops(it, it.opciones ?? []).map((o) => (
            <label key={o} className={`flex gap-3 p-3 rounded-xl border-2 min-h-12 ${r.op === o ? 'border-blue-700 bg-blue-50 dark:bg-blue-900/30' : 'border-slate-300 dark:border-slate-600'}`}>
              <input type="radio" name={it.id} checked={r.op === o} onChange={() => set(it.id, { op: o })} className="mt-1 size-5 shrink-0" />{o}</label>))}</div>}
          {it.tipo === 'vf' && <>
            <div className="grid grid-cols-2 gap-2 mb-3">{['Verdadero', 'Falso'].map((o) => <Boton key={o} v={r.vf === o ? 'primario' : 'secundario'} onClick={() => set(it.id, { vf: o })}>{o}</Boton>)}</div>
            <p className="text-sm font-semibold mb-2">Justificación:</p>
            <div className="grid gap-2">{ops(it, it.justificaciones ?? []).map((o) => (
              <label key={o} className={`flex gap-3 p-3 rounded-xl border-2 min-h-12 ${r.j === o ? 'border-blue-700 bg-blue-50 dark:bg-blue-900/30' : 'border-slate-300 dark:border-slate-600'}`}>
                <input type="radio" name={it.id + 'j'} checked={r.j === o} onChange={() => set(it.id, { j: o })} className="mt-1 size-5 shrink-0" />{o}</label>))}</div>
          </>}
          {(it.tipo === 'caso' || it.tipo === 'desarrollo') && <AreaTexto etiqueta="Tu respuesta" filas={10} value={r.texto ?? ''} onChange={(t) => set(it.id, { texto: t })} />}
        </Tarjeta>
        <div className="grid grid-cols-2 gap-2">
          <Boton v="secundario" disabled={i === 0} onClick={() => setI(i - 1)}>← Anterior</Boton>
          {i < items.length - 1 ? <Boton onClick={() => setI(i + 1)}>Siguiente →</Boton> : <BotonConfirmar v="exito" aviso="¿Entregar? Tocá de nuevo" onConfirmar={() => setFase('autoeval')}>Entregar</BotonConfirmar>}
        </div>
        <nav aria-label="Ir a pregunta" className="flex flex-wrap gap-1 pt-2">
          {items.map((x, k) => <button key={x.id} onClick={() => setI(k)} className={`size-9 rounded-lg text-sm border ${k === i ? 'bg-blue-800 text-white' : resp[x.id] ? 'bg-slate-200 dark:bg-slate-700' : 'border-slate-300 dark:border-slate-600'}`}>{k + 1}</button>)}
        </nav>
      </div>
    )
  }

  if (fase === 'autoeval') {
    const abiertas = items.filter((x) => x.tipo === 'caso' || x.tipo === 'desarrollo')
    return (
      <div className="space-y-4">
        <Titulo sub="Compará tu respuesta con la modelo y tildá con honestidad los puntos que pusiste.">Corrección de las preguntas abiertas</Titulo>
        {abiertas.map((it) => {
          const r = resp[it.id] ?? {}; const m = r.marcas ?? (it.puntosClave ?? []).map(() => false)
          return (
            <Tarjeta key={it.id} className="space-y-3">
              <Etiquetas item={it} />
              <p className="font-semibold">{it.pregunta}</p>
              <p className="text-sm italic whitespace-pre-wrap">{r.texto?.trim() || '(sin respuesta)'}</p>
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm"><b>Modelo:</b> {it.respuesta}</div>
              {(it.puntosClave ?? []).map((pk, k) => (
                <label key={k} className="flex gap-3 items-start min-h-10"><input type="checkbox" className="mt-1 size-5 shrink-0" checked={m[k]} onChange={(e) => set(it.id, { marcas: m.map((v, z) => (z === k ? e.target.checked : v)) })} />{pk}</label>
              ))}
            </Tarjeta>
          )
        })}
        <Boton className="w-full" onClick={() => {
          for (const it of items) {
            const s = puntaje(it, resp[it.id])
            calificarItem(it.id, calificacionPorPorcentaje(Math.round(s * 100)))
            if (s < 0.75) registrarError(it.id)
          }
          const inf = calcularInforme(); setInforme(inf)
          guardarSimulacro({ fecha: hoyISO(), unidades: us, puntaje: inf.pct, erroresPorTema: inf.porTema })
          setFase('informe')
        }}>Ver informe</Boton>
      </div>
    )
  }

  const inf = informe!
  return (
    <div className="space-y-4">
      <Titulo>Informe de la práctica rápida</Titulo>
      <Tarjeta className="text-center"><p className="text-5xl font-black">{inf.pct}%</p><p className="text-slate-600 dark:text-slate-400">Puntaje ponderado (los casos y el desarrollo pesan más)</p></Tarjeta>
      <Tarjeta>
        <h2 className="font-bold text-lg mb-2">Errores por tema</h2>
        {Object.keys(inf.porTema).length === 0 ? <p>Sin errores. 🎉</p> : (
          <ul className="space-y-1">{Object.entries(inf.porTema).sort((a, b) => b[1] - a[1]).map(([t, n]) => <li key={t} className="flex justify-between gap-2"><span>{t}</span><b>{n}</b></li>)}</ul>
        )}
        <Boton className="w-full mt-3" disabled={!inf.mal.length} onClick={() => ir('/run/errores?r=' + Date.now())}>Repasar mis errores</Boton>
      </Tarjeta>
      {inf.mal.map((it) => (
        <Tarjeta key={it.id} className="space-y-2">
          <Etiquetas item={it} />
          <p className="font-semibold">{it.pregunta}</p>
          {it.tipo === 'mcq' && <p className="text-sm">Marcaste: <i>{resp[it.id]?.op ?? '(nada)'}</i> · Correcta: <b>{it.correcta}</b></p>}
          {it.tipo === 'vf' && <p className="text-sm">Correcta: <b>{it.correcta}</b>, porque: {it.justificacionCorrecta}</p>}
          <div className="text-sm"><Explicacion texto={it.explicacion} /></div>
        </Tarjeta>
      ))}
      <Boton v="secundario" className="w-full" onClick={() => setFase('config')}>Otra práctica rápida</Boton>
    </div>
  )
}
