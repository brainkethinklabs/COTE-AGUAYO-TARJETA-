import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { CAMERA, CARD, ZOOM } from '../config';
import { zoomState } from '../components/Card/zoomState';
import { damp } from '../hooks/useCardTilt';

/**
 * Encuadre responsivo y zoom.
 *
 * La distancia base hace que la carta ocupe ~70% del alto útil, corregida por
 * ancho cuando la pantalla es estrecha (móvil en vertical). El zoom divide esa
 * distancia: se acerca la cámara de verdad, en lugar de escalar la carta, así
 * la perspectiva se abre y el objeto se siente físico al mirarlo de cerca.
 */
export function Camera() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const baseDistance = useRef(9);

  useLayoutEffect(() => {
    const fov = THREE.MathUtils.degToRad(CAMERA.fov);
    const aspect = size.width / Math.max(size.height, 1);

    // Distancia para encajar por alto.
    const byHeight = CARD.height / CAMERA.fill / 2 / Math.tan(fov / 2);
    // Distancia para encajar por ancho (incluye la holgura de móvil).
    const targetWidth = (CARD.width * CAMERA.portraitPadding) / CAMERA.fill;
    const byWidth = targetWidth / 2 / (Math.tan(fov / 2) * aspect);

    baseDistance.current = Math.max(byHeight, byWidth);

    camera.fov = CAMERA.fov;
    camera.near = CAMERA.near;
    camera.far = CAMERA.far;
    camera.aspect = aspect;
    camera.position.set(0, 0, baseDistance.current / zoomState.current);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    zoomState.current = damp(zoomState.current, zoomState.target, ZOOM.damping, dt);
    camera.position.z = baseDistance.current / zoomState.current;
  });

  return null;
}
