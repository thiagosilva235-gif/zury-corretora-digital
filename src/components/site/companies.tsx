import { companyLogos } from "@/lib/content";
import { LogoCloud } from "@/components/ui/logo-cloud";
import { Velaris } from "@/components/ui/velaris";
import { useEffect, useState } from "react";
import "./companies.css";

/** Living graphite band (Velaris) carrying the monochrome logo rail; each logo takes its colour on hover. */
export function Companies() {
  const [paused, setPaused] = useState(true);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPaused(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  return (
    <section id="companhias" className="companies" aria-labelledby="companies-title" tabIndex={-1}>
      <Velaris
        className="companies-velaris"
        bg="#0a0c0e"
        colors={["#1f2529", "#3b444a", "#111417", "#6f797f"]}
        speed={0.8}
        grain={0.4}
        paused={paused}
      />
      <div className="container companies-inner">
        <h2 id="companies-title" className="companies-title" data-split>
          COMPANHIAS
        </h2>
        <LogoCloud logos={companyLogos} label="Logos das companhias parceiras" />
        <p className="companies-meta" data-reveal>
          <strong>{companyLogos.length}</strong> COMPANHIAS PARCEIRAS
        </p>
      </div>
    </section>
  );
}
