/**
 * @typedef {{
 *   name: string,
 *   document: string,
 *   phone: string,
 *   email: string,
 *   cep: string,
 *   number: string,
 *   complement: string,
 *   consent: boolean,
 * }} QuoteCustomer
 * @typedef {"name" | "document" | "phone" | "email" | "cep" | "number" | "complement" | "consent"} QuoteField
 * @typedef {Partial<Record<QuoteField, string>>} QuoteErrors
 * @typedef {Omit<QuoteCustomer, "consent"> & { area: string, solution: string }} QuoteMessageData
 * @typedef {{
 *   key: Exclude<QuoteField, "consent">,
 *   label: string,
 *   type: "text" | "email" | "tel",
 *   inputMode: "text" | "numeric" | "tel" | "email",
 *   autoComplete?: string,
 *   autoCapitalize?: "characters",
 *   placeholder?: string,
 *   maxLength: number,
 *   mask?: (value: string) => string,
 *   wide?: boolean,
 * }} QuoteTextField
 */

/** Field order as rendered; the first invalid field in this order receives focus. */
export const quoteFieldOrder = Object.freeze(
  /** @type {QuoteField[]} */ ([
    "name",
    "document",
    "phone",
    "email",
    "cep",
    "number",
    "complement",
    "consent",
  ]),
);

/** @param {string} value */
export function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

/** @param {string} chars @param {number} max */
function allSame(chars, max) {
  return chars.length === max && /^(.)\1+$/.test(chars);
}

/**
 * CPF/CNPJ characters only, uppercased: up to 14, letters allowed in the first 12 (alphanumeric
 * CNPJ, IN RFB 2.229/2024); the last two positions are numeric check digits.
 * @param {string} value
 */
export function cleanDocument(value) {
  let chars = "";
  for (const char of value.toUpperCase().replace(/[^0-9A-Z]/g, "")) {
    if (chars.length === 14) break;
    if (chars.length < 12 || /\d/.test(char)) chars += char;
  }
  return chars;
}

/**
 * Progressive mask: up to 11 digits as CPF (000.000.000-00); 12+ characters, or any letter, as
 * CNPJ (00.000.000/0000-00, letters kept uppercased).
 * @param {string} value
 */
export function maskDocument(value) {
  const c = cleanDocument(value);
  if (c.length <= 11 && /^\d*$/.test(c)) {
    return c
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
  }
  return c
    .replace(/^(\w{2})(\w)/, "$1.$2")
    .replace(/^(\w{2})\.(\w{3})(\w)/, "$1.$2.$3")
    .replace(/^(\w{2})\.(\w{3})\.(\w{3})(\w)/, "$1.$2.$3/$4")
    .replace(/^(\w{2})\.(\w{3})\.(\w{3})\/(\w{4})(\w)/, "$1.$2.$3/$4-$5");
}

/**
 * Mod-11 remainder; each character is worth its char code − 48 (digits keep their value).
 * @param {string} chars @param {number[]} weights
 */
function checkDigit(chars, weights) {
  const sum = weights.reduce(
    (total, weight, index) => total + (chars.charCodeAt(index) - 48) * weight,
    0,
  );
  return sum % 11;
}

/** @param {string} value */
export function isValidCpf(value) {
  const d = cleanDocument(value);
  if (!/^\d{11}$/.test(d) || allSame(d, 11)) return false;
  const first = ((checkDigit(d, [10, 9, 8, 7, 6, 5, 4, 3, 2]) * 10) % 11) % 10;
  const second = ((checkDigit(d, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]) * 10) % 11) % 10;
  return first === Number(d[9]) && second === Number(d[10]);
}

/**
 * Numeric or alphanumeric CNPJ: 12 characters in [0-9A-Z] followed by 2 numeric check digits.
 * @param {string} value
 */
export function isValidCnpj(value) {
  const c = cleanDocument(value);
  if (!/^[0-9A-Z]{12}\d{2}$/.test(c) || allSame(c, 14)) return false;
  const weights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  /** @param {number} rest */
  const digitFrom = (rest) => (rest < 2 ? 0 : 11 - rest);
  const first = digitFrom(checkDigit(c, weights.slice(1)));
  const second = digitFrom(checkDigit(c, weights));
  return first === Number(c[12]) && second === Number(c[13]);
}

/**
 * Progressive mask: (00) 0000-0000 for 10 digits, (00) 00000-0000 for 11.
 * @param {string} value
 */
export function maskPhone(value) {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  const split = d.length === 11 ? 5 : 4;
  return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}

/**
 * Brazilian number with DDD: area code 11–99 (no DDD ends in 0), 10 digits (landline)
 * or 11 digits (mobile, which must start with 9 after the DDD).
 * @param {string} value
 */
export function isValidPhone(value) {
  const d = onlyDigits(value);
  if (d.length !== 10 && d.length !== 11) return false;
  if (!/^[1-9][1-9]/.test(d)) return false;
  if (d.length === 11 && d[2] !== "9") return false;
  return !allSame(d, d.length);
}

/** @param {string} value */
export function maskCep(value) {
  const d = onlyDigits(value).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/** @param {string} value */
export function isValidCep(value) {
  const d = onlyDigits(value);
  return d.length === 8 && d !== "00000000";
}

/** @param {string} value */
export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/.test(value.trim());
}

/** @param {string} chars cleaned CPF/CNPJ characters */
function documentError(chars) {
  if (!chars) return "Informe o CPF ou o CNPJ.";
  if (/^\d{11}$/.test(chars))
    return isValidCpf(chars) ? undefined : "CPF inválido. Confira os números.";
  if (chars.length === 14)
    return isValidCnpj(chars) ? undefined : "CNPJ inválido. Confira os caracteres.";
  return "Digite os 11 números do CPF ou os 14 caracteres do CNPJ.";
}

