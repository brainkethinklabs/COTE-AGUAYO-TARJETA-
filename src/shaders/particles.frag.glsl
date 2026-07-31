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
  // de tinta. Blending normal, no aditivo.
  //
  // El plateado NO puede ser blanco o se borra contra el fondo: se resuelve
  // como un gris frío, que es como se lee un metal claro sobre papel.
  vec3 gold = vec3(0.86, 0.62, 0.11);
  vec3 silver = vec3(0.52, 0.56, 0.63);

  // Corte duro en vez de degradado: cada mota es oro o plata, nunca un tono
  // intermedio sucio. Ligera mayoría dorada.
  float isSilver = step(0.55, vTint);
  vec3 color = mix(gold, silver, isSilver);

  // El núcleo va algo más claro que el borde: da la sensación de faceta.
  color = mix(color, color + vec3(0.18), core * 0.6);

  float a = clamp(core + halo + glint, 0.0, 1.0) * vAlpha * 0.78;
  gl_FragColor = vec4(color, a);
}
