import { Suspense, useMemo, useRef } from 'react';
import { EffectComposer, Bloom, ToneMapping, SMAA } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

import { Camera } from './Camera';
import { Lights } from './Lights';
import { Environment } from './Environment';
import { Card } from '../components/Card/Card';
import { CardGlow } from '../components/Card/CardGlow';
import { CardParticles } from '../components/Card/CardParticles';
import { CardReflection } from '../components/Card/CardReflection';
import { detectQuality } from '../quality';

/**
 * Contenido de la escena: carta, halo, partículas, sombra y luces.
 * Nada más. Sin textos, sin HUD, sin controles.
 */
export function Scene() {
  // Progreso de la entrada, compartido por carta, halo y partículas para que
  // aparezcan como un solo evento y no como tres animaciones sueltas.
  const intro = useRef(0);
  const quality = useMemo(detectQuality, []);

  return (
    <>
      <Camera />
      <Lights />

      <Suspense fallback={null}>
        <Environment />
        <CardGlow intro={intro} />
        <Card intro={intro} />
        <CardParticles intro={intro} />
        {/* La sombra re-renderiza la escena cada frame: sólo en escritorio. */}
        {quality.contactShadows && <CardReflection />}
      </Suspense>

      <EffectComposer multisampling={quality.msaa} enableNormalPass={false}>
        {/* Bloom sólo sobre lo verdaderamente brillante: destellos y barrido. */}
        <Bloom
          mipmapBlur
          intensity={0.85}
          luminanceThreshold={0.72}
          luminanceSmoothing={0.28}
          radius={0.72}
          // El bloom es luz difusa por definición: a media resolución en móvil
          // se ve igual y cuesta la cuarta parte de píxeles.
          resolutionScale={quality.tier === 'low' ? 0.5 : 1}
        />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        {/* Sin MSAA (móvil), SMAA es el único antialias: ahí sí hace falta. */}
        <SMAA />
      </EffectComposer>
    </>
  );
}
