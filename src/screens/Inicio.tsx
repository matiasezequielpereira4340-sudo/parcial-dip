import { UNIDADES } from '../data'
import { Barra, Boton, Chip, Tarjeta } from '../components/ui'
import { diasAlParcial, useProgreso } from '../lib/progreso'
import { contarVencidas, dominio } from '../lib/seleccion'
import { ir } from '../lib/router'
import { parseISO } from '../lib/fechas'

export default function Inicio() {
  const { p, racha } = useProgreso()
  const d = diasAlParcial(p.fechaParcial)
  const venc = contarVencidas(p.cards)
  const fecha = parseISO(p.fechaParcial).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <div className="space-y-4">
      <Tarjeta className="bg-blue-900! text-white border-0!">
        <p className="text-sm opacity-90">Segundo parcial · Unidades 7 a 10</p>
        <p className="text-4xl font-black mt-1">{d > 0 ? `Faltan ${d} día${d === 1 ? '' : 's'}` : d === 0 ? '¡Es hoy!' : 'Parcial pasado'}</p>
        <p className="opacity-90 first-letter:uppercase">{fecha}</p>
        <p className="mt-3 text-sm">🔥 Racha: <b>{racha} día{racha === 1 ? '' : 's'}</b></p>
      </Tarjeta>

      <Tarjeta>
        <h2 className="text-xl font-bold">Sesión de hoy</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-1">~25 preguntas (20-30 min): {venc} vencidas para repasar + nuevas, mezcladas entre unidades.</p>
        <Boton className="w-full mt-3 text-lg" onClick={() => ir('/run/hoy?r=' + Date.now())}>Empezar sesión de hoy</Boton>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Boton v="secundario" onClick={() => ir('/run/mezcla?r=' + Date.now())}>🔀 Mezcla</Boton>
          <Boton v="secundario" onClick={() => ir('/run/errores?r=' + Date.now())} disabled={!p.errores.length}>Mis errores ({p.errores.length})</Boton>
        </div>
      </Tarjeta>

      <Tarjeta>
        <h2 className="text-xl font-bold mb-1">Dominio por unidad</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Dominio = % de ítems en las cajas 4 y 5 del sistema Leitner.</p>
        <ul className="space-y-3">
          {UNIDADES.map((u) => {
            const pend = u.estado === 'pendiente'; const dm = dominio(u.unidad, p.cards)
            return (
              <li key={u.unidad}>
                <a href={`#/unidad/${u.unidad}`} className="block rounded-lg p-1 -m-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <div className="flex justify-between items-center gap-2 mb-1">
                    <span className="font-semibold">U{u.unidad} · {pend ? 'Material pendiente de carga' : u.titulo}</span>
                    {pend ? <Chip tono="ambar">pendiente</Chip> : <span className="font-bold">{dm}%</span>}
                  </div>
                  {!pend && <Barra valor={dm} etiqueta={`Dominio unidad ${u.unidad}`} />}
                </a>
              </li>
            )
          })}
        </ul>
      </Tarjeta>

      <div className="grid grid-cols-2 gap-2">
        <Boton v="secundario" onClick={() => ir('/simulacro')}>📝 Simulacro</Boton>
        <Boton v="secundario" onClick={() => ir('/plan')}>📅 Plan de estudio</Boton>
      </div>
    </div>
  )
}
