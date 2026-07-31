import { useRef } from 'react';
import { MOTION } from '../config';

export interface TiltState {
  /** Rotación en radianes. */
  x: number;
  y: number;
  /**
   * La misma entrada ya suavizada, en -1..1, pero con su propio retardo.
   * Alimenta el desplazamiento: al ir más lenta que la rotación, la carta
   * parece arrastrar su propia masa en lugar de teletransportarse.
   */
  px: number;
  py: number;
}

/** Entrada normalizada -1..1: puntero en escritorio, giroscopio en móvil. */
export interface TiltInput {
  x: number;
  y: number;
}

/** Suavizado exponencial independiente del framerate. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

/**
 * Inclinación de la carta siguiendo el cursor o el giroscopio.
 *
 * Vuelve sola al reposo con easing exponencial, de modo que se lee como un
 * objeto con inercia y no como un elemento enganchado al puntero.
 */
export function useCardTilt() {
  const tilt = useRef<TiltState>({ x: 0, y: 0, px: 0, py: 0 });
  /** Entrada suavizada, previa al reparto entre rotación y traslación. */
  const smooth = useRef({ x: 0, y: 0 });

  /**
   * @param attenuation reduce la inclinación mientras el usuario arrastra:
   *                    en ese momento manda el gesto, no el hover.
   * @param boost       amplía el recorrido cuando la fuente es el giroscopio.
   */
  const update = (input: TiltInput, dt: number, attenuation = 1, boost = 1) => {
    const s = smooth.current;
    s.x = damp(s.x, input.x, MOTION.tiltDamping, dt);
    s.y = damp(s.y, input.y, MOTION.tiltDamping, dt);

    const max = MOTION.maxTilt * attenuation * boost;
    const t = tilt.current;
    t.y = s.x * max;
    t.x = -s.y * max;

    t.px = damp(t.px, s.x, MOTION.parallaxDamping, dt);
    t.py = damp(t.py, s.y, MOTION.parallaxDamping, dt);

    return t;
  };

  return { tilt, update };
}
