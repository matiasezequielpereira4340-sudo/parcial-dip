# Cómo cargar contenido (sin programar)

Cada unidad es un archivo en `src/data/` (`u07.json` … `u10.json`); el banco de consignas tipo parcial está en `consignas.json`. La app los detecta solos.

## Pasos para activar una unidad pendiente
1. Abrí `src/data/uNN.json`.
2. Completá `titulo`, `temas`, `cuadros`, `esquemas`, `lineaDeTiempo` e `items` (formato abajo; `u07.json` sirve de ejemplo completo).
3. Cambiá `"estado": "pendiente"` por `"estado": "cargado"`.
4. Corré `npm run validar`. Si hay errores, te dice archivo, ítem y qué falta.

Mínimos por unidad cargada: 45 flashcards, 25 mcq, 12 vf, 4 casos, 6 desarrollo, 2 matching, 1 timeline.

## Estructura de la unidad
```json
{
  "unidad": 8, "titulo": "…", "estado": "cargado", "nota": "Fuente: …",
  "temas": [{ "id": "u08-t1", "titulo": "…", "ideaClave": "una línea", "fuente": "Bottini" }],
  "cuadros": [{ "titulo": "ZLC vs UA", "columnas": ["", "ZLC", "UA"], "filas": [["Arancel externo", "…", "…"]], "fuente": "Bottini" }],
  "esquemas": [{ "titulo": "…", "pasos": ["paso 1", "paso 2"], "fuente": "Bottini" }],
  "lineaDeTiempo": [{ "fecha": "1994", "texto": "…", "fuente": "Bottini" }],
  "items": [ … ]
}
```

## Ítems (campos comunes)
`id` (único, ej. `u08-f01`), `unidad`, `tema`, `tipo`, `pregunta`, `respuesta`, `explicacion`, `fuente`, `dificultad` (1-3), `etiquetas` (lista).

- **fuente**: `Hinojosa`, `Bottini`, `Pérez Aznar`, `Herdegen (optativo)`, `Segura Serrano`, `Oyarzábal`, `Juste Ruiz`, `Mollar` o `Complemento` (se muestra con el aviso "verificar con la presentación de clase").
- **etiquetas especiales**: `confusables` (entra en el modo "Solo confusables" y se prioriza en la Mezcla), `mnemotecnia`, `optativo` (obligatoria con Herdegen).
- Una mnemotecnia va dentro de `explicacion` empezando con `Ayuda para memorizar:` y se resalta sola.
- Cifras con fecha: escribilas como "según el texto (AAAA)".

| tipo | campos extra |
|---|---|
| `flashcard` | — |
| `mcq` | `opciones` (3-4, sin repetir), `correcta` (texto idéntico a una opción) |
| `vf` | `opciones: ["Verdadero","Falso"]`, `correcta`, `justificaciones` (3), `justificacionCorrecta` |
| `caso` | `relato`, `puntosClave` (≥3) |
| `desarrollo` | `puntosClave` (≥3) |
| `matching` | `pares: [{ "a": "Caso", "b": "Principio" }]` (≥4, sin repetir lados) |
| `timeline` | `eventos: [{ "fecha": "1962", "texto": "…" }]` en orden correcto (≥4, fechas distintas) |

La Unidad 7 se genera desde `scripts/fuentes/u07.py` (`python3 scripts/fuentes/u07.py`). Podés editar el JSON directo o el script, pero no los dos.
