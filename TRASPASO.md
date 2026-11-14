# Traspaso — Exo Space: A Way Home

Lo primero que hay que leer antes de tocar nada. Las entradas nuevas van
arriba, con fecha. Después: [lore-y-mecanicas.md](lore-y-mecanicas.md) (el
diseño) y los prompts de construcción (`prompts-*.md`).

---

## Punto de partida (14/11/2026)

El proyecto empieza hoy, desde cero, para el **NASA Space Apps Challenge 2026**,
reto «Space Mission Design Game». Todavía no hay juego: hay estructura,
contexto, prompts y el catálogo de exoplanetas descargado y comprobado.

### Qué es

Un juego de navegador en 3D cuyo universo son los exoplanetas reales del NASA
Exoplanet Archive. El jugador recorre esos mundos buscando el camino de vuelta
a casa.

### Decisiones del equipo (14/11/2026)

| Tema | Decisión |
|---|---|
| Nombre | «Exo Space: A Way Home», provisional (ver [nombres.md](nombres.md)) |
| Plataforma | Juego de navegador |
| Tecnología | Vite + TypeScript + Three.js |
| Universo | Los planetas confirmados del NASA Exoplanet Archive |
| Variedad | Cada planeta da una experiencia distinta, derivada de sus datos reales |
| Aspecto | Las características reales del planeta deciden cómo se ve y qué enemigos tiene |
| Carga | Por cercanía: un planeta solo se carga cuando el jugador se acerca |
| Modelos | Se parte de NASA 3D Resources y se rehacen con el estilo propio del juego |
| Jugabilidad | Acción y exploración en tercera persona |
| Enemigos | Sin hordas. Viven en mazmorras y aparecen en el mapa solo por una misión |
| Mazmorras | Interiores aparte: una puerta lleva a otro escenario con salas y premio |
| Misiones | Las dan los NPC del mapa |
| Historia | Encontrar el camino a casa |

### Por decidir (lo decide el equipo, no una IA)

1. **Cómo viaja el jugador entre planetas.** Elegir en un mapa estelar y
   aterrizar es barato; volar con la nave por el espacio es una capa nueva
   entera. De esto depende qué significa «carga por cercanía».
2. **Quién es el jugador y por qué está lejos de casa.**
3. **Qué pasa con los planetas gigantes.** 2.494 de los 6.470 tienen cuatro
   radios terrestres o más y no tienen suelo donde aterrizar.
4. **Dónde entra el diseño de misión que pide el reto** (nave, instrumentos,
   presupuesto, masa, energía, datos, comunicaciones). Las misiones de NPC
   decididas hasta ahora son encargos dentro del mapa.
5. **Qué piezas de la jugabilidad base entran para el domingo:** combate,
   progresión, botín, nave propia.
6. **Los NPC hablan con guion fijo o con IA.** Con IA hace falta servidor y
   clave.
7. **Un jugador o cooperativo.** El reto valora hasta cuatro jugadores con
   roles; en red es la pieza más arriesgada.
8. **El nombre definitivo.**

---

## El hackathon

- **Reto:** «Space Mission Design Game». Un juego interactivo donde el jugador
  diseña, gestiona y simula una misión espacial completa, toma decisiones de
  ingeniería con recursos limitados y ve cómo cada decisión cambia el
  resultado.
- **Cierre:** domingo 15 de noviembre de 2026 a las 23:59, hora del evento
  local. Hay que pulsar «Submit for Judging» antes; se puede reenviar.
- **Criterios (1 a 5 cada uno):** impacto, creatividad, validez, relevancia y
  presentación. Relevancia mide responder al reto y usar datos de la NASA como
  parte central, no como añadido.

### Lo que se entrega

| Campo del formulario | Qué va |
|---|---|
| Project Name | Nombre del juego |
| High-Level Project Summary | Qué es, cómo responde al reto, por qué importa |
| Link to Project Demo | Vídeo de 30 segundos como máximo, o hasta 7 diapositivas |
| Link to Final Project | Enlace público, sin login |
| Detailed Project Description | Qué hace, cómo funciona, herramientas usadas |
| Use of Super Intelligence (SI) | Qué herramientas de IA se usaron y cómo |
| NASA Data | Ver [NASA-DATA.md](NASA-DATA.md) |
| Space Agency Partner Data and Other References | Todo recurso externo: código, texto, imágenes |

Pasarse de 30 segundos o de 7 diapositivas deja fuera del juicio global.

### Reglas que condicionan el trabajo

- **Todo en inglés:** el formulario y cualquier material enlazado, incluido el
  texto que ve el jugador. Un vídeo puede hablarse en otro idioma si lleva
  subtítulos en inglés.
- **La idea es del equipo.** La guía permite usar IA para acelerar el trabajo,
  no para inventar cómo se resuelve el reto.
- **El uso de IA se declara.** Imágenes y vídeos generados llevan marca de agua
  visible; audio y código se reconocen en texto descriptivo y metadatos.
- **Sin marca de la NASA en contenido generado:** ni logos, ni banderas, ni
  identificadores de misión.
- **Referencias completas.** Todo recurso externo usado se lista en el campo de
  referencias, aunque sea libre. Eso incluye código, textos o modelos traídos
  de proyectos anteriores.
- **Trabajo del fin de semana.** Las FAQ dicen que no se puede empezar el reto
  antes del hackathon.
- **Al menos un dato o recurso de la NASA** para optar a premio global.
- **Sin imágenes ni voz de menores de 18 años.**

Fuentes: Project Submission Guide, Judging & Awards Guide y Participant FAQs en
spaceappschallenge.org, leídas el 14/11/2026.

---

## Datos de la NASA

