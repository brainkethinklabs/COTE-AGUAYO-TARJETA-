import { useRef } from 'react';
import * as THREE from 'three';
import type { RootState } from '@react-three/fiber';
import { damp } from './useCardTilt';

/** Distancia de la luz por delante del plano de la carta. */
const LIGHT_DEPTH = 4.2;
/** Amplitud del recorrido lateral/vertical de la luz. */
const LIGHT_SPREAD = new THREE.Vector2(5.5, 4.0);

/**
 * Luz especular que persigue al cursor.
 *
 * Es la responsable de que el foil "se encienda" bajo el puntero: sin ella
 * la iridiscencia sólo respondería a la rotación y se sentiría pregrabada.
 */
export function usePointerLight() {
  const position = useRef(new THREE.Vector3(0, 0, LIGHT_DEPTH));

  const update = (state: RootState, dt: number) => {
    const p = position.current;
    p.x = damp(p.x, state.pointer.x * LIGHT_SPREAD.x, 4.0, dt);
    p.y = damp(p.y, state.pointer.y * LIGHT_SPREAD.y, 4.0, dt);
    p.z = LIGHT_DEPTH;
    return p;
  };

  return { position, update };
}
