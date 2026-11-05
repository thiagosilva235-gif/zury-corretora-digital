import { benefitPartners, benefitsContent } from "@/lib/content";
import { Guilloche } from "@/components/ui/guilloche";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import "./exclusive-benefits.css";

/** Unframed partner marks retain their offers and the shared continuous rail. */
export function ExclusiveBenefits() {
  return (
    <section
      id="beneficios"
      className="section benefits surface-light"
      tabIndex={-1}
      aria-labelledby="benefits-title"
    >
      <Guilloche tone="ink" originX={0.08} originY={0.18} size={0.8} alpha={0.07} />
      <div className="container benefits-inner">
        <div className="section-head">
          <h2 id="benefits-title" data-split>
            {benefitsContent.title}
          </h2>
          <p className="section-meta">{benefitPartners.length} PARCEIROS</p>
        </div>
        <InfiniteSlider
          className="benefit-carousel"
          gap={32}
          reverse
          speed={120}
          label="Benefícios exclusivos"
        >
          {benefitPartners.map((partner) => (
            <article className={`benefit-partner benefit-logo-${partner.id}`} key={partner.id}>
              <div className="benefit-logo-stage">
                {partner.logo && (
                  <img
                    src={partner.logo}
                    alt=""
                    width={partner.width}
                    height={partner.height}
                    loading="lazy"
                    decoding="async"
                    sizes="220px"
                    className="partner-logo"
                  />
                )}
              </div>
              <div className="benefit-copy">
                <h3>{partner.name}</h3>
                <p className="benefit-offer">{partner.offer}</p>
              </div>
            </article>
          ))}
        </InfiniteSlider>
      </div>
    </section>
  );
}
