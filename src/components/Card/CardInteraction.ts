import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { MOTION, ZOOM } from '../../config';
import { zoomState, clampZoom } from './zoomState';

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

export interface SpinState {
  /** Rotación acumulada en Y, en radianes (no se normaliza: alimenta el foil). */
  spin: number;
  velocity: number;
  /** Inclinación vertical acotada; vuelve sola a 0 al soltar. */
  pitch: number;
  dragging: boolean;
}

/**
 * Gesto de la carta: arrastrar para girarla en 3D, tocar para voltearla.
 *
 * Los dos ejes se comportan distinto a propósito:
 *
 * - **Horizontal**: 360° completos y libres, con inercia. Es el eje por el
 *   que se llega al reverso, igual que al girar una carta en la mano.
 * - **Vertical**: acotado a ±50° y con retorno elástico al frente. Una carta
 *   no se mira de canto ni cabeza abajo; asomarse por arriba o por abajo da
 *   volumen, pero el frente siempre vuelve a estar de cara.
 *
 * El zoom se hace con dos dedos o con la rueda, y **se queda donde lo dejes**:
 * es un estado, no un gesto momentáneo.
 *
 * No hay botones ni HUD: el objeto es la interfaz.
 */
export function useCardInteraction() {
  const domElement = useThree((s) => s.gl.domElement);
  const state = useRef<SpinState>({ spin: 0, velocity: 0, pitch: 0, dragging: false });

  useEffect(() => {
    const s = state.current;
    let pointerId: number | null = null;
    let lastX = 0;
    let lastY = 0;
    let travelled = 0;
    let lastTime = 0;

    /** Punteros activos, para distinguir arrastre de pellizco. */
    const active = new Map<number, { x: number; y: number }>();
    let pinchStartDistance = 0;
    let pinchStartZoom = 1;
    /** Si hubo pellizco, al soltar no se debe voltear la carta. */
    let pinched = false;

    const distanceBetweenPointers = () => {
      const [a, b] = [...active.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };

    const onDown = (e: PointerEvent) => {
      active.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (active.size >= 2) {
        // Empieza el pellizco: el arrastre cede el paso.
        s.dragging = false;
        s.velocity = 0;
        pointerId = null;
        pinched = true;
        pinchStartDistance = distanceBetweenPointers();
        pinchStartZoom = zoomState.target;
        return;
      }

      if (pointerId !== null) return;
      pointerId = e.pointerId;
      domElement.setPointerCapture(e.pointerId);
      s.dragging = true;
      s.velocity = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      travelled = 0;
      pinched = false;
      lastTime = performance.now();
    };

    const onMove = (e: PointerEvent) => {
      if (active.has(e.pointerId)) {
        active.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      if (active.size >= 2) {
        const d = distanceBetweenPointers();
        if (pinchStartDistance > 0) {
          zoomState.target = clampZoom(pinchStartZoom * (d / pinchStartDistance));
        }
        return;
      }

      if (pointerId !== e.pointerId) return;
      const now = performance.now();
      const dt = Math.max((now - lastTime) / 1000, 1 / 240);
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;

      s.spin += dx * MOTION.dragSensitivity;
      // Velocidad instantánea suavizada: alimenta la inercia al soltar.
      s.velocity = (s.velocity + (dx * MOTION.dragSensitivity) / dt) * 0.5;

      // Arrastrar hacia abajo asoma la parte superior de la carta.
      s.pitch = clamp(
        s.pitch + dy * MOTION.pitchSensitivity,
        -MOTION.maxPitch,
        MOTION.maxPitch,
      );

      travelled += Math.abs(dx) + Math.abs(dy);
      lastX = e.clientX;
      lastY = e.clientY;
      lastTime = now;
    };

    const onUp = (e: PointerEvent) => {
      active.delete(e.pointerId);

      // Al levantar un dedo del pellizco, el otro no debe heredar el arrastre.
      if (active.size < 2) pinchStartDistance = 0;

      if (pointerId !== e.pointerId) return;
      if (domElement.hasPointerCapture(e.pointerId)) {
        domElement.releasePointerCapture(e.pointerId);
      }
      pointerId = null;
      s.dragging = false;

      // Gesto corto = intención de voltear, no de girar. Tras un pellizco no
      // cuenta: soltar el zoom no es tocar la carta.
      if (!pinched && travelled < MOTION.tapThreshold) {
        s.velocity = 0;
        s.spin += Math.PI;
      }
    };

    /** Rueda del ratón: exponencial, para que cada paso se sienta igual. */
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomState.target = clampZoom(
        zoomState.target * Math.exp(-e.deltaY * ZOOM.wheelSensitivity),
      );
    };

    domElement.addEventListener('pointerdown', onDown);
    domElement.addEventListener('pointermove', onMove);
    domElement.addEventListener('pointerup', onUp);
    domElement.addEventListener('pointercancel', onUp);
    // passive: false — hay que impedir el zoom de la página.
    domElement.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      domElement.removeEventListener('pointerdown', onDown);
      domElement.removeEventListener('pointermove', onMove);
      domElement.removeEventListener('pointerup', onUp);
      domElement.removeEventListener('pointercancel', onUp);
      domElement.removeEventListener('wheel', onWheel);
    };
  }, [domElement]);

  /** Integra inercia, magnetismo hacia la cara más cercana y retorno vertical. */
  const update = (dt: number) => {
    const s = state.current;
    if (s.dragging) return s;

    // El eje vertical siempre vuelve al frente, sin inercia: no debe quedarse
    // "colgado" en un ángulo raro después de soltar.
    s.pitch *= Math.exp(-MOTION.pitchReturn * dt);
    if (Math.abs(s.pitch) < 1e-4) s.pitch = 0;

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
