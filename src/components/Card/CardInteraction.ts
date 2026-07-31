import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { MOTION } from '../../config';

export interface SpinState {
  /** Rotación acumulada en Y, en radianes (no se normaliza: alimenta el foil). */
  spin: number;
  velocity: number;
  dragging: boolean;
}

/**
 * Gesto de la carta: arrastrar para girarla en 3D, tocar para voltearla.
 *
 * - Arrastre 1:1 con el puntero, con inercia al soltar.
 * - Imán suave que la alinea siempre a una cara (múltiplos de 180°).
 * - Un tap sin desplazamiento = giro de 180°, como dar vuelta una carta real.
 *
 * No hay botones ni HUD: el objeto es la interfaz.
 */
export function useCardInteraction() {
  const domElement = useThree((s) => s.gl.domElement);
  const state = useRef<SpinState>({ spin: 0, velocity: 0, dragging: false });

  useEffect(() => {
    const s = state.current;
    let pointerId: number | null = null;
    let lastX = 0;
    let travelled = 0;
    let lastTime = 0;

    const onDown = (e: PointerEvent) => {
      if (pointerId !== null) return;
      pointerId = e.pointerId;
      domElement.setPointerCapture(e.pointerId);
      s.dragging = true;
      s.velocity = 0;
      lastX = e.clientX;
      travelled = 0;
      lastTime = performance.now();
    };

    const onMove = (e: PointerEvent) => {
      if (pointerId !== e.pointerId) return;
      const now = performance.now();
      const dt = Math.max((now - lastTime) / 1000, 1 / 240);
      const dx = e.clientX - lastX;

      s.spin += dx * MOTION.dragSensitivity;
      // Velocidad instantánea suavizada: alimenta la inercia al soltar.
      s.velocity = (s.velocity + (dx * MOTION.dragSensitivity) / dt) * 0.5;

      travelled += Math.abs(dx);
      lastX = e.clientX;
      lastTime = now;
    };

    const onUp = (e: PointerEvent) => {
      if (pointerId !== e.pointerId) return;
      if (domElement.hasPointerCapture(e.pointerId)) {
        domElement.releasePointerCapture(e.pointerId);
      }
      pointerId = null;
      s.dragging = false;

      // Gesto corto = intención de voltear, no de girar.
      if (travelled < MOTION.tapThreshold) {
        s.velocity = 0;
        s.spin += Math.PI;
      }
    };

    domElement.addEventListener('pointerdown', onDown);
    domElement.addEventListener('pointermove', onMove);
    domElement.addEventListener('pointerup', onUp);
    domElement.addEventListener('pointercancel', onUp);

    return () => {
      domElement.removeEventListener('pointerdown', onDown);
      domElement.removeEventListener('pointermove', onMove);
      domElement.removeEventListener('pointerup', onUp);
      domElement.removeEventListener('pointercancel', onUp);
    };
  }, [domElement]);

  /** Integra inercia y magnetismo hacia la cara más cercana. */
  const update = (dt: number) => {
    const s = state.current;
    if (s.dragging) return s;

    s.spin += s.velocity * dt;
    s.velocity *= Math.exp(-MOTION.inertiaFriction * dt);

    // El imán sólo actúa cuando el giro ya perdió energía: si no, frenaría
    // el gesto y se sentiría pegajoso.
    const settle = 1 - Math.min(Math.abs(s.velocity) / 2.5, 1);
    if (settle > 0) {
      const nearest = Math.round(s.spin / Math.PI) * Math.PI;
      s.spin += (nearest - s.spin) * (1 - Math.exp(-MOTION.snapStrength * settle * dt));
    }

    if (Math.abs(s.velocity) < 1e-3) s.velocity = 0;
    return s;
  };

  return { state, update };
}
