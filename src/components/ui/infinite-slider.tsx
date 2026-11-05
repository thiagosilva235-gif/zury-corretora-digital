import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Port of ibelick/infinite-slider without framer-motion: one rAF loop translating two copies of the children.
 * Speed eases towards `speedOnHover` while hovered (the original's slow-down). The loop copy is hidden from
 * assistive tech but not `inert`, so per-item hover works on both copies; children must not be focusable.
 */
export function InfiniteSlider({
  children,
  gap = 42,
  speed = 80,
  speedOnHover,
  reverse = false,
  className = "",
  label = "Conteúdo em carrossel",
}: {
  children: ReactNode;
  gap?: number;
  speed?: number;
  speedOnHover?: number;
  reverse?: boolean;
  className?: string;
  label?: string;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const element = viewport.current;
    const rail = track.current;
    if (!element || !rail) return;
    const group = rail.firstElementChild;
    if (!(group instanceof HTMLElement)) return;
    const hoverPointer = matchMedia("(hover: hover) and (pointer: fine)");
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let last = 0;
    let offset = 0;
    let distance = 0;
    let current = speed;
    let hovering = false;
    let visible = false;
    const render = () => {
      rail.style.transform = `translate3d(${reverse ? offset - distance : -offset}px,0,0)`;
    };
    const step = (now: number) => {
      const delta = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      const target =
        hovering && hoverPointer.matches && speedOnHover !== undefined ? speedOnHover : speed;
      current += (target - current) * (1 - Math.exp(-delta / 0.22));
      offset = (offset + current * delta) % distance;
      render();
      frame = requestAnimationFrame(step);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      last = 0;
      // Pausing must keep the last pose; only the animation clock stops.
      if (!visible || document.hidden || motion.matches || distance <= 0) return;
      frame = requestAnimationFrame(step);
    };
    /** Layout is sampled on geometry changes, never in the animation frame. */
    const measure = () => {
      const phase = distance > 0 ? offset / distance : 0;
      const width = group.getBoundingClientRect().width;
      distance = Number.isFinite(width) && width > 0 ? width + gap : 0;
      if (distance > 0) {
        offset = phase * distance;
        render();
      }
      schedule();
    };
    const preference = () => {
      setReducedMotion(motion.matches);
      if (!motion.matches) element.scrollLeft = 0;
      measure();
    };
    const enter = () => {
      hovering = true;
    };
    const leave = () => {
      hovering = false;
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      visible = entry.isIntersecting;
      schedule();
    });
    const sizeObserver = new ResizeObserver(measure);
    observer.observe(element);
    sizeObserver.observe(group);
    sizeObserver.observe(element);
    element.addEventListener("load", measure, true);
    element.addEventListener("pointerenter", enter);
    element.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", schedule);
    motion.addEventListener("change", preference);
    preference();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      sizeObserver.disconnect();
      element.removeEventListener("load", measure, true);
      element.removeEventListener("pointerenter", enter);
      element.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", schedule);
      motion.removeEventListener("change", preference);
      rail.style.transform = "";
    };
  }, [gap, speed, speedOnHover, reverse]);
  return (
    <div
      ref={viewport}
      className={`infinite-slider ${className}`}
      role="group"
      aria-label={label}
      tabIndex={reducedMotion ? 0 : undefined}
      data-reduced-motion={reducedMotion}
      onKeyDown={(event) => {
        if (!reducedMotion || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
          return;
        event.preventDefault();
        const element = event.currentTarget;
        const step = element.clientWidth * 0.8;
        const left =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? element.scrollWidth
              : element.scrollLeft + (event.key === "ArrowRight" ? step : -step);
        element.scrollTo({ left, behavior: "instant" });
      }}
    >
      <div ref={track} className="infinite-slider-track" style={{ gap }}>
        <div className="infinite-slider-group" style={{ gap }}>
          {children}
        </div>
        <div className="infinite-slider-group" style={{ gap }} aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
