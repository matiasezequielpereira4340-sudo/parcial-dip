// npm run validar — controla la calidad del contenido de src/data. Sale con código 1 si hay errores.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const DIR = new URL('../src/data/', import.meta.url).pathname
const FUENTES = ['Hinojosa', 'Bottini', 'Pérez Aznar', 'Herdegen (optativo)', 'Segura Serrano', 'Oyarzábal', 'Juste Ruiz', 'Mollar', 'Complemento']
const TIPOS = ['flashcard', 'mcq', 'vf', 'caso', 'desarrollo', 'matching', 'timeline']
const MINIMOS = { flashcard: 45, mcq: 25, vf: 12, caso: 4, desarrollo: 6, matching: 2, timeline: 1 }
const errores = []; const avisos = []
const err = (m) => errores.push(m); const aviso = (m) => avisos.push(m)
const vacio = (s) => typeof s !== 'string' || !s.trim()
const ids = new Set()

for (const f of readdirSync(DIR).filter((f) => /^u\d+\.json$/.test(f)).sort()) {
  let u
  try { u = JSON.parse(readFileSync(join(DIR, f), 'utf8')) } catch (e) { err(`${f}: JSON inválido (${e.message})`); continue }
  const num = Number(f.match(/\d+/)[0])
  if (u.unidad !== num) err(`${f}: "unidad" (${u.unidad}) no coincide con el nombre del archivo`)
  if (!['cargado', 'pendiente'].includes(u.estado)) err(`${f}: "estado" debe ser "cargado" o "pendiente"`)
  for (const k of ['temas', 'cuadros', 'esquemas', 'lineaDeTiempo', 'items']) if (!Array.isArray(u[k])) err(`${f}: falta el arreglo "${k}"`)
  if (!Array.isArray(u.items)) continue
  for (const t of u.temas ?? []) {
    if (vacio(t.id) || vacio(t.titulo) || vacio(t.ideaClave)) err(`${f}: tema incompleto (${t.id ?? '?'})`)
    if (!FUENTES.includes(t.fuente)) err(`${f}: tema ${t.id} sin fuente válida`)
  }
  for (const c of u.cuadros ?? []) {
    if (!FUENTES.includes(c.fuente)) err(`${f}: cuadro "${c.titulo}" sin fuente válida`)
    for (const fila of c.filas ?? []) if (fila.length !== c.columnas.length) err(`${f}: cuadro "${c.titulo}" tiene una fila con ${fila.length} celdas (esperadas ${c.columnas.length})`)
  }
  for (const e of u.esquemas ?? []) if (!FUENTES.includes(e.fuente)) err(`${f}: esquema "${e.titulo}" sin fuente válida`)
  for (const h of u.lineaDeTiempo ?? []) if (!FUENTES.includes(h.fuente)) err(`${f}: hito "${h.texto}" sin fuente válida`)

  const cuenta = Object.fromEntries(TIPOS.map((t) => [t, 0]))
  for (const it of u.items) {
    const q = `${f} › ${it.id ?? '(sin id)'}`
    if (vacio(it.id)) err(`${q}: falta id`)
    else if (ids.has(it.id)) err(`${q}: id duplicado`); else ids.add(it.id)
    if (it.unidad !== num) err(`${q}: "unidad" no coincide con el archivo`)
    if (!TIPOS.includes(it.tipo)) { err(`${q}: tipo inválido "${it.tipo}"`); continue }
    cuenta[it.tipo]++
    if (!FUENTES.includes(it.fuente)) err(`${q}: falta fuente o no es válida ("${it.fuente}")`)
    if (vacio(it.pregunta)) err(`${q}: falta pregunta`)
    if (vacio(it.respuesta)) err(`${q}: falta respuesta`)
    if (vacio(it.explicacion)) err(`${q}: falta explicación`)
    if (vacio(it.tema)) err(`${q}: falta tema`)
    if (![1, 2, 3].includes(it.dificultad)) err(`${q}: dificultad debe ser 1, 2 o 3`)
    if (!Array.isArray(it.etiquetas)) err(`${q}: "etiquetas" debe ser un arreglo`)
    if (it.tipo === 'mcq') {
      const o = it.opciones ?? []
      if (o.length < 3) err(`${q}: MCQ con menos de 3 opciones`)
      if (new Set(o.map((x) => x.trim().toLowerCase())).size !== o.length) err(`${q}: opciones repetidas`)
      if (!o.includes(it.correcta)) err(`${q}: "correcta" no existe entre las opciones`)
    }
    if (it.tipo === 'vf') {
      if (!['Verdadero', 'Falso'].includes(it.correcta)) err(`${q}: V/F con "correcta" inválida`)
      const j = it.justificaciones ?? []
      if (j.length !== 3) err(`${q}: V/F debe tener 3 justificaciones`)
      if (new Set(j).size !== j.length) err(`${q}: justificaciones repetidas`)
      if (!j.includes(it.justificacionCorrecta)) err(`${q}: "justificacionCorrecta" no está entre las justificaciones`)
    }
    if ((it.tipo === 'caso' || it.tipo === 'desarrollo') && !(it.puntosClave?.length >= 3)) err(`${q}: necesita al menos 3 puntosClave`)
    if (it.tipo === 'caso' && vacio(it.relato)) err(`${q}: caso sin relato`)
    if (it.tipo === 'matching') {
      const p = it.pares ?? []
      if (p.length < 4) err(`${q}: relacionar necesita al menos 4 pares`)
      if (new Set(p.map((x) => x.a)).size !== p.length || new Set(p.map((x) => x.b)).size !== p.length) err(`${q}: hay pares con lados repetidos (sería ambiguo)`)
    }
    if (it.tipo === 'timeline') {
      const ev = it.eventos ?? []
      if (ev.length < 4) err(`${q}: línea de tiempo con menos de 4 eventos`)
      if (new Set(ev.map((e) => e.fecha)).size !== ev.length) err(`${q}: hay fechas repetidas en la línea de tiempo (orden ambiguo)`)
    }
    if (it.fuente === 'Herdegen (optativo)' && !it.etiquetas?.includes('optativo')) aviso(`${q}: Herdegen debería llevar la etiqueta "optativo"`)
  }
  if (u.estado === 'cargado') {
    for (const [t, min] of Object.entries(MINIMOS)) if (cuenta[t] < min) err(`${f}: tiene ${cuenta[t]} ítems de tipo ${t}; el mínimo es ${min}`)
    if (!u.temas.length) err(`${f}: unidad cargada sin temas`)
  } else aviso(`${f}: unidad ${num} pendiente de carga`)
  console.log(`${f.padEnd(9)} [${u.estado}] ` + TIPOS.map((t) => `${t}:${cuenta[t]}`).join(' '))
}

