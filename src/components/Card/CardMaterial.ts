import * as THREE from 'three';
import vertexShader from '../../shaders/card.vert.glsl';
import fragmentShader from '../../shaders/holographic.glsl';
import { HOLO } from '../../config';
import { FACE } from './geometry';

/** Posiciones y colores del tres puntos, compartidos con `Lights.tsx`. */
export const LIGHT_RIG = {
  key: { position: new THREE.Vector3(3.2, 3.6, 4.4), color: new THREE.Color('#fff2dd') },
  fill: { position: new THREE.Vector3(-4.2, -1.0, 2.6), color: new THREE.Color('#4a6fff') },
  rim: { position: new THREE.Vector3(-1.4, 2.2, -4.6), color: new THREE.Color('#ffd9a0') },
} as const;

/**
 * Material holográfico de las caras.
 *
 * Se instancia imperativamente (una por cara) para poder escribir uniformes
 * en `useFrame` sin coste de reconciliación de React.
 */
export class HolographicMaterial extends THREE.ShaderMaterial {
  constructor(map: THREE.Texture, { softness = 1 }: { softness?: number } = {}) {
    super({
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: true,
      toneMapped: false,
      uniforms: {
        uMap: { value: map },
        uTime: { value: 0 },
        uIntro: { value: 0 },
        uSpin: { value: 0 },
        uPointer: { value: new THREE.Vector2() },

        uSize: { value: new THREE.Vector2(FACE.width, FACE.height) },
        uAspect: { value: FACE.width / FACE.height },
        uRadius: { value: FACE.radius },
        uCurvature: { value: 0.006 },

        uFoil: { value: HOLO.foil * softness },
        uFilmScale: { value: HOLO.filmScale },
        uAniso: { value: HOLO.anisotropy },
        uSparkleDensity: { value: HOLO.sparkleDensity },
        uSweepWidth: { value: HOLO.sweepWidth },
        uSweepIntensity: { value: HOLO.sweepIntensity * softness },

        uKeyPos: { value: LIGHT_RIG.key.position.clone() },
        uFillPos: { value: LIGHT_RIG.fill.position.clone() },
        uRimPos: { value: LIGHT_RIG.rim.position.clone() },
        uKeyColor: { value: LIGHT_RIG.key.color.clone() },
        uFillColor: { value: LIGHT_RIG.fill.color.clone() },
        uRimColor: { value: LIGHT_RIG.rim.color.clone() },
        uPointerLightPos: { value: new THREE.Vector3(0, 0, 6) },
      },
    });
  }

  /** Escritura directa de los uniformes animados (sin allocations por frame). */
  update(time: number, intro: number, spin: number, pointer: THREE.Vector2, lightPos: THREE.Vector3) {
    const u = this.uniforms;
    u.uTime.value = time;
    u.uIntro.value = intro;
    u.uSpin.value = spin;
    (u.uPointer.value as THREE.Vector2).copy(pointer);
    (u.uPointerLightPos.value as THREE.Vector3).copy(lightPos);
  }
}

/**
 * Canto de la carta: metal oscuro pulido.
 * Recoge el HDRI procedural del `Environment` para leerse como cromado.
 */
export function createEdgeMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#15161a'),
    metalness: 0.95,
    roughness: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.5,
    transparent: true,
    opacity: 0,
  });
}
