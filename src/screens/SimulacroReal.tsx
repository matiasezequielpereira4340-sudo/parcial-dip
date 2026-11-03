import { useEffect, useState } from 'react'
import consignasJson from '../data/consignas.json'
import { AreaTexto, Boton, BotonConfirmar, Chip, Tarjeta, Titulo } from '../components/ui'
import { useProgreso } from '../lib/progreso'
import { hoyISO } from '../lib/fechas'
import { mezclar } from '../lib/util'

interface Consigna { id: string; unidades: number[]; titulo: string; consigna: string; respuesta: string; puntosClave: string[]; fuentes: string[] }
const BANCO = consignasJson as Consigna[]

/** Arma 5 consignas cubriendo U7-U10 (una por unidad + una más, preferentemente transversal) */
function armar(): Consigna[] {
  const elegidas: Consigna[] = []
  for (const u of [7, 8, 9, 10]) {
    const c = mezclar(BANCO.filter((x) => x.unidades.length === 1 && x.unidades[0] === u && !elegidas.includes(x)))[0]
    if (c) elegidas.push(c)
  }
  const resto = mezclar(BANCO.filter((x) => !elegidas.includes(x)))
  const cruzada = resto.find((x) => x.unidades.length > 1) ?? resto[0]
  if (cruzada) elegidas.push(cruzada)
  return mezclar(elegidas)
}

