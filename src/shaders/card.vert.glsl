// -----------------------------------------------------------------------------
// card.vert.glsl — vértice de las caras de la carta.
// Añade un alabeo mínimo (el cartón real nunca es perfectamente plano) y
// entrega la base tangente en espacio mundo para el foil anisotrópico.
// -----------------------------------------------------------------------------
uniform float uCurvature;
uniform vec2 uSize;

varying vec2 vUv;
varying vec3 vWPos;
varying vec3 vN;
varying vec3 vT;
varying vec3 vB;

void main() {
  vUv = uv;

  vec2 c = uv * 2.0 - 1.0;
  float z = uCurvature * (c.x * c.x + c.y * c.y * 0.4);

  vec3 pos = position + normal * z;

  // Normal analítica del alabeo, en espacio local de la cara.
  vec3 localN = normalize(vec3(
    -uCurvature * 4.0 * c.x / uSize.x,
    -uCurvature * 1.6 * c.y / uSize.y,
    1.0
  ));
  // `normal` local es (0,0,1) para la cara frontal: basta reorientar en Z.
  localN.z *= sign(normal.z);

  mat3 nm = mat3(modelMatrix);
  vec4 wp = modelMatrix * vec4(pos, 1.0);

  vWPos = wp.xyz;
  vN = normalize(nm * localN);
  vT = normalize(nm * vec3(1.0, 0.0, 0.0));
  vB = normalize(cross(vN, vT));

  gl_Position = projectionMatrix * viewMatrix * wp;
}
