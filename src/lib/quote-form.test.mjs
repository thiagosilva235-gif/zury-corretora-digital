import assert from "node:assert/strict";
import test from "node:test";
import {
  buildQuoteMessage,
  cleanDocument,
  isValidCep,
  isValidCnpj,
  isValidCpf,
  isValidEmail,
  isValidPhone,
  maskCep,
  maskDocument,
  maskPhone,
  onlyDigits,
  quoteFieldOrder,
  quoteStart,
  quoteTextFields,
  quoteWhatsAppHref,
  validateCustomer,
} from "./quote-form.mjs";

const customer = {
  name: "  Maria  da Silva ",
  document: "52998224725",
  phone: "38998645200",
  email: "",
  cep: "39400000",
  number: "120",
  complement: "Apto 301",
  consent: true,
};
const quote = { ...customer, area: "PATRIMÔNIO", solution: "Residenciais" };

test("onlyDigits strips every mask character", () => {
  assert.equal(onlyDigits("(38) 99864-5200"), "38998645200");
  assert.equal(onlyDigits("abc"), "");
});

test("CPF check digits accept known valid numbers and reject altered or repeated ones", () => {
  for (const cpf of ["529.982.247-25", "11144477735", "390.533.447-05"]) assert.ok(isValidCpf(cpf));
  for (const cpf of ["529.982.247-24", "11144477736", "123.456.789-00", "1234567890", ""])
    assert.equal(isValidCpf(cpf), false);
  for (let n = 0; n <= 9; n++) assert.equal(isValidCpf(String(n).repeat(11)), false);
});

test("CNPJ check digits accept known valid numbers and reject altered or repeated ones", () => {
  for (const cnpj of ["11.222.333/0001-81", "11444777000161", "45.997.418/0001-53"])
    assert.ok(isValidCnpj(cnpj));
  for (const cnpj of ["11.222.333/0001-80", "11444777000162", "1122233300018", ""])
    assert.equal(isValidCnpj(cnpj), false);
  for (let n = 0; n <= 9; n++) assert.equal(isValidCnpj(String(n).repeat(14)), false);
});

test("alphanumeric CNPJ (IN RFB 2.229/2024) uses char code − 48 with the same mod-11 weights", () => {
  for (const cnpj of ["12.ABC.345/01DE-35", "12ABC34501DE35", "12.abc.345/01de-35"])
    assert.ok(isValidCnpj(cnpj), cnpj);
  for (const cnpj of [
    "12.ABC.345/01DE-34",
    "12.ABC.345/01DF-35",
    "12.ABD.345/01DE-35",
    "12ABC34501DEA5",
    "12ABC34501DE3",
    "AAAAAAAAAAAAAA",
  ])
    assert.equal(isValidCnpj(cnpj), false, cnpj);
  assert.equal(isValidCpf("529.982.247-2A"), false);
});

test("document characters: letters uppercased, only in the first 12 CNPJ positions, max 14", () => {
  assert.equal(cleanDocument("12.abc.345/01de-35"), "12ABC34501DE35");
  assert.equal(cleanDocument("12abc34501deXY35"), "12ABC34501DE35");
  assert.equal(cleanDocument("12ABC34501DE35999"), "12ABC34501DE35");
  assert.equal(cleanDocument("çé-1"), "1");
});

test("document mask is CPF up to 11 digits, CNPJ from 12 characters or with any letter", () => {
  assert.equal(maskDocument(""), "");
  assert.equal(maskDocument("529"), "529");
  assert.equal(maskDocument("5299"), "529.9");
  assert.equal(maskDocument("5299822"), "529.982.2");
  assert.equal(maskDocument("5299822472"), "529.982.247-2");
  assert.equal(maskDocument("52998224725"), "529.982.247-25");
  assert.equal(maskDocument("112223330001"), "11.222.333/0001");
  assert.equal(maskDocument("1122233300018"), "11.222.333/0001-8");
  assert.equal(maskDocument("11222333000181"), "11.222.333/0001-81");
  assert.equal(maskDocument("11.222.333/0001-8199"), "11.222.333/0001-81");
  assert.equal(maskDocument("1"), "1");
  assert.equal(maskDocument("12a"), "12.A");
  assert.equal(maskDocument("12abc345"), "12.ABC.345");
  assert.equal(maskDocument("12abc34501de"), "12.ABC.345/01DE");
  assert.equal(maskDocument("12abc34501de35"), "12.ABC.345/01DE-35");
});

test("phone mask adapts between landline and mobile and caps at 11 digits", () => {
  assert.equal(maskPhone(""), "");
  assert.equal(maskPhone("3"), "(3");
  assert.equal(maskPhone("38"), "(38");
  assert.equal(maskPhone("389"), "(38) 9");
  assert.equal(maskPhone("383221"), "(38) 3221");
  assert.equal(maskPhone("3832211"), "(38) 3221-1");
  assert.equal(maskPhone("3832211234"), "(38) 3221-1234");
  assert.equal(maskPhone("38998645200"), "(38) 99864-5200");
  assert.equal(maskPhone("3899864520099"), "(38) 99864-5200");
});

test("phone validation enforces DDD 11–99, 10/11 digits and the mobile 9", () => {
  assert.ok(isValidPhone("(38) 99864-5200"));
  assert.ok(isValidPhone("(11) 3221-1234"));
  assert.ok(isValidPhone("(99) 98765-4321"));
  for (const phone of [
    "(01) 99864-5200",
    "(10) 99864-5200",
    "(20) 3221-1234",
    "(38) 89864-5200",
    "(38) 3221-123",
    "389986452001",
    "",
  ])
    assert.equal(isValidPhone(phone), false, phone);
});

