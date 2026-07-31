// -----------------------------------------------------------------------------
// sparkles.glsl — destellos de diamante.
// Rejilla de celdas; cada celda tiene posición, fase, velocidad y tinte
// propios, por lo que ningún destello se sincroniza con otro.
// -----------------------------------------------------------------------------
// Requiere `lib.glsl`, que incluye el shader de entrada antes que este chunk.
#ifndef SPARKLES_GLSL
#define SPARKLES_GLSL

/**
 * @param uv        coordenada de la cara
 * @param aspect    relación ancho/alto para que las celdas sean cuadradas
 * @param t         tiempo
 * @param density   celdas por unidad de UV
 * @param cosTheta  ángulo de visión: modula el tinte refractado
 * @param seed      desplazamiento para desacoplar capas
 */
vec3 sparkleLayer(vec2 uv, float aspect, float t, float density, float cosTheta,
                  float seed) {
  vec2 g = uv * vec2(density * aspect, density);
  vec2 id = floor(g) + seed;
  vec2 f = fract(g) - 0.5;

  vec2 rnd = hash22(id);
  vec2 d = f - (rnd - 0.5) * 0.72;

  float phase = hash12(id + 7.13);
  float speed = 0.5 + phase * 2.1;

  // Parpadeo: potencia alta -> flash corto y seco, no un latido.
  float flash = pow(max(sin(t * speed + phase * 62.83 + cosTheta * 3.0), 0.0), 26.0);

  // Núcleo puntual + glint en cruz (difracción de la faceta).
  float core = exp(-dot(d, d) * 620.0);
  float star = (exp(-abs(d.x) * 130.0) + exp(-abs(d.y) * 130.0)) * core;

  float intensity = (core * 1.8 + star * 2.6) * flash;

  // La refracción tiñe cada faceta de un color distinto.
  vec3 tint = mix(vec3(1.0), spectrum(phase + cosTheta * 0.45), 0.5);
  return tint * intensity;
}

#endif
