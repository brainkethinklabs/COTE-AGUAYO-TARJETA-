import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { Scene } from './scene/Scene';
import { detectQuality } from './quality';

/**
 * Visor de la carta.
 *
 * Un canvas a pantalla completa sobre negro absoluto. El DPR arranca en el
 * techo del perfil detectado y baja solo si el equipo no sostiene 60 FPS:
 * antes se pierde resolución que fluidez.
 */
export function App() {
  const quality = useMemo(detectQuality, []);
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio, quality.maxDpr));

  return (
    <Canvas
      dpr={dpr}
      gl={{
        antialias: false, // lo resuelve el EffectComposer (MSAA + SMAA)
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
        toneMapping: THREE.NoToneMapping, // el tone mapping va en postproceso
      }}
      onCreated={({ gl }) => gl.setClearColor('#000000', 1)}
      flat
    >
      <PerformanceMonitor
        onIncline={() => setDpr(Math.min(window.devicePixelRatio, quality.maxDpr))}
        onDecline={() => setDpr(1)}
      >
        <Scene />
      </PerformanceMonitor>
    </Canvas>
  );
}
