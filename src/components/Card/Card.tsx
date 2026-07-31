import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';

import { CardFront } from './CardFront';
import { CardBack } from './CardBack';
import { HolographicMaterial, createEdgeMaterial } from './CardMaterial';
import { createCardBodyGeometry } from './geometry';
import { useCardInteraction } from './CardInteraction';
import { useCardTilt } from '../../hooks/useCardTilt';
import { usePointerLight } from '../../hooks/usePointerLight';
import { INTRO, MOTION } from '../../config';

import frontUrl from '../../assets/front.png';
import backUrl from '../../assets/back.png';

/** Easing de salida suave para la aparición (sin overshoot: es una carta, no un juguete). */
const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

interface CardProps {
  /** Progreso 0→1 de la animación de entrada, compartido con halo y partículas. */
  intro: RefObject<number>;
}

/**
 * La carta.
 *
 * Un único objeto físico: cuerpo extruido con canto metálico + dos caras
 * holográficas. Toda la animación se resuelve por frame sobre refs, sin
 * provocar renders de React.
 */
export function Card({ intro }: CardProps) {
  const group = useRef<THREE.Group>(null!);
  const maxAnisotropy = useThree((s) => s.gl.capabilities.getMaxAnisotropy());

  const [frontMap, backMap] = useTexture([frontUrl, backUrl]);

  useLayoutEffect(() => {
    for (const map of [frontMap, backMap]) {
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = Math.min(maxAnisotropy, 8);
      map.minFilter = THREE.LinearMipmapLinearFilter;
      map.magFilter = THREE.LinearFilter;
      map.generateMipmaps = true;
      map.needsUpdate = true;
    }
  }, [frontMap, backMap, maxAnisotropy]);

  // El reverso lleva el foil algo más contenido: es una ficha, no el arte.
  const frontMaterial = useMemo(() => new HolographicMaterial(frontMap), [frontMap]);
  const backMaterial = useMemo(
    () => new HolographicMaterial(backMap, { softness: 0.72 }),
    [backMap],
  );
  const bodyGeometry = useMemo(createCardBodyGeometry, []);
  const edgeMaterial = useMemo(createEdgeMaterial, []);

  useEffect(
    () => () => {
      frontMaterial.dispose();
      backMaterial.dispose();
      edgeMaterial.dispose();
      bodyGeometry.dispose();
    },
    [frontMaterial, backMaterial, edgeMaterial, bodyGeometry],
  );

  const { update: updateSpin } = useCardInteraction();
  const { update: updateTilt } = useCardTilt();
  const { update: updatePointerLight } = usePointerLight();
  const elapsed = useRef(0);

  useFrame((state, delta) => {
    // Un pico de latencia (cambio de pestaña) no debe teletransportar la carta.
    const dt = Math.min(delta, 1 / 30);
    elapsed.current += dt;
    const t = elapsed.current;

    intro.current = Math.min(intro.current + dt / INTRO.duration, 1);
    const appear = easeOutQuint(intro.current);

    const spin = updateSpin(dt);
    // Mientras se arrastra manda el gesto: el hover se atenúa.
    const tilt = updateTilt(state, dt, spin.dragging ? 0.3 : 1);
    const lightPos = updatePointerLight(state, dt);

    const g = group.current;

    // Flotación: respira, nunca se queda quieta.
    g.position.y = Math.sin(t * MOTION.floatSpeed) * MOTION.floatAmplitude;
    g.position.x = Math.sin(t * MOTION.floatSpeed * 0.63 + 1.7) * MOTION.floatAmplitude * 0.45;

    // Rotación = giro del usuario + inclinación hacia el cursor + balanceo de reposo.
    g.rotation.y = spin.spin + tilt.y;
    g.rotation.x = tilt.x + Math.sin(t * MOTION.breathSpeed) * MOTION.breathTilt;
    g.rotation.z = Math.sin(t * MOTION.breathSpeed * 0.79 + 1.3) * MOTION.breathTilt * 0.55;

    g.scale.setScalar(THREE.MathUtils.lerp(INTRO.scaleFrom, 1, appear));

    frontMaterial.update(t, intro.current, spin.spin, state.pointer, lightPos);
    backMaterial.update(t, intro.current, spin.spin, state.pointer, lightPos);
    edgeMaterial.opacity = appear;
  });

  return (
    <group ref={group}>
      {/* Cuerpo: espesor, bisel y canto metálico reales. */}
      <mesh geometry={bodyGeometry} material={edgeMaterial} />
      <CardFront material={frontMaterial} />
      <CardBack material={backMaterial} />
    </group>
  );
}
