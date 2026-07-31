import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { CAMERA, CARD } from '../config';

/**
 * Encuadre responsivo.
 *
 * Calcula la distancia necesaria para que la carta ocupe ~70% del alto útil,
 * y la corrige por ancho cuando la pantalla es estrecha (móvil en vertical):
 * la carta queda centrada y completa en cualquier viewport.
 */
export function Camera() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  useLayoutEffect(() => {
    const fov = THREE.MathUtils.degToRad(CAMERA.fov);
    const aspect = size.width / Math.max(size.height, 1);

    // Distancia para encajar por alto.
    const byHeight = CARD.height / CAMERA.fill / 2 / Math.tan(fov / 2);
    // Distancia para encajar por ancho (incluye la holgura de móvil).
    const targetWidth = (CARD.width * CAMERA.portraitPadding) / CAMERA.fill;
    const byWidth = targetWidth / 2 / (Math.tan(fov / 2) * aspect);

    camera.fov = CAMERA.fov;
    camera.near = CAMERA.near;
    camera.far = CAMERA.far;
    camera.aspect = aspect;
    camera.position.set(0, 0, Math.max(byHeight, byWidth));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size]);

  return null;
}
