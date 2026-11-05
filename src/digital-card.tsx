import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { OfficialLogo } from "@/components/site/official-logo";
import { QuoteDialog, QuoteTrigger } from "@/components/site/quote-menu";
import { ChannelsPopover } from "@/components/site/channels-popover";
import { SilverTrace } from "@/components/ui/silver-trace";
import {
  digitalChannels,
  googleReviewHref,
  digitalCardNavigation,
  registration,
} from "@/lib/content";
import "@/components/site/quote-cta.css";
import "@/components/site/brand-shine.css";
import "./digital-card.css";

const words = ["vida.", "família.", "empresa."];
const contactsPopoverId = "card-contact-channels";

/**
 * One WhatsApp control; it opens the site's shared contacts popover (same people and links as the home page),
 * rendered outside .card-page so it inherits the site's own type exactly as on the home page.
 */
function CardContacts() {
  return (
    <button
      id="card-contacts-title"
      type="button"
      className="card-control card-whatsapp"
      popoverTarget={contactsPopoverId}
      aria-haspopup="dialog"
    >
      <SilverTrace />
      <img src="/card-icons/whatsapp.svg" width={19} height={19} alt="" />
      <span>WhatsApp</span>
    </button>
  );
}

function CardChannels() {
  const channels = [
    {
      label: "Site institucional",
      href: "/",
      icon: <img src="/brand/zury-monograma-branco.svg" width={19} height={19} alt="" />,
    },
    {
      label: "Instagram",
      href: digitalChannels.instagram.href,
      icon: <span className="card-instagram-icon" aria-hidden="true" />,
    },
    {
      label: "TikTok",
      href: digitalChannels.tiktok.href,
      icon: <img src="/card-icons/tiktok.svg" width={19} height={19} alt="" />,
    },
    {
      label: "Facebook",
      href: digitalChannels.facebook.href,
      icon: <img src="/card-icons/facebook.svg" width={19} height={19} alt="" />,
    },
    {
      label: "E-mail",
      href: `mailto:${digitalChannels.email}`,
      icon: <Mail size={19} aria-hidden="true" />,
    },
    {
      label: "Nos avalie",
      href: googleReviewHref,
      icon: <img src="/card-icons/google.svg" width={19} height={19} alt="" />,
    },
  ];
  return (
    <section className="card-channels" aria-label="Outros caminhos">
      <ul>
        {channels.map(({ label, href, icon }, index) => {
          const external = href.startsWith("https:");
          return (
            <li key={label}>
              <a
                className="card-control card-channel"
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
              >
                <SilverTrace />
                {icon}
                <span>{label}</span>
                {external && <span className="sr-only"> (abre em nova aba)</span>}
              </a>
              {index === 0 && <CardContacts />}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function DigitalCard() {
  const [motionPaused, setMotionPaused] = useState(false);
  useEffect(() => {
    const visibility = () => setMotionPaused(document.hidden);
    visibility();
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, []);
  return (
    <>
      <div className="card-page" data-paused={motionPaused}>
        <a className="skip-link" href="#card-contacts-title">
          Pular para os contatos
        </a>
        <picture className="card-atmosphere" aria-hidden="true">
          <source
            media="(min-width: 1100px) and (min-aspect-ratio: 2/1)"
            srcSet="/backgrounds/digital-card/ultrawide.webp"
            type="image/webp"
          />
          <source
            media="(min-width: 1100px) and (min-aspect-ratio: 3/2)"
            srcSet="/backgrounds/digital-card/desktop.webp"
            type="image/webp"
          />
          <source
            media="(orientation: landscape)"
            srcSet="/backgrounds/digital-card/tablet-landscape.webp"
            type="image/webp"
          />
          <source
            media="(min-width: 768px)"
            srcSet="/backgrounds/digital-card/tablet-portrait.webp"
            type="image/webp"
          />
          <img
            src="/backgrounds/digital-card/mobile.webp"
            alt=""
            width={1882}
            height={3344}
            fetchPriority="high"
            decoding="async"
          />
        </picture>
        <div className="card-shield-overlay" aria-hidden="true">
          <div className="card-shield-plane">
            <img
              src="/brand/zury-escudo-original-1254.png"
              alt=""
              width={1254}
              height={1254}
              decoding="async"
            />
          </div>
        </div>
        <main id="card-main" tabIndex={-1}>
          <div className="card-wrap">
            <header className="card-masthead">
              <a
                href="/"
                className="card-brand brand-shine"
                aria-label="ZURY CORRETORA — site institucional"
              >
                <OfficialLogo priority />
                <span className="brand-shine-light" aria-hidden="true" />
              </a>
            </header>
            <div className="card-intro">
              <h1>
                <span className="sr-only">Proteção para sua vida, sua família e sua empresa.</span>
                <span className="card-reduced-title" aria-hidden="true">
                  Proteção para sua vida, família e empresa.
                </span>
                <span className="card-title-lines" aria-hidden="true">
                  <span className="card-title-line">Proteção para</span>
                  <span className="card-title-line">
                    <span>sua</span>
                    <span className="card-word-window">
                      <span className="card-word-track">
                        {[...words, words[0]].map((word, index) => (
                          <span className="card-word" key={index}>
                            {word}
                          </span>
                        ))}
                      </span>
                    </span>
                  </span>
                </span>
              </h1>
              <QuoteTrigger className="quote-graphite quote-graphite--glow card-quote-cta">
                <img src="/brand/zury-monograma-branco.svg" width={19} height={19} alt="" />
                <span>COTAR AGORA</span>
              </QuoteTrigger>
            </div>
            <div className="card-opening-side">
              <CardChannels />
            </div>
          </div>
          <div className="card-outside">
            <footer className="card-footer">
              <nav className="card-footer-nav" aria-label="Navegação do rodapé">
                {digitalCardNavigation.map((item) => (
                  <a key={item.label} href={`/${item.href}`}>
                    {item.label}
                  </a>
                ))}
              </nav>
              <div className="card-footer-divider" aria-hidden="true" />
              <p className="card-footer-legal">
                &copy; {new Date().getFullYear()} {registration.company} &middot; CNPJ{" "}
                {registration.cnpj} &middot; SUSEP {registration.susep}
              </p>
            </footer>
          </div>
        </main>
        <QuoteDialog />
      </div>
      <ChannelsPopover
        id={contactsPopoverId}
        title="Contatos"
        placement="above"
        contactMode="whatsapp"
      />
    </>
  );
}
