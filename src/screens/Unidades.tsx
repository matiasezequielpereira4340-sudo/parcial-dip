import { UNIDADES } from '../data'
import { Chip, Tarjeta, Titulo } from '../components/ui'
import { useProgreso } from '../lib/progreso'
import { dominio, vistas } from '../lib/seleccion'

export default function Unidades() {
  const { p } = useProgreso()
  return (
    <>
      <Titulo sub="Mapa de cada unidad: temas, cuadros comparativos y línea de tiempo.">Unidades</Titulo>
      <div className="grid gap-3">
        {UNIDADES.map((u) => (
          <a key={u.unidad} href={`#/unidad/${u.unidad}`} className="block">
            <Tarjeta className="hover:border-blue-700">
              <div className="flex justify-between gap-2"><h2 className="font-bold text-lg">Unidad {u.unidad}</h2>{u.estado === 'pendiente' ? <Chip tono="ambar">Material pendiente de carga</Chip> : <Chip tono="verde">{dominio(u.unidad, p.cards)}% dominio</Chip>}</div>
              <p className="text-slate-700 dark:text-slate-300">{u.estado === 'pendiente' ? 'Se completa cuando se cargue el material.' : u.titulo}</p>
              {u.estado === 'cargado' && <p className="text-xs text-slate-500 mt-1">{u.items.length} ítems · {vistas(u.unidad, p.cards)} vistos · {u.temas.length} temas</p>}
            </Tarjeta>
          </a>
        ))}
      </div>
    </>
  )
}
