import { useEffect, useRef, type CSSProperties } from "react";
import {
  CarFront,
  Check,
  ClipboardPen,
  HeartPulse,
  Headset,
  House,
  Landmark,
  MousePointerClick,
  Scale,
  Sprout,
} from "lucide-react";
import { processQuoteStep, registration, services, solutionCount } from "@/lib/content";
import { BentoCard, type BentoImage } from "@/components/ui/bento";
import { Guilloche } from "@/components/ui/guilloche";
import { publicPhoto } from "@/lib/public-photo";
import { useSnapCarousel } from "@/components/ui/use-snap-carousel";
import "./process-bento.css";

const icons = { House, HeartPulse, Sprout, CarFront, Landmark, Scale };

/** A file named public/process/<slot>.(webp|jpg|png) replaces the drawn graphic of its card. */
function processPhoto(slot: string, alt: string, position?: string): BentoImage | undefined {
  const src = publicPhoto("process", slot);
  return src ? { src, alt, position } : undefined;
}

/** Step eyebrow: a minimal line icon beside the step label. */
function StepEyebrow({ icon: Icon, label }: { icon: typeof Headset; label: string }) {
  return (
    <>
      <Icon className="process-step-icon" size={14} strokeWidth={1.6} aria-hidden="true" />
      {label}
    </>
  );
}

/** Step 02 stand-in: a paper customer form whose field lines fill in turn. */
function CustomerFormGraphic() {
  return (
    <div className="g-form" aria-hidden="true">
      <div className="g-form-sheet">
        <strong>DADOS DO CLIENTE</strong>
        <ul>
          {["NOME OU RAZÃO SOCIAL", "CPF / CNPJ", "WHATSAPP", "CEP · NÚMERO"].map(
            (label, field) => (
              <li key={label} style={{ "--field": field } as CSSProperties}>
                <small>{label}</small>
                <span />
              </li>
            ),
          )}
        </ul>
        <span className="g-form-consent">
          <Check size={12} strokeWidth={2.2} />
          POLÍTICA DE PRIVACIDADE
        </span>
      </div>
    </div>
  );
}

/**
 * "Como funciona": the three quote steps side by side (choose, fill in, receive); a swipe carousel on phones.
 * Step 02 is the white card with the drawn customer form; the others sit on their photographs.
 */
export function ProcessBento() {
  const ref = useRef<HTMLElement>(null);
  const { track, current, go } = useSnapCarousel();
  // O formulário desenhado anima só com a seção na tela e a aba visível, como o marquee do CTA.
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
      id="como-funciona"
      className="section process surface-light"
      aria-labelledby="process-title"
      data-motion-paused="true"
    >
      <Guilloche tone="ink" originX={0.08} originY={0.18} size={0.8} alpha={0.07} />
      <div className="container">
        <div className="process-head">
          <h2 id="process-title" data-split>
            COMO FUNCIONA
          </h2>
          <p data-reveal>Da escolha da solução ao acompanhamento do sinistro.</p>
        </div>
        <div ref={track} className="process-grid">
          <BentoCard
            className="process-card process-step process-card-choose"
            index="01"
            eyebrow={<StepEyebrow icon={MousePointerClick} label="ETAPA 01" />}
            title="ESCOLHA UMA SOLUÇÃO"
            description={`${String(services.length).padStart(2, "0")} áreas e ${solutionCount} soluções, do seguro residencial ao RC hospitalar.`}
            image={processPhoto(
              "escolha-solucao",
              "Corretor no alto de um prédio olhando casas, avenida, indústrias e o campo ao amanhecer",
              "50% 28%",
            )}
            graphic={
              <ul className="g-options" aria-hidden="true">
                {services.map((service) => {
                  const Icon = icons[service.icon];
                  const selected = service.number === "04";
                  return (
                    <li key={service.number} className={selected ? "is-selected" : undefined}>
                      <Icon size={18} strokeWidth={1.4} />
                      <span>{service.title}</span>
                      {selected && <Check size={16} />}
                    </li>
                  );
                })}
              </ul>
            }
          />
          <BentoCard
            className="process-card process-step process-card-fill"
            index="02"
            eyebrow={<StepEyebrow icon={ClipboardPen} label="ETAPA 02" />}
            title="PREENCHA OS DADOS"
            description="Nome, CPF ou CNPJ, WhatsApp e endereço, em um formulário curto."
            graphic={<CustomerFormGraphic />}
          />
          <BentoCard
            className="process-card process-step process-card-quote"
            index="03"
            eyebrow={<StepEyebrow icon={Headset} label="ETAPA 03" />}
            title={processQuoteStep.title}
            description={processQuoteStep.description}
            image={processPhoto(
              "cotacao",
              "Corretora entregando ao cliente a proposta escolhida em uma sala de reunião",
              "50% 14%",
            )}
            graphic={
              <div className="g-policy" aria-hidden="true">
                <div className="g-policy-sheet">
                  <Guilloche
                    originX={0.85}
                    originY={0.15}
                    size={0.9}
                    rings={12}
                    lobes={30}
                    alpha={0.16}
                  />
                  <strong>COTAÇÃO</strong>
                  <dl>
                    <div>
                      <dt>SOLUÇÃO</dt>
                      <dd>VEÍCULOS · AUTOMÓVEIS</dd>
                    </div>
                    <div>
                      <dt>ATENDIMENTO</dt>
                      <dd>ESPECIALIZADO</dd>
                    </div>
                  </dl>
                  <span className="g-stamp">
                    <span>ZURY</span>
                    <small>SUSEP {registration.susep}</small>
                  </span>
                </div>
              </div>
            }
          />
        </div>
        <div className="process-dots" role="group" aria-label="Navegar entre as etapas">
          {["01", "02", "03"].map((step, index) => (
            <button
              key={step}
              type="button"
              aria-label={`Etapa ${step}`}
              aria-current={index === current ? "true" : undefined}
              onClick={() => go(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
