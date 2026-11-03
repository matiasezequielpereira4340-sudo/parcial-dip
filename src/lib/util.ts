export function mezclar<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}
/** Intercala listas: toma uno de cada una por turno (base del modo Mezcla) */
export function intercalar<T>(listas: T[][]): T[] {
  const out: T[] = []; const ls = listas.map((l) => l.slice())
  while (ls.some((l) => l.length)) for (const l of ls) { const x = l.shift(); if (x !== undefined) out.push(x) }
  return out
}
export const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
