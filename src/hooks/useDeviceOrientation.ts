import { useEffect, useRef } from 'react';

/** Inclinación del teléfono, ya normalizada a -1..1 como si fuera un puntero. */
export interface OrientationState {
  /** true en cuanto llega la primera lectura utilizable del sensor. */
  active: boolean;
  x: number;
  y: number;
}

/** Grados de inclinación que equivalen al recorrido completo (-1..1). */
const RANGE_DEG = 32;

/** iOS 13+ exige pedir permiso desde un gesto del usuario. */
type PermissionCapableDOE = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

/**
 * Giroscopio: la carta reacciona a cómo sostenés el teléfono.
 *
 * Dos decisiones que importan:
 *
 * - **Calibración relativa.** La primera lectura se toma como posición neutra,
 *   así la carta queda de frente sin importar el ángulo en que tengas el
 *   teléfono. Si se usara `beta` en absoluto, mirar el teléfono acostado en
 *   una mesa dejaría la carta permanentemente volteada.
 * - **Permiso sin UI.** iOS sólo concede el sensor desde un gesto real, así
 *   que el permiso se pide en el primer toque sobre el canvas — el mismo que
 *   ya voltea la carta. No hace falta añadir ningún botón a la escena.
 */
export function useDeviceOrientation() {
  const state = useRef<OrientationState>({ active: false, x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) return;

    const s = state.current;
    /** Lectura neutra de referencia, fijada en el primer evento válido. */
    let origin: { beta: number; gamma: number } | null = null;
    let detach: (() => void) | null = null;

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;

      if (!origin) {
        origin = { beta: e.beta, gamma: e.gamma };
        s.active = true;
        return;
      }

      let dBeta = e.beta - origin.beta;
      let dGamma = e.gamma - origin.gamma;

      // Con el teléfono en horizontal los ejes del sensor rotan con él.
      const angle = window.screen?.orientation?.angle ?? 0;
      if (angle === 90) [dBeta, dGamma] = [-dGamma, dBeta];
      else if (angle === 270 || angle === -90) [dBeta, dGamma] = [dGamma, -dBeta];
      else if (angle === 180) [dBeta, dGamma] = [-dBeta, -dGamma];

      s.x = clamp(dGamma / RANGE_DEG, -1, 1);
      s.y = clamp(-dBeta / RANGE_DEG, -1, 1);
    };

    const listen = () => {
      window.addEventListener('deviceorientation', onOrientation);
      detach = () => window.removeEventListener('deviceorientation', onOrientation);
    };

    const request = (DeviceOrientationEvent as PermissionCapableDOE).requestPermission;

    if (typeof request === 'function') {
      // iOS: hay que esperar a un gesto. El primer toque sirve de disparador.
      const onGesture = () => {
        window.removeEventListener('pointerdown', onGesture);
        request()
          .then((result) => {
            if (result === 'granted') listen();
          })
          // Permiso denegado o contexto inseguro: se sigue con el puntero.
          .catch(() => undefined);
      };
      window.addEventListener('pointerdown', onGesture, { once: true });
      return () => {
        window.removeEventListener('pointerdown', onGesture);
        detach?.();
      };
    }

    // Android y escritorio con sensor: no requiere permiso explícito.
    listen();
    return () => detach?.();
  }, []);

  return state;
}
