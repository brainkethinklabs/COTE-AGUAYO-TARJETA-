import { Environment as DreiEnvironment, Lightformer } from '@react-three/drei';

/**
 * HDRI procedural.
 *
 * Se genera en GPU a partir de unos pocos `Lightformer`: cero descargas, cero
 * assets externos (importante para alojar el build en GitHub Pages) y control
 * total sobre lo que refleja el canto metálico.
 *
 * `frames={1}` lo cocina una sola vez: no cuesta nada por frame.
 */
export function Environment() {
  return (
    <DreiEnvironment frames={1} resolution={256} background={false}>
      {/* Softbox principal, alargado: deja un reflejo vertical limpio en el canto. */}
      <Lightformer
        form="rect"
        intensity={3.2}
        color="#ffffff"
        position={[3, 2, 4]}
        rotation={[0, -Math.PI / 4, 0]}
        scale={[6, 10, 1]}
      />
      {/* Rebote frío por el lado opuesto. */}
      <Lightformer
        form="rect"
        intensity={1.1}
        color="#4d6bff"
        position={[-4, -1, 3]}
        rotation={[0, Math.PI / 3, 0]}
        scale={[6, 8, 1]}
      />
      {/* Barra cálida superior: el destello que recorre el marco al girar. */}
      <Lightformer
        form="rect"
        intensity={2.4}
        color="#ffc27a"
        position={[0, 5, 1]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[10, 2, 1]}
      />
      {/* Contraluz que dibuja el borde por detrás. */}
      <Lightformer
        form="ring"
        intensity={1.6}
        color="#ffffff"
        position={[-1, 1, -5]}
        scale={5}
      />
    </DreiEnvironment>
  );
}
