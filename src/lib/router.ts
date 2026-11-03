import { useEffect, useState } from 'react'
// Router mínimo por hash: funciona en GitHub Pages sin configurar redirecciones.
export function useRuta() {
  const get = () => (location.hash.replace(/^#/, '') || '/')
  const [r, setR] = useState(get)
  useEffect(() => { const f = () => { setR(get()); window.scrollTo(0, 0) }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f) }, [])
  return r
}
export const ir = (ruta: string) => { location.hash = ruta }
