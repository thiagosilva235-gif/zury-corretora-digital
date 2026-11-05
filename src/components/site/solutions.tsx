import { CarFront, HeartPulse, House, Landmark, Scale, Sprout } from "lucide-react";
import { services, solutionCount } from "@/lib/content";
import { useSnapCarousel } from "@/components/ui/use-snap-carousel";
import { publicPhoto } from "@/lib/public-photo";
import { QuoteTrigger, openQuote } from "./quote-menu";
import { TiltedGridHero, type TiltedGridImage } from "@/components/ui/tilted-grid-hero";
import { Guilloche } from "@/components/ui/guilloche";
import "./solutions.css";

const icons = { House, HeartPulse, Sprout, CarFront, Landmark, Scale };
/**
 * Curved-row photography, one per area in catalog order: public/zoom/<slot>.(webp|jpg|png); absent files are
 * skipped. Unsplash License (free commercial use, no attribution required), photo IDs — bens WaC-JFfF21M,
 * vida-saude NpiHxPAVoFg, rural iasJ7GvIhz0, automotivo nYrST00HaDw, credito TdwYsTmA2Bc,
 * responsabilidade-civil IvEYfb-3B70 (unsplash.com/photos/<id>).
 */
const curveSlots = [
  "bens",
  "vida-saude",
  "rural",
  "automotivo",
  "credito",
  "responsabilidade-civil",
];

/** Native public photo URLs are shared by the curved tiles and their slices. */
function curveImages(): TiltedGridImage[] {
  return curveSlots.flatMap((slot) => {
    const src = publicPhoto("zoom", slot);
    return src ? [{ src }] : [];
  });
}

export function Solutions() {
  const { track, current, go } = useSnapCarousel();
  return (
    <section
      id="servicos"
      className="section solutions surface-light"
      tabIndex={-1}
      aria-labelledby="solutions-title"
    >
      <Guilloche tone="ink" originX={0.08} originY={0.18} size={0.8} alpha={0.07} />
      <div className="container">
        <div className="solutions-head">
          <div className="solutions-intro" data-reveal>
            <h2 id="solutions-title" data-split>
              NOSSAS SOLUÇÕES
            </h2>
            <p>Escolha a área e siga direto para a cotação.</p>
            <dl className="solutions-figures">
              <div>
                <dt>ÁREAS</dt>
                <dd>{String(services.length).padStart(2, "0")}</dd>
              </div>
              <div>
                <dt>SOLUÇÕES</dt>
                <dd>{solutionCount}</dd>
              </div>
            </dl>
          </div>
          <TiltedGridHero
            className="solutions-curve"
            images={curveImages()}
            tileHeight={52}
            axis={50}
            speed={4}
            curve={50}
            gap={3}
            aria-hidden="true"
          />
        </div>
        <div ref={track} className="service-catalog">
          {services.map((service) => {
            const Icon = icons[service.icon];
            return (
              <article
                className="catalog-entry"
                data-reveal="wipe"
                key={service.number}
                aria-labelledby={`catalog-${service.number}`}
              >
                <h3 id={`catalog-${service.number}`} className="catalog-title">
                  <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
                  {service.title}
                </h3>
                <ol className="catalog-list">
                  {service.items.map((item) => (
                    <li key={item}>
                      <button
                        type="button"
                        className="catalog-item"
                        aria-haspopup="dialog"
                        aria-controls="quote-dialog"
                        aria-label={`Solicitar cotação: ${item}, ${service.title}`}
                        onClick={(event) =>
                          openQuote({
                            area: service.number,
                            solution: item,
                            trigger: event.currentTarget,
                          })
                        }
                      >
                        <span className="catalog-item-bullet" aria-hidden="true">
                          •
                        </span>
                        <span className="catalog-item-label">{item}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </article>
            );
          })}
        </div>
        <div className="catalog-dots" role="group" aria-label="Navegar entre as áreas">
          {services.map((service, index) => (
            <button
              key={service.number}
              type="button"
              aria-label={`Área ${service.number}: ${service.title}`}
              aria-current={index === current ? "true" : undefined}
              onClick={() => go(index)}
            />
          ))}
        </div>
        <div className="solutions-cta" data-reveal>
          <QuoteTrigger
            variant="primary"
            className="solutions-quote-cta quote-graphite quote-graphite--glow"
          >
            SOLICITAR COTAÇÃO
          </QuoteTrigger>
        </div>
      </div>
    </section>
  );
}
