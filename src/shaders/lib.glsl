// -----------------------------------------------------------------------------
// lib.glsl — utilidades compartidas (hash, ruido, espectro, color).
// Todo sin texturas auxiliares: cero fetches extra, cero descargas.
// -----------------------------------------------------------------------------
#ifndef LIB_GLSL
#define LIB_GLSL

#define PI 3.141592653589793

float sat(float x) { return clamp(x, 0.0, 1.0); }

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

/** Ruido de valor bilineal con interpolación suave. */
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

/** 3 octavas: suficiente para micro-imperfecciones del laminado. */
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * vnoise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}

/** Paleta cosenoidal: espectro visible continuo y cíclico. */
vec3 spectrum(float t) {
  return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));
}

float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

/** Saturación normalizada (HSV.S) — separa metal de piel/color. */
float chroma(vec3 c) {
  float mx = max(c.r, max(c.g, c.b));
  float mn = min(c.r, min(c.g, c.b));
  return (mx - mn) / max(mx, 1e-4);
}

vec3 srgbToLinear(vec3 c) {
  return mix(pow((c + 0.055) / 1.055, vec3(2.4)), c / 12.92, step(c, vec3(0.04045)));
}

/**
 * Especular GGX aislado (sin Fresnel, se aplica fuera).
 * Acotado: con rugosidad baja el pico tiende a infinito y, sobre una
 * superficie plana como esta, reventaría media carta en blanco.
 */
float ggx(vec3 N, vec3 V, vec3 L, float roughness) {
  vec3 H = normalize(V + L);
  float a = max(roughness * roughness, 1e-3);
  float ndh = sat(dot(N, H));
  float d = ndh * ndh * (a * a - 1.0) + 1.0;
  return min((a * a) / (PI * d * d), 6.0);
}

#endif
