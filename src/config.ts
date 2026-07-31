/**
 * Constantes de la experiencia.
 * Único punto de calibración: geometría, cámara, movimiento e intensidades.
 * Nada de números mágicos repartidos por los componentes.
 */

/** Proporción real de una carta coleccionable (2.5" x 3.5"). */
export const CARD = {
  width: 2.5,
  height: 3.5,
  /** Espesor físico del cartón + laminado. */
  thickness: 0.045,
  /** Radio de las esquinas redondeadas. */
  radius: 0.13,
  /** Bisel del canto metálico. */
  bevel: 0.012,
} as const;

export const CAMERA = {
  fov: 32,
  near: 0.1,
  far: 60,
  /** La carta ocupa ~70% del alto útil de pantalla. */
  fill: 0.7,
  /** Margen extra en móvil para que nunca quede cortada. */
  portraitPadding: 1.06,
} as const;

export const MOTION = {
  /** Flotación: amplitud vertical en unidades de mundo (~3px en pantalla). */
  floatAmplitude: 0.045,
  floatSpeed: 0.55,
  /** Balanceo de reposo: menos de 1 grado. */
  breathTilt: 0.014,
  breathSpeed: 0.37,
  /** Inclinación máxima siguiendo el cursor (15°). */
  maxTilt: Math.PI / 12,
  /**
   * Con giroscopio la inclinación se amplía a ~26°. En el teléfono el gesto
   * es el propio aparato: si la carta respondiera con el mismo recorrido que
   * el mouse, el movimiento se leería como si estuviera pegada a la pantalla.
   */
  gyroTiltBoost: 1.75,
  /** Suavizado exponencial (mayor = más rápido). */
  tiltDamping: 3.2,
  /**
   * Desplazamiento lateral de la carta hacia el lado al que inclinás.
   * Es lo que delata que el objeto flota por delante del fondo.
   */
  parallax: 0.3,
  /** Más lento que la inclinación: la traslación llega tarde y da peso. */
  parallaxDamping: 2.0,
  /** Sensibilidad del arrastre: radianes por pixel. */
  dragSensitivity: 0.0085,
  /** Arrastre vertical: algo menos sensible, el recorrido es más corto. */
  pitchSensitivity: 0.006,
  /**
   * Tope de inclinación vertical (50°). El eje vertical NO da la vuelta:
   * la carta se asoma por arriba o por abajo, pero siempre vuelve al frente.
   * Sólo el eje horizontal completa los 360° hacia el reverso.
   */
  maxPitch: Math.PI / 3.6,
  /** Fuerza con la que el eje vertical regresa al frente al soltar. */
  pitchReturn: 3.4,
  /** Fricción de la inercia tras soltar. */
  inertiaFriction: 3.6,
  /** Fuerza del imán que alinea la carta a la cara más cercana. */
  snapStrength: 4.5,
  /** Umbral de pixeles bajo el cual el gesto se considera "click" (voltear). */
  tapThreshold: 6,
} as const;

export const INTRO = {
  /** Duración de la animación de entrada en segundos. */
  duration: 2.2,
  scaleFrom: 0.9,
} as const;

export const HOLO = {
  /** Intensidad global del foil iridiscente. */
  foil: 1.0,
  /** Velocidad de deriva de la iridiscencia. */
  foilSpeed: 0.06,
  /** Frecuencia del thin-film (cuántas bandas espectrales por ángulo). */
  filmScale: 5.5,
  /** Reflejos anisotrópicos (rayado del laminado). */
  anisotropy: 0.55,
  /** Densidad de la rejilla de destellos de diamante. */
  sparkleDensity: 190.0,
  /** Barrido de luz (light sweep) al girar. */
  sweepWidth: 0.11,
  sweepIntensity: 0.5,
} as const;

export const ZOOM = {
  /** Algo más lejos que el encuadre base, por si se quiere ver entera. */
  min: 0.8,
  /** 3.5x: suficiente para leer la letra pequeña del reverso. */
  max: 3.5,
  /** Rueda del ratón: factor de zoom por unidad de scroll. */
  wheelSensitivity: 0.0018,
  /** Suavizado del acercamiento. No hay rebote: el zoom se queda donde lo dejás. */
  damping: 8,
  /**
   * A partir de aquí el laminado se apaga. Acercarse es querer ver el
   * detalle impreso, y el reflejo es justo lo que lo tapa.
   */
  fadeStart: 1.15,
  fadeEnd: 2.3,
} as const;

export const PARTICLES = {
  count: 150,
  radius: 3.4,
  speed: 0.055,
  size: 26,
} as const;
