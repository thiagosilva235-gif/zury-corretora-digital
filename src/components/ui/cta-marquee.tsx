import { useEffect, useRef, type ReactNode } from "react";
import "./cta-marquee.css";

/** Repeats inside each half so one half always outruns the viewport; the loop never shows a gap. */
const REPEATS = 6;

/** Adapted CTA 69: giant drifting statement behind a single decisive call to action. */
export function CtaMarquee({
  id,
  phrase,
  heading,
  note,
  footnote,
  children,
  texture,
}: {
  id: string;
  phrase: string;
  heading: string;
  note: string;
  footnote: string;
  children: ReactNode;
  texture?: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let visible = false;
    const updatePlayback = () => {
      element.dataset["motionPaused"] = String(!visible || document.hidden);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      visible = entry.isIntersecting;
      updatePlayback();
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", updatePlayback);
    updatePlayback();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", updatePlayback);
      element.dataset["motionPaused"] = "true";
    };
  }, []);
  const line = `${phrase} · `.repeat(REPEATS);
  return (
    <section
      ref={ref}
      id={id}
      className="cta-marquee"
      aria-labelledby={`${id}-title`}
      data-motion-paused="true"
    >
      {texture}
      <div className="cta-marquee-backdrop" aria-hidden="true">
        <div className="cta-marquee-track">
          {[0, 1].map((copy) => (
            <span key={copy}>{line}</span>
          ))}
        </div>
      </div>
      <div className="container cta-marquee-body">
        <h2 id={`${id}-title`} data-split>
          {heading}
        </h2>
        <p className="cta-marquee-note">{note}</p>
        <div className="cta-marquee-actions">{children}</div>
        <p className="cta-marquee-footnote">{footnote}</p>
      </div>
    </section>
  );
}
