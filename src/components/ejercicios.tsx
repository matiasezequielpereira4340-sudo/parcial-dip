import { useEffect, useMemo, useState } from 'react'
import type { Item } from '../types'
import type { Calificacion } from '../lib/leitner'
import { calificacionPorPorcentaje } from '../lib/leitner'
import { mezclar } from '../lib/util'
import { AreaTexto, Boton, Etiquetas, Explicacion, Tarjeta } from './ui'

export interface Resultado { calificacion: Calificacion; correcto: boolean }
interface P { item: Item; onListo: (r: Resultado) => void }

const PROB_ELABORACION = 0.3
const PREGUNTAS_ELAB = ['¿Por qué es así? Explicalo con tus palabras.', '¿Qué caso o instrumento lo respalda?']

function Feedback({ ok, children }: { ok: boolean | null; children: React.ReactNode }) {
  const c = ok === null ? 'border-slate-400 bg-slate-50 dark:bg-slate-800' : ok ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' : 'border-red-600 bg-red-50 dark:bg-red-900/30'
  return <div role="status" aria-live="polite" className={`mt-4 border-l-4 rounded-lg p-3 space-y-2 ${c}`}>{children}</div>
}

/** Paso de elaboración: pide justificar antes de mostrar la explicación */
function Elaboracion({ item, onFin }: { item: Item; onFin: () => void }) {
  const [t, setT] = useState(''); const [ver, setVer] = useState(false)
  const preg = useMemo(() => PREGUNTAS_ELAB[Math.floor(Math.random() * PREGUNTAS_ELAB.length)], [])
  return (
    <div className="mt-4 space-y-3">
      <p className="font-semibold">💡 Antes de seguir: {preg}</p>
      <AreaTexto etiqueta="Tu justificación" value={t} onChange={setT} autoFocus />
      {!ver ? <Boton onClick={() => setVer(true)}>Comparar con la explicación</Boton> : (
        <><Feedback ok={null}><Explicacion texto={item.explicacion} /></Feedback><Boton onClick={onFin} autoFocus>Siguiente →</Boton></>
      )}
    </div>
  )
}

function Cabecera({ item, tipo }: { item: Item; tipo: string }) {
  return <div className="mb-3 space-y-2"><p className="text-xs uppercase tracking-wide font-bold text-slate-500">{tipo}</p><Etiquetas item={item} /></div>
}

// ---------------- FLASHCARD ----------------
export function Flashcard({ item, onListo }: P) {
  const [txt, setTxt] = useState(''); const [ver, setVer] = useState(false)
  const [fase, setFase] = useState<'pregunta' | 'respuesta' | 'elab' | 'explic'>('pregunta')
  const [cal, setCal] = useState<Calificacion>('bien')
  const [verExpl, setVerExpl] = useState(false)
  const calificar = (c: Calificacion) => {
    setCal(c)
    const ok = c === 'bien' || c === 'facil'
    if (ok && Math.random() < PROB_ELABORACION) setFase('elab')
    else if (!ok) setFase('explic') // si fallaste, la explicación es obligatoria
    else onListo({ calificacion: c, correcto: true })
  }
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'TEXTAREA') return
      if (fase === 'respuesta' && ['1', '2', '3', '4'].includes(e.key)) calificar((['otra', 'dificil', 'bien', 'facil'] as const)[+e.key - 1])
    }
    addEventListener('keydown', h); return () => removeEventListener('keydown', h)
  })
  return (
    <Tarjeta>
      <Cabecera item={item} tipo="Flashcard" />
      <p className="text-lg font-semibold">{item.pregunta}</p>
      {fase === 'pregunta' && (
        <div className="mt-4 space-y-3">
          <AreaTexto etiqueta="Escribí lo que te acordás (o pensalo en voz alta)" value={txt} onChange={setTxt} />
          <Boton className="w-full" onClick={() => { setVer(true); setFase('respuesta') }}>Ver respuesta</Boton>
        </div>
      )}
      {ver && fase !== 'pregunta' && (
        <>
          {txt.trim() && <div className="mt-4 text-sm"><p className="font-semibold text-slate-500">Lo que escribiste:</p><p className="italic">{txt}</p></div>}
          <Feedback ok={null}><p className="font-semibold">Respuesta:</p><p>{item.respuesta}</p>
            {(verExpl || fase === 'explic') && <div className="pt-2 border-t border-slate-300 dark:border-slate-700"><Explicacion texto={item.explicacion} /></div>}
          </Feedback>
        </>
      )}
      {fase === 'respuesta' && (
        <div className="mt-4">
          {!verExpl && <button className="text-sm underline text-blue-800 dark:text-blue-300 mb-3" onClick={() => setVerExpl(true)}>Ver explicación</button>}
          <p className="text-sm mb-2 font-medium">¿Cómo te fue? (teclas 1-4)</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Boton v="peligro" onClick={() => calificar('otra')}>1 · Otra vez</Boton>
            <Boton v="secundario" onClick={() => calificar('dificil')}>2 · Difícil</Boton>
            <Boton v="exito" onClick={() => calificar('bien')}>3 · Bien</Boton>
            <Boton onClick={() => calificar('facil')}>4 · Fácil</Boton>
          </div>
        </div>
      )}
      {fase === 'elab' && <Elaboracion item={item} onFin={() => onListo({ calificacion: cal, correcto: true })} />}
      {fase === 'explic' && <Boton className="mt-4 w-full" autoFocus onClick={() => onListo({ calificacion: cal, correcto: false })}>Entendido, siguiente →</Boton>}
    </Tarjeta>
  )
}

