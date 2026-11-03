import { useRef, useState } from 'react'
import { AreaTexto, Boton, BotonConfirmar, Tarjeta, Titulo } from '../components/ui'
import { useProgreso, validarProgreso, type Tema } from '../lib/progreso'
import { hoyISO } from '../lib/fechas'

export default function Ajustes() {
  const { p, setFechaParcial, setTema, importar, reiniciar } = useProgreso()
  const [fecha, setFecha] = useState(p.fechaParcial)
  const [msg, setMsg] = useState('')
  const file = useRef<HTMLInputElement>(null)
  const exportar = () => {
    const blob = new Blob([JSON.stringify(p, null, 1)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `progreso-parcial-dip-${hoyISO()}.json`; a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }
  const [pegado, setPegado] = useState('')
  const aplicar = (texto: string) => {
    try {
      const n = validarProgreso(JSON.parse(texto))
      if (!n) return setMsg('✗ Eso no tiene el formato de progreso de esta app.')
      importar(n); setFecha(n.fechaParcial); setPegado(''); setMsg('✓ Progreso importado (reemplazó al anterior).')
    } catch { setMsg('✗ No se pudo leer el progreso.') }
  }
  const leer = async (f: File) => aplicar(await f.text())
  const copiar = async () => {
    try { await navigator.clipboard.writeText(JSON.stringify(p)); setMsg('✓ Progreso copiado. Pegalo en Ajustes del otro dispositivo.') }
    catch { setMsg('✗ Tu navegador no dejó copiar. Probá con Exportar.') }
  }
  return (
    <div className="space-y-4">
      <Titulo>Ajustes</Titulo>
      <Tarjeta className="space-y-3">
        <h2 className="font-bold text-lg">Fecha del parcial</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">Si cambia, se recalculan los repasos: la caja 5 siempre vence la víspera.</p>
        <div className="flex gap-2 flex-wrap">
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="min-h-12 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3" aria-label="Fecha del parcial" />
          <Boton disabled={!fecha || fecha === p.fechaParcial} onClick={() => { setFechaParcial(fecha); setMsg('✓ Fecha actualizada y repasos recalculados.') }}>Guardar</Boton>
        </div>
      </Tarjeta>
      <Tarjeta className="space-y-3">
        <h2 className="font-bold text-lg">Apariencia</h2>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tema">
          {([['sistema', 'Sistema'], ['claro', 'Claro'], ['oscuro', 'Oscuro']] as [Tema, string][]).map(([t, l]) => (
            <Boton key={t} role="radio" aria-checked={p.tema === t} v={p.tema === t ? 'primario' : 'secundario'} onClick={() => setTema(t)}>{l}</Boton>
          ))}
        </div>
      </Tarjeta>
      <Tarjeta className="space-y-3">
        <h2 className="font-bold text-lg">Tu progreso</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">Se guarda solo en este dispositivo. Exportalo para pasarlo al celular o a otra compu.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Boton v="secundario" onClick={exportar}>⬇ Exportar progreso</Boton>
          <Boton v="secundario" onClick={() => file.current?.click()}>⬆ Importar progreso</Boton>
          <Boton v="secundario" onClick={copiar}>📋 Copiar progreso</Boton>
        </div>
        <AreaTexto etiqueta="…o pegá acá un progreso copiado" value={pegado} onChange={setPegado} filas={2} />
        <BotonConfirmar v="secundario" className="w-full" disabled={!pegado.trim()} aviso="Reemplaza tu progreso actual. Tocá de nuevo" onConfirmar={() => aplicar(pegado)}>Importar lo pegado</BotonConfirmar>
        <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && leer(e.target.files[0])} />
        <BotonConfirmar v="peligro" className="w-full" aviso="Se borra TODO. Tocá de nuevo" onConfirmar={() => { reiniciar(); setMsg('Progreso reiniciado.') }}>Reiniciar progreso</BotonConfirmar>
      </Tarjeta>
      {msg && <p role="status" className="font-semibold">{msg}</p>}
      <Tarjeta className="text-sm space-y-2">
        <h2 className="font-bold text-lg">Cómo funciona</h2>
        <p><b>Leitner comprimido:</b> caja 1 = misma sesión · caja 2 = +1 día · caja 3 = +2 · caja 4 = +3 · caja 5 = repaso en la víspera del parcial.</p>
        <p><b>Otra vez</b> → caja 1 · <b>Difícil</b> → misma caja, vuelve mañana · <b>Bien</b> → sube 1 · <b>Fácil</b> → sube 2.</p>
        <p>En desarrollo y casos: &lt;50% = Otra vez · 50-74% = Difícil · 75-89% = Bien · ≥90% = Fácil.</p>
      </Tarjeta>
    </div>
  )
}
