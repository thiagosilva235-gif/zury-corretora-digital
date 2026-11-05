import type { CompanyLogo } from "@/lib/content";
import { InfiniteSlider } from "./infinite-slider";
import "./logo-cloud.css";

/** Floating original marks, masked edges and reverse drift that slows on hover. */
export function LogoCloud({ logos, label }: { logos: readonly CompanyLogo[]; label: string }) {
  return (
    <div className="logo-cloud">
      <div className="logo-cloud-rail" role="region" aria-label={label}>
        <InfiniteSlider gap={18} reverse speed={120} speedOnHover={25} label="Companhias parceiras">
          {logos.map((logo) => (
            <span className="logo-cloud-item" key={logo.id}>
              <img
                className="logo-cloud-logo"
                src={logo.src}
                alt={logo.name}
                width={logo.width}
                height={logo.height}
                loading="lazy"
                decoding="async"
                sizes="200px"
                style={{ width: Math.round(logo.displayWidth * 0.78) }}
                draggable={false}
              />
            </span>
          ))}
        </InfiniteSlider>
      </div>
    </div>
  );
}