// ---------------- OPCIÓN MÚLTIPLE ----------------
export function MCQ({ item, onListo }: P) {
  const ops = useMemo(() => mezclar(item.opciones ?? []), [item])
  const [sel, setSel] = useState<string | null>(null)
  const [elab, setElab] = useState<boolean | null>(null)
  const ok = sel === item.correcta
  const elegir = (o: string) => { if (sel) return; setSel(o); setElab(o === item.correcta && Math.random() < PROB_ELABORACION) }
  useEffect(() => {
    const h = (e: KeyboardEvent) => { const n = +e.key; if (!sel && n >= 1 && n <= ops.length && (e.target as HTMLElement).tagName !== 'TEXTAREA') elegir(ops[n - 1]) }
    addEventListener('keydown', h); return () => removeEventListener('keydown', h)
  })
  const fin = () => onListo({ calificacion: ok ? 'bien' : 'otra', correcto: ok })
  return (
    <Tarjeta>
      <Cabecera item={item} tipo="Opción múltiple" />
      <p className="text-lg font-semibold">{item.pregunta}</p>
      <div className="mt-4 grid gap-2" role="group" aria-label="Opciones">
        {ops.map((o, i) => {
          const est = !sel ? '' : o === item.correcta ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' : o === sel ? 'border-red-600 bg-red-50 dark:bg-red-900/30' : 'opacity-60'
          return (
            <button key={o} onClick={() => elegir(o)} disabled={!!sel}
              className={`text-left min-h-12 p-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 hover:border-blue-700 ${est}`}>
              <span className="font-bold mr-2">{i + 1}.</span>{o}{sel && o === item.correcta && ' ✓'}{sel === o && o !== item.correcta && ' ✗'}
            </button>
          )
        })}
      </div>
      {sel && elab && <><p className="mt-4 font-semibold text-emerald-700 dark:text-emerald-400">✓ ¡Correcto!</p><Elaboracion item={item} onFin={fin} /></>}
      {sel && !elab && (
        <><Feedback ok={ok}><p className="font-semibold">{ok ? '✓ ¡Correcto!' : `✗ La correcta es: ${item.correcta}`}</p><Explicacion texto={item.explicacion} /></Feedback>
          <Boton className="mt-4 w-full" autoFocus onClick={fin}>Siguiente →</Boton></>
      )}
    </Tarjeta>
  )
}

