# Personajes de Exo Space

Este documento tiene cuatro partes:

1. [Cómo se hacen los personajes](#1-cómo-se-hacen-los-personajes) en este proyecto.
2. [El contrato de nombres](#2-el-contrato-de-nombres) que comparten.
3. [La ficha](#3-la-ficha-de-cada-personaje) que el equipo escribe para cada uno.
4. [Los prompts](#4-prompts): el kit primero y después uno por tipo de personaje.

Quién es cada personaje lo decide el equipo en su ficha. Los prompts sirven
para construirlo, no para inventarlo.

---

## 1. Cómo se hacen los personajes

En Exo Space **no hay archivos 3D importados en la partida**: cada modelo es
código TypeScript que monta piezas simples y define sus animaciones. Así pesan
muy poco, se ven todos de la misma familia y las pruebas pueden revisarlos en
Node.

- **Dónde:** un archivo por personaje en `web/src/modelos/`.
- **Con qué:** los ayudantes de `web/src/modelos/kit.ts` (lo crea el Prompt 0):
  - Piezas: `nodo`, `pieza`, `barra`, `ojo` y las formas `caja`, `esfera`,
    `capsula`, `barril`, `toro`, `cono` y `punta`.
  - Materiales: `toon(color)` (sombreado de tres tonos), `brillo(color)` (sin
    sombra, para luces) y el contorno oscuro, que `pieza` pone solo.
  - Colores: la `PALETA` del juego.
- **Animaciones:** clips con `animacion(nombre, duracion, pistas)`. Las pistas
  se hacen con `rot`, `mov` y `esc`, y se muestrean con `ciclo` (bucles que
  cierran solos) o `poses` (claves sueltas).
- **Registro:** cada modelo se añade a `CATALOGO` en
  `web/src/modelos/index.ts` con su `tipo` (`jugador`, `npc`, `enemigo`,
  `guardian`, `objeto`).
- **Pruebas automáticas** (`web/test/modelos.test.ts`): los nombres de nodo no
  se repiten, los clips duran 4 segundos como mucho, los bucles cierran sin
  salto, se respeta el presupuesto de triángulos y el modelo no tiene valores
  raros.
- **Verlo:** con `npm run dev`, en `/modelos.html` (un botón por clip,
  velocidades y descarga GLB) y en `/referencias.html?modelo=<id>&vista=hoja`
  (frente, lado, espalda y tres cuartos).

**Cada personaje es un modelo distinto:** otra silueta, otras proporciones,
otra cabeza y otra forma de moverse. Si al ponerlos en fila se reconoce el
mismo muñeco con otro color, está mal.

---

## 2. El contrato de nombres

El juego anima por nombre de clip y engancha cosas por nombre de nodo. Es lo
único que comparten los modelos. Mira hacia +z; origen a ras de suelo.

| Tipo | Nodos obligatorios | Clips obligatorios |
|---|---|---|
| `jugador` | `cuerpo`, `pecho`, `cabeza`, `pierna_i`, `pierna_d`, `mano_d` | `Reposo`, `Caminar`, `Correr`, `Saltar`, `Golpe recibido`, `Victoria`, `Derrota` |
| `npc` | `cuerpo`, `cabeza` | `Reposo`, `Hablar`, `Saludar` |
| `enemigo` | `cuerpo` | `Reposo`, `Moverse`, `Atacar`, `Golpe recibido`, `Morir` |
| `guardian` | `cuerpo`, `punto_debil` | `Reposo`, `Despertar`, `Moverse`, `Atacar`, `Golpe recibido`, `Morir` |

Presupuesto de triángulos: 30.000 el jugador, 12.000 un NPC, 8.000 un
enemigo, 40.000 un guardián.

---

## 3. La ficha de cada personaje

La escribe el equipo. Va pegada dentro del prompt del personaje.

```
Nombre:
Tipo: jugador | npc | enemigo | guardian
Papel en el juego (una frase):
Aspecto: silueta, altura en metros, cabeza, ropa o piezas, colores
Cómo se mueve (una frase):
Qué hace: herramienta o ataque, o qué misión da
Dónde aparece: qué tipo de planeta, mapa o mazmorra
```

Para enemigos y guardianes, el planeta manda. Propuesta de partida para
derivarlos de los datos reales, pendiente de que el equipo la valide:

| Dato del planeta | Lo que cambia en el enemigo |
|---|---|
| Banda térmica | Familia: hielo, templado, calor o fuego |
| Gravedad | Complexión: con mucha gravedad, bajos y anchos; con poca, altos y ligeros |
| Color de la estrella | Color de las partes que brillan |
| Clase de tamaño del planeta | Tamaño general de la fauna |

Qué son los enemigos (criaturas, máquinas, otra cosa) es parte de la historia
y está por decidir en `lore-y-mecanicas.md`.

---

## 4. Prompts

Primero el **Prompt 0**, una sola vez. Después, un prompt por personaje, en el
orden que se quiera. Pega siempre delante el **bloque de reglas**.

### Bloque de reglas (pegar delante de cada prompt)

```
Trabajas en Exo Space: A Way Home, un juego de navegador en web/ (Vite +
TypeScript + Three.js) para el NASA Space Apps Challenge 2026. Lee antes
TRASPASO.md, lore-y-mecanicas.md y prompts-personajes.md.

Reglas:
- Los modelos se construyen en código con web/src/modelos/kit.ts. Nada de
  archivos 3D ni texturas descargadas dentro de la partida.
- Cada personaje es un modelo TOTALMENTE DISTINTO: otra silueta, otras
  proporciones, otra cabeza. Prohibido partir de un cuerpo base común y
  repintarlo o añadirle accesorios. Solo se comparten los nombres de nodo y
  de clip del contrato.
- Construyes el personaje de la ficha. Si a la ficha le falta algo,
  pregunta: no lo inventes.
- Diseños originales: nada que copie personajes de otros juegos, películas
  o series.
- Nada de logos, banderas ni identificadores de misión de la NASA.
- Todo el texto que ve el jugador, en inglés.
- Datos puros en archivos sin Three.js para que las pruebas los carguen en
  Node. En archivos que cargan las pruebas, nada de propiedades en el
  constructor (Node los ejecuta sin compilar).
- Antes de terminar: `npx tsc --noEmit`, `npm test` y `npm run build` en web/
  sin errores, y mirarlo en el navegador: /modelos.html para el modelo y
  /referencias.html para la hoja de vistas.
```

### Prompt 0 — Kit de modelado, visores y pruebas (va primero)

```
Monta el sistema con el que se van a hacer todos los modelos del juego.

1. web/src/modelos/kit.ts:
   - Piezas: nodo (grupo con nombre), pieza (malla con material toon y su
     contorno oscuro), barra (pieza entre dos puntos), ojo.
   - Formas: caja redondeada, esfera, capsula, barril, toro, cono y punta.
   - Materiales: toon(color), con sombreado de tres tonos; brillo(color),
     sin sombra, para luces.
   - PALETA con los colores base del juego.
   - Animación: animacion(nombre, duracion, pistas), pistas rot, mov y esc,
     y los muestreos ciclo (bucle que cierra solo) y poses (claves sueltas).
     Los clips son AnimationClip normales sobre los nombres de nodo, para
     reproducirlos con AnimationMixer y exportarlos a GLB.

2. web/src/modelos/index.ts: el CATALOGO de modelos, cada uno con id, tipo,
   una función que lo crea y sus clips.

3. Un modelo de prueba sencillo (un cubo con ojos que salta) para comprobar
   que todo funciona. Se borra cuando exista el primer personaje real.

4. Visores, solo para desarrollo:
   - web/modelos.html: elegir modelo, un botón por clip, velocidad y
     descarga en GLB.
   - web/referencias.html: ?modelo=<id>&vista=frente|lado|espalda|
     tres-cuartos|hoja, con fondo neutro y cámara ortográfica, para sacar
     las hojas de referencia.

5. web/test/modelos.test.ts, para todos los modelos del CATALOGO: nombres
   de nodo sin repetir, nodos y clips del contrato según el tipo, clips de
   4 segundos como mucho, bucles que cierran sin salto, presupuesto de
   triángulos por tipo y ningún valor que no sea un número.

Enséñame el modelo de prueba en los dos visores antes de seguir.
```

### Prompt 1 — El jugador

```
Ficha del personaje:
[pegar aquí la ficha escrita por el equipo]
```

```
Crea al personaje jugable de la ficha en web/src/modelos/<id>.ts y regístralo
en el CATALOGO con tipo jugador.

- La cámara va detrás: lo que más se ve es la espalda. Que se reconozca
  desde atrás.
- Clips del contrato para jugador, cada uno con el carácter que dice la
  ficha en «Cómo se mueve».
- El nodo mano_d es donde el juego engancha la herramienta.

Enséñame la hoja de vistas y los clips Reposo, Correr y Saltar antes de
seguir.
```

### Prompt 2 — Un NPC que da misiones

```
Ficha del personaje:
[pegar aquí la ficha escrita por el equipo]
```

```
Crea al NPC de la ficha en web/src/modelos/<id>.ts y regístralo en el
CATALOGO con tipo npc.

- Tiene que reconocerse de lejos en el mapa: silueta clara y algo que lo
  distinga de los enemigos.
- Clips: Reposo (que parezca vivo: respira, mira alrededor), Hablar y
  Saludar (cuando el jugador se acerca).
- Si ya hay otros NPC, ponlo en fila con ellos: no puede parecerse.

Enséñame la hoja de vistas antes de seguir.
```

### Prompt 3 — Un enemigo según el planeta

```
Ficha del personaje:
[pegar aquí la ficha escrita por el equipo]

Tabla validada por el equipo para derivar enemigos de los datos del planeta:
[pegar aquí la tabla de la parte 3, ya revisada]
```

```
Crea al enemigo de la ficha en web/src/modelos/<id>.ts y regístralo en el
CATALOGO con tipo enemigo.

- El modelo recibe la descripción del planeta y cambia con ella según la
  tabla validada: familia, complexión, color de lo que brilla y tamaño.
- No llega en hordas: espera en su sala de la mazmorra o aparece por una
  misión. Su Reposo tiene que aguantar verse de cerca un buen rato.
- Atacar tiene que avisar antes de golpear, para que el jugador pueda
  esquivar.

Enséñame el mismo enemigo en tres planetas distintos (uno frío, uno templado
y uno abrasado) antes de seguir.
```

### Prompt 4 — El guardián de una mazmorra

```
Ficha del personaje:
[pegar aquí la ficha escrita por el equipo]
```

```
Crea al guardián de la ficha en web/src/modelos/<id>.ts y regístralo en el
CATALOGO con tipo guardian.

- Es lo que espera en la última sala. Más grande que el jugador y con una
  silueta que se lea desde la puerta.
- Despertar: empieza quieto y reacciona cuando el jugador entra.
- El nodo punto_debil marca dónde hace más daño el jugador; tiene que verse.
- Cada ataque se anuncia antes de golpear.

Enséñame la hoja de vistas y los clips Despertar y Atacar antes de seguir.
```
