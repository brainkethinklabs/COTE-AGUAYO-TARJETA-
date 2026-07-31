/**
 * Perfil de calidad detectado una sola vez al arrancar.
 *
 * La carta es un objeto a pantalla completa: el coste está casi todo en el
 * fragment shader, así que el número de píxeles (DPR) y las capas de ruido
 * mandan mucho más que la geometría. En móvil se recortan ambos.
 */

export type Tier = 'high' | 'low';

export interface QualitySettings {
  tier: Tier;
  /** Techo de device pixel ratio. */
  maxDpr: number;
  /** Muestras de MSAA en el EffectComposer (0 = desactivado). */
  msaa: number;
  /** Capas de destellos en el shader (2 = más vida, 1 = la mitad de coste). */
  sparkleLayers: 1 | 2;
  /** Filtrado anisotrópico de las texturas. */
  anisotropy: number;
  particles: number;
}

const HIGH: QualitySettings = {
  tier: 'high',
  maxDpr: 2,
  msaa: 4,
  sparkleLayers: 2,
  anisotropy: 16,
  particles: 110,
};

/**
 * Móvil.
 *
 * El DPR es lo único que escala con el cuadrado: a DPR 2 en un iPhone de
 * `devicePixelRatio` 3 se midieron 30 FPS. Vuelve a 1.5, que es el punto
 * donde este shader sostiene 60.
 *
 * Bajar el DPR **no** deshace la ganancia de nitidez: la resolución de la
 * textura y la del render son independientes. Las texturas siguen al doble
 * (1500x2100) y la anisotropía alta, que es lo que evita que la impresión se
 * vea blanda — y ambas cuestan ancho de banda, no fill rate.
 */
const LOW: QualitySettings = {
  tier: 'low',
  maxDpr: 1.5,
  msaa: 0,
  sparkleLayers: 2,
  anisotropy: 8,
  particles: 80,
};

/**
 * Heurística deliberadamente simple: puntero grueso (dedo) o pocos núcleos.
 * No se consulta la GPU porque `WEBGL_debug_renderer_info` está restringido
 * en los navegadores modernos y devolvería una cadena inútil.
 */
export function detectQuality(): QualitySettings {
  if (typeof window === 'undefined') return HIGH;

  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const fewCores = (navigator.hardwareConcurrency ?? 8) <= 4;
  const smallScreen = Math.min(window.screen.width, window.screen.height) <= 820;

  return coarsePointer || fewCores || smallScreen ? LOW : HIGH;
}
