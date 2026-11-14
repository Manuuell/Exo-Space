# Prompts para los modelos 3D de Exo Space

Para pedir modelos a una IA y para adaptar los modelos reales de la NASA al
estilo del juego. Hay dos formatos:

- **Prompt completo (en español):** para una IA que construye el modelo y sus
  animaciones. Pega primero el **bloque de estilo** y después el prompt del
  modelo.
- **Prompt corto (en inglés):** para generadores de texto a 3D. Solo dan la
  malla; sirven como referencia de forma, no como modelo final.

Dentro de la partida los modelos son código hecho con el kit (ver
[prompts-personajes.md](prompts-personajes.md)). Los GLB, propios o de la NASA,
son material de referencia.

---

## Referencias para adjuntar

Todo va en la carpeta [referencias-modelos/](referencias-modelos/):

| Archivo | Qué es | Para qué |
|---|---|---|
| `<modelo>-hoja.png` | Frente, lado, espalda y tres cuartos en una fila | La mejor referencia para una IA que modela |
| `<modelo>-frente.png`, `-lado.png`, `-espalda.png` | Vistas sueltas de 1024 × 1024 | Generadores de imagen a 3D con varias vistas |
| `<modelo>-tres-cuartos.png` | Vista de tres cuartos | Generadores con una sola imagen |
| `estilo-conjunto.png` | Varios modelos juntos, a la misma escala | Referencia de estilo y de tamaño |
| `nasa/<modelo>.glb` | El modelo original de NASA 3D Resources | Punto de partida para adaptarlo |

Las hojas se sacan con `/referencias.html` cuando exista el visor.

**Frase para pegar junto a las imágenes** (antes del bloque de estilo):

```
Adjunto imágenes de referencia de nuestro juego. Respeta la forma, las
proporciones, las piezas y los colores de las referencias, y el estilo de
dibujo (sombreado toon de tres tonos y contorno oscuro grueso). Si es un
modelo nuevo, tiene que parecer de la misma familia que los de
estilo-conjunto.png: mismas formas redondeadas y gruesas, mismo grosor de
contorno y una escala coherente.
```

---

## Bloque de estilo (pegar siempre primero)

```
Estilo: modelos de videojuego 3D hechos de piezas simples y gruesas (cajas
redondeadas, esferas, cápsulas, barriles), proporciones exageradas, sombreado
toon de tres tonos con contorno oscuro grueso. Colores planos, nada realista,
sin texturas fotográficas.

Mundo: exoplanetas reales del NASA Exoplanet Archive. La paleta de cada
planeta sale de sus datos (temperatura de la estrella y del planeta) y se
indica en cada prompt.

Prohibido: logos, insignias, banderas e identificadores de misión de la NASA
o de cualquier agencia. Ningún texto sobre el modelo.

Técnico:
- Exportar GLB con malla, materiales (o colores de vértice) y animaciones.
- Unidades en metros, origen a ras de suelo, mirando a +Z.
- Jerarquía de piezas con nombres claros.
- Animaciones a 30 fps; las de movimiento, en bucle perfecto. Nombres de
  clip exactamente como se indican.
- Anticipación y exageración: que cada acción se lea desde lejos.
```

---

## Adaptar un modelo de NASA 3D Resources

El método, paso a paso:

1. Descargar el GLB original a `referencias-modelos/nasa/` desde
   https://github.com/nasa/NASA-3D-Resources (carpeta `3D Models`).
2. Sacar su hoja de vistas: frente, lado, espalda y tres cuartos.
3. Apuntar sus piezas principales y sus proporciones.
4. Reconstruirlo con el kit: mismas proporciones y misma silueta, con el
   estilo del juego, animado y sin insignias.
5. Ponerlo al lado del original y comparar.
6. Añadir su fila en [NASA-DATA.md](NASA-DATA.md): modelo, archivo, crédito y
   qué se cambió.

**Prompt para adaptar**

```
Adjunto la hoja de vistas de un modelo real de NASA 3D Resources:
[nombre del modelo].

Reconstrúyelo con el kit del juego en web/src/modelos/<id>.ts y regístralo en
el CATALOGO con tipo objeto.

- Tiene que reconocerse: mismas proporciones generales, misma silueta y las
  mismas piezas principales que el original.
- Con el estilo del juego: piezas simples y gruesas, sombreado toon de tres
  tonos, contorno oscuro, colores planos.
- Sin logos, insignias, banderas, matrículas ni texto.
- Con movimiento donde el original lo tiene (ruedas, antenas, paneles,
  brazos), en clips con nombre.
- Presupuesto: 12.000 triángulos.

Enséñame el original y el tuyo, uno al lado del otro, antes de seguir.
```

**Candidatos comprobados el 14/11/2026** (nombre de carpeta en el repositorio
y peso del GLB):

| Modelo | GLB |
|---|---|
| Deep Space Network 70-meter | 1,8 MB |
| Viking Lander | 1,8 MB |
| Apollo Lunar Module | 0,7 MB |
| Voyager Probe (A) | 0,3 MB |
| Cassini-Huygens (A) | 1,6 MB |
| Mars 2020 Perseverance Rover | 4,8 MB |
| Ingenuity Mars Helicopter | 1,9 MB |
| Habitat Demonstration Unit | 0,5 y 0,7 MB (dos partes) |
| Extravehicular Mobility Unit | 3,3 MB |
| CubeSat - 1 RU Generic | 0,1 MB |
| Parker Solar Probe | 0,4 MB |
| 1999 RQ36 asteroid | 0,3 MB |
| Saturn V | 0,9 MB |
| Wrench | menos de 0,1 MB |

Sin GLB: Curiosity (solo Blender) y Space Launch System (solo comprimido).
Demasiado pesados: Gateway (63 MB) y Space Exploration Vehicle (21 MB).

---

## Plantilla para un modelo nuevo

**Prompt completo**

```
Crea [qué es], de [altura] m: [forma general y piezas, de arriba abajo].
Colores: [paleta del planeta o del personaje, con códigos].
Carácter: [cómo tiene que sentirse al verlo].

Animaciones: [nombre del clip (duración, qué hace)], una por línea.
```

**Prompt corto**

```
[What it is], [main shapes], [colours], chunky toon style, thick dark
outline, flat colors, low poly, full body, game asset, no logos, no text
```

---

## Imágenes y vídeo generados con IA

La guía del hackathon exige que toda imagen o vídeo generado con IA lleve una
marca de agua visible, y que no use logos, banderas ni identificadores de
misión de la NASA. Vale también para retratos, fondos de menú y miniaturas.
