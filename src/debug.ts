/**
 * Estado de movimiento expuesto para `?debug`.
 *
 * Sólo se escribe cuando el modo diagnóstico está activo, así que en uso
 * normal no cuesta nada. Existe para poder verificar la rotación sin depender
 * de mirar la pantalla: en un teléfono ajeno es la única forma de saber si un
 * eje va invertido o si el recorrido se está saturando.
 */

export const DEBUG =
  typeof location !== 'undefined' && location.search.includes('debug');

export interface MotionDebug {
  /** Giro horizontal acumulado, en grados. */
  spin: number;
  /** Inclinación vertical por arrastre, en grados. */
  pitch: number;
  /** Inclinación por puntero/giroscopio, en grados. */
  tiltX: number;
  tiltY: number;
}

export const motionDebug: MotionDebug = { spin: 0, pitch: 0, tiltX: 0, tiltY: 0 };

const DEG = 180 / Math.PI;

export function writeMotionDebug(spin: number, pitch: number, tiltX: number, tiltY: number): void {
  motionDebug.spin = spin * DEG;
  motionDebug.pitch = pitch * DEG;
  motionDebug.tiltX = tiltX * DEG;
  motionDebug.tiltY = tiltY * DEG;
}
