// -----------------------------------------------------------------------------
// particles.frag.glsl — punto luminoso con núcleo duro y halo suave.
// Sin textura: la forma es analítica.
// -----------------------------------------------------------------------------
#include ./lib.glsl

varying float vAlpha;
varying float vTint;

void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = length(d);
  if (r > 0.5) discard;

  float core = exp(-r * r * 46.0);
  float halo = exp(-r * r * 9.0) * 0.35;
  // Cruz de difracción muy tenue: se lee como energía, no como polvo.
  float glint = (exp(-abs(d.x) * 60.0) + exp(-abs(d.y) * 60.0)) * core * 0.5;

  // Sobre blanco una mota luminosa no existe: lo que se ve es una partícula
  // de tinta. Oro y ámbar, con blending normal en vez de aditivo.
  vec3 gold = vec3(0.85, 0.60, 0.12);
  vec3 amber = vec3(0.62, 0.45, 0.20);
  vec3 color = mix(gold, amber, vTint);

  float a = clamp(core + halo + glint, 0.0, 1.0) * vAlpha * 0.75;
  gl_FragColor = vec4(color, a);
}
