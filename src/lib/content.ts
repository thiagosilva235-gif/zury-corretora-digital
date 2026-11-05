export type Service = {
  number: string;
  title: string;
  icon: "House" | "HeartPulse" | "Sprout" | "CarFront" | "Landmark" | "Scale";
  items: string[];
};
export type CompanyLogo = {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
  displayWidth: number;
};
// Only supplied and authorized PNGs belong here; do not fabricate insurer endorsements.
export const companyLogos: readonly CompanyLogo[] = [
  {
    id: "ademicon",
    name: "Ademicon",
    src: "/companies/ademicon.png",
    width: 2172,
    height: 724,
    displayWidth: 180,
  },
  {
    id: "akad",
    name: "Akad",
    src: "/companies/akad.png",
    width: 1918,
    height: 563,
    displayWidth: 180,
  },
  {
    id: "allianz",
    name: "Allianz",
    src: "/companies/allianz.png",
    width: 1913,
    height: 516,
    displayWidth: 180,
  },
  {
    id: "amil",
    name: "Amil",
    src: "/companies/amil.png",
    width: 2032,
    height: 744,
    displayWidth: 180,
  },
  {
    id: "axa",
    name: "AXA",
    src: "/companies/axa.png",
    width: 1254,
    height: 1254,
    displayWidth: 100,
  },
  {
    id: "azos",
    name: "Azos",
    src: "/companies/azos.png",
    width: 2032,
    height: 432,
    displayWidth: 200,
  },
  {
    id: "azul-seguros",
    name: "Azul Seguros",
    src: "/companies/azul-seguros.png",
    width: 2032,
    height: 904,
    displayWidth: 180,
  },
  {
    id: "berkley",
    name: "Berkley",
    src: "/companies/berkley.png",
    width: 889,
    height: 281,
    displayWidth: 180,
  },
  {
    id: "bradesco",
    name: "Bradesco",
    src: "/companies/bradesco.png",
    width: 2032,
    height: 478,
    displayWidth: 200,
  },
  {
    id: "brasilseg",
    name: "Brasilseg",
    src: "/companies/brasilseg.png",
    width: 2172,
    height: 724,
    displayWidth: 180,
  },
  { id: "bv", name: "BV", src: "/companies/bv.png", width: 2032, height: 1508, displayWidth: 100 },
  {
    id: "capemisa",
    name: "Capemisa",
    src: "/companies/capemisa.png",
    width: 2172,
    height: 724,
    displayWidth: 180,
  },
  {
    id: "chubb",
    name: "Chubb",
    src: "/companies/chubb.png",
    width: 1946,
    height: 244,
    displayWidth: 200,
  },
  {
    id: "essor",
    name: "Essor",
    src: "/companies/essor.png",
    width: 2032,
    height: 664,
    displayWidth: 180,
  },
  {
    id: "hdi-seguros",
    name: "HDI Seguros",
    src: "/companies/hdi-seguros.png",
    width: 1863,
    height: 792,
    displayWidth: 180,
  },
  {
    id: "honda",
    name: "Honda",
    src: "/companies/honda.png",
    width: 829,
    height: 135,
    displayWidth: 200,
  },
  {
    id: "icatu",
    name: "Icatu",
    src: "/companies/icatu.png",
    width: 962,
    height: 376,
    displayWidth: 180,
  },
  {
    id: "itau",
    name: "Itaú",
    src: "/companies/itau.png",
    width: 1254,
    height: 1254,
    displayWidth: 100,
  },
  {
    id: "justos",
    name: "Justos",
    src: "/companies/justos.png",
    width: 2032,
    height: 629,
    displayWidth: 180,
  },
  {
    id: "mag",
    name: "MAG",
    src: "/companies/mag.png",
    width: 1927,
    height: 741,
    displayWidth: 180,
  },
  {
    id: "magalu",
    name: "Magalu",
    src: "/companies/magalu.png",
    width: 2032,
    height: 479,
    displayWidth: 200,
  },
  {
    id: "mapfre",
    name: "Mapfre",
    src: "/companies/mapfre.png",
    width: 2032,
    height: 335,
    displayWidth: 200,
  },
  {
    id: "metlife",
    name: "MetLife",
    src: "/companies/metlife.png",
    width: 2032,
    height: 462,
    displayWidth: 200,
  },
  {
    id: "omint",
    name: "Omint",
    src: "/companies/omint.png",
    width: 2031,
    height: 597,
    displayWidth: 180,
  },
  {
    id: "pier",
    name: "Pier",
    src: "/companies/pier.png",
    width: 1830,
    height: 554,
    displayWidth: 180,
  },
  {
    id: "porto-seguro",
    name: "Porto Seguro",
    src: "/companies/porto-seguro.png",
    width: 2032,
    height: 489,
    displayWidth: 200,
  },
  {
    id: "rodobens",
    name: "Rodobens",
    src: "/companies/rodobens.png",
    width: 2172,
    height: 724,
    displayWidth: 180,
  },
  {
    id: "safra",
    name: "Safra",
    src: "/companies/safra.png",
    width: 2032,
    height: 768,
    displayWidth: 180,
  },
  {
    id: "sancor",
    name: "Sancor",
    src: "/companies/sancor.png",
    width: 1902,
    height: 487,
    displayWidth: 180,
  },
  {
    id: "santander",
    name: "Santander",
    src: "/companies/santander.png",
    width: 2032,
    height: 382,
    displayWidth: 200,
  },
  {
    id: "suhai",
    name: "Suhai",
    src: "/companies/suhai.png",
    width: 2032,
    height: 609,
    displayWidth: 180,
  },
  {
    id: "sulamerica",
    name: "SulAmérica",
    src: "/companies/sulamerica.png",
    width: 1772,
    height: 472,
    displayWidth: 180,
  },
  {
    id: "tokio-marine",
    name: "Tokio Marine",
    src: "/companies/tokio-marine.png",
    width: 1915,
    height: 476,
    displayWidth: 200,
  },
  {
    id: "unimed",
    name: "Unimed",
    src: "/companies/unimed.png",
    width: 2003,
    height: 359,
    displayWidth: 200,
  },
  {
    id: "yamaha",
    name: "Yamaha",
    src: "/companies/yamaha.png",
    width: 2032,
    height: 468,
    displayWidth: 200,
  },
  {
    id: "yelum",
    name: "Yelum",
    src: "/companies/yelum.png",
    width: 1876,
    height: 508,
    displayWidth: 180,
  },
  {
    id: "zurich",
    name: "Zurich",
    src: "/companies/zurich.png",
    width: 1947,
    height: 494,
    displayWidth: 180,
  },
];
export const heroHeadline = "SEU PATRIMÔNIO MERECE A MELHOR ESCOLHA: ZURY";
export const heroSubtitle = "EXPERIENCIA/AGILIDADE/SOLIDEZ";

