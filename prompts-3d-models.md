# Prompts for the 3D models of Exo Space

For asking an AI for models and for adapting NASA's real models to the game's
style. There are two formats:

- **Full prompt:** for an AI that builds the model and its animations. Paste
  the **style block** first and then the model's prompt.
- **Short prompt:** for text-to-3D generators. They only give the mesh; they
  work as a shape reference, not as the final model.

In play, models are code built with the kit (see
[prompts-characters.md](prompts-characters.md)). GLB files, our own or NASA's,
are reference material.

---

## References to attach

Everything goes in the [reference-models/](reference-models/) folder:

| File | What it is | What it is for |
|---|---|---|
| `<model>-sheet.png` | Front, side, back and three-quarter in one row | The best reference for an AI that models |
| `<model>-front.png`, `-side.png`, `-back.png` | Single views at 1024 × 1024 | Image-to-3D generators with several views |
| `<model>-three-quarter.png` | Three-quarter view | Generators that take a single image |
| `style-group.png` | Several models together, at the same scale | Style and size reference |
| `nasa/<model>.glb` | The original model from NASA 3D Resources | Starting point for adapting it |

The sheets are produced with `/references.html` once the viewer exists.

**Sentence to paste next to the images** (before the style block):

```
I am attaching reference images from our game. Respect the shape,
proportions, parts and colours of the references, and the drawing style
(three-tone toon shading and a thick dark outline). If it is a new model, it
has to look like the same family as the ones in style-group.png: the same
rounded, chunky shapes, the same outline thickness and a consistent scale.
```

---

## Style block (always paste first)

```
Style: 3D video game models made of simple, chunky parts (rounded boxes,
spheres, capsules, barrels), exaggerated proportions, three-tone toon shading
with a thick dark outline. Flat colours, nothing realistic, no photographic
textures.

World: real exoplanets from the NASA Exoplanet Archive. Each planet's palette
comes from its data (temperature of the star and of the planet) and is given
in each prompt.

Forbidden: logos, insignia, flags and mission identifiers of NASA or of any
agency. No text on the model.

Technical:
- Export GLB with mesh, materials (or vertex colours) and animations.
- Units in metres, origin at ground level, facing +Z.
- A hierarchy of parts with clear names.
- Animations at 30 fps; movement ones as a perfect loop. Clip names exactly
  as given.
- Anticipation and exaggeration: every action should read from a distance.
```

---

## Adapting a model from NASA 3D Resources

The method, step by step:

1. Download the original GLB to `reference-models/nasa/` from
   https://github.com/nasa/NASA-3D-Resources (folder `3D Models`).
2. Produce its view sheet: front, side, back and three-quarter.
3. Note its main parts and its proportions.
4. Rebuild it with the kit: same proportions and same silhouette, in the
   game's style, animated and with no insignia.
5. Put it next to the original and compare.
6. Add its row in [NASA-DATA.md](NASA-DATA.md): model, file, credit and what
   was changed.

**Prompt for adapting**

```
I am attaching the view sheet of a real model from NASA 3D Resources:
[name of the model].

Rebuild it with the game's kit in web/src/models/<id>.ts and register it in
the CATALOG with type prop.

- It has to be recognisable: the same overall proportions, the same
  silhouette and the same main parts as the original.
- In the game's style: simple, chunky parts, three-tone toon shading, dark
  outline, flat colours.
- No logos, insignia, flags, registration marks or text.
- With movement where the original has it (wheels, antennas, panels, arms),
  in named clips.
- Budget: 12,000 triangles.

Show me the original and yours, side by side, before going on.
```

**Candidates checked on 2026-11-14** (folder name in the repository and size
of the GLB):

| Model | GLB |
|---|---|
| Deep Space Network 70-meter | 1.8 MB |
| Viking Lander | 1.8 MB |
| Apollo Lunar Module | 0.7 MB |
| Voyager Probe (A) | 0.3 MB |
| Cassini-Huygens (A) | 1.6 MB |
| Mars 2020 Perseverance Rover | 4.8 MB |
| Ingenuity Mars Helicopter | 1.9 MB |
| Habitat Demonstration Unit | 0.5 and 0.7 MB (two parts) |
| Extravehicular Mobility Unit | 3.3 MB |
| CubeSat - 1 RU Generic | 0.1 MB |
| Parker Solar Probe | 0.4 MB |
| 1999 RQ36 asteroid | 0.3 MB |
| Saturn V | 0.9 MB |
| Wrench | under 0.1 MB |

No GLB: Curiosity (Blender only) and Space Launch System (compressed archive
only). Too heavy: Gateway (63 MB) and Space Exploration Vehicle (21 MB).

---

## Template for a new model

**Full prompt**

```
Create [what it is], [height] m tall: [overall shape and parts, top to
bottom].
Colours: [palette of the planet or the character, with codes].
Character: [how it should feel when you see it].

Animations: [clip name (duration, what it does)], one per line.
```

**Short prompt**

```
[What it is], [main shapes], [colours], chunky toon style, thick dark
outline, flat colors, low poly, full body, game asset, no logos, no text
```

---

## AI-generated images and video

The hackathon guide requires every AI-generated image or video to carry a
visible watermark, and forbids NASA logos, flags and mission identifiers in
them. This also applies to portraits, menu backgrounds and thumbnails.
