import { useRef, type PointerEvent } from "react";
import { ShieldCheck } from "lucide-react";
import "./award-badge.css";

/**
 * Adapted Award Badge: a satin credential plate that tilts slightly towards the pointer while a specular band
 * crosses its face. Links to the official SUSEP lookup; the registration number is printed, never inferred.
 */
export function AwardBadge({
  href,
  kicker,
  title,
}: {
  href: string;
  kicker: string;
  title: string;
}) {
  const plate = useRef<HTMLAnchorElement>(null);
  const shine = useRef<HTMLSpanElement>(null);
  const move = (event: PointerEvent<HTMLAnchorElement>) => {
    if (event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(-0.5, Math.min(0.5, (event.clientX - bounds.left) / bounds.width - 0.5));
    const y = Math.max(-0.5, Math.min(0.5, (event.clientY - bounds.top) / bounds.height - 0.5));
    event.currentTarget.style.setProperty("--tilt-x", `${(-y * 10).toFixed(2)}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${(x * 12).toFixed(2)}deg`);
    if (shine.current)
      shine.current.style.transform = `translate3d(${(x * bounds.width).toFixed(2)}px, 0, 0)`;
    event.currentTarget.dataset["pointerActive"] = "true";
  };
  const settle = () => {
    plate.current?.style.removeProperty("--tilt-x");
    plate.current?.style.removeProperty("--tilt-y");
    if (plate.current) delete plate.current.dataset["pointerActive"];
  };
  return (
    <a
      ref={plate}
      className="award-badge"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${kicker} ${title}. Consultar no site da SUSEP (abre em nova aba)`}
      onPointerEnter={move}
      onPointerMove={move}
      onPointerLeave={settle}
      onBlur={settle}
    >
      <span className="award-badge-plate">
        <span className="award-badge-mark">
          <ShieldCheck size={26} strokeWidth={1.4} aria-hidden="true" />
        </span>
        <span className="award-badge-copy">
          <small>{kicker}</small>
          <strong>{title}</strong>
        </span>
        <span ref={shine} className="award-badge-shine" aria-hidden="true" />
      </span>
    </a>
  );
}
