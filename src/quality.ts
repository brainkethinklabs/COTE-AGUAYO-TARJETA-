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
  anisotropy: 16,
  particles: 110,
};

/**
 * Móvil. El DPR sube a 2 — es lo que más define la nitidez percibida, y el
 * presupuesto lo permite tras aligerar el shader y quitar la sombra. Si aun
 * así no llega a 60 FPS, `PerformanceMonitor` lo baja en caliente.
 * El filtrado anisotrópico se mantiene alto: cuesta muy poco y es
 * justamente lo que salva la textura cuando la carta se inclina.
 */
const LOW: QualitySettings = {
  tier: 'low',
  maxDpr: 2,
  msaa: 0,
  contactShadows: false,
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
