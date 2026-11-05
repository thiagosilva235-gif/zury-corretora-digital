import { useEffect, useRef } from "react";

/**
 * Security-print rosette (the guilloché of policies, certificates and banknotes), drawn once per size on canvas.
 * Static texture: no animation loop, no image asset. `tone="ink"` draws graphite lines for paper (surface-light)
 * sections; the default silver lines are for the graphite sections.
 */
export function Guilloche({
  className = "",
  originX = 0.78,
  originY = 0.5,
  size = 0.62,
  rings = 16,
  lobes = 36,
  alpha = 0.12,
  tone = "silver",
}: {
  className?: string;
  originX?: number;
  originY?: number;
  size?: number;
  rings?: number;
  lobes?: number;
  alpha?: number;
  tone?: "silver" | "ink";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    const context = canvas?.getContext("2d");
    if (!canvas || !container || !context) return;
    let drawnWidth = -1;
    let drawnHeight = -1;
    let near = false;
    let frame = 0;
    const draw = () => {
      frame = 0;
      const width = container.clientWidth;
      const height = container.clientHeight;
      // Same size, same pixels: skip the ~23k-segment redraw (ResizeObserver also fires on observe).
      if (!near || (width === drawnWidth && height === drawnHeight)) return;
      drawnWidth = width;
      drawnHeight = height;
      const ratio = Math.min(window.devicePixelRatio, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      const cx = width * originX;
      const cy = height * originY;
      const outer = Math.min(Math.max(width * 0.5, 320), height) * size;
      const inner = outer * 0.3;
      const step = (outer - inner) / rings;
      context.lineWidth = 0.7;
      for (let ring = 0; ring < rings; ring++) {
        const radius = inner + ring * step;
        const amplitude = step * 0.62;
        const fade = 1 - Math.abs(ring / rings - 0.45) * 1.1;
        context.strokeStyle = `rgba(${tone === "ink" ? "20,23,26" : "215,220,224"},${(alpha * Math.max(0.25, fade)).toFixed(3)})`;
        for (const phase of [0, Math.PI]) {
          context.beginPath();
          for (let sample = 0; sample <= 720; sample++) {
            const angle = (sample / 720) * Math.PI * 2;
            const r =
              radius +
              amplitude * Math.sin(lobes * angle + phase + ring * 0.35) * Math.cos(3 * angle);
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            if (sample === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
          }
          context.stroke();
        }
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const sizeObserver = new ResizeObserver(schedule);
    sizeObserver.observe(container);
    // Drawn one viewport ahead of arrival, so it is ready before it scrolls in yet costs nothing at load.
    const viewObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        near = true;
        viewObserver.disconnect();
        draw();
      },
      { rootMargin: "100% 0px" },
    );
    viewObserver.observe(container);
    return () => {
      cancelAnimationFrame(frame);
      sizeObserver.disconnect();
      viewObserver.disconnect();
    };
  }, [originX, originY, size, rings, lobes, alpha, tone]);
  return <canvas ref={canvasRef} className={`guilloche ${className}`} aria-hidden="true" />;
}
