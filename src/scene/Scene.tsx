import { Suspense, useMemo, useRef } from 'react';
import { EffectComposer, SMAA } from '@react-three/postprocessing';

import { Camera } from './Camera';
import { Lights } from './Lights';
import { Environment } from './Environment';
import { Card } from '../components/Card/Card';
import { CardParticles } from '../components/Card/CardParticles';
import { CardShadow } from '../components/Card/CardReflection';
import { detectQuality } from '../quality';

/**
 * Contenido de la escena: carta, sombra, partículas y luces.
 * Nada más. Sin textos, sin HUD, sin controles.
 *
 * **Sobre el postproceso y el fondo blanco.** Antes había Bloom + tone
 * mapping ACES, y ninguno de los dos sobrevive a un fondo claro:
 *
 * - El bloom hace brillar todo lo que supera un umbral de luminancia. Un
 *   fondo blanco lo supera siempre, así que sangraría por toda la pantalla.
 *   Además el resplandor sólo se lee contra la oscuridad: sobre blanco no
 *   aporta nada aunque se afinara el umbral.
 * - ACES mapea el blanco lineal a ~0.80, es decir gris claro. Para que el
 *   fondo saliera blanco puro habría que partir de un valor lineal alto, que
 *   es justo lo que dispararía el bloom.
 *
 * La carta pasa a gestionar su propio rango dinámico en el fragment shader,
 * con una compresión suave de altas luces. Queda un único pase: antialias.
 */
export function Scene() {
  // Progreso de la entrada, compartido por carta, sombra y partículas para
  // que aparezcan como un solo evento y no como tres animaciones sueltas.
  const intro = useRef(0);
  const quality = useMemo(detectQuality, []);

  return (
    <>
      <Camera />
      <Lights />

      <Suspense fallback={null}>
        <Environment />
        <CardShadow intro={intro} />
        <Card intro={intro} />
        <CardParticles intro={intro} />
      </Suspense>

      <EffectComposer multisampling={quality.msaa} enableNormalPass={false}>
        {/* Sin MSAA (móvil), SMAA es el único antialias: ahí sí hace falta. */}
        <SMAA />
      </EffectComposer>
    </>
  );
}