/** @type {Record<QuoteField, (fields: QuoteCustomer) => string | undefined>} */
const fieldValidators = {
  name: ({ name }) => {
    if (!name.trim()) return "Informe o nome completo ou a razão social.";
    return name.trim().length < 3 ? "O nome precisa ter pelo menos 3 letras." : undefined;
  },
  document: ({ document }) => documentError(cleanDocument(document)),
  phone: ({ phone }) => {
    if (!onlyDigits(phone)) return "Informe o WhatsApp com DDD.";
    return isValidPhone(phone)
      ? undefined
      : "Número inválido. Use DDD + número, ex.: (38) 99999-9999.";
  },
  email: ({ email }) =>
    email.trim() && !isValidEmail(email)
      ? "E-mail inválido. Confira o endereço ou deixe em branco."
      : undefined,
  cep: ({ cep }) => {
    if (!onlyDigits(cep)) return "Informe o CEP.";
    return isValidCep(cep) ? undefined : "CEP inválido. Digite os 8 números.";
  },
  number: ({ number }) => (number.trim() ? undefined : "Informe o número do imóvel (ou S/N)."),
  complement: ({ complement }) =>
    complement.trim() ? undefined : "Informe o complemento (ex.: casa, apto 12, sala 3).",
  consent: ({ consent }) =>
    consent ? undefined : "Para continuar, aceite a Política de Privacidade.",
};

/**
 * Every required field must be filled; e-mail is checked only when provided.
 * @param {QuoteCustomer} fields
 * @returns {QuoteErrors}
 */
export function validateCustomer(fields) {
  return Object.fromEntries(
    quoteFieldOrder.flatMap((key) => {
      const error = fieldValidators[key](fields);
      return error ? [[key, error]] : [];
    }),
  );
}

/** Text inputs of the customer step, in render order (consent is the trailing checkbox). */
export const quoteTextFields = Object.freeze(
  /** @type {QuoteTextField[]} */ ([
    {
      key: "name",
      label: "Nome completo ou razão social",
      type: "text",
      inputMode: "text",
      autoComplete: "name",
      maxLength: 120,
      wide: true,
    },
    {
      key: "document",
      label: "CPF ou CNPJ",
      type: "text",
      inputMode: "text",
      autoComplete: "off",
      autoCapitalize: "characters",
      placeholder: "000.000.000-00",
      maxLength: 18,
      mask: maskDocument,
    },
    {
      key: "phone",
      label: "WhatsApp com DDD",
      type: "tel",
      inputMode: "tel",
      autoComplete: "tel-national",
      placeholder: "(00) 00000-0000",
      maxLength: 15,
      mask: maskPhone,
    },
    {
      key: "email",
      label: "E-mail (opcional)",
      type: "email",
      inputMode: "email",
      autoComplete: "email",
      maxLength: 120,
      wide: true,
    },
    {
      key: "cep",
      label: "CEP",
      type: "text",
      inputMode: "numeric",
      autoComplete: "postal-code",
      placeholder: "00000-000",
      maxLength: 9,
      mask: maskCep,
    },
    {
      key: "number",
      label: "Número do imóvel",
      type: "text",
      inputMode: "text",
      placeholder: "Ex.: 120 ou S/N",
      maxLength: 12,
    },
    {
      key: "complement",
      label: "Complemento",
      type: "text",
      inputMode: "text",
      autoComplete: "address-line2",
      placeholder: "Casa, apto, bloco, sala",
      maxLength: 80,
      wide: true,
    },
  ]),
);

/**
 * Where an opened quote starts: area + matching solution → customer step, area only → solution
 * step, otherwise (or unknown values) → empty area step.
 * @param {readonly { number: string, items: readonly string[] }[]} areas
 * @param {{ area?: string | undefined, solution?: string | undefined }} detail
 * @returns {{ area: string, solution: string, step: 1 | 2 | 3 }}
 */
export function quoteStart(areas, { area, solution }) {
  const chosen = areas.find((item) => item.number === area);
  if (!chosen) return { area: "", solution: "", step: 1 };
  if (solution && chosen.items.includes(solution))
    return { area: chosen.number, solution, step: 3 };
  return { area: chosen.number, solution: "", step: 2 };
}

/** @param {string} value */
function clean(value) {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * WhatsApp-ready message: line breaks and *bold* labels; e-mail only when provided.
 * @param {QuoteMessageData} data
 */
export function buildQuoteMessage(data) {
  const email = clean(data.email);
  return [
    "Olá, ZURY CORRETORA! Gostaria de solicitar uma cotação.",
    "",
    `*Área:* ${clean(data.area)}`,
    `*Solução:* ${clean(data.solution)}`,
    "",
    `*Nome/Razão social:* ${clean(data.name)}`,
    `*CPF/CNPJ:* ${maskDocument(data.document)}`,
    `*WhatsApp:* ${maskPhone(data.phone)}`,
    ...(email ? [`*E-mail:* ${email}`] : []),
    `*CEP:* ${maskCep(data.cep)}`,
    `*Número:* ${clean(data.number)}`,
    `*Complemento:* ${clean(data.complement)}`,
  ].join("\n");
}

/**
 * @param {string} baseHref e.g. https://wa.me/5538999608455
 * @param {QuoteMessageData} data
 */
export function quoteWhatsAppHref(baseHref, data) {
  const separator = baseHref.includes("?") ? "&" : "?";
  return `${baseHref}${separator}text=${encodeURIComponent(buildQuoteMessage(data))}`;
}
