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

  // Oro cálido -> blanco puro según el tinte de la partícula.
  vec3 gold = vec3(1.0, 0.78, 0.36);
  vec3 white = vec3(0.92, 0.96, 1.0);
  vec3 color = mix(gold, white, vTint);

  float a = (core + halo + glint) * vAlpha;
  gl_FragColor = vec4(color * a * 1.6, a);
}
