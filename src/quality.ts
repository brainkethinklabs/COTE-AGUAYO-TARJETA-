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
  /** La sombra de contacto re-renderiza la escena cada frame: cara en móvil. */
  contactShadows: boolean;
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
  contactShadows: true,
  sparkleLayers: 2,
  anisotropy: 8,
  particles: 110,
};

const LOW: QualitySettings = {
  tier: 'low',
  maxDpr: 1.5,
  msaa: 0,
  contactShadows: false,
  sparkleLayers: 1,
  anisotropy: 4,
  particles: 70,
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
