import { useEffect } from 'react';
import { useDeviceOrientation, type OrientationState } from './useDeviceOrientation';
import type { TiltInput } from './useCardTilt';

/**
 * Fuente única de inclinación: giroscopio si hay, puntero si no.
 *
 * Es un singleton de módulo a propósito. La carta y las luces necesitan el
 * mismo valor, y montar el hook dos veces duplicaría listeners y podría
 * desincronizarlos. Al escribirse desde eventos del DOM (no por frame), no
 * existe ningún problema de orden entre los `useFrame` que lo leen.
 */

const pointer = { x: 0, y: 0 };
const combined: TiltInput = { x: 0, y: 0 };
let orientation: OrientationState | null = null;

/** Instalar una sola vez, en la raíz de la escena. */
export function useTiltInputSource() {
  const gyro = useDeviceOrientation();

  useEffect(() => {
    orientation = gyro.current;

    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      orientation = null;
    };
  }, [gyro]);
}

/** El giroscopio manda en cuanto entrega una lectura; si no, el puntero. */
export function readTiltInput(): TiltInput {
  const source = orientation?.active ? orientation : pointer;
  combined.x = source.x;
  combined.y = source.y;
  return combined;
}

/** true cuando la inclinación viene del sensor del teléfono. */
export function isGyroActive(): boolean {
  return orientation?.active ?? false;
}
