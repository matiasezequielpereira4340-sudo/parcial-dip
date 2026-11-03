import { useRuta } from './lib/router'
import Inicio from './screens/Inicio'
import Unidades from './screens/Unidades'
import Mapa from './screens/Mapa'
import Practicar from './screens/Practicar'
import Sesion from './screens/Sesion'
import Simulacro from './screens/Simulacro'
import Plan from './screens/Plan'
import Glosario from './screens/Glosario'
import Ajustes from './screens/Ajustes'
import Mas from './screens/Mas'

const NAV = [['/', 'Inicio', '🏠'], ['/unidades', 'Unidades', '🗺'], ['/practicar', 'Practicar', '🎯'], ['/simulacro', 'Simulacro', '📝'], ['/mas', 'Más', '☰']] as const

export default function App() {
  const ruta = useRuta()
  const [path, qs] = ruta.split('?')
  const q = new URLSearchParams(qs ?? '')
  let vista
  if (path === '/') vista = <Inicio />
  else if (path === '/unidades') vista = <Unidades />
  else if (path.startsWith('/unidad/')) vista = <Mapa key={path} n={Number(path.split('/')[2])} />
  else if (path === '/practicar') vista = <Practicar />
  else if (path.startsWith('/run/')) vista = <Sesion key={ruta} modo={path.split('/')[2]} q={q} />
  else if (path === '/simulacro') vista = <Simulacro />
  else if (path === '/plan') vista = <Plan />
  else if (path === '/glosario') vista = <Glosario />
  else if (path === '/ajustes') vista = <Ajustes />
  else if (path === '/mas') vista = <Mas />
  else vista = <Inicio />
  const activo = (h: string) => (h === '/' ? path === '/' : path.startsWith(h) || (h === '/practicar' && path.startsWith('/run')) || (h === '/unidades' && path.startsWith('/unidad')) || (h === '/mas' && ['/plan', '/glosario', '/ajustes'].includes(path)))
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:p-2 focus:bg-amber-300 focus:text-black">Saltar al contenido</a>
      <main id="main" className="max-w-2xl mx-auto px-4 pt-4 pb-28">{vista}</main>
      <nav aria-label="Principal" className="fixed bottom-0 inset-x-0 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)]">
        <ul className="max-w-2xl mx-auto grid grid-cols-5">
          {NAV.map(([h, l, i]) => (
            <li key={h}><a href={`#${h}`} aria-current={activo(h) ? 'page' : undefined}
              className={`flex flex-col items-center justify-center min-h-16 text-xs font-semibold ${activo(h) ? 'text-blue-800 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400'}`}>
              <span aria-hidden className="text-xl">{i}</span>{l}</a></li>
          ))}
        </ul>
      </nav>
    </>
  )
}
