# Prompts para construir el mundo de Exo Space

Cinco prompts, en orden. Cada uno se pega en una sesión de IA abierta en la
carpeta del proyecto, siempre con el **bloque de reglas** delante.

Sirven para construir lo que el equipo ya decidió. Donde falta una decisión
hay una línea **«Decisión del equipo»**: se escribe antes de pegar el prompt.
Si se deja en blanco, la IA tiene que preguntar, no elegir.

---

## Bloque de reglas (pegar delante de cada prompt)

```
Trabajas en Exo Space: A Way Home, un juego de navegador en web/ (Vite +
TypeScript + Three.js) para el NASA Space Apps Challenge 2026. El universo del
juego son los exoplanetas reales del NASA Exoplanet Archive. Lee antes
TRASPASO.md y lore-y-mecanicas.md.

Reglas:
- Construyes lo que el equipo decidió. Si falta una decisión de diseño
  (historia, mecánicas, qué pasa en cada planeta), pregunta: no la inventes.
- Datos reales: usa solo los campos de web/public/datos/exoplanetas.csv. No
  inventes cifras. Si a un planeta le falta un dato, el juego lo dice y usa
  un valor neutro.
- Todo lo que ve el jugador va en inglés. Los nombres de planetas y estrellas
  se muestran tal como vienen en el catálogo.
- Lo que el juego deduce (colores, terreno, clima, criaturas) se presenta
  como derivado de datos reales, nunca como dato real.
- Nada de logos, banderas ni identificadores de misión de la NASA.
- Datos puros en archivos sin Three.js (src/contenido/, src/datos/) para que
  las pruebas los carguen en Node.
- Diseños originales: otros juegos son referencia de género; no se copian
  nombres, personajes, arte ni niveles.
- Antes de terminar: `npx tsc --noEmit`, `npm test` y `npm run build` en web/
  sin errores, y verlo en el navegador con `npm run dev`.
```

---

## Prompt 1 — Catálogo de exoplanetas

```
Quiero que el juego lea el catálogo de exoplanetas y lo tenga siempre en
memoria. Solo datos, sin Three.js y sin nada en pantalla todavía.

1. web/src/datos/exoplanetas.ts: el tipo Exoplaneta con los veinte campos de
   web/public/datos/exoplanetas.csv (los numéricos, number | null) y una
   función que convierte el texto del CSV en la lista. El CSV trae textos
   entre comillas y celdas vacías.

2. web/src/datos/derivados.ts: lo que se calcula a partir de los datos, con
   null cuando falta alguno:
   - Gravedad en la superficie, en g terrestres: masa / radio².
   - Velocidad de escape, en km/s: 11,19 × raíz de (masa / radio).
   - Clase de tamaño: rocoso (menos de 1,6 radios terrestres), intermedio
     (de 1,6 a 4) o gigante (4 o más).
   - Banda térmica: menos de 200 K, de 200 a 350, de 350 a 1.000, o 1.000 o
     más.
   - Color de la estrella a partir de su temperatura, con una aproximación
     de cuerpo negro.
   - Distancia a la Tierra en años luz: parsecs × 3,26156.
   - Posición en el espacio a partir de ra, dec y sy_dist, con la Tierra en
     el origen.

3. web/test/exoplanetas.test.ts: el catálogo carga, tiene más de 6.000
   planetas, el más cercano está a 1,30 parsecs, la Tierra (masa 1, radio 1)
   da gravedad 1 y velocidad de escape 11,19, una estrella de 3.000 K sale
   más roja que una de 6.500 K, y un planeta sin masa da gravedad null.

Cuando esté, dime cuántos planetas tienen todos los datos derivados y cuántos
no.
```

---

## Prompt 2 — Un planeta a partir de sus datos

**Decisión del equipo** (ver `lore-y-mecanicas.md`, apartado 2): confirmar o
corregir la tabla que relaciona cada dato real con lo que decide en el juego.

```
Tabla validada por el equipo:
[pegar aquí la tabla del apartado 2 de lore-y-mecanicas.md, ya revisada]
```

