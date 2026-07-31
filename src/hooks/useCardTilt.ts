import { useRef } from 'react';
import type { RootState } from '@react-three/fiber';
import { MOTION } from '../config';

export interface TiltState {
  x: number;
  y: number;
}

/** Suavizado exponencial independiente del framerate. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

/**
 * Inclinación de la carta siguiendo el cursor.
 *
 * Nunca supera `MOTION.maxTilt` (15°) y vuelve sola al reposo con easing
 * exponencial, de modo que se lee como un objeto con inercia, no como un
 * elemento enganchado al mouse.
 */
export function useCardTilt() {
  const tilt = useRef<TiltState>({ x: 0, y: 0 });

  /**
   * @param attenuation reduce la inclinación mientras el usuario arrastra:
   *                    en ese momento manda el gesto, no el hover.
   */
  const update = (state: RootState, dt: number, attenuation = 1) => {
    const max = MOTION.maxTilt * attenuation;
    const targetY = state.pointer.x * max;
    const targetX = -state.pointer.y * max;

    tilt.current.x = damp(tilt.current.x, targetX, MOTION.tiltDamping, dt);
    tilt.current.y = damp(tilt.current.y, targetY, MOTION.tiltDamping, dt);
    return tilt.current;
  };

  return { tilt, update };
}
