import { useEffect, useRef } from "react";
import { Handshake, UserRoundPlus } from "lucide-react";
import { referralInquiryHref, referralProgram } from "@/lib/content";
import { GlareCard } from "@/components/ui/glare-card";
import { Guilloche } from "@/components/ui/guilloche";
import { OfficialLogo } from "./official-logo";
import { SilverTrace } from "@/components/ui/silver-trace";
import "./referral-program.css";

/**
 * Each modality is a ZURY member card (Glare Card with tilt): graphite for affiliates, satin silver for partners.
 * A diffuse light sits behind the pair; each CTA carries a light travelling its edge and a satin sheen.
 */
export function ReferralProgram() {
  // Both CTA loops pause off-screen and in hidden tabs, like the other looping sections.
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
  return (
    <section
      ref={ref}
      id="indicacoes"
      className="section referrals"
      tabIndex={-1}
      aria-labelledby="referrals-title"
      data-motion-paused="true"
    >
      <Guilloche originX={0.15} originY={0.85} size={0.9} alpha={0.06} />
      <div className="container referrals-layout">
        <div className="referrals-intro">
          <h2 id="referrals-title" data-split>
            {referralProgram.title}
          </h2>
          <p className="referral-commercial" data-scrub-words>
            {referralProgram.commercialDescription}
          </p>
        </div>
        <div className="referral-offers">
          {referralProgram.options.map((option) => {
            const Icon = option.id === "affiliate" ? UserRoundPlus : Handshake;
            const topics = option.paragraphs.slice(0, -1);
            const reward = option.paragraphs.at(-1);
            return (
              <div className="referral-offer" key={option.id} data-reveal="deal">
                <GlareCard
                  className="member-card"
                  data-variant={option.id}
                  aria-labelledby={`${option.id}-title`}
                >
                  {option.id === "affiliate" && (
                    <Guilloche
                      originX={0.9}
                      originY={0.1}
                      size={1}
                      rings={14}
                      lobes={32}
                      alpha={0.16}
                    />
                  )}
                  <div className="member-top">
                    <OfficialLogo className="member-logo" />
                    <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <h3 id={`${option.id}-title`}>{option.title}</h3>
                  <ul className="member-topics">
                    {topics.map((topic) => (
                      <li key={topic}>{topic}</li>
                    ))}
                  </ul>
                  <div className="member-code" aria-hidden="true">
                    <span>CÓDIGO INDIVIDUAL</span>
                    <span className="member-code-mask">••••••••••••</span>
                  </div>
                  <p className="member-reward">
                    <strong>{reward}</strong>
                  </p>
                </GlareCard>
                <a
                  className="btn btn-primary referral-cta green-cta"
                  data-mode={option.id}
                  href={referralInquiryHref(option.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <SilverTrace loop tone="green" />
                  <span className="referral-cta-label">{option.cta}</span>
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
