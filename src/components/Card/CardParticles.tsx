import { useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import vertexShader from '../../shaders/particles.vert.glsl';
import fragmentShader from '../../shaders/particles.frag.glsl';
import { PARTICLES } from '../../config';
import { detectQuality } from '../../quality';
import { detailFade } from './zoomState';

/**
 * Motas de energía alrededor de la carta.
 *
 * Pocas, doradas y blancas, en órbitas lentas y desfasadas. Se distribuyen
 * en una cáscara elipsoidal con un hueco central: nunca cruzan por delante
 * del arte, sólo lo rodean.
 */
export function CardParticles({ intro }: { intro: RefObject<number> }) {
  const dpr = useThree((s) => s.viewport.dpr);

  const geometry = useMemo(() => {
    const count = Math.min(PARTICLES.count, detectQuality().particles);
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Punto en una cáscara: radio entre 55% y 100% del volumen.
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = PARTICLES.radius * (0.55 + Math.random() * 0.45);

      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r * 0.85;
      positions[i * 3 + 1] = Math.cos(phi) * r * 1.15;
      positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r * 0.55;

      seeds[i * 3] = Math.random();              // fase
      seeds[i * 3 + 1] = 0.35 + Math.random();   // velocidad
      seeds[i * 3 + 2] = Math.random();          // tinte oro <-> blanco

      // Mayoría diminutas, unas pocas notorias.
      scales[i] = 0.35 + Math.pow(Math.random(), 3) * 1.6;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));
    g.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), PARTICLES.radius * 2);
    return g;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        // Normal, no aditivo: sobre fondo blanco el aditivo no dibuja nada.
        blending: THREE.NormalBlending,
        toneMapped: false,
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: PARTICLES.size },
          uPixelRatio: { value: dpr },
          uIntro: { value: 0 },
        },
      }),
    [dpr],
  );

  const time = useRef(0);
  useFrame((_, dt) => {
    time.current += dt * PARTICLES.speed * 10;
    material.uniforms.uTime.value = time.current;
    // Se desvanecen al acercarse: la cámara entra en la nube de partículas y,
    // además, inspeccionando el detalle sólo estorbarían.
    material.uniforms.uIntro.value = (intro.current ?? 0) * detailFade();
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
