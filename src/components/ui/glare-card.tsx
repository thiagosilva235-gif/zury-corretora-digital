import { useRef, type ComponentPropsWithoutRef } from "react";
import "./glare-card.css";

/**
 * Adapted Glare Card: pointer-tracked satin glare plus the original's diagonal foil, re-tuned from rainbow to
 * silver. `tilt` restores the original's 3D lean (rotate factor 0.4); without it the card stays still.
 */
export function GlareCard({
  className = "",
  tilt = false,
  children,
  ...props
}: ComponentPropsWithoutRef<"article"> & { tilt?: boolean }) {
  const card = useRef<HTMLElement>(null);
  return (
    <article
      ref={card}
      {...props}
      data-tilt={tilt || undefined}
      className={`glare-card ${className}`}
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse") return;
        const element = card.current;
        if (!element) return;
        const bounds = element.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width) * 100;
        const y = ((event.clientY - bounds.top) / bounds.height) * 100;
        element.style.setProperty("--glare-x", `${x}%`);
        element.style.setProperty("--glare-y", `${y}%`);
        element.style.setProperty("--foil-x", `${50 + x / 4 - 12.5}%`);
        element.style.setProperty("--foil-y", `${50 + y / 3 - 16.67}%`);
        if (tilt) {
          element.style.setProperty("--r-x", `${(-(x - 50) / 3.5) * 0.4}deg`);
          element.style.setProperty("--r-y", `${((y - 50) / 2) * 0.4}deg`);
        }
      }}
      onPointerLeave={() => {
        card.current?.style.removeProperty("--r-x");
        card.current?.style.removeProperty("--r-y");
      }}
    >
      <span className="glare-card-light" aria-hidden="true" />
      <span className="glare-card-foil" aria-hidden="true" />
      {children}
    </article>
  );
}
