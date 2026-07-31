// -----------------------------------------------------------------------------
// particles.vert.glsl — motas de energía alrededor de la carta.
// Toda la animación ocurre en GPU: un solo draw call, cero trabajo en CPU.
// -----------------------------------------------------------------------------
#include ./lib.glsl

uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform float uIntro;

attribute vec3 aSeed;   // (fase, velocidad, tinte)
attribute float aScale;

varying float vAlpha;
varying float vTint;

void main() {
  vec3 pos = position;

  float phase = aSeed.x * 6.28318;
  float speed = aSeed.y;

  // Deriva orbital lenta: sube, gira y vuelve — nunca cae como nieve.
  float t = uTime * speed;
  pos.y += sin(t * 0.6 + phase) * 0.55 + mod(t * 0.18 + aSeed.x, 1.0) * 0.4 - 0.2;
  pos.x += cos(t * 0.45 + phase * 1.7) * 0.35;
  pos.z += sin(t * 0.38 + phase * 2.3) * 0.35;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  // Atenuación por perspectiva.
  gl_PointSize = uSize * aScale * uPixelRatio * (1.0 / -mv.z);

  // Latido de intensidad, independiente por partícula.
  float pulse = 0.35 + 0.65 * pow(sat(sin(t * 1.6 + phase) * 0.5 + 0.5), 2.0);
  vAlpha = pulse * uIntro;
  vTint = aSeed.z;
}
