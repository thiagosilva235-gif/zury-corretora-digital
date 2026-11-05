import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { ArrowRight, X } from "lucide-react";
import { contacts, services } from "@/lib/content";
import {
  quoteFieldOrder,
  quoteStart,
  quoteWhatsAppHref,
  validateCustomer,
  type QuoteCustomer,
  type QuoteErrors,
  type QuoteField,
} from "@/lib/quote-form.mjs";
import {
  CustomerStep,
  OptionStep,
  QuoteActions,
  QuoteProgress,
  ReviewStep,
  type Step,
} from "./quote-steps";
import { SilverTrace } from "@/components/ui/silver-trace";
import "./quote-menu.css";

type QuoteVariant = "primary" | "secondary" | "card";
export type QuoteDetail = { area?: string; solution?: string; trigger?: HTMLElement | null };

const QUOTE_EVENT = "zury:quote";
const emptyCustomer: QuoteCustomer = {
  name: "",
  document: "",
  phone: "",
  email: "",
  cep: "",
  number: "",
  complement: "",
  consent: false,
};
const areaOptions = services.map((item) => ({
  value: item.number,
  label: item.title,
  number: item.number,
}));

/** Opens the single quote dialog. Area + solution start at the customer step; no args start at step 1. */
// eslint-disable-next-line react-refresh/only-export-components -- shared entry point of this dialog
export function openQuote(detail: QuoteDetail = {}): void {
  window.dispatchEvent(new CustomEvent<QuoteDetail>(QUOTE_EVENT, { detail }));
}

export function QuoteTrigger({
  variant = "primary",
  className = "",
  children = "COTAR AGORA",
}: {
  variant?: QuoteVariant;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`btn btn-${variant} quote-trigger green-cta ${className}`}
      aria-haspopup="dialog"
      aria-controls="quote-dialog"
      onClick={(event) => openQuote({ trigger: event.currentTarget })}
    >
      <span>{children}</span>
      <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
      <SilverTrace loop tone="green" />
    </button>
  );
}

function isOutside(event: { clientX: number; clientY: number; currentTarget: Element }) {
  const bounds = event.currentTarget.getBoundingClientRect();
  return (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  );
}

/** Locks page scroll while the modal is open; returns the restore callback. */
function lockPage() {
  const html = document.documentElement;
  const saved = {
    overflow: html.style.overflow,
    gutter: html.style.scrollbarGutter,
    scrollY: window.scrollY,
  };
  html.style.scrollbarGutter = "stable";
  html.style.overflow = "hidden";
  return () => {
    html.style.overflow = saved.overflow;
    html.style.scrollbarGutter = saved.gutter;
    if (window.scrollY !== saved.scrollY)
      window.scrollTo({ top: saved.scrollY, behavior: "instant" });
  };
}

/** Moves focus into the current step: the chosen (or first) radio, the first field, or the summary. */
function focusStep(root: HTMLDialogElement, step: Step) {
  const target =
    step === 3
      ? root.querySelector<HTMLElement>("#quote-name")
      : step === 4
        ? root.querySelector<HTMLElement>("#quote-step-title")
        : (root.querySelector<HTMLElement>(".quote-options input:checked") ??
          root.querySelector<HTMLElement>(".quote-options input"));
  target?.focus();
}

// Enter on a radio card or the consent checkbox advances like on a text field.
function submitOnEnter(event: KeyboardEvent<HTMLFormElement>) {
  const target = event.target;
  if (
    event.key === "Enter" &&
    target instanceof HTMLInputElement &&
    (target.type === "radio" || target.type === "checkbox")
  ) {
    event.preventDefault();
    event.currentTarget.requestSubmit();
  }
}

