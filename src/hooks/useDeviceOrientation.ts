/** Inclinación del teléfono, ya normalizada a -1..1 como si fuera un puntero. */
export interface OrientationState {
  /** true en cuanto llega la primera lectura utilizable del sensor. */
  active: boolean;
  x: number;
  y: number;
  /** Diagnóstico: por qué el sensor no está funcionando. */
  status: string;
}

/**
 * Grados de inclinación que equivalen al recorrido completo (-1..1).
 * Cuanto menor, más reacciona la carta a un movimiento pequeño del teléfono.
 */
const RANGE_DEG = 20;

/** iOS 13+ exige pedir permiso desde un gesto del usuario. */
type PermissionCapableDOE = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

/** `?debug` en la URL imprime el estado del sensor en consola. */
const DEBUG = typeof location !== 'undefined' && location.search.includes('debug');
const log = (...args: unknown[]) => DEBUG && console.log('[gyro]', ...args);

/**
 * Conecta el giroscopio y vuelca sus lecturas en `state`.
 *
 * Deliberadamente **no** es un hook. Los listeners deben vivir lo que vive la
 * página, y atarlos al ciclo de vida de un componente dentro del `<Canvas>`
 * de R3F resultó frágil: con StrictMode el efecto se monta, se limpia y se
 * vuelve a montar, y la limpieza dejaba el sensor desconectado. Como función
 * idempotente no hay nada que se pueda desincronizar.
 *
 * Decisiones que importan:
 *
 * - **Calibración relativa.** La primera lectura se toma como posición neutra,
 *   así la carta queda de frente sin importar el ángulo en que tengas el
 *   teléfono. Con `beta` absoluto, mirarlo apoyado en una mesa la dejaría
 *   permanentemente volteada.
 * - **Permiso sin UI.** iOS sólo concede el sensor desde un gesto real. Se
 *   escuchan `touchend`, `click` y `pointerup` porque no todas las versiones
 *   aceptan `pointerdown` como activación válida.
 * - **Dos eventos.** Algunos Android sólo emiten `deviceorientationabsolute`.
 */
export function startDeviceOrientation(state: OrientationState): void {
  if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
    state.status = 'sin-DeviceOrientationEvent';
    log(state.status);
    return;
  }

  // El sensor exige contexto seguro. En HTTP los eventos no llegan nunca.
  if (!window.isSecureContext) {
    state.status = 'contexto-inseguro (requiere https)';
    log(state.status);
    return;
  }

  /** Lectura neutra de referencia, fijada en el primer evento válido. */
  let origin: { beta: number; gamma: number } | null = null;

  const onOrientation = (e: DeviceOrientationEvent) => {
    if (e.beta === null || e.gamma === null) {
      if (state.status !== 'eventos-sin-datos') {
        state.status = 'eventos-sin-datos';
        log(state.status, e.type);
      }
      return;
    }

    if (!origin) {
      origin = { beta: e.beta, gamma: e.gamma };
      state.active = true;
      state.status = `activo (${e.type})`;
      log(state.status, 'origen', origin);
      return;
    }

    let dBeta = e.beta - origin.beta;
    let dGamma = e.gamma - origin.gamma;

    // Con el teléfono en horizontal los ejes del sensor rotan con él.
    const angle = window.screen?.orientation?.angle ?? 0;
    if (angle === 90) [dBeta, dGamma] = [-dGamma, dBeta];
    else if (angle === 270 || angle === -90) [dBeta, dGamma] = [dGamma, -dBeta];
    else if (angle === 180) [dBeta, dGamma] = [-dBeta, -dGamma];

    state.x = clamp(dGamma / RANGE_DEG, -1, 1);
    state.y = clamp(-dBeta / RANGE_DEG, -1, 1);
  };

  const listen = () => {
    window.addEventListener('deviceorientation', onOrientation as EventListener);
    window.addEventListener('deviceorientationabsolute', onOrientation as EventListener);
    state.status = 'escuchando';
    log(state.status);

    // Si en 2 s no llegó nada, el equipo no tiene sensor (típico escritorio).
    window.setTimeout(() => {
      if (!state.active) {
        state.status = 'sin-sensor (no llegaron eventos)';
        log(state.status);
      }
    }, 2000);
  };

  const request = (DeviceOrientationEvent as PermissionCapableDOE).requestPermission;

  if (typeof request !== 'function') {
    // Android y escritorio con sensor: no requiere permiso explícito.
    state.status = 'sin-permiso-requerido';
    log(state.status);
    listen();
    return;
  }

  // iOS: hay que esperar a un gesto del usuario.
  state.status = 'esperando-gesto (iOS)';
  log(state.status);

  let granted = false;
  let inFlight = false;

  /**
   * Sólo `touchend` y `click`. `pointerup` NO cuenta como activación válida
   * en iOS: pedir el permiso desde ahí devuelve NotAllowedError. Y si se
   * marcase el intento como consumido, se quemaría la única oportunidad —
   * por eso aquí se reintenta en cada gesto hasta conseguirlo. En un tap,
   * `click` llega justo después de `touchend`, así que el reintento suele
   * ocurrir dentro del mismo toque.
   */
  const gestureTypes = ['touchend', 'click'];

  const onGesture = () => {
    if (granted || inFlight) return;
    inFlight = true;

    request()
      .then((result) => {
        inFlight = false;
        state.status = `permiso: ${result}`;
        log(state.status);
        if (result === 'granted') {
          granted = true;
          gestureTypes.forEach((t) => window.removeEventListener(t, onGesture));
          listen();
        }
      })
      .catch((err) => {
        inFlight = false;
        state.status = `reintentando permiso (${String(err).slice(0, 40)})`;
        log(state.status);
      });
  };

  gestureTypes.forEach((t) => window.addEventListener(t, onGesture));
}
