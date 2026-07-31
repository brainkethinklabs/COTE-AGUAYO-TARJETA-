import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { Scene } from './scene/Scene';
import { detectQuality } from './quality';
import { DebugOverlay } from './DebugOverlay';

/** El panel de diagnóstico sólo existe si se pide explícitamente. */
const DEBUG = location.search.includes('debug');

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
    <>
      {DEBUG && <DebugOverlay />}
      <Canvas
        dpr={dpr}
        gl={{
          antialias: false, // lo resuelve el EffectComposer (MSAA + SMAA)
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
          // La carta comprime sus propias altas luces en el shader: un pase
          // global de tone mapping volvería gris el blanco del fondo.
          toneMapping: THREE.NoToneMapping,
        }}
        onCreated={({ gl }) => gl.setClearColor('#ffffff', 1)}
        flat
      >
        <PerformanceMonitor
          onIncline={() => setDpr(Math.min(window.devicePixelRatio, quality.maxDpr))}
          // Si 2 no se sostiene, cae a 1.5 (el punto estable conocido), no a
          // un valor de pánico: prioriza nitidez mientras se pueda.
          onDecline={() => setDpr(1.5)}
          // Si sube y baja 3 veces, es que está justo en el límite: se fija
          // en 1.5 definitivo antes que quedar oscilando entre nitidez y lag.
          flipflops={3}
          onFallback={() => setDpr(1.5)}
        >
          <Scene />
        </PerformanceMonitor>
      </Canvas>
    </>
  );
}
