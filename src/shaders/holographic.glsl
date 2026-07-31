// -----------------------------------------------------------------------------
// holographic.glsl — fragmento de las caras de la carta.
//
// Modelo: impresión sobre cartón + capa de barniz UV + foil holográfico
// enmascarado por las zonas metálicas del arte original.
//
//  1. Máscara de foil derivada de la propia textura (brillo alto + croma bajo).
//  2. Thin-film iridiscente dependiente del ángulo (foil.glsl).
//  3. Destellos independientes en los diamantes (sparkles.glsl).
//  4. Especular GGX de 3 luces + barrido de luz (light sweep).
//  5. Fresnel de barniz y fundido de entrada.
//
// La salida es lineal HDR: el tone mapping lo aplica el EffectComposer.
// -----------------------------------------------------------------------------
#include ./lib.glsl
#include ./foil.glsl
#include ./sparkles.glsl

uniform sampler2D uMap;
uniform float uTime;
uniform float uIntro;      // 0 -> 1 durante la animación de entrada
uniform float uSpin;       // rotación acumulada de la carta (radianes)
uniform float uAspect;     // ancho / alto de la cara
uniform vec2 uSize;        // dimensiones de la cara en unidades de mundo
uniform float uRadius;     // radio de las esquinas redondeadas
uniform vec2 uPointer;     // cursor normalizado (-1..1)

uniform float uFoil;
uniform float uFilmScale;
uniform float uAniso;
uniform float uSparkleDensity;
uniform float uSweepWidth;
uniform float uSweepIntensity;

uniform vec3 uKeyPos;
uniform vec3 uFillPos;
uniform vec3 uRimPos;
uniform vec3 uKeyColor;
uniform vec3 uFillColor;
uniform vec3 uRimColor;
uniform vec3 uPointerLightPos;

varying vec2 vUv;
varying vec3 vWPos;
varying vec3 vN;
varying vec3 vT;
varying vec3 vB;

/** Aporte de una luz puntual: difuso suave + especular de barniz. */
vec3 lightContribution(vec3 N, vec3 V, vec3 P, vec3 lightPos, vec3 lightColor,
                       float roughness, float specular) {
  vec3 L = normalize(lightPos - P);
  float ndl = sat(dot(N, L));
  // Wrap lighting: la impresión mate no se apaga de golpe.
  float diff = pow(ndl * 0.5 + 0.5, 1.6);
  float spec = ggx(N, V, L, roughness) * ndl * specular;
  return lightColor * (diff * 0.5 + spec);
}

