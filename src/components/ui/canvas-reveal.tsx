import { useEffect, useRef } from "react";

const SILVER = [215, 220, 224] as const;
const LEVELS = [0.06, 0.06, 0.1, 0.1, 0.16, 0.16, 0.24, 0.32, 0.5, 0.72] as const;

/**
 * Adapted Canvas Reveal Effect: a dot matrix that ripples outward from the pointer when its parent row is
 * hovered or focused. 2D canvas, rendered only while active; nothing runs at rest.
 */
export function CanvasReveal({
  color = SILVER,
  cell = 7,
  dot = 2,
  levels = LEVELS,
  trigger,
}: {
  color?: readonly [number, number, number];
  cell?: number;
  dot?: number;
  levels?: readonly number[];
  trigger?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const frameBox = canvas?.parentElement;
    const host = (trigger ? canvas?.closest<HTMLElement>(trigger) : null) ?? frameBox;
    const context = canvas?.getContext("2d");
    if (!canvas || !frameBox || !host || !context) return;
    let frame = 0;
    let start = 0;
    let origin = { x: 0, y: 0 };
    let active = false;
    let width = 0;
    let height = 0;
    const seed = (x: number, y: number) => {
      const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      return value - Math.floor(value);
    };
    const render = (now: number) => {
      const elapsed = (now - start) / 1000;
      context.clearRect(0, 0, width, height);
      const columns = Math.ceil(width / cell);
      const rows = Math.ceil(height / cell);
      const [r, g, b] = color;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          const cx = x * cell + cell / 2;
          const cy = y * cell + cell / 2;
          const offset = Math.hypot(cx - origin.x, cy - origin.y) / 900 + seed(x, y) * 0.15;
          if (elapsed * 1.6 < offset) continue;
          const phase = seed(x * Math.floor(elapsed / 4 + seed(y, x) + 4) + 1, y);
          const opacity = levels[Math.min(levels.length - 1, Math.floor(phase * levels.length))];
          context.fillStyle = `rgba(${r},${g},${b},${opacity})`;
          context.fillRect(cx - dot / 2, cy - dot / 2, dot, dot);
        }
      }
      if (active) frame = requestAnimationFrame(render);
    };
    const enter = (event: Event) => {
      if (active) return;
      const bounds = frameBox.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio, 2);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      origin =
        event instanceof PointerEvent
          ? { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
          : { x: width / 2, y: height / 2 };
      active = true;
      start = performance.now();
      host.dataset["revealing"] = "true";
      frame = requestAnimationFrame(render);
    };
    const leave = (event: Event) => {
      if (
        event instanceof FocusEvent &&
        event.relatedTarget instanceof Node &&
        host.contains(event.relatedTarget)
      )
        return;
      if (event.type === "pointerleave" && host.contains(document.activeElement)) return;
      active = false;
      cancelAnimationFrame(frame);
      delete host.dataset["revealing"];
    };
    host.addEventListener("pointerenter", enter);
    host.addEventListener("pointerleave", leave);
    host.addEventListener("focusin", enter);
    host.addEventListener("focusout", leave);
    return () => {
      cancelAnimationFrame(frame);
      host.removeEventListener("pointerenter", enter);
      host.removeEventListener("pointerleave", leave);
      host.removeEventListener("focusin", enter);
      host.removeEventListener("focusout", leave);
    };
  }, [color, cell, dot, levels, trigger]);
  return <canvas ref={canvasRef} className="canvas-reveal" aria-hidden="true" />;
}