/** Hero no estilo minimalista centralizado: selo, título em duas cores e parágrafo de apoio. */
export const heroBadgeChip = "ZURY";
export const heroBadgeText = "Corretora autorizada SUSEP";
export const heroTitleParts = [
  "SUA VIDA",
  "SEUS PLANOS",
  "SEU PATRIMÔNIO",
  "A ESCOLHA É ZURY",
] as const;
export const heroLead =
  "SOLUÇÕES EM SEGUROS, SAÚDE E CRÉDITO, COM AS MELHORES CONDIÇÕES E ATENDIMENTO ESPECIALIZADO.";

export type BenefitPartner = {
  id: string;
  name: string;
  logo: string | null;
  width: number;
  height: number;
  offer: string;
};
export const benefitPartners: readonly BenefitPartner[] = [
  {
    id: "grupo-zapp",
    name: "ZAPP",
    logo: "/partners/grupo-zapp-metalico.png",
    width: 2172,
    height: 724,
    offer: "5% DE DESCONTO EM ATÉ 3X",
  },
  {
    id: "grupo-mv",
    name: "GRUPO MV",
    logo: "/partners/grupo-mv.png",
    width: 1057,
    height: 1057,
    offer: "5% DE DESCONTO EM SERVIÇOS",
  },
  {
    id: "otica-vemos",
    name: "ÓTICA VEMOS",
    logo: "/partners/otica-vemos.png",
    width: 1254,
    height: 1254,
    offer: "15% DE DESCONTO A VISTA E 10% Á PRAZO",
  },
  {
    id: "centrolab",
    name: "LABORATÓRIO CENTROLAB",
    logo: "/partners/centrolab.png",
    width: 1254,
    height: 1254,
    offer: "10% DE DESCONTO",
  },
];
export const benefitsContent = {
  title: "BENEFÍCIOS EXCLUSIVOS",
};

