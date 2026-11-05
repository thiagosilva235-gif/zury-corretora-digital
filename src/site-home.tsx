import { Headset, ShieldCheck, Zap } from "lucide-react";
import { Companies } from "@/components/site/companies";
import {
  differentiatorDetails,
  differentiators,
  heroLead,
  heroSubtitle,
  heroTitleParts,
  institutionalLinks,
  navigationForSite,
  registration,
  services,
  solutionCount,
} from "@/lib/content";
import { ExclusiveBenefits } from "@/components/site/exclusive-benefits";
import { ReferralProgram } from "@/components/site/referral-program";
import { SiteHeader } from "@/components/site/header";
import { ChannelsPopover } from "@/components/site/channels-popover";
import { Solutions } from "@/components/site/solutions";
import { ProcessBento } from "@/components/site/process-bento";
import { SiteMotion } from "@/components/site/motion";
import { FloatingWhatsApp } from "@/components/site/floating-whatsapp";
import { SiteFooter } from "@/components/site/site-footer";
import { QuoteDialog, QuoteTrigger } from "@/components/site/quote-menu";
import { HeroScrollVideo } from "@/components/site/hero-scroll-video";
import { Guilloche } from "@/components/ui/guilloche";
import { CanvasReveal } from "@/components/ui/canvas-reveal";
import { AwardBadge } from "@/components/ui/award-badge";
import { WhatsAppIcon } from "@/components/site/whatsapp-icon";
import { CtaMarquee } from "@/components/ui/cta-marquee";
import { SilverTrace } from "@/components/ui/silver-trace";
import { publicPhoto } from "@/lib/public-photo";

const differenceIcons = [ShieldCheck, Headset, Zap];
const motto = heroSubtitle.split("/");

/**
 * Illustrative portraits of the public the brokerage serves, not clients. Unsplash License.
 * produtor-rural photo-1641405138782-c941abb01567, caminhoneiro photo-1698465358843-5f5a24271bfd,
 * empresaria photo-1580489944761-15a19d654956, familia photo-1586262184027-4f1ff282ca5c.
 */
const audience = ["produtor-rural", "caminhoneiro", "empresaria", "familia"];

export default function Home() {
  // Both sections are public at the owner's request; navbar anchors always have real destinations.
  const showReferrals = true;
  const showBenefits = true;
  const portraits = audience.flatMap((slot) => {
    const src = publicPhoto("people", slot);
    return src ? [src] : [];
  });
  return (
    <div className="zury-site">
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      <SiteHeader items={navigationForSite(showReferrals, showBenefits)} />
      <main id="conteudo" tabIndex={-1}>
        <div className="hero-scroll">
          <HeroScrollVideo />
          <section id="inicio" className="hero" tabIndex={-1} aria-labelledby="hero-title">
            <div className="container hero-content">
              <div className="hero-copy">
                <h1 id="hero-title">
                  {heroTitleParts.map((line, index) => (
                    <span
                      className={`hero-line${index === heroTitleParts.length - 1 ? " hero-line-accent" : ""}`}
                      key={line}
                    >
                      {line}
                      {index === heroTitleParts.length - 1 && (
                        <span className="hero-text-shine" aria-hidden="true">
                          {line}
                        </span>
                      )}
                    </span>
                  ))}
                </h1>
                <p className="hero-lead">{heroLead}</p>
                <div className="hero-actions">
                  <QuoteTrigger variant="primary" />
                  <button
                    type="button"
                    className="btn btn-secondary hero-contact green-cta"
                    popoverTarget="nav-contact-channels"
                    aria-haspopup="dialog"
                  >
                    <WhatsAppIcon size={20} />
                    <span>FALE COM UM ESPECIALISTA</span>
                    <SilverTrace loop tone="green" />
                  </button>
                </div>
                {portraits.length > 0 && (
                  <p className="hero-proof">
                    <span className="hero-proof-faces" aria-hidden="true">
                      {portraits.map((src) => (
                        <img key={src} src={src} alt="" width={96} height={96} loading="eager" />
                      ))}
                    </span>
                    <span>
                      <strong>{String(services.length).padStart(2, "0")} áreas</strong> e{" "}
                      {solutionCount} soluções
                    </span>
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
        <Solutions />
        <ProcessBento />
        <section
          id="sobre"
          className="section about"
          tabIndex={-1}
          aria-labelledby="differences-title"
        >
          <Guilloche originX={0.08} originY={0.18} size={0.8} alpha={0.07} />
          <div className="container">
            <div className="about-head">
              <h2 id="differences-title" data-split>
                NOSSOS DIFERENCIAIS
              </h2>
              <AwardBadge
                href={institutionalLinks.susep}
                kicker="CORRETORA AUTORIZADA SUSEP"
                title={`REGISTRO ${registration.susep}`}
              />
            </div>
            <ol className="difference-list">
              {differentiators.map((item, index) => {
                const Icon = differenceIcons[index]!;
                return (
                  <li className="difference-row" key={item.number}>
                    <CanvasReveal />
                    <span className="card-icon">
                      <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
                    </span>
                    <h3 className="difference-title fill-text" data-fill data-text={item.title}>
                      {item.title}
                    </h3>
                    <ul className="difference-copy" data-scrub-words>
                      {differentiatorDetails(item.description).map((detail) => (
                        <li key={detail}>{detail}</li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
        <Companies />
        {showReferrals && <ReferralProgram />}
        {showBenefits && <ExclusiveBenefits />}
        <CtaMarquee
          id="cotacao"
          phrase={motto.join(" · ")}
          heading="PROTEJA O QUE VOCÊ CONSTRUIU."
          note="Compare propostas de diferentes seguradoras, com acompanhamento da cotação à resolução de sinistros."
          footnote={differentiators[1].description}
          texture={<Guilloche originX={0.82} originY={0.5} size={0.75} alpha={0.1} />}
        >
          <QuoteTrigger variant="primary" />
          <button
            type="button"
            className="btn btn-secondary hero-contact green-cta"
            popoverTarget="contact-channels"
            aria-haspopup="dialog"
          >
            <WhatsAppIcon size={20} />
            <span>FALE COM UM ESPECIALISTA</span>
            <SilverTrace loop tone="green" />
          </button>
        </CtaMarquee>
      </main>
      <SiteFooter />
      <ChannelsPopover id="contact-channels" title="Contatos" placement="above" />
      <ChannelsPopover id="nav-contact-channels" title="Contato" placement="below" />
      <ChannelsPopover id="social-channels" title="Redes sociais" kind="social" placement="below" />
      <QuoteDialog />
      <FloatingWhatsApp />
      <SiteMotion />
    </div>
  );
}
