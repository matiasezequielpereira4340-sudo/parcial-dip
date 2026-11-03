import { useEffect, useState } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { Item, Fuente } from '../types'

type Var = 'primario' | 'secundario' | 'fantasma' | 'peligro' | 'exito'
const VAR: Record<Var, string> = {
  primario: 'bg-blue-800 text-white hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500',
  secundario: 'bg-white text-slate-900 border border-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 dark:hover:bg-slate-700',
  fantasma: 'text-blue-800 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-slate-800',
  peligro: 'bg-red-700 text-white hover:bg-red-800',
  exito: 'bg-emerald-700 text-white hover:bg-emerald-800',
}
export function Boton({ v = 'primario', className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { v?: Var }) {
  return <button {...p} className={`min-h-12 px-4 py-2 rounded-xl font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${VAR[v]} ${className}`} />
}
export function Tarjeta({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm ${className}`}>{children}</section>
}
export function Titulo({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return <header className="mb-4"><h1 className="text-2xl font-bold">{children}</h1>{sub && <p className="text-slate-600 dark:text-slate-400 mt-1">{sub}</p>}</header>
}
export function Barra({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  return (
    <div role="progressbar" aria-valuenow={valor} aria-valuemin={0} aria-valuemax={100} aria-label={etiqueta}
      className="h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
      <div className="h-full bg-emerald-600 dark:bg-emerald-500" style={{ width: `${valor}%` }} />
    </div>
  )
}
export function Chip({ children, tono = 'gris' }: { children: ReactNode; tono?: 'gris' | 'ambar' | 'violeta' | 'azul' | 'rojo' | 'verde' }) {
  const t = {
    gris: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    ambar: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200',
    violeta: 'bg-violet-100 text-violet-900 dark:bg-violet-900/40 dark:text-violet-200',
    azul: 'bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200',
    rojo: 'bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-200',
    verde: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200',
  }[tono]
  return <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-lg ${t}`}>{children}</span>
}
export function FuenteChip({ fuente }: { fuente: Fuente }) {
  if (fuente === 'Complemento') return <Chip tono="ambar">⚠ Complemento: verificar con la presentación de clase</Chip>
  if (fuente === 'Herdegen (optativo)') return <Chip tono="violeta">Herdegen (optativo)</Chip>
  return <Chip>Fuente: {fuente}</Chip>
}
export function Etiquetas({ item }: { item: Item }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Chip tono="azul">U{item.unidad} · {item.tema}</Chip>
      <FuenteChip fuente={item.fuente} />
      {item.etiquetas.includes('confusables') && <Chip tono="rojo">Se confunde seguido</Chip>}
    </div>
  )
}
/** Texto marcado como mnemotecnia ("Ayuda para memorizar: ...") resaltado */
export function Explicacion({ texto }: { texto: string }) {
  const i = texto.indexOf('Ayuda para memorizar')
  if (i < 0) return <p>{texto}</p>
  return <>{i > 0 && <p>{texto.slice(0, i).trim()}</p>}<p className="mt-2 rounded-lg bg-violet-50 dark:bg-violet-900/30 p-2 border-l-4 border-violet-500">🧠 {texto.slice(i)}</p></>
}
export function AreaTexto(p: { value: string; onChange: (s: string) => void; etiqueta: string; filas?: number; autoFocus?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{p.etiqueta}</span>
      <textarea autoFocus={p.autoFocus} rows={p.filas ?? 3} value={p.value} onChange={(e) => p.onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-3 text-base" />
    </label>
  )
}
export function Enlace({ href, children, className = '' }: { href: string; children: ReactNode; className?: string }) {
  return <a href={`#${href}`} className={`underline text-blue-800 dark:text-blue-300 ${className}`}>{children}</a>
}

/** Botón con confirmación en dos toques (reemplaza confirm(), que no funciona en todos los navegadores embebidos) */
export function BotonConfirmar({ onConfirmar, children, aviso = 'Tocá de nuevo para confirmar', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { v?: Var; onConfirmar: () => void; aviso?: string }) {
  const [armado, setArmado] = useState(false)
  useEffect(() => { if (!armado) return; const t = setTimeout(() => setArmado(false), 4000); return () => clearTimeout(t) }, [armado])
  return <Boton {...p} onClick={() => (armado ? (setArmado(false), onConfirmar()) : setArmado(true))} aria-live="polite">{armado ? `⚠ ${aviso}` : children}</Boton>
}
