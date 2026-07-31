/**
 * Convierte los PNG originales de la carta a WebP.
 *
 * Los PNG pesan ~1.3 MB cada uno: en móvil eso es descarga + decodificación
 * antes de que la carta pueda siquiera aparecer. WebP con calidad alta baja
 * el peso ~85% sin diferencia visible sobre una textura que además se ve
 * iluminada y con foil encima.
 *
 * Se corre a mano cuando cambian los originales:
 *   node scripts/optimize-textures.mjs
 */
import sharp from 'sharp';
import { stat } from 'node:fs/promises';

const SOURCES = [
  { from: '1.png', to: 'src/assets/front.webp' },
  { from: '2.png', to: 'src/assets/back.webp' },
];

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

for (const { from, to } of SOURCES) {
  const before = (await stat(from)).size;

  await sharp(from)
    // Se duplica la resolución con Lanczos antes de comprimir. No inventa
    // detalle que no exista, pero evita que la GPU tenga que magnificar la
    // textura en pantallas de DPR alto, que es lo que la volvía blanda.
    .resize({ width: 1500, height: 2100, kernel: 'lanczos3' })
    // quality 95: el texto fino y los diamantes no toleran menos.
    .webp({ quality: 95, effort: 6 })
    .toFile(to);

  const after = (await stat(to)).size;
  const saved = ((1 - after / before) * 100).toFixed(1);
  console.log(`${from} -> ${to}  ${mb(before)} -> ${mb(after)}  (-${saved}%)`);
}
