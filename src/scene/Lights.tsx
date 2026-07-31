import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { LIGHT_RIG } from '../components/Card/CardMaterial';
import { usePointerLight } from '../hooks/usePointerLight';
import { readTiltInput } from '../hooks/useTiltInput';

/**
 * Esquema de tres puntos.
 *
 * Las mismas posiciones y colores viajan como uniformes al shader holográfico
 * (`LIGHT_RIG`), de modo que canto metálico y foil comparten una única
 * intención de iluminación en lugar de contradecirse.
 */
export function Lights() {
  const pointer = useRef<THREE.PointLight>(null!);
  const { update } = usePointerLight();

  useFrame((_, delta) => {
    const p = update(readTiltInput(), Math.min(delta, 1 / 30));
    pointer.current.position.copy(p);
  });

  return (
    <>
      {/* Ambiente mínimo: la carta no debe morir en negro absoluto. */}
      <ambientLight intensity={0.35} color="#8ea6ff" />

      {/* Key: define el volumen y enciende el foil. */}
      <pointLight
        position={LIGHT_RIG.key.position}
        color={LIGHT_RIG.key.color}
        intensity={38}
        distance={30}
        decay={2}
      />

      {/* Fill: azul frío, abre las sombras sin plancharlas. */}
      <pointLight
        position={LIGHT_RIG.fill.position}
        color={LIGHT_RIG.fill.color}
        intensity={16}
        distance={30}
        decay={2}
      />

      {/* Rim: separa el canto del fondo por detrás. */}
      <pointLight
        position={LIGHT_RIG.rim.position}
        color={LIGHT_RIG.rim.color}
        intensity={26}
        distance={30}
        decay={2}
      />

      {/* Luz que sigue al cursor: hace vivir los diamantes del marco. */}
      <pointLight ref={pointer} color="#fff0d8" intensity={22} distance={26} decay={2} />
    </>
  );
}
