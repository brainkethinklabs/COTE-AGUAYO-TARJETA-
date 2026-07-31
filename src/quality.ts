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
  particles: 150,
};

/**
 * Móvil.
 *
 * El DPR sube a 2. Hubo una medición de 30 FPS a ese nivel, pero es anterior
 * a quitar el Bloom y el tone mapping: el bloom era un blur multi-pase sobre
 * el buffer HDR a resolución completa, con diferencia el pase más caro. Al
 * pasar a fondo blanco desapareció y ese presupuesto quedó libre.
 *
 * De todas formas no se apuesta a ciegas: el DPR arranca aquí y
 * `PerformanceMonitor` lo baja por escalones si el equipo no sostiene 60.
 *
 * Sin MSAA a propósito: la silueta de la carta se recorta con un SDF en el
 * shader, que ya entrega bordes suavizados, así que el multisampling
 * apenas aportaría sobre el coste que tiene. SMAA cubre el resto.
 */
const LOW: QualitySettings = {
  tier: 'low',
  maxDpr: 2,
  msaa: 0,
  sparkleLayers: 2,
  // Prácticamente gratis y es justo lo que salva la textura al inclinarse.
  anisotropy: 16,
  particles: 110,
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
