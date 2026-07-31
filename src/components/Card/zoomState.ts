import { ZOOM } from '../../config';

/**
 * Nivel de zoom, compartido entre el gesto, la cámara y los materiales.
 *
 * `target` lo escribe la interacción; `current` lo persigue con suavizado.
 * No vuelve solo a 1: el zoom es un estado, no un gesto momentáneo — la
 * carta se queda del tamaño en que la dejes.
 */
export const zoomState = {
  target: 1,
  current: 1,
};

export const clampZoom = (v: number) => Math.min(Math.max(v, ZOOM.min), ZOOM.max);

/**
 * 1 cuando la carta se ve completa, 0 cuando estás encima.
 * Apaga brillo y partículas a medida que te acercás a mirar el detalle.
 */
export function detailFade(): number {
  const t = (zoomState.current - ZOOM.fadeStart) / (ZOOM.fadeEnd - ZOOM.fadeStart);
  const s = Math.min(Math.max(t, 0), 1);
  // smoothstep
  return 1 - s * s * (3 - 2 * s);
}