```
Quiero aterrizar en un exoplaneta del catálogo y que se vea y se juegue
distinto según sus datos reales.

1. web/src/contenido/planeta.ts (datos puros): una función que recibe un
   Exoplaneta y devuelve la descripción del planeta jugable. La misma entrada
   da siempre el mismo planeta: la semilla sale del nombre del planeta.
   - Paleta de cielo, luz y suelo teñida de forma continua con la temperatura
     de la estrella y la del planeta. No quiero una lista corta de biomas
     fijos: dos planetas con cifras distintas tienen que verse distintos.
   - Gravedad real aplicada al salto y a la caída, con un tope para que se
     pueda jugar.
   - Relieve, clima y peligros según la tabla validada.
   - Familia de enemigos del planeta, según la tabla validada.

2. web/src/mundo.ts: construye la escena del planeta a partir de esa
   descripción. Terreno y cielo generados en código.

3. Una ficha del planeta, en inglés, con dos columnas claramente separadas:
   «Real data» (lo que viene del catálogo, con sus unidades) y «Derived»
   (lo que deduce el juego).

4. Pruebas en web/test/planeta.test.ts: mismo planeta, misma descripción; un
   planeta frío y uno abrasado dan paletas distintas; con datos incompletos
   no falla y marca qué dato falta.

Enséñame tres planetas muy distintos entre sí (uno frío, uno templado, uno
abrasado) en capturas antes de seguir.
```

---

## Prompt 3 — Elegir planeta y carga por cercanía

**Decisión del equipo** (pendiente 1 de `TRASPASO.md`): cómo viaja el jugador
entre planetas.

```
Decisión del equipo sobre el viaje entre planetas:
[escribir aquí: mapa estelar y aterrizar, o vuelo libre con la nave]

Decisión del equipo sobre los planetas gigantes, que no tienen suelo:
[escribir aquí]
```

```
Quiero que el jugador pueda llegar a cualquier planeta del catálogo sin que
el juego cargue más de lo necesario.

1. El catálogo entero está siempre en memoria (pesa 0,4 MB comprimido). Lo
   que se carga y se descarga es lo que el juego genera para cada planeta:
   terreno, modelos, misiones y mazmorras.

2. web/src/datos/celdas.ts (datos puros): reparte los planetas en celdas del
   espacio según su posición, para saber rápido cuáles quedan cerca de un
   punto. Con pruebas.

3. Carga por cercanía: un planeta se genera cuando el jugador entra en su
   radio y se libera cuando se aleja. Tope de planetas cargados a la vez.
   Que se vea que algo está cargando y que no haya tirones.

4. La forma de viajar y de elegir destino, según la decisión de arriba. En
   cada planeta se ve su nombre real, su estrella y su distancia a la Tierra.

Dime cuánta memoria ocupa un planeta cargado y cuántos aguanta a la vez un
portátil normal.
```

---

## Prompt 4 — Mazmorras

```
Quiero mazmorras: interiores aparte del mapa del planeta.

1. En el mapa del planeta hay puertas. Al entrar se carga otro escenario,
   cerrado, con varias salas, enemigos que esperan dentro y un premio al
   final.

2. Los enemigos de la mazmorra no persiguen al jugador por el mapa: están en
   su sala y despiertan cuando entra.

3. Al salir, el jugador vuelve al mismo punto del planeta y lo encuentra como
   lo dejó: posición, objetos recogidos, misiones en curso.

4. La mazmorra se genera en código a partir de una plantilla y de los datos
   del planeta (paleta y familia de enemigos). La misma puerta lleva siempre
   a la misma mazmorra.

5. Datos puros de la plantilla en web/src/contenido/mazmorra.ts, con pruebas:
   todas las salas están conectadas, hay una entrada y un final, y el premio
   está en el final.

Tomamos la estructura del género (puerta, salas, premio), no los nombres, el
arte ni los niveles de ningún juego.

Antes de empezar, pregúntame cuántas salas, qué premio da y si se puede
repetir. Enséñame una mazmorra entera en capturas antes de seguir.
```

---

## Prompt 5 — Misiones de NPC

**Decisión del equipo** (pendiente 6 de `TRASPASO.md`): los NPC hablan con
guion fijo o con IA.

```
Decisión del equipo sobre cómo hablan los NPC:
[escribir aquí: guion fijo, o IA con guion de respaldo]
```

```
Quiero que los NPC del mapa den misiones.

1. Una misión tiene: quién la da, qué pide, cómo se sabe que está cumplida y
   qué premio da. Datos puros en web/src/contenido/misiones.ts.

2. El jugador se acerca al NPC, habla, acepta la misión, la cumple y vuelve
   a cobrar. En pantalla se ve siempre la misión activa y cuánto falta.

3. No hay hordas. Los enemigos que aparecen fuera de las mazmorras lo hacen
   porque una misión los trae, donde la misión dice y en la cantidad que
   dice.

4. Empieza con un solo tipo de misión, completo de principio a fin. Los
   demás tipos vendrán después.

5. Pruebas en web/test/misiones.test.ts: una misión no se puede cobrar sin
   cumplirla, no se puede aceptar dos veces y su estado se guarda.

Antes de empezar, pregúntame qué tipo de misión es la primera, quién la da y
qué se gana. Todo el texto de los NPC, en inglés.
```
