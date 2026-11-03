# Parcial DIP · UNTREF (2026-2)

Web app de práctica activa para el segundo parcial (Unidades 7 a 10). Vite + React + TypeScript + Tailwind, PWA offline, sin backend.

```bash
npm install
npm run dev        # desarrollo
npm run validar    # controla el contenido de src/data
npm run build      # valida + compila a dist/
```

- **Contenido**: `src/data/uNN.json` y `glosario.json`. Ver `CONTENIDO.md`.
- **Progreso**: localStorage del navegador (exportar/importar desde Ajustes).
- **Deploy**: Vercel (detecta `vercel.json`) o GitHub Pages (workflow en `.github/workflows/pages.yml`; activar Pages → Source: GitHub Actions). Usa base relativa y router por hash, así que funciona en subcarpetas.

Estado del contenido: U7 cargada (Hinojosa, cap. XIII, contrastada con el PDF completo). U8, U9 y U10 cargadas. Las U5 y U6 no se evalúan en este parcial.