test("CEP mask and validation require 8 digits that are not all zeros", () => {
  assert.equal(maskCep("39400"), "39400");
  assert.equal(maskCep("394000"), "39400-0");
  assert.equal(maskCep("394000001"), "39400-000");
  assert.ok(isValidCep("39400-000"));
  assert.equal(isValidCep("00000-000"), false);
  assert.equal(isValidCep("3940000"), false);
});

test("e-mail format is validated only when filled", () => {
  assert.ok(isValidEmail("maria@zury.com.br"));
  for (const email of ["maria", "maria@", "maria@zury", "maria@.com", "ma ria@zury.com"])
    assert.equal(isValidEmail(email), false, email);
  assert.equal(validateCustomer(customer).email, undefined);
  assert.ok(validateCustomer({ ...customer, email: "maria@zury" }).email);
});

test("validateCustomer requires every mandatory field and returns no errors for valid data", () => {
  assert.deepEqual(validateCustomer(customer), {});
  assert.deepEqual(validateCustomer({ ...customer, document: "11.222.333/0001-81" }), {});
  assert.deepEqual(validateCustomer({ ...customer, document: "12.ABC.345/01DE-35" }), {});
  assert.ok(validateCustomer({ ...customer, document: "12.ABC.345/01DE-36" }).document);
  assert.ok(validateCustomer({ ...customer, document: "12.ABC.345" }).document);
  const empty = validateCustomer({
    name: " ",
    document: "",
    phone: "",
    email: "",
    cep: "",
    number: " ",
    complement: "",
    consent: false,
  });
  assert.deepEqual(
    quoteFieldOrder.filter((field) => empty[field]),
    ["name", "document", "phone", "cep", "number", "complement", "consent"],
  );
  assert.ok(validateCustomer({ ...customer, document: "111.111.111-11" }).document);
  assert.ok(validateCustomer({ ...customer, document: "529982247" }).document);
});

test("quote message lists the selection and customer data and omits an empty e-mail", () => {
  const message = buildQuoteMessage(quote);
  assert.equal(
    message,
    [
      "Olá, ZURY CORRETORA! Gostaria de solicitar uma cotação.",
      "",
      "*Área:* PATRIMÔNIO",
      "*Solução:* Residenciais",
      "",
      "*Nome/Razão social:* Maria da Silva",
      "*CPF/CNPJ:* 529.982.247-25",
      "*WhatsApp:* (38) 99864-5200",
      "*CEP:* 39400-000",
      "*Número:* 120",
      "*Complemento:* Apto 301",
    ].join("\n"),
  );
  assert.ok(!message.includes("E-mail"));
  assert.ok(
    buildQuoteMessage({ ...quote, email: " maria@zury.com.br " }).includes(
      "*WhatsApp:* (38) 99864-5200\n*E-mail:* maria@zury.com.br\n*CEP:*",
    ),
  );
  assert.ok(
    buildQuoteMessage({ ...quote, document: "12abc34501de35" }).includes(
      "*CPF/CNPJ:* 12.ABC.345/01DE-35",
    ),
  );
});

test("WhatsApp href keeps the destination and percent-encodes the whole message", () => {
  const href = quoteWhatsAppHref("https://wa.me/5538999608455", {
    ...quote,
    complement: "Sala 3 & 4 #fundos",
  });
  const url = new URL(href);
  assert.equal(url.origin + url.pathname, "https://wa.me/5538999608455");
  assert.equal([...url.searchParams].length, 1);
  assert.equal(
    url.searchParams.get("text"),
    buildQuoteMessage({ ...quote, complement: "Sala 3 & 4 #fundos" }),
  );
  assert.ok(href.includes("%0A") && href.includes("%20") && !href.includes(" "));
  assert.ok(!href.includes("#") && !href.slice(href.indexOf("?") + 1).includes("&"));
});

test("an opened quote starts at the customer step only for a matching area + solution", () => {
  const areas = [
    { number: "01", items: ["Residenciais", "Empresariais"] },
    { number: "04", items: ["Automóveis"] },
  ];
  assert.deepEqual(quoteStart(areas, { area: "01", solution: "Empresariais" }), {
    area: "01",
    solution: "Empresariais",
    step: 3,
  });
  assert.deepEqual(quoteStart(areas, { area: "01", solution: "Automóveis" }), {
    area: "01",
    solution: "",
    step: 2,
  });
  assert.deepEqual(quoteStart(areas, { area: "04" }), { area: "04", solution: "", step: 2 });
  for (const detail of [{}, { solution: "Residenciais" }, { area: "99", solution: "Residenciais" }])
    assert.deepEqual(quoteStart(areas, detail), { area: "", solution: "", step: 1 });
});

test("customer inputs render in validation order so the first error gets focus", () => {
  assert.deepEqual(
    quoteTextFields.map((field) => field.key),
    quoteFieldOrder.filter((key) => key !== "consent"),
  );
  const masked = Object.fromEntries(quoteTextFields.map((field) => [field.key, field.mask]));
  assert.equal(masked.document, maskDocument);
  assert.equal(masked.phone, maskPhone);
  assert.equal(masked.cep, maskCep);
});
