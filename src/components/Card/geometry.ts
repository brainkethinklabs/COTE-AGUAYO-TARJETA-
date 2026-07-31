import * as THREE from 'three';
import { CARD } from '../../config';

/**
 * Contorno de la carta: rectángulo con esquinas redondeadas.
 * Se usa para extruir el cuerpo físico (canto metálico).
 */
export function createCardShape(
  width = CARD.width,
  height = CARD.height,
  radius = CARD.radius,
): THREE.Shape {
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, w, h);

  const shape = new THREE.Shape();
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);
  shape.closePath();
  return shape;
}

/**
 * Cuerpo de la carta: volumen extruido con bisel.
 * Aporta espesor, canto y profundidad reales — no es un plano.
 */
export function createCardBodyGeometry(): THREE.ExtrudeGeometry {
  const depth = CARD.thickness - CARD.bevel * 2;

  const geometry = new THREE.ExtrudeGeometry(createCardShape(), {
    depth,
    bevelEnabled: true,
    bevelThickness: CARD.bevel,
    bevelSize: CARD.bevel,
    bevelSegments: 3,
    curveSegments: 24,
    steps: 1,
  });

  // ExtrudeGeometry crece desde z=0: lo centramos en el origen.
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Superficie plana del cuerpo, una vez descontado el bisel.
 *
 * La cara imprimible debe apoyarse exactamente sobre esta meseta: si usara
 * las medidas completas de la carta sobresaldría por encima del canto, y si
 * se hundiera quedaría tapada por el metal.
 */
export const FACE = {
  width: CARD.width - CARD.bevel * 2,
  height: CARD.height - CARD.bevel * 2,
  radius: CARD.radius - CARD.bevel,
  /** Z de la meseta + un pelo para ganar el z-fight contra el cuerpo. */
  offset: CARD.thickness / 2 + 0.0004,
} as const;

/**
 * Cara imprimible: plano teselado (para el alabeo del cartón) recortado
 * al contorno redondeado dentro del fragment shader.
 */
export function createCardFaceGeometry(): THREE.PlaneGeometry {
  return new THREE.PlaneGeometry(FACE.width, FACE.height, 40, 56);
}
