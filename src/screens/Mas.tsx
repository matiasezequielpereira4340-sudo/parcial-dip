import { Tarjeta, Titulo } from '../components/ui'
const L = [['/plan', '📅 Plan de estudio', 'Qué unidad priorizar cada día hasta el parcial.'], ['/glosario', '🔤 Glosario de siglas', 'CIADI, CNUDMI, APPRI, NMF, TJE…'], ['/ajustes', '⚙ Ajustes', 'Fecha del parcial, modo oscuro, exportar e importar.']]
export default function Mas() {
  return <><Titulo>Más</Titulo><div className="grid gap-3">{L.map(([h, t, d]) => <a key={h} href={`#${h}`}><Tarjeta className="hover:border-blue-700"><p className="font-bold text-lg">{t}</p><p className="text-sm text-slate-600 dark:text-slate-400">{d}</p></Tarjeta></a>)}</div></>
}
