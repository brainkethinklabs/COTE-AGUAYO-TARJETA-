import { CardFace } from './CardFace';
import type { HolographicMaterial } from './CardMaterial';

/** Anverso: el arte del jugador. */
export function CardFront({ material }: { material: HolographicMaterial }) {
  return <CardFace material={material} />;
}
