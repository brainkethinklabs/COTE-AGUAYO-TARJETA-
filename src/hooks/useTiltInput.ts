import { startDeviceOrientation, type OrientationState } from './useDeviceOrientation';
import type { TiltInput } from './useCardTilt';

/**
 * Fuente única de inclinación: giroscopio si hay, puntero si no.
 *
 * Vive fuera de React a propósito. La carta y las luces necesitan el mismo
 * valor, y una versión anterior lo ataba a un `useEffect` dentro del
 * `<Canvas>`: con StrictMode el ciclo montar → limpiar → montar dejaba la
 * referencia en `null` y el giroscopio no se leía nunca. Al ser un singleton
 * de módulo con instalación idempotente no hay ciclo de vida que romper, y al
 * escribirse desde eventos del DOM tampoco hay orden entre `useFrame`.
 */

const pointer = { x: 0, y: 0 };
const combined: TiltInput = { x: 0, y: 0 };

const gyro: OrientationState = { active: false, x: 0, y: 0, status: 'sin-instalar' };

let installed = false;

/** Idempotente: se puede llamar desde donde sea, cuantas veces sea. */
export function installTiltInput(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  window.addEventListener(
    'pointermove',
    (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    },
    { passive: true },
  );

  startDeviceOrientation(gyro);
}

// Se instala al importar: el visor es una sola página y los listeners deben
// vivir exactamente lo mismo que ella.
installTiltInput();

/** El giroscopio manda en cuanto entrega una lectura; si no, el puntero. */
export function readTiltInput(): TiltInput {
  const source = gyro.active ? gyro : pointer;
  combined.x = source.x;
  combined.y = source.y;
  return combined;
}

/** true cuando la inclinación viene del sensor del teléfono. */
export function isGyroActive(): boolean {
  return gyro.active;
}

/** Estado del sensor, para el panel de `?debug`. */
export function readGyroDiagnostics() {
  return {
    active: gyro.active,
    status: gyro.status,
    x: gyro.x,
    y: gyro.y,
    pointerX: pointer.x,
    pointerY: pointer.y,
  };
}