export function QuoteDialog() {
  const dialog = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const unlockPage = useRef<(() => void) | null>(null);
  const backdropPress = useRef(false);
  const [session, setSession] = useState(0);
  const [step, setStep] = useState<Step>(1);
  const [area, setArea] = useState("");
  const [solution, setSolution] = useState("");
  const [customer, setCustomer] = useState<QuoteCustomer>(emptyCustomer);
  const [touched, setTouched] = useState<Partial<Record<QuoteField, boolean>>>({});
  const [attempted, setAttempted] = useState(false);

  const service = services.find((item) => item.number === area);
  const areaTitle = service?.title ?? "";
  const errors = validateCustomer(customer);
  // Errors appear once a field was left (blur) or after an AVANÇAR attempt.
  const shownErrors: QuoteErrors = Object.fromEntries(
    quoteFieldOrder
      .filter((key) => errors[key] && (attempted || touched[key]))
      .map((key) => [key, errors[key]]),
  );

  useEffect(() => {
    const root = dialog.current;
    const open = (event: Event) => {
      const detail = (event as CustomEvent<QuoteDetail | undefined>).detail ?? {};
      const start = quoteStart(services, detail);
      setArea(start.area);
      setSolution(start.solution);
      setStep(start.step);
      setCustomer(emptyCustomer);
      setTouched({});
      setAttempted(false);
      setSession((value) => value + 1);
      returnFocus.current =
        detail.trigger ??
        (document.activeElement instanceof HTMLElement ? document.activeElement : null);
      if (!root || root.open) return;
      unlockPage.current = lockPage();
      root.showModal();
    };
    window.addEventListener(QUOTE_EVENT, open);
    return () => {
      window.removeEventListener(QUOTE_EVENT, open);
      unlockPage.current?.();
    };
  }, []);

  useEffect(() => {
    if (dialog.current?.open) focusStep(dialog.current, step);
  }, [step, session]);

  const handleClose = () => {
    unlockPage.current?.();
    unlockPage.current = null;
    const target = returnFocus.current;
    returnFocus.current = null;
    if (target?.isConnected) target.focus({ preventScroll: true });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step === 1 && service) setStep(2);
    else if (step === 2 && solution) setStep(3);
    else if (step === 3) {
      const invalid = quoteFieldOrder.find((key) => errors[key]);
      if (!invalid) {
        setStep(4);
        return;
      }
      // Render the messages first so the focused field announces its error.
      flushSync(() => setAttempted(true));
      dialog.current?.querySelector<HTMLElement>(`#quote-${invalid}`)?.focus();
    }
  };

  return (
    <dialog
      ref={dialog}
      id="quote-dialog"
      className="quote-dialog"
      aria-labelledby="quote-title"
      onClose={handleClose}
      onPointerDown={(event) => {
        backdropPress.current = event.target === event.currentTarget && isOutside(event);
      }}
      onClick={(event) => {
        if (backdropPress.current && event.target === event.currentTarget && isOutside(event))
          event.currentTarget.close();
        backdropPress.current = false;
      }}
    >
      <header className="quote-header">
        <h2 id="quote-title">COTAR AGORA</h2>
        <button
          type="button"
          className="btn btn-icon quote-close"
          aria-label="Fechar cotação"
          onClick={() => dialog.current?.close()}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </header>
      <form noValidate data-step={step} onSubmit={submit} onKeyDown={submitOnEnter}>
        <QuoteProgress step={step} />

        <div className="quote-step" key={`${session}-${step}`}>
          {step === 1 && (
            <OptionStep
              legend="Qual área você procura?"
              name="quote-area"
              options={areaOptions}
              value={area}
              onChoose={(number) => {
                setArea(number);
                // Only a solution outside the new area is cleared.
                setSolution((current) =>
                  services.find((item) => item.number === number)?.items.includes(current)
                    ? current
                    : "",
                );
              }}
            />
          )}
          {step === 2 && service && (
            <OptionStep
              legend={`Qual solução em ${service.title}?`}
              name="quote-solution"
              options={service.items.map((item) => ({ value: item, label: item }))}
              value={solution}
              onChoose={setSolution}
            />
          )}
          {step === 3 && (
            <CustomerStep
              areaTitle={areaTitle}
              solution={solution}
              customer={customer}
              errors={shownErrors}
              setCustomer={setCustomer}
              onTouch={(field) => setTouched((current) => ({ ...current, [field]: true }))}
              onEdit={setStep}
            />
          )}
          {step === 4 && (
            <ReviewStep areaTitle={areaTitle} solution={solution} customer={customer} />
          )}
        </div>

        <QuoteActions
          step={step}
          canAdvance={!((step === 1 && !service) || (step === 2 && !solution))}
          sendHref={quoteWhatsAppHref(contacts[0].href, { ...customer, area: areaTitle, solution })}
          onBack={() => setStep((step - 1) as Step)}
        />
      </form>
    </dialog>
  );
}
