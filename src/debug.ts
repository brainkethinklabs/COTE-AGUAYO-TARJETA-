/** `?debug` en la URL muestra el panel de diagnóstico. */
export const DEBUG =
  typeof location !== 'undefined' && location.search.includes('debug');
