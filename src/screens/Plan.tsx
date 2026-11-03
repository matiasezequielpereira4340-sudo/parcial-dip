import { unidadPorNumero } from '../data'
import { Chip, Tarjeta, Titulo } from '../components/ui'
import { useProgreso } from '../lib/progreso'
import { dominio, pendientes, plan } from '../lib/seleccion'
import { formatoCorto, hoyISO } from '../lib/fechas'

export default function Plan() {
  const { p } = useProgreso()
  const dias = plan(p.cards, p.fechaParcial)
  const hoy = hoyISO()
  const pend = pendientes()
  return (
    <div className="space-y-4">
      <Titulo sub="Se recalcula con tu progreso real: prioriza las unidades con menos dominio y alterna dos por día (intercalado, no en bloques).">Plan de estudio</Titulo>
      {pend.length > 0 && <Tarjeta className="border-amber-400!"><p className="text-sm">⚠ Unidades sin material cargado: {pend.map((u) => 'U' + u.unidad).join(', ')}. El plan solo reparte lo que ya está cargado; cuando se carguen, se suman solas.</p></Tarjeta>}
      <ol className="space-y-2">
        {dias.map((d) => (
          <li key={d.fecha}>
            <Tarjeta className={d.fecha === hoy ? 'border-blue-700! border-2' : ''}>
              <div className="flex justify-between items-center gap-2">
                <p className="font-bold first-letter:uppercase">{formatoCorto(d.fecha)}{d.fecha === hoy && ' · HOY'}</p>
                <div className="flex gap-1 flex-wrap justify-end">{d.unidades.map((u) => <Chip key={u} tono="azul">U{u} · {dominio(u, p.cards)}%</Chip>)}</div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{d.unidades.length <= 2 && d.unidades.map((u) => unidadPorNumero(u)?.titulo).join(' + ')}</p>
              <p className="text-sm mt-1">{d.nota}</p>
            </Tarjeta>
          </li>
        ))}
        <li><Tarjeta className="bg-blue-900! text-white border-0!"><p className="font-bold first-letter:uppercase">{formatoCorto(p.fechaParcial)} · PARCIAL</p><p className="text-sm">Antes de entrar, solo un repaso liviano de la caja 5. ¡Éxitos!</p></Tarjeta></li>
      </ol>
    </div>
  )
}
