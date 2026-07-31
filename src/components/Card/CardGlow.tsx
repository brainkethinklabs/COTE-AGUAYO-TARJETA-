import { useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CARD } from '../../config';

/**
 * Halo que envuelve la carta.
 *
 * No es decoración: da al fondo negro algo sobre lo que la sombra pueda
 * recortarse y hace que la carta se lea retroiluminada, no pegada.
 * Plano billboard con blending aditivo — un draw call, sin textura.
 */
export function CardGlow({ intro }: { intro: RefObject<number> }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        uniforms: {
          uIntensity: { value: 0 },
          uTime: { value: 0 },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uIntensity;
          uniform float uTime;
          varying vec2 vUv;

          void main() {
            // Elipse vertical: el halo abraza la silueta de la carta.
            vec2 p = (vUv - 0.5) * vec2(1.35, 1.0);
            float r = length(p);

            // Dos caídas superpuestas: núcleo apretado + derrame corto.
            // Debe morir antes del borde de pantalla: el fondo es negro puro.
            float core = exp(-r * r * 44.0);
            float spread = exp(-r * r * 15.0) * 0.28;

            // Respiración lenta, desfasada de la flotación de la carta.
            float breathe = 0.92 + 0.08 * sin(uTime * 0.4);

            vec3 warm = vec3(1.0, 0.72, 0.32);
            vec3 cool = vec3(0.32, 0.46, 1.0);
            vec3 color = mix(cool, warm, smoothstep(0.0, 0.45, core));

            float a = (core * 0.40 + spread) * uIntensity * breathe;
            gl_FragColor = vec4(color * a, a);
          }
        `,
      }),
    [],
  );

  const time = useRef(0);
  useFrame((_, dt) => {
    time.current += dt;
    material.uniforms.uTime.value = time.current;
    // Sobre-brillo en la entrada que decae hasta el nivel de reposo.
    const t = intro.current ?? 0;
    const burst = Math.sin(Math.min(t, 1) * Math.PI) * 0.45;
    material.uniforms.uIntensity.value = t * 0.34 + burst;
  });

  return (
    <mesh position-z={-0.9} renderOrder={-1}>
      <planeGeometry args={[CARD.width * 2.6, CARD.height * 1.9]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
