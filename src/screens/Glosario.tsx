import { useState } from 'react'
import { GLOSARIO } from '../data'
import { Chip, FuenteChip, Tarjeta, Titulo } from '../components/ui'
import { normalizar } from '../lib/util'

export default function Glosario() {
  const [q, setQ] = useState('')
  const n = normalizar(q)
  const lista = GLOSARIO.filter((s) => !n || normalizar(`${s.sigla} ${s.nombre} ${s.definicion}`).includes(n))
  return (
    <div className="space-y-4">
      <Titulo sub="Las definiciones salen del texto indicado. Las siglas de unidades todavía no cargadas solo muestran el nombre y están marcadas como Complemento.">Glosario de siglas</Titulo>
      <label className="block sticky top-0 z-10 bg-slate-50 dark:bg-slate-950 py-2">
        <span className="sr-only">Buscar sigla</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar (ej. CIADI, nación más favorecida…)"
          className="w-full min-h-12 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 text-base" />
      </label>
      <p className="text-sm text-slate-500" aria-live="polite">{lista.length} resultado{lista.length === 1 ? '' : 's'}</p>
      <ul className="space-y-2">
        {lista.map((s) => (
          <li key={s.sigla}><Tarjeta>
            <div className="flex justify-between gap-2 items-start"><p className="text-lg font-black">{s.sigla}</p>{s.unidad && <Chip tono="azul">U{s.unidad}</Chip>}</div>
            <p className="font-semibold">{s.nombre}</p>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{s.definicion}</p>
            <div className="mt-2"><FuenteChip fuente={s.fuente} /></div>
          </Tarjeta></li>
        ))}
      </ul>
    </div>
  )
}
