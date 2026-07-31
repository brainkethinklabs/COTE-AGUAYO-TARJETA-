/**
 * Estado de movimiento de la carta, compartido con quien lo necesite.
 *
 * La sombra tiene que saber cómo está girada la carta para deformarse con
 * ella, y el panel de diagnóstico quiere los mismos números. Pasarlo por
 * props obligaría a re-renderizar React en cada frame; un objeto mutable
 * escrito desde el `useFrame` de la carta cuesta cinco asignaciones.
 */
export const cardMotion = {
  /** Giro horizontal acumulado, en radianes. */
  spin: 0,
  /** Inclinación vertical por arrastre, en radianes. */
  pitch: 0,
  /** Inclinación por puntero o giroscopio, en radianes. */
  tiltX: 0,
  tiltY: 0,
  /** Altura de la flotación, en unidades de mundo. */
  floatY: 0,
  /** Desplazamiento lateral por paralaje. */
  offsetX: 0,
};
