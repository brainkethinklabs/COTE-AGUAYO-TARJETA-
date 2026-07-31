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
| Arrastrar | Gira la carta en 3D, con inercia al soltar |
| Click / tap | La voltea 180° |

Al soltar, un imán suave la alinea siempre a una de las dos caras.

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
    useCardTilt.ts       inclinación con easing exponencial
    usePointerLight.ts   luz especular que persigue al puntero
  config.ts              único punto de calibración
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
- **Rendimiento.** Un `ShaderMaterial` por cara, un draw call para las
  partículas, tone mapping ACES y bloom en el `EffectComposer`, y `dpr`
  adaptativo vía `PerformanceMonitor`: si el equipo no sostiene 60 FPS baja
  resolución antes que fluidez.

## Publicar en GitHub Pages

```bash
npm run deploy
```

`vite.config.ts` usa `base: './'`, así que el build funciona en cualquier
subdirectorio sin tocar nada.