export function isBenefitsPreviewEnabled(env: {
  NODE_ENV?: string;
  ZURY_BENEFITS_PREVIEW?: string;
}): boolean {
  return env.NODE_ENV === "development" || env.ZURY_BENEFITS_PREVIEW === "true";
}

/** Owner-defined catalog: exactly 6 areas and 25 solutions, in this order. Section, stats and quote dialog read it. */
export const services: Service[] = [
  {
    number: "04",
    title: "VEÍCULOS",
    icon: "CarFront",
    items: ["Automóveis", "Frotas", "Motos", "Caminhões"],
  },
  {
    number: "02",
    title: "VIDA E SAÚDE",
    icon: "HeartPulse",
    items: ["Seguros de vida", "Planos de saúde", "Odontológicos", "Seguro viagem"],
  },
  {
    number: "05",
    title: "CRÉDITO",
    icon: "Landmark",
    items: ["Consórcios", "Financiamentos", "Empréstimos", "Seguro prestamista"],
  },
  {
    number: "01",
    title: "PATRIMÔNIO",
    icon: "House",
    items: ["Residenciais", "Empresariais", "Aeronáuticos"],
  },
  {
    number: "03",
    title: "AGRONEGÓCIO",
    icon: "Sprout",
    items: [
      "Seguros agrícolas",
      "Safras",
      "Pecuários",
      "Equipamentos agrícolas",
      "Corretagem de grãos",
    ],
  },
  {
    number: "06",
    title: "RESPONSABILIDADE CIVIL",
    icon: "Scale",
    items: [
      "RC Geral",
      "RC Profissional",
      "RC Obras e Engenharia",
      "RC Agropecuária",
      "RC Hospitalar e Clínicas",
    ],
  },
];
export const solutionCount = services.reduce((sum, service) => sum + service.items.length, 0);
export const differentiators = [
  {
    number: "01",
    title: "SEGURANÇA",
    description: "Equipe qualificada, atuação autorizada pela SUSEP.",
  },
  {
    number: "02",
    title: "SUPORTE",
    description: "Atendimento humanizado e especializado, disponível 24 horas por dia.",
  },
  {
    number: "03",
    title: "AGILIDADE",
    description: "Agilidade nas cotações e no acompanhamento e resolução de sinistros.",
  },
] as const;

// Presentation only: retain the official full sentences above as the source of truth.
// 24h availability is expressly approved in ZURY-SITE-SPEC.md §9.2.
export const processQuoteStep = {
  title: "Receba a cotação",
  description: "Atendimento especializado disponível 24 horas por dia",
} as const;

export function differentiatorDetails(description: string): string[] {
  return description
    .replace(/\.$/u, "")
    .split(/, | e (?=parceria)| e no (?=acompanhamento)/u)
    .map((part) => part.charAt(0).toLocaleUpperCase("pt-BR") + part.slice(1));
}

export const navigation = [
  { label: "SOLUÇÕES", href: "#servicos" },
  { label: "DIFERENCIAIS", href: "#sobre" },
  { label: "SOBRE", href: "#institucional" },
] as const;

/** Card-only footer: the landing retains its own navigation and footer. */
export const digitalCardNavigation = [
  ...navigation.filter((item) => item.href !== "#institucional"),
  { label: "COMPANHIAS", href: "#companhias" },
  { label: "INDICAÇÕES", href: "#indicacoes" },
  { label: "BENEFÍCIOS", href: "#beneficios" },
] as const;

export type Contact = { name: string; role?: string; phone: string; href: string };
export const contacts = [
  {
    name: "Thiago",
    role: "Corretor",
    phone: "(38) 99960-8455",
    href: "https://wa.me/5538999608455",
  },
  {
    name: "Valdir",
    role: "Consultor",
    phone: "(38) 99961-5862",
    href: "https://wa.me/5538999615862",
  },
  { name: "Joana", role: "Saúde", phone: "(61) 98563-8090", href: "https://wa.me/5561985638090" },
] as const satisfies readonly Contact[];

export type SiteNavigationItem = { label: string; href: string };

