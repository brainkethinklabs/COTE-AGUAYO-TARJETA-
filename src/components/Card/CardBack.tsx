import { CardFace } from './CardFace';
import type { HolographicMaterial } from './CardMaterial';

/** Reverso: la ficha del jugador. Foil algo más contenido que el anverso. */
export function CardBack({ material }: { material: HolographicMaterial }) {
  return <CardFace material={material} back />;
}