try {
  const g = JSON.parse(readFileSync(join(DIR, 'glosario.json'), 'utf8'))
  const vistas = new Set()
  for (const s of g) {
    if (vacio(s.sigla) || vacio(s.nombre) || vacio(s.definicion)) err(`glosario: entrada incompleta (${s.sigla})`)
    if (!FUENTES.includes(s.fuente)) err(`glosario: ${s.sigla} sin fuente válida`)
    if (vistas.has(s.sigla)) err(`glosario: sigla duplicada ${s.sigla}`); vistas.add(s.sigla)
  }
} catch (e) { err(`glosario.json: ${e.message}`) }

try {
  const k = JSON.parse(readFileSync(join(DIR, 'consignas.json'), 'utf8'))
  if (k.length < 15) err(`consignas.json: hay ${k.length}; el mínimo es 15`)
  const ks = new Set()
  for (const c of k) {
    if (ks.has(c.id)) err(`consignas: id duplicado ${c.id}`); ks.add(c.id)
    for (const f of ['titulo', 'consigna', 'respuesta']) if (vacio(c[f])) err(`consignas ${c.id}: falta ${f}`)
    if (!(c.puntosClave?.length >= 5)) err(`consignas ${c.id}: necesita al menos 5 puntosClave`)
    if (!c.unidades?.length || c.unidades.some((u) => u < 7 || u > 10)) err(`consignas ${c.id}: unidades fuera de U7-U10`)
    if (!c.fuentes?.length || c.fuentes.some((f) => !FUENTES.includes(f))) err(`consignas ${c.id}: fuente inválida`)
  }
  for (const u of [7, 8, 9, 10]) if (k.filter((c) => c.unidades.length === 1 && c.unidades[0] === u).length < 3) err(`consignas: menos de 3 consignas propias de U${u}`)
  console.log(`consignas: ${k.length} (cruzadas: ${k.filter((c) => c.unidades.length > 1).length})`)
} catch (e) { err(`consignas.json: ${e.message}`) }

avisos.forEach((a) => console.log('  aviso: ' + a))
if (errores.length) { console.error(`\n✗ ${errores.length} error(es):`); errores.forEach((e) => console.error('  - ' + e)); process.exit(1) }
console.log('\n✓ Contenido válido.')
