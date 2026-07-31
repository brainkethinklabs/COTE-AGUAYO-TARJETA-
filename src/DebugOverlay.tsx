import { useEffect, useState } from 'react';
import { readGyroDiagnostics } from './hooks/useTiltInput';
import { detectQuality } from './quality';
import { cardMotion } from './components/Card/motionState';

const DEG = 180 / Math.PI;

/**
 * Panel de diagnóstico. Sólo aparece con `?debug` en la URL, así que la
 * experiencia normal sigue sin ningún elemento de interfaz.
 *
 * Existe porque el giroscopio no se puede verificar desde escritorio: sin
 * esto, depurarlo en un teléfono ajeno sería adivinar.
 */
export function DebugOverlay() {
  const [info, setInfo] = useState(readGyroDiagnostics);
  const [fps, setFps] = useState(0);
  const quality = detectQuality();

  useEffect(() => {
    // 300 ms: el panel no debe falsear la medición de FPS que él mismo muestra.
    const id = window.setInterval(() => setInfo(readGyroDiagnostics()), 300);
    // También accesible desde la consola del navegador del teléfono, que es
    // más fiable que leer un panel mientras se inclina el aparato.
    (window as unknown as Record<string, unknown>).cardDebug = () => ({
      ...readGyroDiagnostics(),
      motion: { ...cardMotion },
    });
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const tick = () => {
      frames++;
      const now = performance.now();
      if (now - last >= 1000) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const rows: Array<[string, string]> = [
    ['fps', String(fps)],
    ['perfil', `${quality.tier} · dpr max ${quality.maxDpr}`],
    ['devicePixelRatio', String(window.devicePixelRatio)],
    ['giroscopio', info.active ? 'ACTIVO' : 'inactivo'],
    ['estado', info.status],
    ['gyro x/y', `${info.x.toFixed(2)} / ${info.y.toFixed(2)}`],
    ['puntero x/y', `${info.pointerX.toFixed(2)} / ${info.pointerY.toFixed(2)}`],
    ['giro horizontal', `${(cardMotion.spin * DEG).toFixed(0)}°`],
    ['inclin. vertical', `${(cardMotion.pitch * DEG).toFixed(0)}°`],
    ['tilt x/y', `${(cardMotion.tiltX * DEG).toFixed(0)}° / ${(cardMotion.tiltY * DEG).toFixed(0)}°`],
    ['secure context', String(window.isSecureContext)],
    ['DeviceOrientation', String('DeviceOrientationEvent' in window)],
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 'env(safe-area-inset-top, 0px)',
        left: 0,
        padding: '10px 12px',
        font: '12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace',
        color: '#d8e0ff',
        background: 'rgba(0,0,0,0.72)',
        borderBottomRightRadius: 8,
        pointerEvents: 'none',
        zIndex: 10,
        maxWidth: '92vw',
      }}
    >
      {rows.map(([k, v]) => (
        <div key={k}>
          <span style={{ opacity: 0.55 }}>{k}</span>{' '}
          <span style={{ color: k === 'giroscopio' && info.active ? '#7dffa8' : '#fff' }}>{v}</span>
        </div>
      ))}
    </div>
  );
}