/** SDF de rectángulo redondeado: recorta las esquinas con antialias exacto. */
float roundedRect(vec2 p, vec2 halfSize, float r) {
  vec2 q = abs(p) - halfSize + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

void main() {
  // Silueta: la cara es un plano teselado recortado al contorno de la carta.
  vec2 p = (vUv - 0.5) * uSize;
  float sdf = roundedRect(p, uSize * 0.5, uRadius);
  float edge = fwidth(sdf) * 0.9;
  float silhouette = 1.0 - smoothstep(-edge, edge, sdf);
  if (silhouette <= 0.001) discard;

  // La textura se sube con formato sRGB: el sampler ya devuelve lineal.
  vec4 tex = texture2D(uMap, vUv);
  vec3 base = tex.rgb;

  float l = luma(base);
  float c = chroma(base);

  // --- 1. Máscara de foil -----------------------------------------------
  // Metal/diamante: luminancia alta y croma bajo. La piel y el uniforme
  // (croma alto) quedan fuera, así el retrato no se contamina de arcoíris.
  float metal = smoothstep(0.24, 0.78, l) * (1.0 - smoothstep(0.30, 0.72, c));
  // El foil vive sobre la tinta, no sobre el negro: si se sumara un velo
  // constante, las zonas oscuras adoptarían el tono del iris y toda la carta
  // quedaría teñida de un color plano.
  float foilMask = clamp(metal * 1.30 + 0.30 * smoothstep(0.10, 0.52, l), 0.0, 1.4);

  // --- 2. Geometría de sombreado ----------------------------------------
  vec3 N = normalize(vN);
  vec3 T = normalize(vT);
  vec3 B = normalize(vB);
  vec3 V = normalize(cameraPosition - vWPos);

  // Micro-relieve del barniz: rompe el especular perfecto de un plano.
  float nx = fbm(vUv * vec2(210.0, 290.0)) - 0.5;
  float ny = fbm(vUv * vec2(290.0, 210.0) + 11.7) - 0.5;
  N = normalize(N + (T * nx + B * ny) * 0.045);

  float cosTheta = sat(dot(N, V));
  float fresnel = pow(1.0 - cosTheta, 5.0);

  // --- 3. Impresión iluminada -------------------------------------------
  vec3 lit = vec3(0.30);  // ambiente frío mínimo
  lit += lightContribution(N, V, vWPos, uKeyPos, uKeyColor, 0.26, 0.55);
  lit += lightContribution(N, V, vWPos, uFillPos, uFillColor, 0.45, 0.18);
  lit += lightContribution(N, V, vWPos, uRimPos, uRimColor, 0.30, 0.40);
  // Luz que sigue al cursor: hace tangible el volumen al mover el mouse.
  lit += lightContribution(N, V, vWPos, uPointerLightPos, vec3(1.0, 0.94, 0.82), 0.22, 0.75) * 0.5;

  vec3 color = base * lit;

  // --- 4. Foil holográfico ----------------------------------------------
  vec3 foil = foilLayer(vUv, N, V, T, B, uTime, uSpin, uFilmScale, uAniso);
  color += foil * foilMask * uFoil * 0.30;

  // --- 5. Light sweep ----------------------------------------------------
  // Banda diagonal que recorre la carta según giro, cursor y tiempo.
  float axis = dot(vUv - 0.5, normalize(vec2(0.6, 1.0)));
  float sweepPos = 0.62 * sin(uSpin * 0.85 + uPointer.x * 0.8 + uTime * 0.16);
  float sweep = exp(-pow((axis - sweepPos) / uSweepWidth, 2.0));

  // Barrido de presentación: cruza la carta una vez al aparecer.
  float introAxis = mix(-1.0, 1.0, smoothstep(0.15, 0.95, uIntro));
  float introSweep = exp(-pow((axis - introAxis) / 0.085, 2.0)) * (1.0 - uIntro * 0.15);

  vec3 sweepTint = mix(vec3(1.0, 0.97, 0.90), spectrum(axis * 2.0 + uTime * 0.05), 0.45);
  color += sweepTint * sweep * uSweepIntensity * (0.22 + foilMask * 0.75);
  color += sweepTint * introSweep * 1.1;

  // --- 6. Destellos de diamante -----------------------------------------
  // Sólo donde el arte tiene facetas: brillo muy alto y croma casi nulo.
  float gemMask = smoothstep(0.55, 0.95, l) * (1.0 - smoothstep(0.12, 0.40, c));
  vec3 gems = sparkleLayer(vUv, uAspect, uTime, uSparkleDensity, cosTheta, 0.0);
  gems += sparkleLayer(vUv, uAspect, uTime * 1.31 + 4.0, uSparkleDensity * 0.62, cosTheta, 19.0) * 0.8;
  color += gems * gemMask * 2.4;

  // --- 7. Barniz UV -------------------------------------------------------
  // Reflejo especular ancho del laminado + halo en el borde.
  color += vec3(0.55, 0.60, 0.72) * fresnel * 0.55;
  color = mix(color, color * 1.12, sat(fresnel * 2.0));

  // --- 8. Entrada ---------------------------------------------------------
  float appear = smoothstep(0.0, 0.55, uIntro);
  color *= mix(0.0, 1.0, appear);
  // Pequeño exceso de brillo que se disuelve.
  color += vec3(0.35, 0.45, 0.70) * (1.0 - smoothstep(0.0, 0.8, uIntro)) * appear * 0.5;

  gl_FragColor = vec4(color, tex.a * appear * silhouette);
}