// ---------------- V/F JUSTIFICADO ----------------
export function VF({ item, onListo }: P) {
  const js = useMemo(() => mezclar(item.justificaciones ?? []), [item])
  const [vf, setVf] = useState<string | null>(null)
  const [j, setJ] = useState<string | null>(null)
  const vfOk = vf === item.correcta; const jOk = j === item.justificacionCorrecta
  const cal: Calificacion = vfOk && jOk ? 'bien' : vfOk ? 'dificil' : 'otra'
  return (
    <Tarjeta>
      <Cabecera item={item} tipo="Verdadero / Falso justificado" />
      <p className="text-lg font-semibold">{item.pregunta}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {['Verdadero', 'Falso'].map((o) => (
          <Boton key={o} v={vf === o ? 'primario' : 'secundario'} disabled={!!vf} onClick={() => setVf(o)}>{o}</Boton>
        ))}
      </div>
      {vf && (
        <div className="mt-4">
          <p className="font-semibold mb-2">Ahora elegí la justificación correcta:</p>
          <div className="grid gap-2">
            {js.map((x) => {
              const est = !j ? '' : x === item.justificacionCorrecta ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' : x === j ? 'border-red-600 bg-red-50 dark:bg-red-900/30' : 'opacity-60'
              return <button key={x} disabled={!!j} onClick={() => setJ(x)} className={`text-left min-h-12 p-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 ${est}`}>{x}</button>
            })}
          </div>
        </div>
      )}
      {vf && j && (
        <><Feedback ok={vfOk && jOk}>
          <p className="font-semibold">{vfOk ? '✓' : '✗'} Era <b>{item.correcta}</b>. {jOk ? '✓ Justificación correcta.' : '✗ La justificación correcta es la marcada en verde.'}</p>
          {vfOk && !jOk && <p className="text-sm">Acertaste el V/F pero no el porqué: en el parcial eso no alcanza.</p>}
          <Explicacion texto={item.explicacion} />
        </Feedback><Boton className="mt-4 w-full" autoFocus onClick={() => onListo({ calificacion: cal, correcto: vfOk && jOk })}>Siguiente →</Boton></>
      )}
    </Tarjeta>
  )
}

// ---------------- DESARROLLO / CASO (checklist) ----------------
export function Desarrollo({ item, onListo }: P) {
  const [txt, setTxt] = useState(''); const [ver, setVer] = useState(false)
  const [marcas, setMarcas] = useState<boolean[]>(() => (item.puntosClave ?? []).map(() => false))
  const [pct, setPct] = useState<number | null>(null)
  const esCaso = item.tipo === 'caso'
  return (
    <Tarjeta>
      <Cabecera item={item} tipo={esCaso ? 'Caso práctico' : 'Pregunta de desarrollo (formato parcial)'} />
      {item.relato && <p className="mb-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-800 leading-relaxed">{item.relato}</p>}
      <p className="text-lg font-semibold">{item.pregunta}</p>
      {!ver ? (
        <div className="mt-4 space-y-3">
          <AreaTexto etiqueta="Tu respuesta (como en el parcial)" value={txt} onChange={setTxt} filas={8} />
          <Boton className="w-full" disabled={txt.trim().length < 20} onClick={() => setVer(true)}>Ver respuesta modelo</Boton>
          <p className="text-xs text-slate-500">Escribí al menos unas líneas: el esfuerzo de recuperar es lo que fija el contenido.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <details className="text-sm" open><summary className="font-semibold cursor-pointer">Tu respuesta</summary><p className="whitespace-pre-wrap italic mt-1">{txt}</p></details>
          <Feedback ok={null}><p className="font-semibold">Respuesta modelo:</p><p className="leading-relaxed">{item.respuesta}</p></Feedback>
          <fieldset className="space-y-2">
            <legend className="font-semibold mb-1">Tildá los puntos clave que pusiste en TU respuesta:</legend>
            {(item.puntosClave ?? []).map((pk, i) => (
              <label key={i} className="flex gap-3 items-start p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 min-h-12">
                <input type="checkbox" className="mt-1 size-5 shrink-0 accent-emerald-700" checked={marcas[i]} disabled={pct !== null}
                  onChange={(e) => setMarcas(marcas.map((m, k) => (k === i ? e.target.checked : m)))} />
                <span>{pk}</span>
              </label>
            ))}
          </fieldset>
          {pct === null ? <Boton className="w-full" onClick={() => setPct(Math.round((marcas.filter(Boolean).length / marcas.length) * 100))}>Calcular mi resultado</Boton> : (
            <>
              <Feedback ok={pct >= 75}><p className="text-xl font-bold">{pct}% de los puntos clave</p>
                <p>{pct >= 90 ? 'Excelente: vuelve en el repaso final.' : pct >= 75 ? 'Bien: se reprograma para dentro de unos días.' : pct >= 50 ? 'Regular: vuelve mañana.' : 'Floja: vuelve en esta misma sesión o la próxima.'}</p>
                <Explicacion texto={item.explicacion} /></Feedback>
              <Boton className="w-full" autoFocus onClick={() => onListo({ calificacion: calificacionPorPorcentaje(pct), correcto: pct >= 75 })}>Siguiente →</Boton>
            </>
          )}
        </div>
      )}
    </Tarjeta>
  )
}