export default function SimulacroReal() {
  const { guardarSimulacro } = useProgreso()
  const [fase, setFase] = useState<'config' | 'elegir' | 'examen' | 'correccion' | 'informe'>('config')
  const [min, setMin] = useState(120)
  const [cinco, setCinco] = useState<Consigna[]>([])
  const [elegidas, setElegidas] = useState<string[]>([])
  const [textos, setTextos] = useState<Record<string, string>>({})
  const [marcas, setMarcas] = useState<Record<string, boolean[]>>({})
  const [fin, setFin] = useState(0)
  const [ahora, setAhora] = useState(Date.now())

  useEffect(() => { if (fase !== 'examen') return; const t = setInterval(() => setAhora(Date.now()), 1000); return () => clearInterval(t) }, [fase])
  const restante = Math.max(0, Math.round((fin - ahora) / 1000))
  useEffect(() => { if (fase === 'examen' && restante === 0) setFase('correccion') }, [restante, fase])

  const cuatro = cinco.filter((c) => elegidas.includes(c.id))
  const pct = (c: Consigna) => { const m = marcas[c.id] ?? []; return Math.round((m.filter(Boolean).length / c.puntosClave.length) * 100) }
  const total = cuatro.length ? Math.round(cuatro.reduce((s, c) => s + pct(c), 0) / cuatro.length) : 0

  if (fase === 'config') return (
    <div className="space-y-4">
      <Titulo sub="Mismo formato que los parciales de la cátedra: 5 consignas de desarrollo, respondés CUATRO (y solo cuatro). Al final, respuesta modelo y checklist para autocorregirte.">Simulacro tipo parcial real</Titulo>
      <Tarjeta className="space-y-4">
        <fieldset><legend className="font-semibold mb-2">Duración</legend>
          <div className="grid grid-cols-3 gap-2">{[90, 120, 150].map((m) => <Boton key={m} v={min === m ? 'primario' : 'secundario'} aria-pressed={min === m} onClick={() => setMin(m)}>{m} min</Boton>)}</div>
        </fieldset>
        <p className="text-sm text-slate-600 dark:text-slate-400">Banco de {BANCO.length} consignas sobre las Unidades 7 a 10 (incluye consignas que cruzan unidades): cada simulacro sale distinto.</p>
        <Boton className="w-full" onClick={() => { setCinco(armar()); setElegidas([]); setTextos({}); setMarcas({}); setFase('elegir') }}>Ver las consignas</Boton>
      </Tarjeta>
    </div>
  )

  if (fase === 'elegir') return (
    <div className="space-y-4">
      <Titulo sub="Leé las cinco y elegí CUATRO (y solo cuatro). El tiempo corre cuando empezás.">Elegí 4 consignas</Titulo>
      {cinco.map((c, i) => {
        const sel = elegidas.includes(c.id)
        return (
          <label key={c.id} className={`block rounded-2xl border-2 p-4 cursor-pointer ${sel ? 'border-blue-700 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-700'}`}>
            <div className="flex gap-3 items-start">
              <input type="checkbox" className="mt-1 size-5 shrink-0" checked={sel} disabled={!sel && elegidas.length >= 4}
                onChange={() => setElegidas(sel ? elegidas.filter((x) => x !== c.id) : [...elegidas, c.id])} />
              <div>
                <p><b>{i + 1}. <i>{c.titulo}.</i></b> {c.consigna}</p>
                <div className="mt-2 flex gap-1 flex-wrap">{c.unidades.map((u) => <Chip key={u} tono="azul">U{u}</Chip>)}</div>
              </div>
            </div>
          </label>
        )
      })}
      <Boton className="w-full" disabled={elegidas.length !== 4} onClick={() => { setFin(Date.now() + min * 60000); setAhora(Date.now()); setFase('examen') }}>
        {elegidas.length === 4 ? `Empezar (${min} min)` : `Elegí ${4 - elegidas.length} más`}
      </Boton>
    </div>
  )

  if (fase === 'examen') {
    const mm = String(Math.floor(restante / 60)).padStart(2, '0'), ss = String(restante % 60).padStart(2, '0')
    return (
      <div className="space-y-4">
        <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-slate-50/95 dark:bg-slate-950/95 flex justify-between items-center">
          <span className="font-semibold">Respondé las 4 consignas</span>
          <span className={`font-mono text-lg font-bold ${restante < 600 ? 'text-red-700 dark:text-red-400' : ''}`} aria-label="Tiempo restante">⏱ {mm}:{ss}</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">Sé breve y conciso, pero respondé todo el tema: cada consigna encadena varias exigencias.</p>
        {cuatro.map((c, i) => (
          <Tarjeta key={c.id} className="space-y-3">
            <p><b>{i + 1}. <i>{c.titulo}.</i></b> {c.consigna}</p>
            <AreaTexto etiqueta="Tu respuesta" filas={12} value={textos[c.id] ?? ''} onChange={(t) => setTextos({ ...textos, [c.id]: t })} />
            <p className="text-xs text-slate-500 text-right">{(textos[c.id] ?? '').trim().split(/\s+/).filter(Boolean).length} palabras</p>
          </Tarjeta>
        ))}
        <BotonConfirmar v="exito" className="w-full" aviso="¿Entregar? Tocá de nuevo" onConfirmar={() => setFase('correccion')}>Entregar</BotonConfirmar>
      </div>
    )
  }

  if (fase === 'correccion') return (
    <div className="space-y-4">
      <Titulo sub="Compará con la respuesta modelo (sacada solo de los textos cargados) y tildá con honestidad los puntos que pusiste.">Autocorrección</Titulo>
      {cuatro.map((c, i) => {
        const m = marcas[c.id] ?? c.puntosClave.map(() => false)
        return (
          <Tarjeta key={c.id} className="space-y-3">
            <p className="font-semibold">{i + 1}. {c.titulo}</p>
            <details><summary className="cursor-pointer text-sm font-semibold">Consigna</summary><p className="text-sm mt-1">{c.consigna}</p></details>
            <div className="text-sm"><p className="font-semibold text-slate-500">Tu respuesta:</p><p className="italic whitespace-pre-wrap">{textos[c.id]?.trim() || '(sin respuesta)'}</p></div>
            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm leading-relaxed"><p className="font-semibold mb-1">Respuesta modelo <span className="font-normal text-slate-500">({c.fuentes.join(', ')})</span>:</p>{c.respuesta}</div>
            <fieldset className="space-y-1"><legend className="font-semibold text-sm mb-1">Puntos que espera la cátedra — tildá los que pusiste:</legend>
              {c.puntosClave.map((pk, k) => (
                <label key={k} className="flex gap-3 items-start min-h-10"><input type="checkbox" className="mt-1 size-5 shrink-0" checked={m[k]} onChange={(e) => setMarcas({ ...marcas, [c.id]: m.map((v, z) => (z === k ? e.target.checked : v)) })} /><span className="text-sm">{pk}</span></label>
              ))}
            </fieldset>
          </Tarjeta>
        )
      })}
      <Boton className="w-full" onClick={() => {
        const porTema: Record<string, number> = {}
        cuatro.forEach((c) => { if (pct(c) < 75) porTema[c.titulo] = 100 - pct(c) })
        guardarSimulacro({ fecha: hoyISO(), unidades: [...new Set(cuatro.flatMap((c) => c.unidades))], puntaje: total, erroresPorTema: porTema })
        setFase('informe')
      }}>Ver resultado</Boton>
    </div>
  )

  return (
    <div className="space-y-4">
      <Titulo>Resultado del simulacro</Titulo>
      <Tarjeta className="text-center"><p className="text-5xl font-black">{total}%</p><p className="text-slate-600 dark:text-slate-400">de los puntos esperados, promedio de tus 4 consignas</p></Tarjeta>
      <Tarjeta>
        <ul className="space-y-2">{cuatro.map((c) => (
          <li key={c.id} className="flex justify-between gap-2"><span>{c.titulo} <span className="text-xs text-slate-500">({c.unidades.map((u) => 'U' + u).join(', ')})</span></span><b className={pct(c) < 50 ? 'text-red-700 dark:text-red-400' : pct(c) < 75 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}>{pct(c)}%</b></li>
        ))}</ul>
        <p className="text-sm mt-3 text-slate-600 dark:text-slate-400">Lo que quedó por debajo de 75 %: repasalo en el mapa de la unidad y en las preguntas de desarrollo.</p>
      </Tarjeta>
      <div className="grid gap-2 sm:grid-cols-2">
        <Boton onClick={() => setFase('config')}>Otro simulacro</Boton>
        <Boton v="secundario" onClick={() => (location.hash = '/run/tipo?t=desarrollo&r=' + Date.now())}>Practicar desarrollo</Boton>
      </div>
    </div>
  )
}
