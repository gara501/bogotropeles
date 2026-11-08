# Batalla de aura · prompts para regenerar al Gordo del Aura con el estilo liso de los jugadores

**Cómo usarlos:** en ChatGPT adjunta las dos imágenes de esta carpeta:
- `referencia-estilo.png`: un jugador de Aura, para copiar el estilo.
- `referencia-gordo.png`: el Gordo actual, para copiar el diseño.

Pega el bloque común seguido de una de las tres hojas. Genera una imagen por hoja.

**Al terminar,** reemplaza el archivo correspondiente en `src/scenes/aura/game/cast-v2/`. El juego espera:
- 3 poses por hoja, cada una de 256 × 512 px (hoja de 768 × 512).
- Pies apoyados en la fila 450.
- Cuerpo de unos 280 px de alto.

Si la imagen sale de otro tamaño, pásamela y la recorto y alineo.

---

## Bloque común

```
Character sprite sheet for a 2D game, in EXACTLY the art style of the first attached image (the player):
same smooth soft shading, same level of detail, same dark outline thickness, same proportions and the same
size on the canvas. NOT chunky pixel art, no visible big pixels, no dithering.

The character is the one in the second attached image, "El Gordo del Aura": a chubby shirtless young man,
short black hair with faded sides, thin moustache, gold chain necklace, big round belly, red basketball shorts
below the knee, white socks, black sandals. Keep his face, hair, chain, shorts and sandals identical.

Layout: 3 poses side by side on a transparent background, each pose in its own equal-width slot, full body,
same three-quarter view as the second image, feet on the same ground line in every pose, same scale in all poses, empty space between poses.
No text, no background, no ground shadow.
```

## Hoja 1 · `gordo-idle-taunt.png` (provocando)

```
Pose 1: standing relaxed, arms at the sides, confident smirk.
Pose 2: pointing at the viewer with one hand, the other hand on his belly, mocking grin.
Pose 3: both forearms raised with open palms, "come on, show me" gesture, cocky smile.
```

## Hoja 2 · `gordo-crowd-hype.png` (el público lo celebra)

```
Pose 1: both arms raised high with open hands, hyping the crowd.
Pose 2: one hand cupped behind his ear, leaning, "I can't hear you!", the other arm loose.
Pose 3: flexing both arms like a bodybuilder, proud grin.
```

## Hoja 3 · `gordo-defeat.png` (pierde)

```
Pose 1: shocked, both hands on his cheeks, mouth wide open.
Pose 2: facepalm with one hand, the other hand on his belly.
Pose 3: hands on his hips, shoulders down, looking at the floor, defeated.
```