// ---------------- RELACIONAR ----------------
export function Relacionar({ item, onListo }: P) {
  const pares = item.pares ?? []
  const derecha = useMemo(() => mezclar(pares.map((p) => p.b)), [item])
  const [selA, setSelA] = useState<number | null>(null)
  const [asig, setAsig] = useState<Record<number, string>>({})
  const [listo, setListo] = useState(false)
  const usado = new Set(Object.values(asig))
  const aciertos = pares.filter((p, i) => asig[i] === p.b).length
  const pct = Math.round((aciertos / pares.length) * 100)
  const tocarB = (b: string) => {
    if (listo || selA === null) return
    const nuevo = { ...asig }; for (const k of Object.keys(nuevo)) if (nuevo[+k] === b) delete nuevo[+k]
    nuevo[selA] = b; setAsig(nuevo); setSelA(null)
  }
  return (
    <Tarjeta>
      <Cabecera item={item} tipo="Relacionar" />
      <p className="text-lg font-semibold">{item.pregunta}</p>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Tocá un elemento de la izquierda y después su pareja de la derecha.</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {pares.map((p, i) => {
            const est = listo ? (asig[i] === p.b ? 'border-emerald-600' : 'border-red-600') : selA === i ? 'border-blue-700 bg-blue-50 dark:bg-blue-900/30' : 'border-slate-300 dark:border-slate-600'
            return (
              <button key={i} onClick={() => !listo && setSelA(i)} aria-pressed={selA === i} className={`w-full text-left text-sm min-h-12 p-2 rounded-xl border-2 ${est}`}>
                <b>{p.a}</b>
                {asig[i] && <span className="block text-xs mt-1 text-slate-600 dark:text-slate-300">→ {asig[i]}</span>}
                {listo && asig[i] !== p.b && <span className="block text-xs mt-1 text-emerald-700 dark:text-emerald-400">✓ {p.b}</span>}
              </button>
            )
          })}
        </div>
        <div className="space-y-2">
          {derecha.map((b) => (
            <button key={b} onClick={() => tocarB(b)} disabled={listo || selA === null}
              className={`w-full text-left text-sm min-h-12 p-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 ${usado.has(b) ? 'opacity-50' : ''} disabled:cursor-default`}>{b}</button>
          ))}
        </div>
      </div>
      {!listo ? <Boton className="mt-4 w-full" disabled={Object.keys(asig).length < pares.length} onClick={() => setListo(true)}>Comprobar</Boton> : (
        <><Feedback ok={pct === 100}><p className="font-semibold">{aciertos} de {pares.length} correctas ({pct}%)</p><Explicacion texto={item.explicacion} /></Feedback>
          <Boton className="mt-4 w-full" autoFocus onClick={() => onListo({ calificacion: calificacionPorPorcentaje(pct), correcto: pct >= 75 })}>Siguiente →</Boton></>
      )}
    </Tarjeta>
  )
}

