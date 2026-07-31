# Carta holográfica — José Tomás (Cote) Aguayo

Visor 3D de una única carta coleccionable. No es un sitio, no es una landing:
sólo la carta, flotando sobre negro absoluto.

## Correr

```bash
npm install
```

```bash
npm run dev
```

## Interacción

| Gesto | Resultado |
| --- | --- |
| Mover el cursor | La carta se inclina (máx. 15°) y la luz recorre el foil |
| Inclinar el teléfono | Igual que el cursor, vía giroscopio |
| Arrastrar en horizontal | Giro de 360°, con inercia; es como se llega al reverso |
| Arrastrar en vertical | Asoma por arriba o por abajo (máx. 50°) y vuelve al frente |
| Click / tap | La voltea 180° |

Los dos ejes se comportan distinto a propósito. El horizontal da la vuelta
completa, con un imán suave que al soltar alinea siempre a una de las dos
caras. El vertical está acotado y tiene retorno elástico: una carta no se mira
de canto ni cabeza abajo, así que asomarse aporta volumen pero el frente
siempre vuelve a estar de cara.

Con `?debug` en la URL aparece un panel con FPS, perfil de calidad, estado del
sensor y ángulos actuales. Sin ese parámetro no existe ningún elemento de
interfaz.

En iOS el sensor sólo se concede tras un gesto real del usuario, así que el
permiso se pide en el primer toque sobre la carta — el mismo que ya la voltea.
No hace falta ningún botón. Si se deniega, todo sigue funcionando con el dedo.
La calibración es relativa a la primera lectura: la carta queda de frente sea
cual sea el ángulo en que sostengas el teléfono.

## Arquitectura

```
src/
  components/Card/
    Card.tsx             orquestador: flotación, giro, entrada
    CardFront.tsx        anverso
    CardBack.tsx         reverso
    CardFace.tsx         cara compartida (geometría + material)
    CardMaterial.ts      ShaderMaterial holográfico + material del canto
    CardGlow.tsx         halo aditivo detrás de la carta
    CardParticles.tsx    motas de energía (1 draw call, animadas en GPU)
    CardReflection.tsx   sombra de contacto difusa
    CardInteraction.ts   arrastre, inercia, volteo y magnetismo
    geometry.ts          contorno redondeado, cuerpo extruido, meseta
  shaders/
    lib.glsl             ruido, espectro, GGX acotado
    foil.glsl            thin-film iridiscente + reflexión anisotrópica
    sparkles.glsl        destellos de diamante desincronizados
    holographic.glsl     fragmento de las caras
    card.vert.glsl       vértice de las caras (alabeo + base tangente)
    particles.*.glsl     partículas
  scene/
    Scene.tsx            composición + postproceso
    Camera.tsx           encuadre responsivo (~70% del alto)
    Lights.tsx           key / fill / rim + luz que sigue al cursor
    Environment.tsx      HDRI procedural (sin descargas)
  hooks/
    useCardTilt.ts          inclinación con easing exponencial
    usePointerLight.ts      luz especular que persigue al puntero
    useDeviceOrientation.ts giroscopio, con permiso iOS y calibración relativa
    useTiltInput.ts         fuente única: giroscopio si hay, puntero si no
  config.ts                 único punto de calibración
  quality.ts                perfil alto/bajo detectado al arrancar
scripts/
  optimize-textures.mjs     PNG -> WebP (se corre a mano)
```

### Decisiones técnicas

- **La carta es un objeto, no una imagen.** Cuerpo extruido con bisel y canto
  metálico (`MeshPhysicalMaterial`) + dos caras impresas que se apoyan sobre la
  meseta que deja el bisel. Las caras se recortan al contorno redondeado con un
  SDF en el fragment shader, lo que da un borde antialiaseado exacto.
- **El foil se enmascara con la propia textura.** La máscara sale de luminancia
  alta + croma bajo, así el arcoíris vive en el marco y los diamantes y no
  contamina el retrato. Sin ese enmascarado, sumar iridiscencia sobre las zonas
  negras tiñe la carta entera de un color plano.
- **Iluminación compartida.** `LIGHT_RIG` alimenta a la vez las luces reales de
  la escena y los uniformes del shader, para que canto y foil no se contradigan.
- **Sin assets externos.** El entorno HDRI se cocina en GPU con `Lightformer` y
  `frames={1}`: cero descargas, cero red. Todo el build es estático.
- **Rendimiento.** El coste está casi todo en el fragment shader, no en la
  geometría: la carta ocupa media pantalla y cada píxel paga foil, ruido y
  destellos. Por eso lo que se recorta en móvil es el número de píxeles y las
  capas de ruido, no los triángulos.

| | Escritorio | Móvil |
| --- | --- | --- |
| DPR máximo | 2 | 1.5 |
| MSAA | 4x | 0 (sólo SMAA) |
| Sombra de contacto | sí | no |
| Capas de destellos | 2 | 1 |
| Partículas | 110 | 70 |

  La sombra de contacto es lo primero que cae: re-renderiza la escena entera
  cada frame para un efecto que sobre negro casi no se lee. Las capas de
  destellos son un `#define`, así que no cuestan una rama por píxel.

  En el shader, `fbm` bajó de 3 a 2 octavas, el micro-relieve del barniz pasó
  de dos `fbm` (24 hashes) a un `vnoise2` (4), y los destellos se saltan por
  completo donde la máscara de facetas es cero.

- **Texturas en WebP.** 2.48 MB de PNG a 0.36 MB (−85%) sin diferencia visible.
  Era el mayor coste de carga en móvil.

## Publicar en GitHub Pages

```bash
npm run deploy
```

`vite.config.ts` usa `base: './'`, así que el build funciona en cualquier
subdirectorio sin tocar nada.