Cifras comprobadas el 14/11/2026. Las citas y los enlaces están en
[NASA-DATA.md](NASA-DATA.md).

### NASA Exoplanet Archive, tabla `pscomppars`

- **6.470 planetas** confirmados alrededor de **4.862 estrellas**.
- **Copia local:** `web/public/datos/exoplanetas.csv` (1,2 MB; 0,4 MB
  comprimido). Se regenera con `npm run datos` dentro de `web/`.
- **No se puede consultar desde el navegador** (el servicio no envía cabeceras
  CORS): por eso el juego lleva la copia dentro.
- **Solo hay números.** No hay superficies, imágenes ni colores; el aspecto de
  cada planeta lo deduce el juego.

| Campo | Qué es | Planetas que lo tienen |
|---|---|---|
| `pl_name`, `hostname` | Nombre del planeta y de su estrella | 6.470 |
| `pl_rade` | Radio, en radios terrestres | 6.420 |
| `pl_bmasse` | Masa, en masas terrestres | 6.439 |
| `pl_eqt` | Temperatura de equilibrio, en kelvin | 5.930 |
| `st_teff` | Temperatura de la estrella, en kelvin | 6.161 |
| `sy_dist` | Distancia a la Tierra, en parsecs | 6.442 |
| `ra`, `dec` | Posición en el cielo | 6.470 |

Otros campos de la copia: `sy_pnum`, `discoverymethod`, `disc_year`, `pl_dens`,
`pl_insol`, `pl_orbper`, `pl_orbsmax`, `pl_orbeccen`, `st_rad`, `st_mass`,
`st_spectype`.

Cómo se reparten (sirve para decidir biomas y enemigos):

| Reparto | Cifras |
|---|---|
| Por tamaño | 1.201 rocosos (menos de 1,6 radios) · 2.725 intermedios · 2.494 gigantes (4 o más) |
| Por temperatura | 331 bajo 200 K · 490 entre 200 y 350 K · 3.278 entre 350 y 1.000 K · 1.831 sobre 1.000 K |
| Por estrella | 616 rojas (bajo 3.900 K) · 1.803 naranjas · 2.563 amarillas · 1.179 blancas (6.000 K o más) |
| Por distancia | De 1,3 a 8.500 parsecs · 1.615 a menos de 100 |
| Con radio, masa, temperatura y distancia | 5.845 |

### NASA 3D Resources

- 227 modelos; 219 traen archivo GLB y casi todos pesan menos de 5 MB.
- Sin GLB: Curiosity y el cohete SLS. Demasiado pesados: Gateway (63 MB) y
  Space Exploration Vehicle (21 MB).
- Uso permitido citando a la NASA y sin dar a entender que avala el proyecto.

---

## Dónde está todo

```
Exo Space/
├── TRASPASO.md                 Este archivo
├── lore-y-mecanicas.md         Documento de diseño
├── nombres.md                  El nombre y los descartados
├── NASA-DATA.md                Fuentes de la NASA y cómo citarlas (en inglés)
├── README.md                   Presentación pública (en inglés)
├── prompt-continuar-claude.md  Para abrir un chat nuevo con todo el contexto
├── prompts-mundo.md            Catálogo, planetas, carga, mazmorras, misiones
├── prompts-personajes.md       Kit de modelado, jugador, NPC y enemigos
├── prompts-modelos-3d.md       Estilo, modelos 3D y adaptación de modelos de la NASA
├── referencias-modelos/        Hojas de referencia y GLB de partida
├── docs/media/                 Capturas y clips para el README
├── video/                      Material de la demo
└── web/                        El juego
    ├── index.html
    ├── package.json            dev · build · test · preview · datos
    ├── public/datos/           Catálogo de exoplanetas y su ficha de origen
    ├── scripts/                Descarga del catálogo
    ├── src/                    Código del juego
    │   ├── main.ts             Punto de entrada (hoy, una escena vacía)
    │   ├── contenido/          Datos puros, sin Three.js
    │   ├── datos/              Lectura del catálogo y valores derivados
    │   └── modelos/            Un archivo por modelo, hechos en código
    └── test/                   Pruebas con node --test
```

---

## Cómo se trabaja

- **Comandos**, dentro de `web/`: `npm install` la primera vez, `npm run dev`
  (http://127.0.0.1:5173), `npx tsc --noEmit`, `npm test`, `npm run build` y
  `npm run datos` para volver a descargar el catálogo.
- **Antes de dar algo por hecho:** tipos, pruebas, build y verlo en el
  navegador.
- **Idioma:** todo lo que ve el jugador y el README, en inglés. Estos
  documentos de trabajo, en español.
- **Modelos:** en código, con piezas simples; sin archivos 3D importados en el
  juego. Los GLB de la NASA son referencia, no se cargan en la partida.
- **Datos puros aparte:** lo que no necesita Three.js va en archivos sin
  Three.js para que las pruebas lo carguen en Node.
- **Diseños originales:** otros juegos sirven como referencia de género, no se
  copian nombres, personajes, arte ni niveles.
- **Carpeta en iCloud:** `node_modules` tiene miles de archivos y iCloud los
  sincroniza todos. Si molesta, conviene mover el proyecto fuera de iCloud.

---

## Orden de construcción

1. Base: catálogo cargado, elegir un planeta y aterrizar en él.
2. El dato real decide paleta, gravedad y enemigos.
3. Un tipo de misión de NPC.
4. Una plantilla de mazmorra.
5. Dos o tres modelos adaptados de NASA 3D Resources.
6. Demo de 30 segundos o 7 diapositivas, y el formulario. Reservar la tarde
   del domingo.

Cada paso tiene su prompt en `prompts-mundo.md`, `prompts-personajes.md` y
`prompts-modelos-3d.md`.