// ---------------- ORDENAR LÍNEA DE TIEMPO ----------------
export function Ordenar({ item, onListo }: P) {
  const ev = item.eventos ?? []
  const pool = useMemo(() => mezclar(ev.map((_, i) => i)), [item])
  const [orden, setOrden] = useState<number[]>([])
  const [listo, setListo] = useState(false)
  const aciertos = orden.filter((x, pos) => x === pos).length
  const pct = Math.round((aciertos / ev.length) * 100)
  const mover = (pos: number, d: -1 | 1) => { const o = orden.slice(); const t = pos + d; if (t < 0 || t >= o.length) return; [o[pos], o[t]] = [o[t], o[pos]]; setOrden(o) }
  return (
    <Tarjeta>
      <Cabecera item={item} tipo="Ordenar la línea de tiempo" />
      <p className="text-lg font-semibold">{item.pregunta}</p>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Tocá los hechos del más antiguo al más reciente. Podés reacomodar con ↑ ↓.</p>
      {!listo && (
        <div className="mt-3 flex flex-wrap gap-2">
          {pool.filter((i) => !orden.includes(i)).map((i) => (
            <button key={i} onClick={() => setOrden([...orden, i])} className="min-h-12 px-3 py-2 rounded-xl border-2 border-dashed border-slate-400 text-left text-sm">{ev[i].texto}</button>
          ))}
        </div>
      )}
      <ol className="mt-4 space-y-2">
        {orden.map((i, pos) => (
          <li key={i} className={`flex items-center gap-2 p-2 rounded-xl border-2 ${listo ? (i === pos ? 'border-emerald-600' : 'border-red-600') : 'border-slate-300 dark:border-slate-600'}`}>
            <span className="font-bold w-6 text-center">{pos + 1}</span>
            <span className="flex-1 text-sm">{listo && <b className="mr-1">{ev[i].fecha}:</b>}{ev[i].texto}</span>
            {!listo && <>
              <button aria-label="Subir" className="size-10 rounded-lg border border-slate-300 dark:border-slate-600" onClick={() => mover(pos, -1)}>↑</button>
              <button aria-label="Bajar" className="size-10 rounded-lg border border-slate-300 dark:border-slate-600" onClick={() => mover(pos, 1)}>↓</button>
              <button aria-label="Quitar" className="size-10 rounded-lg border border-slate-300 dark:border-slate-600" onClick={() => setOrden(orden.filter((x) => x !== i))}>✕</button>
            </>}
          </li>
        ))}
      </ol>
      {!listo ? <Boton className="mt-4 w-full" disabled={orden.length < ev.length} onClick={() => setListo(true)}>Comprobar</Boton> : (
        <><Feedback ok={pct === 100}>
          <p className="font-semibold">{aciertos} de {ev.length} en su lugar ({pct}%)</p>
          <p className="text-sm font-semibold">Orden correcto:</p>
          <ol className="text-sm list-decimal ml-5">{ev.map((e) => <li key={e.texto}><b>{e.fecha}</b>: {e.texto}</li>)}</ol>
          <Explicacion texto={item.explicacion} />
        </Feedback><Boton className="mt-4 w-full" autoFocus onClick={() => onListo({ calificacion: calificacionPorPorcentaje(pct), correcto: pct >= 75 })}>Siguiente →</Boton></>
      )}
    </Tarjeta>
  )
}

export function Ejercicio(p: P) {
  switch (p.item.tipo) {
    case 'flashcard': return <Flashcard {...p} />
    case 'mcq': return <MCQ {...p} />
    case 'vf': return <VF {...p} />
    case 'caso': case 'desarrollo': return <Desarrollo {...p} />
    case 'matching': return <Relacionar {...p} />
    case 'timeline': return <Ordenar {...p} />
  }
}
