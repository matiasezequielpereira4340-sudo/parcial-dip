// Fechas locales en formato AAAA-MM-DD (evita líos de zona horaria con toISOString)
export const hoyISO = (d = new Date()) => {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
export const parseISO = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
export const sumarDias = (s: string, n: number) => { const d = parseISO(s); d.setDate(d.getDate() + n); return hoyISO(d) }
export const diasEntre = (a: string, b: string) => Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86400000)
export const formatoCorto = (s: string) =>
  parseISO(s).toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit' })
