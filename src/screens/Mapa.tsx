import { useState } from 'react'
import { unidadPorNumero } from '../data'
import type { Cuadro, Tema } from '../types'
import { AreaTexto, Boton, Chip, FuenteChip, Tarjeta, Titulo } from '../components/ui'
import { useProgreso } from '../lib/progreso'
import { ir } from '../lib/router'

function TemaRecuerdo({ t }: { t: Tema }) {
  const { p, guardarRecuerdo } = useProgreso()
  const [abierto, setAbierto] = useState(false); const [txt, setTxt] = useState(''); const [ver, setVer] = useState(false)
  const previo = p.recuerdos[t.id]
  return (
    <li className="border-b border-slate-200 dark:border-slate-800 py-3 last:border-0">
      <p className="font-semibold">{t.titulo}</p>
      {!abierto && <Boton v="fantasma" className="mt-1 -ml-4" onClick={() => setAbierto(true)}>🧠 ¿Qué te acordás de esto?</Boton>}
      {abierto && !ver && (
        <div className="mt-2 space-y-2">
          <AreaTexto autoFocus etiqueta="Escribí la idea central con tus palabras" value={txt} onChange={setTxt} />
          <div className="flex gap-2 flex-wrap">
            <Boton disabled={!txt.trim()} onClick={() => { guardarRecuerdo(t.id, txt); setVer(true) }}>Ver idea clave</Boton>
            <Boton v="secundario" onClick={() => setVer(true)}>No me acuerdo</Boton>
          </div>
        </div>
      )}
      {ver && (
        <div className="mt-2 space-y-2">
          {txt.trim() && <p className="text-sm italic text-slate-600 dark:text-slate-400">Vos: {txt}</p>}
          <p className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border-l-4 border-emerald-600"><b>Idea clave:</b> {t.ideaClave}</p>
          {!txt.trim() && previo && <p className="text-xs text-slate-500">La vez anterior escribiste: "{previo}"</p>}
          <FuenteChip fuente={t.fuente} />
        </div>
      )}
    </li>
  )
}

function TablaComparativa({ c }: { c: Cuadro }) {
  const [practica, setPractica] = useState(false)
  const [vistas, setVistas] = useState<Set<string>>(new Set())
  const toggle = (k: string) => setVistas((s) => new Set(s).add(k))
  return (
    <Tarjeta>
      <div className="flex justify-between items-start gap-2 mb-2">
        <h3 className="font-bold">{c.titulo}</h3>
        <label className="text-xs flex items-center gap-1 shrink-0"><input type="checkbox" className="size-4" checked={practica} onChange={(e) => { setPractica(e.target.checked); setVistas(new Set()) }} />Ocultar celdas</label>
      </div>
      {practica && <p className="text-xs text-slate-500 mb-2">Intentá recordar cada celda y tocala para verla.</p>}
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-sm border-collapse min-w-[480px]">
          <thead><tr>{c.columnas.map((h) => <th key={h} className="text-left p-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">{h}</th>)}</tr></thead>
          <tbody>{c.filas.map((f, i) => <tr key={i}>{f.map((cel, j) => {
            const k = `${i}-${j}`; const oculta = practica && j > 0 && !vistas.has(k)
            return <td key={j} onClick={() => oculta && toggle(k)} onKeyDown={(e) => oculta && e.key === 'Enter' && toggle(k)} tabIndex={oculta ? 0 : undefined}
              className={`p-2 align-top border border-slate-200 dark:border-slate-700 ${j === 0 ? 'font-semibold' : ''} ${oculta ? 'oculta' : ''}`}>{cel}</td>
          })}</tr>)}</tbody>
        </table>
      </div>
      <div className="mt-2"><FuenteChip fuente={c.fuente} /></div>
    </Tarjeta>
  )
}

const TIPOS = [['flashcard', 'Flashcards'], ['mcq', 'Opción múltiple'], ['vf', 'V/F justificado'], ['caso', 'Casos prácticos'], ['desarrollo', 'Desarrollo'], ['matching', 'Relacionar'], ['timeline', 'Línea de tiempo']] as const

export default function Mapa({ n }: { n: number }) {
  const u = unidadPorNumero(n)
  if (!u) return <Titulo>Unidad no encontrada</Titulo>
  if (u.estado === 'pendiente') return (
    <>
      <Titulo>Unidad {n}</Titulo>
      <Tarjeta className="space-y-2">
        <Chip tono="ambar">Material pendiente de carga</Chip>
        <p>{u.nota}</p>
        <p className="text-sm text-slate-600 dark:text-slate-400">Archivo: <code>src/data/u{String(n).padStart(2, '0')}.json</code>. El formato está explicado en <code>CONTENIDO.md</code>. No hace falta tocar código.</p>
      </Tarjeta>
    </>
  )
  return (
    <div className="space-y-4">
      <Titulo sub={u.nota}>U{u.unidad} · {u.titulo}</Titulo>
      <Tarjeta>
        <h2 className="text-xl font-bold">Temas del programa</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">Primero intentá recordar; después mirá la idea clave.</p>
        <ul>{u.temas.map((t) => <TemaRecuerdo key={t.id} t={t} />)}</ul>
      </Tarjeta>

      <Tarjeta>
        <h2 className="text-xl font-bold mb-2">Practicar esta unidad</h2>
        <div className="grid grid-cols-2 gap-2">
          {TIPOS.map(([t, l]) => <Boton key={t} v="secundario" className="text-sm" onClick={() => ir(`/run/tipo?u=${n}&t=${t}&r=${Date.now()}`)}>{l} ({u.items.filter((i) => i.tipo === t).length})</Boton>)}
        </div>
      </Tarjeta>

      <h2 className="text-xl font-bold pt-2">Cuadros comparativos</h2>
      {u.cuadros.map((c) => <TablaComparativa key={c.titulo} c={c} />)}

      {u.esquemas.length > 0 && <h2 className="text-xl font-bold pt-2">Esquemas</h2>}
      {u.esquemas.map((e) => (
        <Tarjeta key={e.titulo}>
          <h3 className="font-bold mb-3">{e.titulo}</h3>
          <ol className="space-y-0">
            {e.pasos.map((p, i) => (
              <li key={i} className="flex flex-col items-center">
                <div className="w-full text-center p-3 rounded-xl border-2 border-blue-700/60 bg-blue-50 dark:bg-blue-900/20 text-sm">{p}</div>
                {i < e.pasos.length - 1 && <span aria-hidden className="text-blue-700 dark:text-blue-400 text-xl leading-6">↓</span>}
              </li>
            ))}
          </ol>
          <div className="mt-2"><FuenteChip fuente={e.fuente} /></div>
        </Tarjeta>
      ))}

      <h2 className="text-xl font-bold pt-2">Línea de tiempo</h2>
      <Tarjeta>
        <ol className="relative border-l-4 border-blue-700/50 ml-3 space-y-4">
          {u.lineaDeTiempo.map((h, i) => (
            <li key={i} className="ml-4">
              <span className="absolute -left-[10px] mt-1 size-4 rounded-full bg-blue-700" aria-hidden />
              <p className="font-bold text-blue-900 dark:text-blue-300">{h.fecha}</p>
              <p className="text-sm">{h.texto}</p>
            </li>
          ))}
        </ol>
      </Tarjeta>
    </div>
  )
}
