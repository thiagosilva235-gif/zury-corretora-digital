import { useEffect, useRef } from "react";
import "./silver-trace.css";

/**
 * Silver Light Trace: a decorative satin ring on a control's edge with a light that travels it. Place it inside a
 * positioned, isolated control; it takes the control's radius. `loop` keeps the beam running on selected CTAs;
 * otherwise it passes on hover/focus. Green sits outside the face and shares a wall-clock phase across routes.
 */
export function SilverTrace({
  loop = false,
  tone = "silver",
}: {
  loop?: boolean;
  tone?: "silver" | "graphite" | "green";
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!loop || tone !== "green") return;
    const sync = () => {
      if (document.hidden) return;
      // Use the animation timeline's frame time: passive effects can run tens of milliseconds apart
      // within one frame under load, while Date.now() advances and makes the beams drift apart.
      const frameTime = document.timeline.currentTime;
      const phase =
        (performance.timeOrigin + (typeof frameTime === "number" ? frameTime : performance.now())) %
        3600;
      for (const animation of ref.current?.getAnimations({ subtree: true }) ?? []) {
        if ("animationName" in animation && animation.animationName === "silver-trace-loop") {
          animation.currentTime = phase;
        }
      }
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pageshow", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pageshow", sync);
    };
  }, [loop, tone]);
  const classes = `silver-trace${loop ? " silver-trace--loop" : ""}${tone !== "silver" ? ` silver-trace--${tone}` : ""}`;
  return <span ref={ref} className={classes} aria-hidden="true" />;
}
