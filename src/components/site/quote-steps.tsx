import type { Dispatch, SetStateAction } from "react";
import { ArrowLeft, ArrowRight, Check, CircleAlert } from "lucide-react";
import {
  quoteTextFields,
  type QuoteCustomer,
  type QuoteErrors,
  type QuoteField,
} from "@/lib/quote-form.mjs";
import { WhatsAppIcon } from "./whatsapp-icon";

/** Step bodies, progress and footer of the quote dialog; state lives in `QuoteDialog`. */
export type Step = 1 | 2 | 3 | 4;

const stepLabels = ["ÁREA", "SOLUÇÃO", "DADOS DO CLIENTE", "CONFIRMAÇÃO"] as const;

function errorProps(key: QuoteField, error: string | undefined) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `quote-${key}-error` : undefined,
  } as const;
}

function FieldError({ field, error }: { field: QuoteField; error: string | undefined }) {
  if (!error) return null;
  return (
    <p className="quote-error" id={`quote-${field}-error`}>
      <CircleAlert size={14} strokeWidth={2} aria-hidden="true" />
      <span>{error}</span>
    </p>
  );
}

export function OptionStep({
  legend,
  name,
  options,
  value,
  onChoose,
}: {
  legend: string;
  name: string;
  options: { value: string; label: string; number?: string }[];
  value: string;
  onChoose: (value: string) => void;
}) {
  return (
    <fieldset className="quote-options">
      <legend>{legend}</legend>
      {options.map((option) => (
        <label className="quote-option" key={option.value}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChoose(option.value)}
            required
          />
          <span className="quote-option-text">
            {option.number && <small>{option.number}</small>}
            {option.label}
          </span>
          <Check size={16} aria-hidden="true" />
        </label>
      ))}
    </fieldset>
  );
}

export function QuoteProgress({ step }: { step: Step }) {
  return (
    <div className="quote-progress-row">
      <p className="quote-progress" aria-live="polite">
        PASSO 0{step} DE 04 · {stepLabels[step - 1]}
      </p>
      <div className="quote-track" aria-hidden="true">
        {stepLabels.map((label, index) => (
          <span key={label} className={index < step ? "is-done" : undefined} />
        ))}
      </div>
    </div>
  );
}

export function CustomerStep({
  areaTitle,
  solution,
  customer,
  errors,
  setCustomer,
  onTouch,
  onEdit,
}: {
  areaTitle: string;
  solution: string;
  customer: QuoteCustomer;
  errors: QuoteErrors;
  setCustomer: Dispatch<SetStateAction<QuoteCustomer>>;
  onTouch: (field: QuoteField) => void;
  onEdit: (step: 1 | 2) => void;
}) {
  const selection = [
    { label: "Área", value: areaTitle, step: 1 as const },
    { label: "Solução", value: solution, step: 2 as const },
  ];
  return (
    <>
      <h3 className="quote-step-title" id="quote-step-title" tabIndex={-1}>
        Seus dados para a cotação
      </h3>
      <dl className="quote-selection">
        {selection.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>
              <span>{item.value}</span>
              <button
                type="button"
                className="quote-change"
                aria-label={`Alterar ${item.label.toLowerCase()}`}
                onClick={() => onEdit(item.step)}
              >
                ALTERAR
              </button>
            </dd>
          </div>
        ))}
      </dl>
      <div className="quote-fields">
        {quoteTextFields.map((field) => (
          <div className={`quote-field${field.wide ? " is-wide" : ""}`} key={field.key}>
            <label htmlFor={`quote-${field.key}`}>{field.label}</label>
            <input
              id={`quote-${field.key}`}
              name={field.key}
              type={field.type}
              inputMode={field.inputMode}
              autoComplete={field.autoComplete}
              autoCapitalize={field.autoCapitalize}
              spellCheck={false}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              required={field.key !== "email"}
              value={customer[field.key]}
              onChange={(event) => {
                const value = field.mask ? field.mask(event.target.value) : event.target.value;
                setCustomer((current) => ({ ...current, [field.key]: value }));
              }}
              onBlur={() => onTouch(field.key)}
              {...errorProps(field.key, errors[field.key])}
            />
            <FieldError field={field.key} error={errors[field.key]} />
          </div>
        ))}
        <div className="quote-consent">
          <div className="quote-consent-row">
            <input
              id="quote-consent"
              name="consent"
              type="checkbox"
              required
              checked={customer.consent}
              onChange={(event) => {
                const consent = event.target.checked;
                setCustomer((current) => ({ ...current, consent }));
                onTouch("consent");
              }}
              {...errorProps("consent", errors.consent)}
            />
            <label htmlFor="quote-consent">
              Li e aceito a Política de Privacidade e autorizo o contato da ZURY para esta cotação.
            </label>
          </div>
          <FieldError field="consent" error={errors.consent} />
        </div>
      </div>
    </>
  );
}

export function ReviewStep({
  areaTitle,
  solution,
  customer,
}: {
  areaTitle: string;
  solution: string;
  customer: QuoteCustomer;
}) {
  const rows = [
    ["Área", areaTitle],
    ["Solução", solution],
    ["Nome / razão social", customer.name.trim()],
    ["CPF / CNPJ", customer.document],
    ["WhatsApp", customer.phone],
    ["E-mail", customer.email.trim() || "Não informado"],
    ["CEP", customer.cep],
    ["Número", customer.number.trim()],
    ["Complemento", customer.complement.trim()],
  ];
  return (
    <>
      <h3 className="quote-step-title" id="quote-step-title" tabIndex={-1}>
        Confira antes de enviar
      </h3>
      <dl className="quote-review">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="quote-note">
        O WhatsApp abre em uma nova aba com a mensagem pronta. A cotação só chega à ZURY quando você
        enviar a mensagem na conversa.
      </p>
    </>
  );
}

/** VOLTAR from step 2; AVANÇAR submits steps 1–3; step 4 hands the message to WhatsApp. */
export function QuoteActions({
  step,
  canAdvance,
  sendHref,
  onBack,
}: {
  step: Step;
  canAdvance: boolean;
  sendHref: string;
  onBack: () => void;
}) {
  return (
    <footer className="quote-actions">
      {step > 1 && (
        <button key={`back-${step}`} className="btn btn-secondary" type="button" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden="true" />
          VOLTAR
        </button>
      )}
      {step < 4 ? (
        <button
          key={`next-${step}`}
          className="btn btn-primary"
          type="submit"
          disabled={!canAdvance}
        >
          <span>AVANÇAR</span>
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      ) : (
        <a
          key="send"
          className="btn btn-primary"
          href={sendHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          <WhatsAppIcon size={16} />
          <span>ENVIAR PELO WHATSAPP</span>
          <span className="sr-only"> (abre em nova aba)</span>
        </a>
      )}
    </footer>
  );
}
