import { useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { Scene } from './scene/Scene';

/**
 * Visor de la carta.
 *
 * Un canvas a pantalla completa sobre negro absoluto. El DPR se adapta solo:
 * si el equipo no sostiene 60 FPS, baja resolución antes que perder fluidez.
 */
export function App() {
  const [dpr, setDpr] = useState(1.5);

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
        onIncline={() => setDpr(Math.min(window.devicePixelRatio, 2))}
        onDecline={() => setDpr(1)}
      >
        <Scene />
      </PerformanceMonitor>
    </Canvas>
  );
}
