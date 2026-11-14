# EXO SPACE: A WAY HOME — Documento de diseño

Estado al 14/11/2026: punto de partida. Cada apartado dice si está
**DECIDIDO** por el equipo o **ABIERTO**. Lo abierto lo decide el equipo; una
IA puede preguntar y contrastar, no rellenarlo por su cuenta.

---

## PARTE 1 — LORE

### Premisa `DECIDIDO`

El jugador está lejos de casa, entre mundos reales: los planetas que la
humanidad ha confirmado alrededor de otras estrellas. Quiere volver.

«Casa» tiene una posición real. El catálogo da la distancia de cada planeta a
la Tierra, de 1,3 a 8.500 parsecs, así que en cada mundo se puede decir a qué
distancia queda.

### Por escribir `ABIERTO`

- ¿Quién es el jugador? ¿Viaja solo?
- ¿Por qué está lejos de casa y qué le impide volver?
- ¿Qué o quién se opone? ¿De dónde salen los enemigos de las mazmorras?
- ¿Quiénes son los NPC que dan misiones y qué hacen en esos planetas?
- ¿Qué cuenta como «llegar a casa» y cómo termina el juego?

### Tono `ABIERTO`

Por decidir: aventura luminosa, soledad en el espacio, humor. Condiciona la
paleta, la música y la forma de hablar de los NPC.

---

## PARTE 2 — MECÁNICAS

### 1. Un universo de planetas reales `DECIDIDO`

El mapa del juego es el catálogo de exoplanetas confirmados. Cada planeta
lleva su nombre real, su estrella y sus cifras, y el jugador puede verlas.

### 2. Cada planeta, una experiencia distinta `DECIDIDO`

Las características reales del planeta deciden cómo se ve, cómo se juega y qué
enemigos tiene. El catálogo solo trae números, así que los colores y el
terreno se deducen de ellos.

Propuesta de partida para esa deducción, pendiente de que el equipo la valide:

| Dato real | Lo que puede decidir |
|---|---|
| Temperatura de la estrella (`st_teff`) | Color de la luz y del cielo: roja, naranja, amarilla o blanca |
| Temperatura del planeta (`pl_eqt`) | Paleta y bioma: helado, templado, cálido, abrasado |
| Radio y masa (`pl_rade`, `pl_bmasse`) | Gravedad en la superficie (masa entre radio al cuadrado) y tipo de planeta |
| Luz que recibe (`pl_insol`) | Brillo del día y dureza del clima |
| Órbita (`pl_orbper`, `pl_orbeccen`) | Duración del día o del año en el juego, estaciones |
| Combinación de lo anterior | Familia y rasgo de los enemigos del planeta |

Para que 6.470 planetas no se repitan, la paleta debería teñirse de forma
continua con los números, no elegirse entre unos pocos biomas fijos.

Cuando un planeta no tiene un dato, el juego lo dice y usa un valor neutro. No
se inventan cifras.

### 3. Carga por cercanía `DECIDIDO`

Un planeta solo se carga cuando el jugador se acerca. El catálogo entero pesa
0,4 MB comprimido y puede estar siempre en memoria; lo que se carga al
acercarse es lo que el juego genera para ese planeta: terreno, modelos,
misiones.

Qué significa «acercarse» depende del apartado 7.

### 4. Sin hordas `DECIDIDO`

Los enemigos no llegan por oleadas. Están en las mazmorras y aparecen en el
mapa solo cuando una misión los trae.

### 5. Mazmorras `DECIDIDO`

Interiores aparte. En el mapa hay una puerta; al entrar se carga otro
escenario con salas, enemigos que esperan dentro y un premio al final. Al
salir, el jugador vuelve al mismo punto del planeta y encuentra la superficie
como la dejó.

Por concretar: cuántas salas, qué premio, si la mazmorra cambia con los datos
del planeta y si se puede repetir.

### 6. Misiones de NPC `DECIDIDO`

En el mapa hay NPC que dan misiones: el jugador acepta, cumple un objetivo y
cobra un premio. Los enemigos que aparecen fuera de las mazmorras lo hacen por
una misión.

Por concretar: tipos de misión, cómo se sigue el objetivo en pantalla y qué se
gana.

### 7. Viaje entre planetas `ABIERTO`

Dos caminos: elegir destino en un mapa estelar y aterrizar, o volar con la
nave por el espacio. El primero cabe en el plazo; el segundo es una capa
nueva entera.

### 8. Diseño de misión `ABIERTO`

Es lo que pide el reto y todavía no tiene sitio en el juego: decidir antes de
salir qué nave, qué instrumentos y con qué presupuesto, y que esas decisiones
cambien lo que pasa después.

### 9. Jugabilidad base `DECIDIDO` en lo general, `ABIERTO` en el detalle

Acción y exploración en tercera persona. Falta concretar qué entra para el
domingo: tipo de combate, progresión del personaje, botín y si el jugador
construye o mejora su nave.

### 10. Modelos a partir de la NASA `DECIDIDO`

Naves, rovers, antenas y herramientas parten de los modelos reales de NASA 3D
Resources y se rehacen con el estilo del juego, sin logos ni banderas.

---

## Lo que pide el reto y dónde está

| El reto pide | Hoy en el diseño |
|---|---|
| Definir el objetivo de la misión | Abierto (apartado 8) |
| Diseñar la nave y elegir instrumentos | Abierto (apartados 8 y 9) |
| Elegir lanzador y órbita | Sin sitio todavía |
| Gestionar masa, energía, presupuesto, datos, comunicaciones, tiempo | Sin sitio todavía |
| Que cada decisión tenga consecuencias | La gravedad y el clima reales pueden darlas (apartado 2) |
| Simular la misión y explicar por qué sale bien o mal | Sin sitio todavía |
| Jugar solo o en equipo de hasta cuatro | Abierto |
| Usar datos de la NASA como parte central | Cubierto (apartados 1, 2 y 10) |

---

## PARTE 3 — PRIORIDADES

Con el cierre el domingo 15 a las 23:59, cabe una pieza de cada tipo:

1. Catálogo cargado, elegir un planeta y aterrizar.
2. El dato real decide paleta, gravedad y enemigos.
3. Un tipo de misión de NPC.
4. Una plantilla de mazmorra.
5. Dos o tres modelos adaptados de la NASA.
6. Demo y formulario, la tarde del domingo.

### Riesgos conocidos

- **Relevancia.** Sin el apartado 8, el juego es de exploración y acción, no de
  diseño de misión.
- **Alcance.** Volar entre planetas, el cooperativo en red y las mazmorras
  como interiores son las tres piezas más caras.
- **Planetas gigantes y abrasados.** Son la mayoría del catálogo: 2.494 sin
  suelo y 1.831 por encima de 1.000 K. Hay que decidir qué se hace con ellos.
- **Idioma.** Todo lo que ve el jugador tiene que estar en inglés.
