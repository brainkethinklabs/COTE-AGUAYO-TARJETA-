import { ContactShadows } from '@react-three/drei';
import { CARD } from '../../config';

/**
 * Sombra de contacto bajo la carta.
 *
 * Sobre negro puro una sombra sería invisible: aquí se recorta contra el
 * halo de `CardGlow`, que es lo que la vuelve legible. Muy difusa y de baja
 * opacidad — sugiere el suelo sin llegar a dibujarlo.
 */
export function CardReflection() {
  return (
    <ContactShadows
      position={[0, -(CARD.height / 2 + 0.55), 0]}
      scale={CARD.width * 3.4}
      resolution={256}
      blur={3.2}
      far={2.2}
      opacity={0.55}
      color="#000000"
      frames={Infinity}
    />
  );
}
