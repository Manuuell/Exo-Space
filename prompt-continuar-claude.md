# Prompt para continuar Exo Space en un chat nuevo de Claude

Pega todo el bloque de abajo como primer mensaje del chat nuevo, abierto en la
carpeta del proyecto.

---

```
Seguimos con Exo Space: A Way Home, nuestro juego para el NASA Space Apps
Challenge 2026 (reto «Space Mission Design Game»). Estás en la carpeta del
proyecto. Lee primero, en este orden: TRASPASO.md (contexto, decisiones,
reglas del hackathon y datos de la NASA), lore-y-mecanicas.md (el diseño, con
lo decidido y lo abierto) y NASA-DATA.md (fuentes y citas).

## Qué es y cómo se trabaja

- Juego de navegador en web/: Vite + TypeScript + Three.js. El universo son
  los exoplanetas reales del NASA Exoplanet Archive; el catálogo está en
  web/public/datos/exoplanetas.csv.
- Comandos (en web/): `npm install` la primera vez, `npm run dev`
  (http://127.0.0.1:5173), `npx tsc --noEmit`, `npm test` (node --test),
  `npm run build` y `npm run datos` (vuelve a descargar el catálogo). Para
  verlo, usa tu navegador con preview_start y el nombre "web" de
  .claude/launch.json. Antes de decir que algo está hecho: tipos, pruebas,
  build y verlo en el navegador.
- Todo lo que ve el jugador y el README van en inglés. Los documentos de
  trabajo, en español.
- Los modelos son código hecho con web/src/modelos/kit.ts (piezas simples,
  sombreado toon, contorno oscuro, clips). Los GLB de la NASA son referencia
  y no se cargan en la partida. Ver prompts-personajes.md y
  prompts-modelos-3d.md.
- Datos reales: solo los campos del catálogo, sin inventar cifras. Lo que el
  juego deduce se presenta como derivado, nunca como dato real.
- Nada de logos, banderas ni identificadores de misión de la NASA.
- Diseños originales: otros juegos son referencia de género; no copies
  nombres, personajes, arte ni niveles.

## Reglas del hackathon que te afectan

- La idea es del equipo. Tú construyes, preguntas y contrastas con los datos
  y con el plazo. Si falta una decisión de diseño, pregunta: no la inventes.
  Las pendientes están en TRASPASO.md, «Por decidir».
- Cierre: domingo 15 de noviembre de 2026, 23:59. Avisa si algo no cabe.
- El uso de IA se declara como pide la guía. Pregunta al equipo cómo quiere
  reflejarlo antes del primer commit y antes de generar imágenes o vídeo.
- Todo recurso externo que entre en el proyecto (código, texto, imágenes,
  modelos) se apunta para el campo de referencias, y los de la NASA en
  NASA-DATA.md.
- Commits y subidas: solo cuando te lo pidan.

## Estado ahora mismo

Punto de partida. Hay estructura, contexto, prompts y el catálogo descargado.
web/ arranca y muestra una escena vacía. No hay jugabilidad.

## Tareas, en orden

1. Lee los tres documentos y dime en cinco líneas qué entiendes que es el
   juego y qué decisiones siguen abiertas.

2. Pregúntame, de una en una, las decisiones abiertas que bloquean el primer
   paso: cómo se viaja entre planetas y qué se hace con los planetas
   gigantes.

3. Sigue el orden de construcción de TRASPASO.md. Cada paso tiene su prompt
   en prompts-mundo.md, prompts-personajes.md y prompts-modelos-3d.md:
   empieza por el Prompt 1 de prompts-mundo.md (catálogo) y el Prompt 0 de
   prompts-personajes.md (kit de modelado).

4. Después de cada paso, añade una entrada con fecha al principio de
   TRASPASO.md: qué se hizo, qué se comprobó y qué quedó sin comprobar.

Enséñame cada paso funcionando antes de empezar el siguiente.
```