// User-supplied and browser-verified business profile, with Google's review entry.
export const googleReviewHref = "https://share.google/AnNgzLmPy4lMNqHO9";

// Official registration documents served from CDN assets (PDFs open in a new tab). Relative paths with JSON
// import attributes keep this module loadable by the `node --test` unit tests as well as by Vite.
import cnpjDocument from "../assets/zury-cnpj.pdf.asset.json" with { type: "json" };
import susepDocument from "../assets/certidao-corretora-susep.pdf.asset.json" with { type: "json" };

export const institutionalLinks = {
  cnpj: cnpjDocument.url,
  susep: susepDocument.url,
} as const;

export const registration = {
  company: "ZURY CORRETORA LTDA",
  cnpj: "49.393.734/0001-77",
  susep: "262180499",
} as const;

export function navigationForSite(
  includeReferrals: boolean,
  includeBenefits = false,
): readonly SiteNavigationItem[] {
  return [
    ...navigation.slice(0, 2),
    ...(includeReferrals ? [{ label: "INDICAÇÕES", href: "#indicacoes" }] : []),
    ...(includeBenefits ? [{ label: "BENEFÍCIOS", href: "#beneficios" }] : []),
    ...navigation.slice(2),
  ];
}

// Build-time preview only. This is not commercial/legal approval or access control.
export function isReferralPreviewEnabled(env: {
  NODE_ENV?: string;
  ZURY_REFERRAL_PREVIEW?: string;
}): boolean {
  return env.NODE_ENV === "development" || env.ZURY_REFERRAL_PREVIEW === "true";
}

export type ReferralMode = "affiliate" | "commercial";
type ReferralOption = {
  id: ReferralMode;
  title: string;
  paragraphs: readonly string[];
  cta: string;
  message: string;
};

export const referralProgram = {
  title: "PROGRAMA DE INDICAÇÕES",
  commercialDescription:
    "A ZURY OFERECE O MELHOR PREÇO DO MERCADO PARA AFILIADOS E PARCEIROS NAS CONTRATAÇÕES, RENUNCIANDO Á NOSSA COMISSÃO.",
  options: [
    {
      id: "affiliate",
      title: "SEJA UM AFILIADO",
      paragraphs: [
        "INDICAÇÕES SIMPLES",
        "CÓDIGO INDIVIDUAL DE INDICAÇÃO PODENDO GERAR UMA EXCELENTE RENDA EXTRA",
        "REMUNERAÇÃO DE R$100 ENVIADO VIA PIX PELA CONTRATACÃO DO INDICADO.",
      ],
      cta: "QUERO SER AFILIADO",
      message:
        "Olá! Tenho interesse em participar do programa de afiliados da ZURY CORRETORA. Gostaria de saber como funciona.",
    },
    {
      id: "commercial",
      title: "SEJA UM PARCEIRO COMERCIAL",
      paragraphs: [
        "INDICAÇÕES RECORRENTES.",
        "CÓDIGO INDIVIDUAL DE INDICAÇÃO PODENDO GERAR UMA EXCELENTE RENDA EXTRA",
        "REMUNERAÇÃO DE 10% DA COMISSÃO RECEBIDA PELA CONTRATACÃO DO INDICADO",
      ],
      cta: "QUERO SER PARCEIRO COMERCIAL",
      message:
        "Olá! Tenho interesse em me tornar parceiro comercial da ZURY CORRETORA. Gostaria de conhecer as condições da parceria.",
    },
  ] satisfies readonly ReferralOption[],
};

export function referralInquiryHref(mode: ReferralMode): string {
  const option = referralProgram.options.find((item) => item.id === mode);
  if (!option) throw new RangeError("Modalidade de indicação desconhecida");
  const params = new URLSearchParams({ text: option.message });
  return `${contacts[0].href}?${params.toString()}`;
}

// Owner-provided destinations: preserve these exact links even if public access is blocked.
export const digitalChannels = {
  facebook: { href: "https://www.facebook.com/share/19zFT3sdGr/?mibextid=wwXIfr" },
  instagram: { handle: "@zury_corretora", href: "https://www.instagram.com/zury_corretora/" },
  tiktok: { handle: "@zury_corretora", href: "https://www.tiktok.com/@zury_corretora" },
  email: "contato@zurycorretora.com",
} as const;
