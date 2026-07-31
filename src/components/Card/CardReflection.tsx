import { useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CARD } from '../../config';
import { cardMotion } from './motionState';

/**
 * Sombra proyectada de la carta.
 *
 * Va sobre un plano **vertical** detrás de la carta, no sobre un suelo: la
 * cámara mira en horizontal, así que un plano de suelo se vería exactamente
 * de canto y la sombra sería una línea. Sobre un fondo blanco la lectura
 * correcta es la de un objeto flotando delante de una pared.
 *
 * La silueta se deforma con el giro —al ponerse de canto la sombra se
 * estrecha— y se desplaza según la luz principal, que viene de arriba a la
 * derecha. Es un solo draw call: no re-renderiza la escena como haría un
 * mapa de sombras.
 */
export function CardShadow({ intro }: { intro: RefObject<number> }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        uniforms: {
          uHalfSize: { value: new THREE.Vector2(CARD.width / 2, CARD.height / 2) },
          uRadius: { value: CARD.radius },
          uSpin: { value: 0 },
          uPitch: { value: 0 },
          uOffset: { value: new THREE.Vector2(-0.34, -0.30) },
          uPlane: { value: new THREE.Vector2(CARD.width * 3, CARD.height * 2.2) },
          uIntensity: { value: 0 },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec2 uHalfSize;
          uniform float uRadius;
          uniform float uSpin;
          uniform float uPitch;
          uniform vec2 uOffset;
          uniform vec2 uPlane;
          uniform float uIntensity;

          varying vec2 vUv;

          float roundedRect(vec2 p, vec2 halfSize, float r) {
            vec2 q = abs(p) - halfSize + r;
            return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
          }

          void main() {
            vec2 p = (vUv - 0.5) * uPlane - uOffset;

            // Al girar, la carta presenta menos anchura: la sombra la sigue.
            // El mínimo evita que desaparezca del todo al ponerse de canto.
            float w = max(abs(cos(uSpin)), 0.12);
            float h = max(abs(cos(uPitch)), 0.35);
            vec2 half = vec2(uHalfSize.x * w, uHalfSize.y * h);

            float d = roundedRect(p, half, uRadius);

            // Dos caídas: penumbra amplia + núcleo más cerrado y oscuro.
            float wide = 1.0 - smoothstep(-0.15, 0.85, d);
            float core = 1.0 - smoothstep(-0.10, 0.30, d);

            float a = (wide * 0.55 + core * 0.45) * uIntensity;

            // Azulada, no negra: una sombra neutra sobre blanco se ve sucia.
            gl_FragColor = vec4(vec3(0.36, 0.39, 0.48), a);
          }
        `,
      }),
    [],
  );

  const plane = material.uniforms.uPlane.value as THREE.Vector2;
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    const u = material.uniforms;
    u.uSpin.value = cardMotion.spin;
    u.uPitch.value = cardMotion.pitch + cardMotion.tiltX;
    // La sombra acompaña la flotación pero con menos recorrido: así la
    // distancia entre carta y pared se lee como profundidad real.
    meshRef.current.position.y = cardMotion.floatY * 0.45;
    meshRef.current.position.x = cardMotion.offsetX * 0.45;
    u.uIntensity.value = (intro.current ?? 0) * 0.5;
  });

  return (
    <mesh ref={meshRef} position-z={-0.85} renderOrder={-1}>
      <planeGeometry args={[plane.x, plane.y]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
