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
import { readTiltInput } from '../../hooks/useTiltInput';
import { INTRO, MOTION } from '../../config';
import { detectQuality } from '../../quality';
import { cardMotion } from './motionState';
import { detailFade, zoomState } from './zoomState';
import { isGyroActive } from '../../hooks/useTiltInput';

import frontUrl from '../../assets/front.webp';
import backUrl from '../../assets/back.webp';

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
  const quality = useMemo(detectQuality, []);

  const [frontMap, backMap] = useTexture([frontUrl, backUrl]);

  useLayoutEffect(() => {
    for (const map of [frontMap, backMap]) {
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = Math.min(maxAnisotropy, quality.anisotropy);
      map.minFilter = THREE.LinearMipmapLinearFilter;
      map.magFilter = THREE.LinearFilter;
      map.generateMipmaps = true;
      map.needsUpdate = true;
    }
  }, [frontMap, backMap, maxAnisotropy, quality]);

  const frontMaterial = useMemo(
    () => new HolographicMaterial(frontMap, { sparkleLayers: quality.sparkleLayers }),
    [frontMap, quality],
  );
  // El reverso es un bloque de texto: el foil se contiene y, sobre todo, se
  // baja el brillo del laminado. Un reflejo sobre un párrafo lo vuelve
  // ilegible mucho antes que sobre una fotografía.
  const backMaterial = useMemo(
    () => new HolographicMaterial(backMap, {
      softness: 0.5,
      gloss: 0.32,
      sparkleLayers: quality.sparkleLayers,
    }),
    [backMap, quality],
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

  useFrame((_, delta) => {
    // Un pico de latencia (cambio de pestaña) no debe teletransportar la carta.
    const dt = Math.min(delta, 1 / 30);
    elapsed.current += dt;
    const t = elapsed.current;

    intro.current = Math.min(intro.current + dt / INTRO.duration, 1);
    const appear = easeOutQuint(intro.current);

    // Puntero en escritorio, giroscopio en el teléfono: misma señal.
    const input = readTiltInput();
    const spin = updateSpin(dt);
    // Mientras se arrastra manda el gesto: el hover se atenúa.
    // Con giroscopio el recorrido se amplía: el gesto es mover el teléfono.
    const tilt = updateTilt(
      input,
      dt,
      spin.dragging ? 0.3 : 1,
      isGyroActive() ? MOTION.gyroTiltBoost : 1,
    );
    const lightPos = updatePointerLight(input, dt);

    const g = group.current;

    // Flotación: respira, nunca se queda quieta.
    const floatY = Math.sin(t * MOTION.floatSpeed) * MOTION.floatAmplitude;
    const floatX = Math.sin(t * MOTION.floatSpeed * 0.63 + 1.7) * MOTION.floatAmplitude * 0.45;

    // Paralaje: la carta se desplaza hacia el lado al que inclinás, con más
    // retardo que la rotación. Es lo que hace visible que se está moviendo.
    const offsetX = tilt.px * MOTION.parallax;
    const offsetY = tilt.py * MOTION.parallax * 0.7;

    // Todo el movimiento de traslación se divide por el zoom: en unidades de
    // mundo sería el mismo, pero en pantalla se vería multiplicado, y lo que
    // era una flotación sutil se volvería un vaivén al acercarse.
    const z = zoomState.current;
    g.position.y = (floatY + offsetY) / z;
    g.position.x = (floatX + offsetX) / z;

    // Rotación = giro del usuario + inclinación hacia el cursor + balanceo de reposo.
    // El orden Euler por defecto (XYZ) aplica X en espacio de mundo, así que
    // el eje vertical sigue siendo vertical por mucho que la carta haya girado.
    g.rotation.y = spin.spin + tilt.y;
    g.rotation.x = spin.pitch + tilt.x + Math.sin(t * MOTION.breathSpeed) * MOTION.breathTilt;
    g.rotation.z = Math.sin(t * MOTION.breathSpeed * 0.79 + 1.3) * MOTION.breathTilt * 0.55;

    g.scale.setScalar(THREE.MathUtils.lerp(INTRO.scaleFrom, 1, appear));

    // Al acercarse, el laminado se apaga para dejar ver la impresión.
    const detail = detailFade();
    frontMaterial.setDetailFade(detail);
    backMaterial.setDetailFade(detail);
    // El canto cromado también deja de reflejar tanto de cerca.
    edgeMaterial.envMapIntensity = 0.35 + 1.15 * detail;

    frontMaterial.update(t, intro.current, spin.spin, input, lightPos);
    backMaterial.update(t, intro.current, spin.spin, input, lightPos);
    edgeMaterial.opacity = appear;

    // Lo consumen la sombra y el panel de diagnóstico.
    cardMotion.spin = spin.spin;
    cardMotion.pitch = spin.pitch;
    cardMotion.tiltX = tilt.x;
    cardMotion.tiltY = tilt.y;
    cardMotion.floatY = g.position.y;
    cardMotion.offsetX = g.position.x;
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
