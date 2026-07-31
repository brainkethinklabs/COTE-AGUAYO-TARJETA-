// -----------------------------------------------------------------------------
// foil.glsl — foil iridiscente por interferencia de película delgada
// (thin-film) + reflexión anisotrópica del laminado.
// El color depende del ángulo cámara/normal, nunca de un simple gradiente.
// -----------------------------------------------------------------------------
// Requiere `lib.glsl`, que incluye el shader de entrada antes que este chunk.
#ifndef FOIL_GLSL
#define FOIL_GLSL

/**
 * @param uv     coordenada de textura de la cara
 * @param N      normal en espacio mundo (ya perturbada por el micro-relieve)
 * @param V      dirección hacia la cámara
 * @param T,B    tangente y bitangente en mundo (rayado del foil)
 * @param t      tiempo
 * @param spin   rotación acumulada de la carta: desplaza la interferencia
 * @param scale  frecuencia del thin-film
 * @param aniso  intensidad del reflejo anisotrópico
 */
vec3 foilLayer(vec2 uv, vec3 N, vec3 V, vec3 T, vec3 B, float t, float spin,
               float scale, float aniso) {
  float cosTheta = sat(dot(N, V));

  // Grano del foil: micro-variación del espesor de la película.
  float grain = fbm(uv * vec2(5.0, 7.0) + vec2(spin * 0.12, t * 0.03)) * 2.4;
  float micro = fbm(uv * vec2(140.0, 190.0)) - 0.5;

  // Espesor óptico aparente: crece hacia los ángulos rasantes.
  float thickness = scale * (1.0 - cosTheta) + grain * 1.35 + micro * 0.12 +
                    spin * 0.11 + t * 0.02;

  vec3 irid = spectrum(thickness);

  // Segunda capa desfasada -> el arcoíris no se lee como un degradado plano.
  irid = mix(irid, spectrum(thickness * 1.9 + 0.35), 0.35);

  // Reflexión anisotrópica: el laminado tiene un rayado direccional.
  vec3 Vt = normalize(V - N * dot(N, V));
  float along = dot(Vt, T);
  float streak = pow(abs(sin(along * 26.0 + grain * 7.0 + spin * 0.6)), 6.0);
  float streakB = pow(abs(sin(dot(Vt, B) * 9.0 - t * 0.15)), 10.0) * 0.4;

  // Fresnel: el foil enciende en los bordes y en ángulos rasantes.
  float fres = pow(1.0 - cosTheta, 4.0);

  float energy = 0.28 + fres * 1.15 + (streak + streakB) * aniso;
  return irid * energy;
}

#endif
