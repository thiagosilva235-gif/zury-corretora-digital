import type { ReactNode } from "react";
import "./bento.css";

export type BentoImage = { src: string; alt: string; position?: string | undefined };

/**
 * Tall graphic above a frosted copy panel that rises over it, as in the original card.
 * A supplied photograph replaces the drawn graphic; hover only drifts the graphic (CSS).
 */
export function BentoCard({
  eyebrow,
  title,
  description,
  graphic,
  image,
  index,
  className = "",
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  description: ReactNode;
  graphic?: ReactNode;
  image?: BentoImage | undefined;
  /** Large step numeral over the card's top corner; decorative, the eyebrow carries the label. */
  index?: string;
  className?: string;
}) {
  return (
    <article className={`bento-card ${className}`} data-reveal="wipe">
      {(image || graphic) && (
        <div className="bento-graphic">
          {image ? (
            <img
              className="bento-image"
              src={image.src}
              alt={image.alt}
              loading="lazy"
              decoding="async"
              sizes="(max-width: 767px) 100vw, 50vw"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectPosition: image.position ?? "50% 35%",
              }}
            />
          ) : (
            graphic
          )}
        </div>
      )}
      {index && (
        <span className="bento-index" aria-hidden="true">
          {index}
        </span>
      )}
      <div className="bento-copy">
        <p className="bento-eyebrow">{eyebrow}</p>
        <h3 className="bento-title">{title}</h3>
        <p className="bento-description">{description}</p>
      </div>
    </article>
  );
}
