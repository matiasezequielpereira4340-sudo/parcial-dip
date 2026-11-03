import { useState } from 'react'
import { CARGADAS, ITEMS } from '../data'
import { Boton, Tarjeta, Titulo } from '../components/ui'
import { ir } from '../lib/router'
import { useProgreso } from '../lib/progreso'

const MODOS = [
  ['flashcard', 'Flashcards (Leitner)', 'Recordá, mirá y autoevaluate.'],
  ['mcq', 'Opción múltiple', 'Distractores con los errores típicos.'],
  ['vf', 'V/F justificado', 'No alcanza con acertar: elegí el porqué.'],
  ['caso', 'Casos prácticos', 'Aplicá el concepto a un relato.'],
  ['desarrollo', 'Desarrollo', 'Formato parcial escrito con checklist.'],
  ['matching', 'Relacionar', 'Caso ↔ principio, instrumento ↔ año.'],
  ['timeline', 'Ordenar la línea de tiempo', 'Tocá los hechos en orden.'],
] as const

export default function Practicar() {
  const { p } = useProgreso()
  const [us, setUs] = useState<number[]>(CARGADAS.map((u) => u.unidad))
  const t = (u: number) => setUs(us.includes(u) ? us.filter((x) => x !== u) : [...us, u])
  return (
    <div className="space-y-4">
      <Titulo sub="Toda la práctica pregunta antes de mostrar la respuesta.">Practicar</Titulo>
      <Tarjeta>
        <h2 className="font-bold text-lg">🔀 Intercalado</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Mezclar unidades y tipos obliga a distinguir conceptos: cuesta más, pero se recuerda mejor.</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <Boton onClick={() => ir('/run/mezcla?r=' + Date.now())}>Mezcla general</Boton>
          <Boton v="secundario" onClick={() => ir('/run/confusables?r=' + Date.now())}>Solo confusables</Boton>
          <Boton v="secundario" disabled={!p.errores.length} onClick={() => ir('/run/errores?r=' + Date.now())}>Mis errores ({p.errores.length})</Boton>
        </div>
      </Tarjeta>
      <Tarjeta>
        <h2 className="font-bold text-lg mb-2">Por tipo de ejercicio</h2>
        <fieldset className="flex flex-wrap gap-3 mb-3"><legend className="text-sm font-medium mb-1">Unidades:</legend>
          {CARGADAS.map((u) => <label key={u.unidad} className="flex items-center gap-2 min-h-10"><input type="checkbox" className="size-5" checked={us.includes(u.unidad)} onChange={() => t(u.unidad)} />U{u.unidad}</label>)}
          {CARGADAS.length === 0 && <p>No hay unidades cargadas.</p>}
        </fieldset>
        <div className="grid gap-2">
          {MODOS.map(([tipo, nombre, desc]) => {
            const n = ITEMS.filter((i) => i.tipo === tipo && us.includes(i.unidad)).length
            return (
              <button key={tipo} disabled={!n} onClick={() => ir(`/run/tipo?u=${us.join(',')}&t=${tipo}&r=${Date.now()}`)}
                className="text-left min-h-14 p-3 rounded-xl border border-slate-300 dark:border-slate-600 hover:border-blue-700 disabled:opacity-40">
                <span className="font-semibold">{nombre}</span> <span className="text-xs text-slate-500">({n})</span>
                <span className="block text-sm text-slate-600 dark:text-slate-400">{desc}</span>
              </button>
            )
          })}
        </div>
      </Tarjeta>
    </div>
  )
}
