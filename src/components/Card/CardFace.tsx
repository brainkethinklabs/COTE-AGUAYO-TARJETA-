import { useMemo } from 'react';
import { FACE, createCardFaceGeometry } from './geometry';
import type { HolographicMaterial } from './CardMaterial';

interface CardFaceProps {
  material: HolographicMaterial;
  /** Cara trasera: se gira 180° y se desplaza al otro lado del volumen. */
  back?: boolean;
}

/**
 * Cara imprimible de la carta.
 *
 * Ambas caras comparten geometría y pipeline; sólo cambian la textura y la
 * orientación. El backface culling hace innecesario alternar visibilidad al
 * girar: cada cara desaparece sola cuando le da la espalda a la cámara.
 */
export function CardFace({ material, back = false }: CardFaceProps) {
  const geometry = useMemo(createCardFaceGeometry, []);

  return (
    <mesh
      geometry={geometry}
      position-z={back ? -FACE.offset : FACE.offset}
      rotation-y={back ? Math.PI : 0}
      renderOrder={1}
    >
      <primitive object={material} attach="material" />
    </mesh>
  );
}
